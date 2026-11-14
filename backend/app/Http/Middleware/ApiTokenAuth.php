<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $userId = $token ? \Illuminate\Support\Facades\DB::table('auth_tokens')
            ->where('token_hash', hash('sha256', $token))
            ->where('expires_at', '>', now())
            ->value('user_id') : null;
        $user = $userId ? User::find($userId) : null;
        if (!$user || $user->is_blocked) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $request->setUserResolver(fn () => $user);
        return $next($request);
    }
}
