<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use SplFileObject;

class ImportDetailedFloodHistory extends Command
{
    protected $signature = 'history:import-detailed {path? : Path to the detailed flood history CSV}';

    protected $description = 'Import verifiable flood locations mapped to existing village areas';

    public function handle(): int
    {
        $path = $this->argument('path') ?: storage_path('app/private/bpbd-banjir-histori.csv');
        if (! is_string($path) || ! is_file($path) || ! is_readable($path)) {
            $this->error("CSV tidak dapat dibaca: {$path}");

            return self::FAILURE;
        }

        $file = new SplFileObject($path);
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
        $header = $file->fgetcsv();
        if (! is_array($header)) {
            $this->error('CSV tidak memiliki header.');

            return self::FAILURE;
        }
        $header = array_map(
            static fn ($value): string => trim((string) $value, "\xEF\xBB\xBF \t\n\r\""),
            $header,
        );
        $columns = array_flip($header);
        foreach (['event_id', 'event_date', 'location', 'source_url'] as $required) {
            if (! array_key_exists($required, $columns)) {
                $this->error("Kolom CSV wajib tidak ditemukan: {$required}");

                return self::FAILURE;
            }
        }

        $sourceId = DB::table('data_sources')->where([
            'name' => 'Surabaya flood history dataset',
            'source_type' => 'disaster',
        ])->value('id');
        if ($sourceId === null) {
            $sourceId = DB::table('data_sources')->insertGetId([
                'name' => 'Surabaya flood history dataset',
                'provider' => 'partadox/history_flood_sby',
                'source_type' => 'disaster',
                'url' => 'https://github.com/partadox/history_flood_sby',
                'license_note' => 'Public research dataset extracted from online news; location mapping is limited to explicit village names.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $areas = DB::table('areas')
            ->whereIn('level', ['village', 'kelurahan', 'desa'])
            ->get(['id', 'name', 'code', 'regency_code']);
        $areaByName = [];
        foreach ($areas as $area) {
            $areaByName[$this->normalizeName($area->name)][] = $area;
        }

        $imported = 0;
        $unmapped = 0;
        DB::transaction(function () use ($file, $columns, $sourceId, $areaByName, &$imported, &$unmapped): void {
            DB::table('flood_events')
                ->where('source_reference', 'like', 'HISTORY:%')
                ->delete();

            foreach ($file as $row) {
                if (! is_array($row)) {
                    continue;
                }

                $eventId = trim((string) ($row[$columns['event_id']] ?? ''));
                $location = trim((string) ($row[$columns['location']] ?? ''));
                $area = $this->findVillage($location, $areaByName);
                if ($eventId === '' || $area === null) {
                    $unmapped++;
                    continue;
                }

                try {
                    $startedAt = Carbon::parse((string) ($row[$columns['event_date']] ?? ''));
                } catch (\Throwable) {
                    $unmapped++;
                    continue;
                }

                DB::table('flood_events')->updateOrInsert(
                    ['source_reference' => "HISTORY:{$eventId}"],
                    [
                        'area_id' => $area->id,
                        'data_source_id' => $sourceId,
                        'started_at' => $startedAt,
                        'ended_at' => null,
                        'severity' => 'reported',
                        'description' => json_encode([
                            'location' => $location,
                            'latitude' => $row[$columns['latitude']] ?? null,
                            'longitude' => $row[$columns['longitude']] ?? null,
                            'source_url' => $row[$columns['source_url']] ?? null,
                            'mapping' => 'explicit_village_name',
                        ], JSON_THROW_ON_ERROR),
                        'verification_status' => 'source_reported',
                        'updated_at' => now(),
                        'created_at' => now(),
                    ],
                );
                $imported++;
            }
        });

        $this->info("Import selesai: {$imported} kejadian terpetakan, {$unmapped} baris tidak terpetakan.");
        if ($unmapped > 0) {
            $this->warn('Baris tanpa nama kelurahan yang dapat dicocokkan tidak dimasukkan ke area mana pun.');
        }

        return self::SUCCESS;
    }

    private function findVillage(string $location, array $areaByName): ?object
    {
        $normalizedLocation = $this->normalizeName($location);
        $matches = [];
        foreach ($areaByName as $name => $areas) {
            if ($name !== '' && Str::contains($normalizedLocation, $name)) {
                $matches = array_merge($matches, $areas);
            }
        }

        return count($matches) === 1 ? $matches[0] : null;
    }

    private function normalizeName(string $value): string
    {
        $value = Str::lower($value);
        $value = preg_replace('/\b(kelurahan|desa)\b/u', '', $value) ?? $value;
        $value = preg_replace('/[^a-z0-9]+/u', ' ', $value) ?? $value;

        return trim($value);
    }
}
