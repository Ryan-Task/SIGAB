<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GeminiDataDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class EnvironmentDiscoveryController extends Controller
{
    public function show(string $slug, GeminiDataDiscoveryService $discovery): JsonResponse
    {
        $area = DB::table('areas')
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first(['name', 'regency_name', 'province_name']);

        abort_if($area === null, 404, 'Area not found.');

        $cacheKey = 'environment-discovery:'.$slug;
        $cached = Cache::get($cacheKey);
        if (is_array($cached)) {
            return response()->json(['data' => $cached, 'cached' => true]);
        }

        $lock = Cache::lock($cacheKey.':lock', 60);
        if (! $lock->get()) {
            return response()->json([
                'message' => 'Pencarian untuk wilayah ini sedang berjalan. Tunggu sekitar satu menit sebelum mencoba lagi.',
            ], 429, ['Retry-After' => '60']);
        }

        try {
            $result = $discovery->discover($area);
            Cache::put($cacheKey, $result, now()->addMinutes(10));

            return response()->json(['data' => $result, 'cached' => false]);
        } catch (\RuntimeException $error) {
            $status = str_contains($error->getMessage(), 'Kuota Gemini')
                ? 429
                : 502;

            return response()->json(['message' => $error->getMessage()], $status, $status === 429 ? ['Retry-After' => '60'] : []);
        } finally {
            $lock->release();
        }
    }
}
