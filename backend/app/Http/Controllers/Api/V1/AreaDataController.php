<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class AreaDataController extends Controller
{
    private const FOCUS_REGENCY_CODES = ['35.15', '35.78'];

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('areas')
            ->where('is_active', true)
            ->whereIn('regency_code', self::FOCUS_REGENCY_CODES)
            ->select([
                'id',
                'name',
                'slug',
                'level',
                'code',
                'regency_code',
                'regency_name',
                'province_code',
                'province_name',
                'centroid_lat',
                'centroid_lng',
            ]);

        if ($request->filled('level')) {
            $query->where('level', $request->string('level')->toString());
        }

        if ($request->filled('q')) {
            $term = $request->string('q')->toString();
            $query->where(function ($areaQuery) use ($term): void {
                $areaQuery
                    ->where('name', 'like', "%{$term}%")
                    ->orWhere('code', 'like', "%{$term}%");
            });
        }

        return response()->json([
            'data' => $query->orderBy('name')->paginate(min($request->integer('per_page', 50), 100)),
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $area = DB::table('areas')
            ->where('slug', $slug)
            ->where('is_active', true)
            ->whereIn('regency_code', self::FOCUS_REGENCY_CODES)
            ->first();

        abort_if($area === null, 404, 'Area not found.');

        return response()->json(['data' => $this->areaPayload($area)]);
    }

    public function risk(string $slug): JsonResponse
    {
        $area = $this->findArea($slug);
        $prediction = DB::table('risk_predictions')
            ->where('area_id', $area->id)
            ->latest('calculated_at')
            ->first();
        $predictionPayload = $prediction === null
            ? null
            : $this->realtimePredictionPayload($prediction, $this->fetchCurrentWeather($area));

        return response()->json([
            'data' => [
                'area' => $this->areaPayload($area),
                'prediction' => $predictionPayload,
            ],
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    public function rainfall(Request $request, string $slug): JsonResponse
    {
        $area = $this->findArea($slug);
        $baseQuery = DB::table('rainfall_records')
            ->where('area_id', $area->id)
            ->select([
                'observed_at',
                'period_hours',
                'rainfall_mm',
                'quality_status',
                'data_source_id',
                'raw_metadata',
                'updated_at',
            ]);

        if ($request->filled('from')) {
            $baseQuery->where('observed_at', '>=', $request->date('from')->startOfDay());
        }
        if ($request->filled('to')) {
            $baseQuery->where('observed_at', '<=', $request->date('to')->endOfDay());
        }

        $records = (clone $baseQuery)
            ->where('observed_at', '>=', now()->subHours(3))
            ->orderBy('observed_at')
            ->paginate(min($request->integer('per_page', 8), 8));
        if ($records->isEmpty()) {
            $records = (clone $baseQuery)
                ->orderByDesc('observed_at')
                ->paginate(min($request->integer('per_page', 8), 8));
            $records->setCollection($records->getCollection()->sortBy('observed_at')->values());
        }
        $records->getCollection()->transform(function (object $record): array {
            $metadata = $record->raw_metadata === null ? [] : json_decode($record->raw_metadata, true);
            return [
                'observed_at' => $record->observed_at,
                'period_hours' => $record->period_hours,
                'rainfall_mm' => $record->rainfall_mm,
                'rainfall_probability' => is_array($metadata) ? ($metadata['pp'] ?? null) : null,
                'weather_code' => is_array($metadata) ? ($metadata['weather'] ?? null) : null,
                'weather_description' => is_array($metadata) ? ($metadata['weather_desc'] ?? null) : null,
                'fetched_at' => $record->updated_at,
                'quality_status' => $record->quality_status,
            ];
        });

        return response()->json(['data' => $records]);
    }

    public function currentWeather(string $slug): JsonResponse
    {
        $area = $this->findArea($slug);
        abort_if($area->centroid_lat === null || $area->centroid_lng === null, 422, 'Area coordinates are unavailable.');

        $weather = $this->fetchCurrentWeather($area);
        if ($weather === null) {
            return response()->json(['message' => 'Current weather provider is unavailable.'], 502);
        }

        return response()->json(['data' => $weather])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    private function fetchCurrentWeather(object $area): ?array
    {
        if ($area->centroid_lat === null || $area->centroid_lng === null) {
            return null;
        }

        try {
            $response = Http::timeout(10)->retry(2, 200)->get('https://api.open-meteo.com/v1/forecast', [
                'latitude' => $area->centroid_lat,
                'longitude' => $area->centroid_lng,
                'current' => 'precipitation,rain,showers,weather_code',
                'hourly' => 'precipitation,weather_code',
                'past_days' => 1,
                'forecast_days' => 2,
                'timezone' => 'Asia/Jakarta',
            ]);
        } catch (ConnectionException) {
            return null;
        }
        if ($response->failed()) {
            return null;
        }

        $payload = $response->json();
        $current = is_array($payload['current'] ?? null) ? $payload['current'] : [];
        $times = $payload['hourly']['time'] ?? [];
        $precipitation = $payload['hourly']['precipitation'] ?? [];
        $currentTime = isset($current['time']) ? strtotime((string) $current['time']) : time();
        $currentIndex = 0;
        $closestDistance = PHP_INT_MAX;
        foreach ($times as $index => $time) {
            $distance = abs(strtotime((string) $time) - $currentTime);
            if ($distance < $closestDistance) {
                $closestDistance = $distance;
                $currentIndex = $index;
            }
        }
        $isWet = static fn (int $index): bool => isset($precipitation[$index]) && (float) $precipitation[$index] > 0.1;
        $start = $currentIndex;
        $end = $currentIndex;
        if ($isWet($currentIndex)) {
            while ($start > 0 && $isWet($start - 1)) {
                $start--;
            }
            while ($end + 1 < count($times) && $isWet($end + 1)) {
                $end++;
            }
        }
        $currentPrecipitation = max(
            (float) ($current['precipitation'] ?? 0),
            (float) ($current['rain'] ?? 0),
            (float) ($current['showers'] ?? 0),
        );
        // The hourly series is a forecast and can still show rain after it has
        // stopped. Use the near-real-time current observation for the active label.
        $isCurrentlyRaining = $currentPrecipitation > 0.1;
        $durationHours = $isCurrentlyRaining ? $end - $start + 1 : 0;
        $intensityScore = $currentPrecipitation <= 0.1 ? 0
            : ($currentPrecipitation < 1 ? 10
                : ($currentPrecipitation < 5 ? 25
                    : ($currentPrecipitation < 10 ? 50
                        : ($currentPrecipitation < 20 ? 75 : 100))));
        $rainScore = $isCurrentlyRaining
            ? round(min(100, ($intensityScore * 0.7) + min(30, $durationHours * 5)), 2)
            : 0;

        $weather = [
            'provider' => 'Open-Meteo',
            'source_type' => 'near_realtime_model',
            'fetched_at' => now()->toIso8601String(),
            'current' => [
                'time' => $current['time'] ?? null,
                'precipitation_mm' => $current['precipitation'] ?? 0,
                'rain_mm' => $current['rain'] ?? 0,
                'showers_mm' => $current['showers'] ?? 0,
                'weather_code' => $current['weather_code'] ?? null,
                'is_raining' => $isCurrentlyRaining,
                'rain_score' => $rainScore,
            ],
            'rain_window' => [
                'start_at' => $isCurrentlyRaining ? ($times[$start] ?? null) : null,
                'end_at' => $isCurrentlyRaining ? ($times[$end] ?? null) : null,
                'duration_hours' => $durationHours,
            ],
        ];
        return $weather;
    }

    public function latestPredictions(): JsonResponse
    {
        $latestIds = DB::table('risk_predictions')
            ->select('area_id', DB::raw('MAX(id) as latest_id'))
            ->groupBy('area_id');
        $latestRainfall = DB::table('rainfall_records')
            ->select('area_id', DB::raw('MAX(observed_at) as latest_observed_at'))
            ->groupBy('area_id');

        $predictions = DB::table('risk_predictions as predictions')
            ->joinSub($latestIds, 'latest', function ($join): void {
                $join->on('predictions.id', '=', 'latest.latest_id');
            })
            ->join('areas', 'areas.id', '=', 'predictions.area_id')
            ->leftJoinSub($latestRainfall, 'latest_rainfall', function ($join): void {
                $join->on('latest_rainfall.area_id', '=', 'areas.id');
            })
            ->leftJoin('rainfall_records as rainfall', function ($join): void {
                $join->on('rainfall.area_id', '=', 'latest_rainfall.area_id')
                    ->on('rainfall.observed_at', '=', 'latest_rainfall.latest_observed_at');
            })
            ->where('areas.is_active', true)
            ->whereIn('areas.regency_code', self::FOCUS_REGENCY_CODES)
            ->select([
                'areas.id as area_id',
                'areas.name',
                'areas.slug',
                'areas.code',
                'areas.regency_code',
                'areas.regency_name',
                'areas.province_code',
                'areas.province_name',
                'areas.centroid_lat',
                'areas.centroid_lng',
                'predictions.score',
                'predictions.risk_level',
                'predictions.status',
                'predictions.data_as_of',
                'predictions.calculated_at',
                'predictions.explanation',
                'rainfall.rainfall_mm',
                'rainfall.observed_at as weather_observed_at',
                'rainfall.raw_metadata as weather_metadata',
            ])
            ->orderByDesc('predictions.score')
            ->get()
            ->map(function (object $prediction): array {
                $payload = (array) $prediction;
                $metadata = $payload['weather_metadata'] === null
                    ? []
                    : json_decode($payload['weather_metadata'], true);
                $payload['weather'] = [
                    'rainfall_mm' => $payload['rainfall_mm'],
                    'observed_at' => $payload['weather_observed_at'],
                    'temperature_c' => $metadata['t'] ?? null,
                    'humidity_percent' => $metadata['hu'] ?? null,
                    'weather_code' => $metadata['weather'] ?? null,
                    'description' => $metadata['weather_desc'] ?? null,
                    'rainfall_probability' => $metadata['pp'] ?? null,
                ];
                $payload['explanation'] = $this->riskExplanation(
                    $prediction,
                    $payload['rainfall_mm'] !== null,
                );
                unset($payload['rainfall_mm'], $payload['weather_observed_at'], $payload['weather_metadata']);

                return $payload;
            })
            ->values();

        return response()->json(['data' => $predictions]);
    }

    public function floodEvents(Request $request): JsonResponse
    {
        $year = $request->integer('year');
        $regencyCode = $request->string('regency_code')->toString();
        if ($request->filled('year') && ($year < 1900 || $year > now()->year + 1)) {
            return response()->json(['message' => 'Year must be between 1900 and next year.'], 422);
        }
        if ($regencyCode !== '' && ! in_array($regencyCode, self::FOCUS_REGENCY_CODES, true)) {
            return response()->json(['message' => 'Unsupported regency code.'], 422);
        }

        $query = DB::table('flood_events as events')
            ->join('areas', 'areas.id', '=', 'events.area_id')
            ->leftJoin('data_sources', 'data_sources.id', '=', 'events.data_source_id')
            ->where('areas.is_active', true)
            ->whereIn('areas.regency_code', self::FOCUS_REGENCY_CODES)
            ->select([
                'events.id',
                'events.started_at',
                'events.ended_at',
                'events.severity',
                'events.description',
                'events.source_reference',
                'events.verification_status',
                'events.updated_at',
                'areas.name as area_name',
                'areas.slug as area_slug',
                'areas.code as area_code',
                'areas.regency_code',
                'areas.regency_name',
                'data_sources.name as source_name',
                'data_sources.url as source_url',
            ])
            ->orderByDesc('events.started_at');

        if ($request->filled('year')) {
            $query->whereYear('events.started_at', $year);
        }
        if ($regencyCode !== '') {
            $query->where('areas.regency_code', $regencyCode);
        }
        if ($request->filled('from')) {
            $query->where('events.started_at', '>=', $request->date('from')->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('events.started_at', '<=', $request->date('to')->endOfDay());
        }

        $events = $query->limit(500)->get();
        $monthly = $events
            ->filter(fn (object $event): bool => $event->started_at !== null)
            ->groupBy(fn (object $event): string => substr((string) $event->started_at, 0, 7))
            ->map(fn ($monthEvents, string $month): array => [
                'month' => $month,
                'count' => $monthEvents->count(),
            ])
            ->sortBy('month')
            ->values();

        return response()->json([
            'data' => [
                'year' => $request->filled('year') ? $year : null,
                'regency_code' => $regencyCode !== '' ? $regencyCode : null,
                'total' => $events->count(),
                'updated_at' => $events->max('updated_at'),
                'source' => 'DIBI BNPB',
                'source_url' => 'https://dibi.bnpb.go.id/',
                'events' => $events,
                'monthly' => $monthly,
            ],
        ]);
    }

    public function floodEventYears(): JsonResponse
    {
        $years = DB::table('flood_events as events')
            ->join('areas', 'areas.id', '=', 'events.area_id')
            ->where('areas.is_active', true)
            ->whereIn('areas.regency_code', self::FOCUS_REGENCY_CODES)
            ->whereNotNull('events.started_at')
            ->selectRaw("strftime('%Y', events.started_at) as year")
            ->distinct()
            ->orderByDesc('year')
            ->pluck('year')
            ->map(fn (string $year): int => (int) $year)
            ->values();

        return response()->json(['data' => $years]);
    }

    private function findArea(string $slug): object
    {
        $area = DB::table('areas')
            ->where('slug', $slug)
            ->where('is_active', true)
            ->whereIn('regency_code', self::FOCUS_REGENCY_CODES)
            ->first();

        abort_if($area === null, 404, 'Area not found.');

        return $area;
    }

    private function areaPayload(object $area): array
    {
        return [
            'id' => $area->id,
            'name' => $area->name,
            'slug' => $area->slug,
            'level' => $area->level,
            'code' => $area->code,
            'regency_code' => $area->regency_code,
            'regency_name' => $area->regency_name,
            'province_code' => $area->province_code,
            'province_name' => $area->province_name,
            'centroid_lat' => $area->centroid_lat,
            'centroid_lng' => $area->centroid_lng,
        ];
    }

    private function predictionPayload(object $prediction): array
    {
        $historyCount = $this->historyCount((int) $prediction->area_id);
        return [
            'id' => $prediction->id,
            'score' => $prediction->score,
            'risk_level' => $prediction->risk_level,
            'rainfall_score' => $prediction->rainfall_score,
            'history_score' => $prediction->history_score,
            'history_count' => $historyCount,
            'history_frequency' => $historyCount === null ? null : $this->historyFrequency($historyCount),
            'environment_score' => $prediction->environment_score,
            'drainage_score' => $prediction->drainage_score,
            'method_version' => $prediction->method_version,
            'data_as_of' => $prediction->data_as_of,
            'calculated_at' => $prediction->calculated_at,
            'status' => $prediction->status,
            'explanation' => $this->riskExplanation($prediction),
        ];
    }

    private function realtimePredictionPayload(object $prediction, ?array $currentWeather): array
    {
        $payload = $this->predictionPayload($prediction);
        if ($currentWeather === null) {
            $payload['realtime_calculated_at'] = null;
            return $payload;
        }

        $currentWeatherScore = (float) ($currentWeather['current']['rain_score'] ?? 0);
        $components = [
            'rainfall' => $prediction->rainfall_score,
            'current_weather' => $currentWeatherScore,
            'history' => $prediction->history_score,
            'environment' => $prediction->environment_score,
            'drainage' => $prediction->drainage_score === null
                ? null
                : 100 - (float) $prediction->drainage_score,
        ];
        $weights = [
            'rainfall' => 0.30,
            'current_weather' => 0.30,
            'history' => 0.25,
            'environment' => 0.05,
            'drainage' => 0.10,
        ];
        $available = array_filter($components, static fn ($value): bool => $value !== null);
        $score = $available !== []
            ? (int) round(array_sum(array_map(
                static fn (string $name, $value): float => $weights[$name] * (float) $value,
                array_keys($available),
                array_values($available),
            )))
            : null;

        $explanation = $payload['explanation'] ?? [];
        if (! is_array($explanation)) {
            $explanation = [];
        }
        $availableComponents = $explanation['available_components'] ?? [];
        if (! is_array($availableComponents)) {
            $availableComponents = [];
        }
        if (! in_array('current_weather', $availableComponents, true)) {
            $availableComponents[] = 'current_weather';
        }
        $sources = $explanation['sources'] ?? [];
        if (! is_array($sources)) {
            $sources = [];
        }
        $sources['current_weather'] = [
            'provider' => 'Open-Meteo',
            'url' => 'https://open-meteo.com/',
            'status' => 'available',
            'method' => 'near_realtime_model',
            'fetched_at' => $currentWeather['fetched_at'] ?? null,
            'score' => $currentWeatherScore,
            'rain_duration_hours' => $currentWeather['rain_window']['duration_hours'] ?? 0,
            'rain_start_at' => $currentWeather['rain_window']['start_at'] ?? null,
            'rain_end_at' => $currentWeather['rain_window']['end_at'] ?? null,
        ];
        $explanation['available_components'] = $availableComponents;
        $explanation['weights_used'] = array_intersect_key($weights, $available);
        $explanation['formula'] = 'fixed weighted sum; unavailable components contribute 0 and are not promoted to represent missing risk data';
        $explanation['sources'] = $sources;
        $explanation['realtime'] = true;
        $explanation['realtime_caveat'] = 'Skor diperbarui saat halaman meminta data. Open-Meteo adalah model cuaca near-real-time, bukan pengukuran sensor langsung.';

        $payload['score'] = $score;
        $payload['risk_level'] = $score === null
            ? 'insufficient'
            : ($score <= 33 ? 'low' : ($score <= 66 ? 'medium' : 'high'));
        $payload['current_weather_score'] = $currentWeatherScore;
        $payload['realtime_calculated_at'] = now()->toIso8601String();
        $payload['explanation'] = $explanation;

        return $payload;
    }

    private function riskExplanation(object $prediction, bool $rainfallAvailable = false): ?array
    {
        $explanation = $prediction->explanation === null
            ? []
            : json_decode($prediction->explanation, true);
        if (! is_array($explanation)) {
            $explanation = [];
        }

        $available = $explanation['available_components'] ?? [];
        if (! is_array($available)) {
            $available = [];
        }
        $historyCount = $this->historyCount((int) $prediction->area_id);
        if ($historyCount !== null) {
            if (! in_array('history', $available, true)) {
                $available[] = 'history';
            }
            $explanation['history_count'] = $historyCount;
            $explanation['history_frequency'] = $this->historyFrequency($historyCount);
        } else {
            $available = array_values(array_filter($available, static fn ($name) => $name !== 'history'));
            unset($explanation['history_count'], $explanation['history_frequency']);
        }
        if ($rainfallAvailable && ! in_array('rainfall', $available, true)) {
            $available[] = 'rainfall';
        }

        $sources = $explanation['sources'] ?? [];
        if (! is_array($sources)) {
            $sources = [];
        }
        $sources['rainfall'] ??= [
            'provider' => 'BMKG',
            'url' => 'https://api.bmkg.go.id/publik/prakiraan-cuaca',
            'status' => in_array('rainfall', $available, true) ? 'available' : 'unavailable',
        ];
        $sources['history'] = [
            'provider' => 'Dataset publik riwayat banjir Surabaya',
            'url' => 'https://github.com/partadox/history_flood_sby',
            'status' => $historyCount !== null ? 'available' : 'not_imported',
        ];
        $sources['environment'] ??= [
            'provider' => 'Belum tersedia',
            'url' => '',
            'status' => in_array('environment', $available, true) ? 'available' : 'unavailable',
        ];
        $sources['drainage'] ??= [
            'provider' => 'Manual survey / local authority',
            'url' => '',
            'status' => in_array('drainage', $available, true) ? 'available' : 'not_imported',
        ];

        $explanation['available_components'] = array_values($available);
        $explanation['sources'] = $sources;
        $explanation['completeness'] ??= count($available) >= 2 ? 'standard' : 'limited';
        $explanation['confidence'] ??= $explanation['completeness'];
        $explanation['caveat'] ??= count($available) < 3
            ? 'Data belum lengkap. Skor sementara lebih banyak dipengaruhi komponen yang tersedia.'
            : 'Perhitungan menggunakan seluruh komponen yang tersedia.';

        return $explanation;
    }

    private function historyCount(int $areaId): ?int
    {
        $count = DB::table('flood_events')
            ->where('area_id', $areaId)
            ->where('started_at', '>=', now()->subYear())
            ->where('verification_status', 'source_reported')
            ->count();

        return $count === 0 ? null : $count;
    }

    private function historyFrequency(int $count): string
    {
        return $count > 5 ? 'sering' : ($count >= 2 ? 'terkadang' : 'jarang');
    }
}
