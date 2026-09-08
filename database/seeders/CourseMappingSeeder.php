<?php

namespace Database\Seeders;

use App\Models\CourseMapping;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;

class CourseMappingSeeder extends Seeder
{
    public function run(): void
    {
        $csvPaths = [
            base_path('../Model-BK-Ews/course_mapping.csv'),
            'c:/Users/ramad/Documents/PROJECT/Model-BK-Ews/course_mapping.csv',
            base_path('course_mapping.csv'),
        ];

        $csvPath = null;
        foreach ($csvPaths as $path) {
            if (File::exists($path)) {
                $csvPath = $path;
                break;
            }
        }

        if ($csvPath) {
            $lines = file($csvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            $header = null;

            foreach ($lines as $i => $line) {
                $row = str_getcsv($line);
                if ($i === 0) {
                    $header = $row;
                    continue;
                }

                if (count($row) >= 6) {
                    CourseMapping::updateOrCreate(
                        ['code_module' => trim($row[0])],
                        [
                            'nama_mapel' => trim($row[1]),
                            'kategori_mapel' => trim($row[2]),
                            'nama_guru_mapel' => trim($row[3]),
                            'no_wa_guru' => trim($row[4]),
                            'kkm' => (int) trim($row[5]),
                        ]
                    );
                }
            }
        } else {
            // Fallback default kurikulum SMK
            $defaults = [
                ['code_module' => 'AAA', 'nama_mapel' => 'Pemrograman Web dan Perangkat Bergerak', 'kategori_mapel' => 'Kejuruan/Produktif', 'nama_guru_mapel' => 'I Wayan Sudarma S.Kom.', 'no_wa_guru' => '+6281234567801', 'kkm' => 75],
                ['code_module' => 'BBB', 'nama_mapel' => 'Basis Data', 'kategori_mapel' => 'Kejuruan/Produktif', 'nama_guru_mapel' => 'Ni Made Rai Astuti S.Pd.', 'no_wa_guru' => '+6281234567802', 'kkm' => 75],
                ['code_module' => 'CCC', 'nama_mapel' => 'Pemodelan Perangkat Lunak', 'kategori_mapel' => 'Kejuruan/Produktif', 'nama_guru_mapel' => 'I Ketut Sujana S.T.', 'no_wa_guru' => '+6281234567803', 'kkm' => 75],
                ['code_module' => 'DDD', 'nama_mapel' => 'Matematika Terapan dan Komputasi', 'kategori_mapel' => 'Umum/Normatif-Adaptif', 'nama_guru_mapel' => 'Drs. I Nyoman Artawa', 'no_wa_guru' => '+6281234567804', 'kkm' => 70],
                ['code_module' => 'EEE', 'nama_mapel' => 'Bahasa Inggris Kejuruan', 'kategori_mapel' => 'Umum/Normatif-Adaptif', 'nama_guru_mapel' => 'Ni Luh Putu Eka Dewi S.Pd.', 'no_wa_guru' => '+6281234567805', 'kkm' => 70],
                ['code_module' => 'FFF', 'nama_mapel' => 'Proyek Kreatif dan Kewirausahaan', 'kategori_mapel' => 'Kejuruan/Produktif', 'nama_guru_mapel' => 'I Made Suarta S.E.', 'no_wa_guru' => '+6281234567806', 'kkm' => 72],
                ['code_module' => 'GGG', 'nama_mapel' => 'Dasar-Dasar Kejuruan RPL', 'kategori_mapel' => 'Kejuruan/Produktif', 'nama_guru_mapel' => 'I Gede Yoga Pratama M.Kom.', 'no_wa_guru' => '+6281234567807', 'kkm' => 75],
            ];

            foreach ($defaults as $item) {
                CourseMapping::updateOrCreate(['code_module' => $item['code_module']], $item);
            }
        }
    }
}
