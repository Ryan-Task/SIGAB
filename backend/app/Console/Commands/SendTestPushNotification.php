<?php

namespace App\Console\Commands;

use App\Services\PushNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendTestPushNotification extends Command
{
    protected $signature = 'push:test {email : Email akun yang sudah mengaktifkan notifikasi}';

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

        $subscriptions = DB::table('push_subscriptions')->where('user_id', $user->id)->get();
        if ($subscriptions->isEmpty()) {
            $this->error('Akun belum memiliki subscription notifikasi. Aktifkan dari halaman Profil.');

            return self::FAILURE;
        }

        $reports = $push->send($subscriptions->all(), [
            'title' => 'Tes notifikasi SIGAB',
            'body' => 'Notifikasi browser SIGAB berhasil diterima.',
            'url' => '/daerah-anda',
            'tag' => 'sigab-test',
        ]);
        $expiredEndpoints = collect($reports)->where('expired', true)->pluck('endpoint');
        if ($expiredEndpoints->isNotEmpty()) {
            DB::table('push_subscriptions')->whereIn('endpoint', $expiredEndpoints)->delete();
        }

        $this->info('Notifikasi tes sudah dikirim.');

        return self::SUCCESS;
    }
}
