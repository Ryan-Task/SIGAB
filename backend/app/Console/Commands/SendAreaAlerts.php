<?php

namespace App\Console\Commands;

use App\Services\PushNotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendAreaAlerts extends Command
{
    protected $signature = 'alerts:send-area';

    protected $description = 'Send push alerts for rain and high flood risk in saved user areas';

    public function handle(PushNotificationService $push): int
    {
        if (!$push->configured()) {
            $this->warn('VAPID belum dikonfigurasi; notifikasi tidak dikirim.');

            return self::SUCCESS;
        }

        $locations = DB::table('user_locations')
            ->join('areas', 'areas.id', '=', 'user_locations.area_id')
            ->join('users', 'users.id', '=', 'user_locations.user_id')
            ->where('areas.is_active', true)
            ->get([
                'user_locations.user_id',
                'user_locations.area_id',
                'areas.name',
                'areas.slug',
            ]);

        $sent = 0;
        foreach ($locations as $location) {
            $prediction = DB::table('risk_predictions')
                ->where('area_id', $location->area_id)
                ->latest('id')
                ->first(['score', 'risk_level']);
            $rainfall = DB::table('rainfall_records')
                ->where('area_id', $location->area_id)
                ->latest('observed_at')
                ->first(['observed_at', 'rainfall_mm']);

            $score = $prediction?->score === null ? null : (int) $prediction->score;
            $scoreLabel = $score === null ? 'belum tersedia' : "{$score}/100";
            $isHighRisk = $score !== null && $score >= 66
                || $prediction?->risk_level === 'high';
            $rainAmount = (float) ($rainfall?->rainfall_mm ?? 0);
            $rainTime = $rainfall?->observed_at ? Carbon::parse($rainfall->observed_at) : null;
            $isRainingNow = $rainAmount > 0
                && $rainTime !== null
                && $rainTime->between(now()->subHours(3), now()->addHour());
            $hasRainForecast = $rainAmount > 0 && !$isRainingNow;
            if (!$isHighRisk && !$isRainingNow && !$hasRainForecast) {
                continue;
            }

            $alertKey = implode(':', [
                $location->area_id,
                $isHighRisk ? 'high' : 'normal',
                $isRainingNow ? 'rain-now' : ($hasRainForecast ? 'rain-forecast' : 'dry'),
                (string) ($score ?? 'unknown'),
            ]);
            $subscriptions = DB::table('push_subscriptions')
                ->where('user_id', $location->user_id)
                ->get();
            $pending = $subscriptions->filter(function (object $subscription) use ($location, $alertKey): bool {
                $states = json_decode((string) $subscription->alert_key, true);

                return !is_array($states) || ($states[(string) $location->area_id] ?? null) !== $alertKey;
            });
            if ($pending->isEmpty()) {
                continue;
            }

            if ($isHighRisk && ($isRainingNow || $hasRainForecast)) {
                $title = 'Peringatan banjir '.$location->name;
                $body = "{$location->name}: skor risiko {$scoreLabel} (tinggi) dan "
                    .($isRainingNow ? 'hujan sedang terdeteksi.' : 'ada prakiraan hujan.');
            } elseif ($isHighRisk) {
                $title = 'Risiko banjir tinggi '.$location->name;
                $body = "{$location->name}: skor risiko banjir {$scoreLabel} (tinggi). Waspadai genangan dan hindari jalur rawan.";
            } elseif ($isRainingNow) {
                $title = 'Hujan di '.$location->name;
                $body = "{$location->name}: hujan terdeteksi ({$rainAmount} mm). Pantau perubahan kondisi wilayah.";
            } else {
                $title = 'Prakiraan hujan '.$location->name;
                $body = "{$location->name}: prakiraan hujan {$rainAmount} mm. Siapkan perjalanan dan pantau peringatan.";
            }
            $reports = $push->send($pending->all(), [
                'title' => $title,
                'body' => $body,
                'url' => "/wilayah/{$location->slug}",
                'tag' => "sigab-area-{$location->area_id}",
                'urgent' => $isHighRisk,
            ]);
            $expiredEndpoints = collect($reports)->where('expired', true)->pluck('endpoint');
            if ($expiredEndpoints->isNotEmpty()) {
                DB::table('push_subscriptions')->whereIn('endpoint', $expiredEndpoints)->delete();
            }
            foreach ($pending as $subscription) {
                $states = json_decode((string) $subscription->alert_key, true);
                if (!is_array($states)) $states = [];
                $states[(string) $location->area_id] = $alertKey;
                DB::table('push_subscriptions')->where('id', $subscription->id)->update([
                    'alert_key' => json_encode($states, JSON_THROW_ON_ERROR),
                    'alerted_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $sent++;
        }

        $this->info("Peringatan dikirim untuk {$sent} daerah.");

        return self::SUCCESS;
    }
}
