<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use SplFileObject;

class ImportDibiFloodEvents extends Command
{
    protected $signature = 'dibi:import-flood-events {path : Path to the DIBI CSV export}';

    protected $description = 'Import individual DIBI BNPB flood events for Surabaya and Sidoarjo';

    private const REGENCY_NAMES = [
        '35.15' => 'Sidoarjo',
        '35.78' => 'Kota Surabaya',
    ];

    public function handle(): int
    {
        $path = $this->argument('path');
        if (! is_string($path) || ! is_file($path) || ! is_readable($path)) {
            $this->error("CSV file tidak dapat dibaca: {$path}");

            return self::FAILURE;
        }

        $file = new SplFileObject($path);
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
        $header = $file->fgetcsv();
        if (! is_array($header)) {
            $this->error('CSV tidak memiliki header.');

            return self::FAILURE;
        }
        $header[0] = preg_replace('/^\xEF\xBB\xBF/', '', (string) $header[0]);
        $columns = array_flip($header);
        foreach (['id', 'Tanggal / Waktu Kejadian', 'Kode Kabupaten', 'Jenis Bencana'] as $required) {
            if (! array_key_exists($required, $columns)) {
                $this->error("Kolom CSV wajib tidak ditemukan: {$required}");

                return self::FAILURE;
            }
        }

        $sourceId = DB::table('data_sources')->where([
            'name' => 'DIBI BNPB',
            'source_type' => 'disaster',
        ])->value('id');
        if ($sourceId === null) {
            $sourceId = DB::table('data_sources')->insertGetId([
                'name' => 'DIBI BNPB',
                'provider' => 'BNPB',
                'source_type' => 'disaster',
                'url' => 'https://dibi.bnpb.go.id/',
                'license_note' => 'Imported from an official DIBI BNPB CSV export.',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $areaIds = $this->ensureRegencyAreas();
        $imported = 0;
        $skipped = 0;
        $seen = [];

        DB::transaction(function () use ($file, $columns, $sourceId, $areaIds, &$imported, &$skipped, &$seen): void {
            foreach ($file as $row) {
                if (! is_array($row) || count($row) < count($columns)) {
                    continue;
                }

                $eventId = trim((string) ($row[$columns['id']] ?? ''));
                $regencyCode = trim((string) ($row[$columns['Kode Kabupaten']] ?? ''));
                $eventType = trim((string) ($row[$columns['Jenis Bencana']] ?? ''));
                if ($eventId === '' || ! isset($areaIds[$regencyCode]) || strcasecmp($eventType, 'Banjir') !== 0) {
                    $skipped++;
                    continue;
                }
                if (isset($seen[$eventId])) {
                    $skipped++;
                    continue;
                }
                $seen[$eventId] = true;

                try {
                    $startedAt = Carbon::parse((string) ($row[$columns['Tanggal / Waktu Kejadian']] ?? ''));
                } catch (\Throwable) {
                    $skipped++;
                    continue;
                }

                if (DB::table('flood_events')->where('source_reference', "DIBI:{$eventId}")->exists()) {
                    $skipped++;
                    continue;
                }

                $impact = [];
                foreach ([
                    'Meninggal' => 'deaths',
                    'Hilang' => 'missing',
                    'Luka / Sakit' => 'injured',
                    'menderita_mengungsi' => 'affected_displaced',
                    'Rumah Terendam' => 'houses_flooded',
                ] as $csvColumn => $key) {
                    if (isset($columns[$csvColumn]) && ($value = $row[$columns[$csvColumn]] ?? null) !== null && $value !== '') {
                        $impact[$key] = (float) $value;
                    }
                }

                DB::table('flood_events')->insert([
                    'area_id' => $areaIds[$regencyCode],
                    'data_source_id' => $sourceId,
                    'started_at' => $startedAt,
                    'ended_at' => null,
                    'severity' => 'reported',
                    'description' => json_encode([
                        'event_type' => $eventType,
                        'impact' => $impact,
                    ], JSON_THROW_ON_ERROR),
                    'source_reference' => "DIBI:{$eventId}",
                    'verification_status' => 'source_reported',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $imported++;
            }
        });

        $this->info("Import selesai: {$imported} kejadian baru, {$skipped} baris dilewati.");

        return self::SUCCESS;
    }

    /**
     * @return array<string, int>
     */
    private function ensureRegencyAreas(): array
    {
        $areaIds = [];
        foreach (self::REGENCY_NAMES as $code => $name) {
            $areaId = DB::table('areas')->where('code', $code)->where('level', 'regency')->value('id');
            if ($areaId === null) {
                $areaId = DB::table('areas')->insertGetId([
                    'name' => $name,
                    'slug' => str($name)->slug('-').'-'.strtolower($code),
                    'level' => 'regency',
                    'code' => $code,
                    'regency_code' => $code,
                    'regency_name' => $name,
                    'province_code' => '35',
                    'province_name' => 'Jawa Timur',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            $areaIds[$code] = (int) $areaId;
        }

        return $areaIds;
    }
}
