<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseMapping;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CourseMappingController extends Controller
{
    /**
     * Update cepat (inline/modal) data pemetaan kursus.
     */
    public function update(Request $request, int $id): RedirectResponse|JsonResponse
    {
        $mapping = CourseMapping::findOrFail($id);

        $validated = $request->validate([
            'nama_mapel' => 'required|string|max:255',
            'kategori_mapel' => 'required|string|max:100',
            'nama_guru_mapel' => 'required|string|max:255',
            'no_wa_guru' => 'nullable|string|max:50',
            'kkm' => 'required|integer|min:50|max:100',
        ]);

        $mapping->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "Pemetaan modul {$mapping->code_module} berhasil diperbarui.",
                'data' => $mapping,
            ]);
        }

        return redirect()->back()->with('success', "Pemetaan mata pelajaran {$mapping->nama_mapel} ({$mapping->code_module}) berhasil diperbarui.");
    }

    /**
     * Upload & import file course_mapping.csv baru.
     */
    public function uploadCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:2048',
        ]);

        $file = $request->file('csv_file');
        $path = $file->getRealPath();

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (empty($lines)) {
            return redirect()->back()->with('error', 'File CSV kosong.');
        }

        $header = null;
        $updatedCount = 0;

        foreach ($lines as $i => $line) {
            $row = str_getcsv($line);
            if ($i === 0) {
                $header = array_map('trim', $row);
                continue;
            }

            if (count($row) >= 5) {
                $codeModule = trim($row[0]);
                if (empty($codeModule)) {
                    continue;
                }

                CourseMapping::updateOrCreate(
                    ['code_module' => $codeModule],
                    [
                        'nama_mapel' => trim($row[1] ?? ''),
                        'kategori_mapel' => trim($row[2] ?? 'Kejuruan/Produktif'),
                        'nama_guru_mapel' => trim($row[3] ?? ''),
                        'no_wa_guru' => trim($row[4] ?? ''),
                        'kkm' => isset($row[5]) ? (int) trim($row[5]) : 75,
                    ]
                );
                $updatedCount++;
            }
        }

        return redirect()->back()->with('success', "Berhasil memproses file CSV: {$updatedCount} mata pelajaran berhasil diperbarui.");
    }

    /**
     * Ekspor/unduh file course_mapping.csv saat ini.
     */
    public function downloadCsv(): StreamedResponse
    {
        $fileName = 'course_mapping_' . date('Y-m-d') . '.csv';
        $mappings = CourseMapping::orderBy('code_module')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($mappings) {
            $handle = fopen('php://output', 'w');
            // Header CSV
            fputcsv($handle, ['code_module', 'nama_mapel', 'kategori_mapel', 'nama_guru_mapel', 'no_wa_guru', 'kkm']);

            foreach ($mappings as $m) {
                fputcsv($handle, [
                    $m->code_module,
                    $m->nama_mapel,
                    $m->kategori_mapel,
                    $m->nama_guru_mapel,
                    $m->no_wa_guru,
                    $m->kkm,
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}
