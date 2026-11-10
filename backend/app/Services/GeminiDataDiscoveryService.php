<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

class GeminiDataDiscoveryService
{
    public function discover(object $area): array
    {
        $apiKey = (string) config('services.gemini.api_key', '');
        if ($apiKey === '') {
            throw new \RuntimeException('GEMINI_API_KEY belum dikonfigurasi.');
        }

        $model = (string) config('services.gemini.model', 'gemini-2.5-flash');
        $prompt = $this->promptFor($area);
        $request = [
            'contents' => [[
                'role' => 'user',
                'parts' => [['text' => $prompt]],
            ]],
            'generationConfig' => [
                'temperature' => 0.1,
                'responseMimeType' => 'application/json',
            ],
        ];
        if (config('services.gemini.google_search', false)) {
            $request['tools'] = [['google_search' => (object) []]];
        }

        $response = Http::timeout(45)
            ->acceptJson()
            ->post('https://generativelanguage.googleapis.com/v1beta/models/'.rawurlencode($model).':generateContent?key='.rawurlencode($apiKey), $request);

        if ($response->failed()) {
            if ($response->status() === 429) {
                $message = config('services.gemini.google_search', false)
                    ? 'Kuota Gemini Google Search grounding habis atau rate limit tercapai. Nonaktifkan grounding atau tunggu kuota pulih.'
                    : 'Rate limit Gemini tercapai. Tunggu sebentar sebelum mencoba lagi.';
                throw new \RuntimeException($message);
            }
            throw new \RuntimeException('Gemini gagal mencari sumber data (HTTP '.$response->status().').');
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        if (! is_string($text) || trim($text) === '') {
            throw new \RuntimeException('Gemini tidak mengembalikan hasil pencarian yang dapat dibaca.');
        }

        $result = json_decode($this->stripJsonFence($text), true);
        if (! is_array($result) || ! isset($result['datasets']) || ! is_array($result['datasets'])) {
            throw new \RuntimeException('Format hasil Gemini tidak sesuai kontrak data discovery.');
        }

        $datasets = [];
        foreach (array_slice($result['datasets'], 0, 8) as $dataset) {
            if (! is_array($dataset) || ! is_string($dataset['url'] ?? null)) {
                continue;
            }
            $datasets[] = $this->validateDataset($dataset);
        }

        return [
            'area' => [
                'name' => $area->name,
                'regency_name' => $area->regency_name,
                'province_name' => $area->province_name,
            ],
            'summary' => is_string($result['summary'] ?? null) ? $result['summary'] : null,
            'datasets' => $datasets,
            'searched_at' => now()->toIso8601String(),
            'grounded' => (bool) config('services.gemini.google_search', false),
            'disclaimer' => config('services.gemini.google_search', false)
                ? 'Hasil ini memakai Google Search grounding, tetapi tetap kandidat untuk ditinjau. Tidak ada data yang dimasukkan ke model risiko secara otomatis.'
                : 'Google Search grounding sedang nonaktif karena batas kuota. Hasil Gemini bukan bukti sumber terbaru; verifikasi setiap URL sebelum digunakan. Tidak ada data yang dimasukkan ke model risiko secara otomatis.',
        ];
    }

    private function validateDataset(array $dataset): array
    {
        $url = trim($dataset['url']);
        $status = 'invalid_url';
        $httpStatus = null;
        if (filter_var($url, FILTER_VALIDATE_URL) && in_array(parse_url($url, PHP_URL_SCHEME), ['http', 'https'], true)) {
            try {
                $sourceResponse = Http::timeout(10)->withHeaders(['User-Agent' => 'SIGAB-SIGAB-data-discovery/1.0'])->get($url);
                $httpStatus = $sourceResponse->status();
                $status = $sourceResponse->successful() ? 'reachable' : 'unreachable';
            } catch (ConnectionException|RequestException) {
                $status = 'unreachable';
            }
        }

        return [
            'category' => is_string($dataset['category'] ?? null) ? $dataset['category'] : 'other',
            'title' => is_string($dataset['title'] ?? null) ? $dataset['title'] : 'Tanpa judul',
            'provider' => is_string($dataset['provider'] ?? null) ? $dataset['provider'] : 'Tidak diketahui',
            'url' => $url,
            'format' => is_string($dataset['format'] ?? null) ? $dataset['format'] : 'Perlu diperiksa',
            'coverage' => is_string($dataset['coverage'] ?? null) ? $dataset['coverage'] : 'Perlu diverifikasi',
            'year' => is_string($dataset['year'] ?? null) ? $dataset['year'] : 'Tidak diketahui',
            'status' => $status,
            'http_status' => $httpStatus,
            'reason' => is_string($dataset['reason'] ?? null) ? $dataset['reason'] : null,
        ];
    }

    private function promptFor(object $area): string
    {
        $location = implode(', ', array_filter([$area->name, $area->regency_name, $area->province_name]));

        return <<<PROMPT
Anda adalah asisten discovery data lingkungan untuk SIGAB. Cari sumber pemerintah atau institusi resmi terlebih dahulu untuk wilayah: {$location}.
Cari kandidat dataset untuk: jaringan drainase buatan, sungai, tutupan lahan, elevasi, dan riwayat banjir.
Jangan mengarang dataset, URL, cakupan, tahun, format, atau angka. Jika tidak yakin, tulis "Perlu diverifikasi".
Jangan menyatakan data cocok untuk wilayah hanya karena nama provinsinya sama.
Kembalikan JSON valid saja dengan bentuk:
{"summary":"ringkasan singkat","datasets":[{"category":"drainage|river|land_cover|elevation|flood_history|other","title":"...","provider":"...","url":"https://...","format":"GeoJSON|WFS|CSV|raster|other","coverage":"...","year":"...","reason":"mengapa relevan"}]}
Maksimal 8 dataset. URL harus halaman atau endpoint sumber asli, bukan URL buatan.
PROMPT;
    }

    private function stripJsonFence(string $text): string
    {
        $text = trim($text);
        if (str_starts_with($text, '```')) {
            $text = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $text) ?? $text;
        }

        return trim($text);
    }
}
