<?php

namespace App\Services;

use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    public function configured(): bool
    {
        return filled(config('services.vapid.subject'))
            && filled(config('services.vapid.public_key'))
            && filled(config('services.vapid.private_key'));
    }

    /**
     * @param array{title: string, body: string, url: string, tag: string, urgent?: bool} $payload
     * @return array<int, array{endpoint: string, expired: bool}>
     */
    public function send(array $subscriptions, array $payload): array
    {
        $this->configureOpenSsl();
        $webPush = new WebPush([
            'VAPID' => [
                'subject' => config('services.vapid.subject'),
                'publicKey' => config('services.vapid.public_key'),
                'privateKey' => config('services.vapid.private_key'),
            ],
        ]);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                ]),
                json_encode($payload, JSON_THROW_ON_ERROR),
            );
        }

        $reports = [];
        foreach ($webPush->flush() as $report) {
            $reports[] = [
                'endpoint' => $report->getEndpoint(),
                'expired' => !$report->isSuccess() && $report->isSubscriptionExpired(),
            ];
        }

        return $reports;
    }

    private function configureOpenSsl(): void
    {
        $configuredPath = env('OPENSSL_CONF');
        $phpConfigPath = PHP_OS_FAMILY === 'Windows'
            ? dirname(PHP_BINARY).DIRECTORY_SEPARATOR.'extras'.DIRECTORY_SEPARATOR.'ssl'.DIRECTORY_SEPARATOR.'openssl.cnf'
            : null;
        $path = is_string($configuredPath) && is_file($configuredPath)
            ? $configuredPath
            : $phpConfigPath;
        if (is_string($path) && is_file($path)) {
            putenv("OPENSSL_CONF={$path}");
        }
    }
}
