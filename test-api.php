<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Simulasi response sukses
$response = array(
    'success' => true,
    'message' => 'Data berhasil dimuat',
    'data' => array(
        'nama' => 'John Doe',
        'jabatan' => 'Software Developer',
        'statusAbsen' => 'Sudah Absen',
        'jamMasuk' => '08:15',
        'jamKeluar' => '17:00',
        'totalJamKerja' => '8j 45m'
    )
);

echo json_encode($response);
?>