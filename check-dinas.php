<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Untuk sementara, return data dummy untuk testing
$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(['success' => false, 'message' => 'User ID diperlukan']);
    exit;
}

// Data dummy - nanti bisa diganti dengan query database sebenarnya
// Untuk testing, anggap user tidak sedang dinas
echo json_encode([
    'success' => true,
    'is_dinas' => false,
    'lokasi_dinas' => null
]);

/* 
// Kode asli untuk koneksi database (uncomment jika tabel sudah siap)
try {
    $pdo = new PDO("mysql:host=localhost;dbname=hadirinapp", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $today = date('Y-m-d');
    
    $stmt = $pdo->prepare("
        SELECT 
            d.*,
            l.nama_lokasi,
            l.latitude,
            l.longitude,
            l.radius,
            l.jenis_lokasi
        FROM dinas d
        LEFT JOIN lokasi_kantor l ON d.lokasi_dinas_id = l.id
        WHERE d.user_id = ? 
        AND ? BETWEEN d.tanggal_mulai AND d.tanggal_selesai
        AND d.status = 'approved'
        ORDER BY d.created_at DESC
        LIMIT 1
    ");
    
    $stmt->execute([$user_id, $today]);
    $dinas = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($dinas) {
        echo json_encode([
            'success' => true,
            'is_dinas' => true,
            'lokasi_dinas' => [
                'id' => $dinas['lokasi_dinas_id'],
                'nama_lokasi' => $dinas['nama_lokasi'],
                'latitude' => $dinas['latitude'],
                'longitude' => $dinas['longitude'],
                'radius' => $dinas['radius'],
                'jenis_lokasi' => 'dinas'
            ],
            'dinas_info' => [
                'keperluan' => $dinas['keperluan'],
                'tanggal_mulai' => $dinas['tanggal_mulai'],
                'tanggal_selesai' => $dinas['tanggal_selesai']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'is_dinas' => false,
            'lokasi_dinas' => null
        ]);
    }
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
*/
?>