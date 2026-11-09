<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PredictionImportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $pipelineKey = (string) config('services.sigab.pipeline_key', '');
        if ($pipelineKey !== '' && ! hash_equals($pipelineKey, (string) $request->header('X-Pipeline-Key'))) {
            return response()->json(['message' => 'Invalid pipeline key.'], 401);
        }

        $validator = Validator::make($request->all(), [
            'metadata.source' => ['required', 'string', 'max:100'],
            'metadata.method_version' => ['required', 'string', 'max:50'],
            'areas' => ['required', 'array'],
            'areas.*.code' => ['required', 'string', 'max:30'],
            'areas.*.name' => ['required', 'string', 'max:255'],
            'areas.*.level' => ['required', 'string', 'max:30'],
            'areas.*.regency_code' => ['nullable', 'string', 'max:10'],
            'areas.*.regency_name' => ['nullable', 'string', 'max:255'],
            'areas.*.province_code' => ['nullable', 'string', 'max:10'],
            'areas.*.province_name' => ['nullable', 'string', 'max:255'],
            'areas.*.latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'areas.*.longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'rainfall_records' => ['required', 'array'],
            'rainfall_records.*.area_code' => ['required', 'string', 'max:30'],
            'rainfall_records.*.observed_at' => ['required', 'date'],
            'rainfall_records.*.period_hours' => ['nullable', 'integer', 'min:1'],
            'rainfall_records.*.rainfall_mm' => ['nullable', 'numeric', 'min:0'],
            'rainfall_records.*.quality_status' => ['required', 'string', 'max:30'],
            'rainfall_records.*.raw_metadata' => ['nullable', 'array'],
            'predictions' => ['required', 'array'],
            'predictions.*.area_code' => ['required', 'string', 'max:30'],
            'predictions.*.score' => ['nullable', 'integer', 'between:0,100'],
            'predictions.*.risk_level' => ['required', 'string', 'max:30'],
            'predictions.*.status' => ['required', 'string', 'max:30'],
            'predictions.*.rainfall_score' => ['nullable', 'numeric', 'between:0,100'],
            'predictions.*.history_score' => ['nullable', 'numeric', 'between:0,100'],
            'predictions.*.environment_score' => ['nullable', 'numeric', 'between:0,100'],
            'predictions.*.drainage_score' => ['nullable', 'numeric', 'between:0,100'],
            'predictions.*.method_version' => ['required', 'string', 'max:50'],
            'predictions.*.data_as_of' => ['nullable', 'date'],
            'predictions.*.explanation' => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid pipeline payload.', 'errors' => $validator->errors()], 422);
        }

        $payload = $validator->validated();
        $imported = DB::transaction(function () use ($payload): array {
            $areaIds = [];
            foreach ($payload['areas'] as $area) {
                $areaId = DB::table('areas')->where('code', $area['code'])->value('id');
                $areaValues = [
                    'name' => $area['name'],
                    'level' => $area['level'],
                    'regency_code' => $area['regency_code'] ?? null,
                    'regency_name' => $area['regency_name'] ?? null,
                    'province_code' => $area['province_code'] ?? null,
                    'province_name' => $area['province_name'] ?? null,
                    'centroid_lat' => $area['latitude'] ?? null,
                    'centroid_lng' => $area['longitude'] ?? null,
                    'is_active' => true,
                    'updated_at' => now(),
                ];
                if ($areaId === null) {
                    $areaId = DB::table('areas')->insertGetId([
                        'name' => $area['name'],
                        'slug' => Str::slug($area['name']).'-'.strtolower($area['code']),
                        'level' => $area['level'],
                        'code' => $area['code'],
                        'regency_code' => $area['regency_code'] ?? null,
                        'regency_name' => $area['regency_name'] ?? null,
                        'province_code' => $area['province_code'] ?? null,
                        'province_name' => $area['province_name'] ?? null,
                        'centroid_lat' => $area['latitude'] ?? null,
                        'centroid_lng' => $area['longitude'] ?? null,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::table('areas')->where('id', $areaId)->update($areaValues);
                }
                $areaIds[$area['code']] = $areaId;
            }

            $source = DB::table('data_sources')->updateOrInsert(
                ['name' => $payload['metadata']['source'], 'source_type' => 'weather'],
                ['provider' => $payload['metadata']['source'], 'is_active' => true, 'updated_at' => now(), 'created_at' => now()],
            );
            $sourceId = DB::table('data_sources')
                ->where('name', $payload['metadata']['source'])
                ->where('source_type', 'weather')
                ->value('id');

            $rainfallCount = 0;
            foreach ($payload['rainfall_records'] as $record) {
                $areaId = $areaIds[$record['area_code']] ?? DB::table('areas')->where('code', $record['area_code'])->value('id');
                if ($areaId === null) {
                    continue;
                }
                DB::table('rainfall_records')->updateOrInsert(
                    ['area_id' => $areaId, 'data_source_id' => $sourceId, 'observed_at' => $record['observed_at']],
                    [
                        'period_hours' => $record['period_hours'] ?? null,
                        'rainfall_mm' => $record['rainfall_mm'] ?? null,
                        'quality_status' => $record['quality_status'],
                        'raw_metadata' => isset($record['raw_metadata']) ? json_encode($record['raw_metadata']) : null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ],
                );
                $rainfallCount++;
            }

            $predictionCount = 0;
            foreach ($payload['predictions'] as $prediction) {
                $areaId = $areaIds[$prediction['area_code']] ?? DB::table('areas')->where('code', $prediction['area_code'])->value('id');
                if ($areaId === null) {
                    continue;
                }
                $historyCount = $this->historyCount($areaId);
                $historyScore = $historyCount === null
                    ? null
                    : $this->historyRiskScore($historyCount);
                $score = $this->calculateScore($prediction, $historyScore);
                $riskLevel = $score === null
                    ? $prediction['risk_level']
                    : ($score <= 33 ? 'low' : ($score <= 66 ? 'medium' : 'high'));
                $explanation = $prediction['explanation'] ?? [];
                if (! is_array($explanation)) {
                    $explanation = [];
                }
                if ($historyScore !== null) {
                    $explanation['history_scope'] = 'village';
                    $explanation['history_source_status'] = 'secondary_geocoded_news';
                    $explanation['history_caveat'] = 'Histori berasal dari dataset publik berbasis berita dan hanya mencakup lokasi yang berhasil dipetakan ke kelurahan.';
                    $explanation['history_count'] = $historyCount;
                    $explanation['history_frequency'] = $this->historyFrequency($historyCount);
                }
                DB::table('risk_predictions')->insert([
                    'area_id' => $areaId,
                    'score' => $score,
                    'risk_level' => $riskLevel,
                    'rainfall_score' => $prediction['rainfall_score'] ?? null,
                    'history_score' => $historyScore,
                    'history_count' => $historyCount,
                    'history_frequency' => $historyCount === null ? null : $this->historyFrequency($historyCount),
                    'environment_score' => $prediction['environment_score'] ?? null,
                    'drainage_score' => $prediction['drainage_score'] ?? null,
                    'input_snapshot' => json_encode(['source' => $payload['metadata']['source']]),
                    'method_version' => $prediction['method_version'],
                    'data_as_of' => $prediction['data_as_of'] ?? null,
                    'calculated_at' => now(),
                    'status' => $prediction['status'],
                    'explanation' => $explanation === [] ? null : json_encode($explanation),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $predictionCount++;
            }

            return compact('rainfallCount', 'predictionCount');
        });

        return response()->json(['message' => 'Prediction data imported.', 'imported' => $imported]);
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

    private function historyRiskScore(int $count): float
    {
        return $count > 5 ? 100.0 : ($count >= 2 ? 60.0 : 20.0);
    }

    private function calculateScore(array $prediction, ?float $historyScore): ?int
    {
        $components = [
            'rainfall' => $prediction['rainfall_score'] ?? null,
            'history' => $historyScore,
            'environment' => $prediction['environment_score'] ?? null,
            'drainage' => isset($prediction['drainage_score']) && $prediction['drainage_score'] !== null
                ? 100 - (float) $prediction['drainage_score']
                : null,
        ];
        $weights = ['rainfall' => 0.45, 'history' => 0.35, 'environment' => 0.05, 'drainage' => 0.15];
        $available = array_filter($components, static fn ($value) => $value !== null);
        if ($available === []) {
            return null;
        }

        $totalWeight = 0.0;
        $weightedScore = 0.0;
        foreach ($available as $name => $value) {
            $totalWeight += $weights[$name];
            $weightedScore += $weights[$name] * (float) $value;
        }

        return (int) round($weightedScore / $totalWeight);
    }
}
