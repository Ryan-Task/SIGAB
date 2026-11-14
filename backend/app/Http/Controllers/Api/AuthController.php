<?php

namespace App\Http\Controllers\Api;

use App\Mail\LoginCodeMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController
{
    public function requestCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);
        $this->sendOtp(
            Str::lower(trim($validated['email'])),
            $validated['name'] ?? null,
            'login',
        );

        return response()->json(['message' => 'Kode verifikasi telah dikirim ke email.']);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'digits:6'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);
        $email = Str::lower(trim($validated['email']));
        $otp = DB::table('auth_otps')
            ->where('email', $email)
            ->where('purpose', 'login')
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest('id')
            ->first();

        if (!$otp || !Hash::check($validated['code'], $otp->code_hash)) {
            return response()->json(['message' => 'Kode verifikasi tidak valid atau sudah kedaluwarsa.'], 422);
        }

        DB::table('auth_otps')->where('id', $otp->id)->update(['used_at' => now(), 'updated_at' => now()]);
        $user = User::firstOrCreate(
            ['email' => $email],
            ['name' => $validated['name'] ?: Str::before($email, '@'), 'password' => Str::random(32)],
        );

        return response()->json(['data' => $this->userPayload($user)]);
    }

    public function requestPasswordResetCode(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $email = Str::lower(trim($validated['email']));
        if (!User::where('email', $email)->exists()) {
            return response()->json(['message' => 'Akun dengan email tersebut belum terdaftar.'], 404);
        }

        $this->sendOtp($email, null, 'password_reset');

        return response()->json(['message' => 'Kode OTP reset password telah dikirim ke email.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $email = Str::lower(trim($validated['email']));
        $otp = $this->validOtp($email, $validated['code'], 'password_reset');
        if (!$otp) {
            return response()->json(['message' => 'Kode OTP tidak valid atau sudah kedaluwarsa.'], 422);
        }

        $user = User::where('email', $email)->firstOrFail();
        $user->password = $validated['password'];
        $user->save();
        $this->consumeOtp($otp->id);
        DB::table('auth_tokens')->where('user_id', $user->id)->delete();

        return response()->json(['data' => $this->userPayload($user)]);
    }

    public function emailLogin(Request $request): JsonResponse
    {
        $validated = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $user = User::where('email', Str::lower(trim($validated['email'])))->first();
        if (!$user) {
            return response()->json(['message' => 'Akun belum terdaftar. Silakan pilih Register.'], 404);
        }
        if ($user->is_blocked) {
            return response()->json(['message' => 'Akun ini telah diblokir administrator.'], 403);
        }
        if ($user->two_factor_enabled) {
            return response()->json(['requires_verification' => true]);
        }
        return response()->json(['data' => $this->userPayload($user)]);
    }

    public function adminLogin(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string'],
        ]);
        $user = User::where('email', Str::lower(trim($validated['email'])))
            ->where('is_admin', true)
            ->where('is_blocked', false)
            ->first();
        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Email atau password admin tidak valid.'], 401);
        }

        return response()->json(['data' => $this->userPayload($user)]);
    }

    public function adminDashboard(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json(['data' => [
            'users' => DB::table('users')->count(),
            'areas' => DB::table('areas')->where('is_active', true)->count(),
            'saved_locations' => DB::table('user_locations')->count(),
            'push_subscriptions' => DB::table('push_subscriptions')->count(),
            'risk_predictions' => DB::table('risk_predictions')->count(),
        ]]);
    }

    public function adminUsers(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);

        return response()->json(['data' => User::query()
            ->select(['id', 'name', 'email', 'is_admin', 'is_blocked', 'created_at'])
            ->latest('created_at')
            ->get()]);
    }

    public function createAdminUser(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => Str::lower(trim($validated['email'])),
            'password' => $validated['password'],
            'is_admin' => true,
            'is_blocked' => false,
            'two_factor_enabled' => false,
            'email_verified_at' => now(),
        ]);

        return response()->json(['data' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_admin' => true,
            'is_blocked' => false,
            'created_at' => $user->created_at,
        ]], 201);
    }

    public function blockUser(Request $request, int $userId): JsonResponse
    {
        $this->ensureAdmin($request);
        $validated = $request->validate(['blocked' => ['required', 'boolean']]);
        $user = User::findOrFail($userId);
        abort_if($user->is_admin, 422, 'Akun administrator tidak dapat diblokir.');
        $user->is_blocked = $validated['blocked'];
        $user->save();
        if ($user->is_blocked) {
            DB::table('auth_tokens')->where('user_id', $user->id)->delete();
        }

        return response()->json(['data' => [
            'id' => $user->id,
            'is_blocked' => $user->is_blocked,
        ]]);
    }

    public function deleteUser(Request $request, int $userId): JsonResponse
    {
        $this->ensureAdmin($request);
        $user = User::findOrFail($userId);
        abort_if($user->is_admin, 422, 'Akun administrator tidak dapat dihapus.');

        DB::table('auth_tokens')->where('user_id', $user->id)->delete();
        DB::table('user_locations')->where('user_id', $user->id)->delete();
        DB::table('push_subscriptions')->where('user_id', $user->id)->delete();
        DB::table('auth_otps')->where('email', $user->email)->delete();
        $user->delete();

        return response()->json(['message' => 'Akun pengguna berhasil dihapus.']);
    }

    public function importAdminHistory(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $filename = 'bpbd-banjir-histori.csv';
        $path = $validated['file']->storeAs('private', $filename);
        if ($path === false) {
            abort(500, 'File CSV tidak dapat disimpan.');
        }

        try {
            $exitCode = Artisan::call('history:import-detailed', [
                'path' => Storage::disk('local')->path($path),
            ]);
            $output = trim(Artisan::output());
            if ($exitCode !== 0) {
                return response()->json(['message' => $output ?: 'Import CSV riwayat gagal.'], 422);
            }

            return response()->json([
                'message' => $output ?: 'CSV riwayat berhasil diimpor.',
            ]);
        } finally {
            Storage::disk('local')->delete($path);
        }
    }

    public function googleRedirect(Request $request): RedirectResponse
    {
        $clientId = config('services.google.client_id');
        $redirectUri = config('services.google.redirect_uri');
        if (!$clientId || !$redirectUri) {
            abort(503, 'Google login belum dikonfigurasi.');
        }

        $statePayload = ($request->boolean('remember') ? '1' : '0') . '|' . Str::random(40);
        $state = base64_encode($statePayload . '|' . hash_hmac('sha256', $statePayload, config('app.key')));

        $query = http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'access_type' => 'online',
            'prompt' => 'select_account',
            'state' => $state,
        ]);
        return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $query);
    }

    public function googleCallback(Request $request): RedirectResponse
    {
        $stateParts = explode('|', base64_decode($request->string('state')->toString(), true) ?: '');
        $stateRemember = $stateParts[0] ?? '';
        $stateNonce = $stateParts[1] ?? '';
        $stateSignature = $stateParts[2] ?? '';
        $statePayload = $stateRemember . '|' . $stateNonce;
        if (
            !in_array($stateRemember, ['0', '1'], true)
            || $stateNonce === ''
            || $stateSignature === ''
            || !hash_equals(hash_hmac('sha256', $statePayload, config('app.key')), $stateSignature)
        ) {
            Log::warning('Google OAuth callback rejected because its state was invalid.');
            return redirect($this->frontendUrl('/login?error=Permintaan+Google+kedaluwarsa%2C+silakan+coba+lagi'));
        }

        $code = $request->string('code')->toString();
        if ($code === '') {
            return redirect($this->frontendUrl('/login?error=Google+login+dibatalkan'));
        }

        $tokenResponse = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => config('services.google.redirect_uri'),
            'grant_type' => 'authorization_code',
        ]);
        if (!$tokenResponse->successful()) {
            Log::warning('Google OAuth token exchange failed.', [
                'status' => $tokenResponse->status(),
                'error' => $tokenResponse->json('error'),
                'description' => $tokenResponse->json('error_description'),
            ]);
            return redirect($this->frontendUrl('/login?error=Google+login+gagal'));
        }

        $profileResponse = Http::withToken($tokenResponse->json('access_token'))
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');
        $profile = $profileResponse->json();
        if (!$profileResponse->successful() || !filter_var($profile['email'] ?? null, FILTER_VALIDATE_EMAIL)) {
            return redirect($this->frontendUrl('/login?error=Data+Google+tidak+valid'));
        }

        $user = User::firstOrNew(['email' => Str::lower($profile['email'])]);
        if ($user->exists && $user->is_blocked) {
            return redirect($this->frontendUrl('/login?error=Akun+Google+ini+telah+diblokir+administrator'));
        }
        $isNewUser = !$user->exists;
        if ($isNewUser || blank($user->name)) {
            $user->name = $profile['name'] ?? Str::before($user->email, '@');
        }
        $user->google_id = $profile['sub'] ?? null;
        $user->password ??= Str::random(32);
        $user->email_verified_at ??= now();
        $user->save();

        $token = $this->issueToken($user);
        $remember = $stateRemember === '1';
        return redirect($this->frontendUrl('/login?token=' . urlencode($token) . '&remember=' . ($remember ? '1' : '0')));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->userDetails($request->user())]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate(['two_factor_enabled' => ['required', 'boolean']]);
        $user = $request->user();
        $user->two_factor_enabled = $validated['two_factor_enabled'];
        $user->save();
        return response()->json(['data' => $this->userDetails($user)]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:255'],
        ]);
        $user = $request->user();
        $user->name = trim($validated['name']);
        $user->save();
        return response()->json(['data' => $this->userDetails($user)]);
    }

    public function requestPasswordChangeCode(Request $request): JsonResponse
    {
        $this->sendOtp($request->user()->email, null, 'password_change');

        return response()->json(['message' => 'Kode OTP perubahan password telah dikirim ke email.']);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'digits:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);
        $user = $request->user();
        $otp = $this->validOtp($user->email, $validated['code'], 'password_change');
        if (!$otp) {
            return response()->json(['message' => 'Kode OTP tidak valid atau sudah kedaluwarsa.'], 422);
        }

        $user->password = $validated['password'];
        $user->save();
        $this->consumeOtp($otp->id);

        return response()->json(['message' => 'Password berhasil diperbarui.']);
    }

    public function locations(Request $request): JsonResponse
    {
        $locations = DB::table('user_locations')
            ->join('areas', 'areas.id', '=', 'user_locations.area_id')
            ->where('user_locations.user_id', $request->user()->id)
            ->select([
                'user_locations.id',
                'user_locations.label',
                'user_locations.latitude',
                'user_locations.longitude',
                'user_locations.source',
                'areas.id as area_id',
                'areas.name',
                'areas.slug',
                'areas.regency_name',
                'areas.centroid_lat',
                'areas.centroid_lng',
            ])
            ->orderBy('user_locations.id')
            ->get();

        return response()->json(['data' => $locations]);
    }

    public function addLocation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'area_id' => ['required', 'integer', 'exists:areas,id'],
            'label' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'source' => ['required', 'in:gps,manual'],
        ]);
        $location = DB::table('user_locations')->updateOrInsert(
            ['user_id' => $request->user()->id, 'area_id' => $validated['area_id']],
            [
                'label' => $validated['label'] ?? null,
                'latitude' => $validated['latitude'] ?? null,
                'longitude' => $validated['longitude'] ?? null,
                'source' => $validated['source'],
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        return response()->json(['message' => 'Daerah berhasil disimpan.']);
    }

    public function removeLocation(Request $request, int $locationId): JsonResponse
    {
        $deleted = DB::table('user_locations')
            ->where('id', $locationId)
            ->where('user_id', $request->user()->id)
            ->delete();
        abort_if($deleted === 0, 404, 'Location not found.');
        return response()->json(['message' => 'Daerah dihapus.']);
    }

    public function pushPublicKey(): JsonResponse
    {
        return response()->json(['data' => [
            'public_key' => config('services.vapid.public_key'),
            'configured' => filled(config('services.vapid.public_key')),
        ]]);
    }

    public function subscribePush(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => ['required', 'url', 'max:2048'],
            'keys.p256dh' => ['required', 'string', 'max:255'],
            'keys.auth' => ['required', 'string', 'max:255'],
        ]);
        DB::table('push_subscriptions')->updateOrInsert(
            [
                'user_id' => $request->user()->id,
                'endpoint_hash' => hash('sha256', $validated['endpoint']),
            ],
            [
                'endpoint' => $validated['endpoint'],
                'public_key' => $validated['keys']['p256dh'],
                'auth_token' => $validated['keys']['auth'],
                'alert_key' => null,
                'updated_at' => now(),
                'created_at' => now(),
            ],
        );

        return response()->json(['message' => 'Notifikasi berhasil diaktifkan.']);
    }

    public function unsubscribePush(Request $request): JsonResponse
    {
        $validated = $request->validate(['endpoint' => ['required', 'url', 'max:2048']]);
        DB::table('push_subscriptions')
            ->where('user_id', $request->user()->id)
            ->where('endpoint', $validated['endpoint'])
            ->delete();

        return response()->json(['message' => 'Notifikasi berhasil dinonaktifkan.']);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->bearerToken();
        if ($token) {
            DB::table('auth_tokens')->where('token_hash', hash('sha256', $token))->delete();
        }
        return response()->json(['message' => 'Berhasil keluar.']);
    }

    private function userPayload(User $user): array
    {
        return ['user' => $this->userDetails($user), 'token' => $this->issueToken($user)];
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()->is_admin, 403, 'Akses admin diperlukan.');
    }

    private function userDetails(User $user): array
    {
        return array_merge(
            $user->only(['id', 'name', 'email', 'two_factor_enabled', 'is_admin']),
            ['has_locations' => DB::table('user_locations')->where('user_id', $user->id)->exists()],
        );
    }

    private function issueToken(User $user): string
    {
        $token = Str::random(64);
        DB::table('auth_tokens')->insert([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays(30),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return $token;
    }

    private function frontendUrl(string $path): string
    {
        return rtrim(config('app.frontend_url', 'http://127.0.0.1:3000'), '/') . $path;
    }

    private function sendOtp(string $email, ?string $name, string $purpose): void
    {
        $code = (string) random_int(100000, 999999);
        DB::table('auth_otps')->where('email', $email)->where('purpose', $purpose)->whereNull('used_at')
            ->update(['used_at' => now()]);
        DB::table('auth_otps')->insert([
            'email' => $email,
            'code_hash' => Hash::make($code),
            'name' => $name,
            'purpose' => $purpose,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        Mail::to($email)->send(new LoginCodeMail($code));
    }

    private function validOtp(string $email, string $code, string $purpose): ?object
    {
        $otp = DB::table('auth_otps')->where('email', $email)->where('purpose', $purpose)
            ->whereNull('used_at')->where('expires_at', '>', now())->latest('id')->first();

        return $otp && Hash::check($code, $otp->code_hash) ? $otp : null;
    }

    private function consumeOtp(int $id): void
    {
        DB::table('auth_otps')->where('id', $id)->update(['used_at' => now(), 'updated_at' => now()]);
    }
}
