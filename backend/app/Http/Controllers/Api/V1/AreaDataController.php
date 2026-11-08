<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        return response()->json([
            'data' => [
                'area' => $this->areaPayload($area),
                'prediction' => $prediction === null ? null : $this->predictionPayload($prediction),
            ],
        ]);
    }

    public function rainfall(Request $request, string $slug): JsonResponse
    {
        $area = $this->findArea($slug);
        $query = DB::table('rainfall_records')
            ->where('area_id', $area->id)
            ->select([
                'observed_at',
                'period_hours',
                'rainfall_mm',
                'quality_status',
                'data_source_id',
                'raw_metadata',
            ])
            ->orderByDesc('observed_at');

        if ($request->filled('from')) {
            $query->where('observed_at', '>=', $request->date('from')->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('observed_at', '<=', $request->date('to')->endOfDay());
        }

        $records = $query->paginate(min($request->integer('per_page', 50), 100));
        $records->getCollection()->transform(function (object $record): array {
            $metadata = $record->raw_metadata === null ? [] : json_decode($record->raw_metadata, true);
            return [
                'observed_at' => $record->observed_at,
                'period_hours' => $record->period_hours,
                'rainfall_mm' => $record->rainfall_mm,
                'rainfall_probability' => is_array($metadata) ? ($metadata['pp'] ?? null) : null,
                'quality_status' => $record->quality_status,
            ];
        });

        return response()->json(['data' => $records]);
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
        return [
            'id' => $prediction->id,
            'score' => $prediction->score,
            'risk_level' => $prediction->risk_level,
            'rainfall_score' => $prediction->rainfall_score,
            'history_score' => $prediction->history_score,
            'environment_score' => $prediction->environment_score,
            'drainage_score' => $prediction->drainage_score,
            'method_version' => $prediction->method_version,
            'data_as_of' => $prediction->data_as_of,
            'calculated_at' => $prediction->calculated_at,
            'status' => $prediction->status,
            'explanation' => $this->riskExplanation($prediction),
        ];
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
        $sources['history'] ??= [
            'provider' => 'DIBI BNPB',
            'url' => 'https://dibi.bnpb.go.id/superset/dashboard/2/',
            'status' => in_array('history', $available, true) ? 'available' : 'not_imported',
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
}
