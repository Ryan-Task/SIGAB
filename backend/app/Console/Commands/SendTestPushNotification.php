<?php

namespace App\Console\Commands;

use App\Services\PushNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendTestPushNotification extends Command
{
    protected $signature = 'push:test
        {email : Email akun yang sudah mengaktifkan notifikasi}
        {--type=test : Jenis simulasi: test, rain-now, rain-forecast, high-risk}';

    protected $description = 'Send a test browser push notification to one account';

    public function handle(PushNotificationService $push): int
    {
        if (!$push->configured()) {
            $this->error('VAPID belum dikonfigurasi.');

            return self::FAILURE;
        }

        $user = DB::table('users')->where('email', strtolower(trim((string) $this->argument('email'))))->first(['id']);
        if ($user === null) {
            $this->error('Akun tidak ditemukan.');

            return self::FAILURE;
        }

        $location = DB::table('user_locations')
            ->join('areas', 'areas.id', '=', 'user_locations.area_id')
            ->where('user_locations.user_id', $user->id)
            ->where('areas.is_active', true)
            ->first([
                'areas.id',
                'areas.name',
                'areas.slug',
            ]);
        if ($location === null) {
            $this->error('Akun belum memiliki daerah pantauan aktif.');

            return self::FAILURE;
        }

        $subscriptions = DB::table('push_subscriptions')->where('user_id', $user->id)->get();
        if ($subscriptions->isEmpty()) {
            $this->error('Akun belum memiliki subscription notifikasi. Aktifkan dari halaman Profil.');

            return self::FAILURE;
        }

        $type = (string) $this->option('type');
        $payloads = [
            'test' => [
                'title' => 'Tes notifikasi SIGAB',
                'body' => 'Notifikasi browser SIGAB berhasil diterima.',
            ],
            'rain-now' => [
                'title' => 'Hujan di '.$location->name,
                'body' => "{$location->name}: hujan terdeteksi (10 mm). Pantau perubahan kondisi wilayah.",
            ],
            'rain-forecast' => [
                'title' => 'Prakiraan hujan '.$location->name,
                'body' => "{$location->name}: prakiraan hujan 10 mm. Siapkan perjalanan dan pantau peringatan.",
            ],
            'high-risk' => [
                'title' => 'Risiko banjir tinggi '.$location->name,
                'body' => "{$location->name}: skor risiko banjir 80/100 (tinggi). Waspadai genangan dan hindari jalur rawan.",
            ],
        ];
        if (!array_key_exists($type, $payloads)) {
            $this->error('Jenis simulasi tidak valid. Gunakan: test, rain-now, rain-forecast, atau high-risk.');

            return self::INVALID;
        }

        $reports = $push->send($subscriptions->all(), [
            ...$payloads[$type],
            'url' => "/wilayah/{$location->slug}",
            'tag' => "sigab-area-{$location->id}-test-{$type}",
        ]);
        $expiredEndpoints = collect($reports)->where('expired', true)->pluck('endpoint');
        if ($expiredEndpoints->isNotEmpty()) {
            DB::table('push_subscriptions')->whereIn('endpoint', $expiredEndpoints)->delete();
        }

        $this->info('Notifikasi tes sudah dikirim.');

        return self::SUCCESS;
    }
}
