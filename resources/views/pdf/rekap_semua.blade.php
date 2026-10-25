<!DOCTYPE html>
<html>
<head>
    <title>Rekap Setoran Siswa</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; }
        .page-break { page-break-after: always; } /* Kunci untuk memisah halaman per siswa */
        .header { text-align: center; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #047857; }
        .student-info { margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
        th { background-color: #f8fafc; color: #334155; }
        .badge { padding: 3px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
        .hafalan { background-color: #d1fae5; color: #065f46; }
        .murojaah { background-color: #dbeafe; color: #1e40af; }
    </style>
</head>
<body>

    @foreach($siswas as $siswa)
    <div class="page-break">
        <div class="header">
            <h2>SABIRA TAHFIDZ</h2>
            <p>Laporan Rekapitulasi Hafalan & Murojaah Siswa</p>
        </div>

        <div class="student-info">
            <strong>Nama Siswa :</strong> {{ $siswa->nama }} <br>
            <strong>NIS / Kelas :</strong> {{ $siswa->nis }} / {{ $siswa->kelas }}
        </div>

        <table>
            <thead>
                <tr>
                    <th>Tanggal</th>
                    <th>Jenis</th>
                    <th>Surah & Ayat</th>
                    <th>Nilai</th>
                    <th>Pembimbing</th>
                </tr>
            </thead>
            <tbody>
                @foreach($siswa->setorans as $setoran)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($setoran->tanggal)->format('d M Y') }}</td>
                    <td><span class="badge {{ strtolower($setoran->jenis) }}">{{ $setoran->jenis }}</span></td>
                    <td>{{ $setoran->surah }} ({{ $setoran->ayat_awal }}-{{ $setoran->ayat_akhir }})</td>
                    <td>{{ $setoran->nilai }}</td>
                    <td>{{ $setoran->ustadz?->nama ?? '-' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach

</body>
</html>
