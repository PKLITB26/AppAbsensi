<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Database connection
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "hadirinapp";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $e->getMessage()]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // Check if requesting monthly stats
        if (isset($_GET['month'])) {
            $month = $_GET['month']; // Format: YYYY-MM
            
            $sql = "SELECT 
                        p.tanggal,
                        COUNT(*) as total_attendance
                    FROM presensi p
                    WHERE DATE_FORMAT(p.tanggal, '%Y-%m') = :month
                    AND p.lat_absen IS NOT NULL 
                    AND p.long_absen IS NOT NULL
                    GROUP BY p.tanggal
                    ORDER BY p.tanggal";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':month', $month);
            $stmt->execute();
            
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $result,
                'month' => $month
            ]);
            
        } else {
            // Get tanggal parameter, default to today
            $tanggal = isset($_GET['tanggal']) ? $_GET['tanggal'] : date('Y-m-d');
            
            // Query to get presensi data with user info
            $sql = "SELECT 
                        p.id_presensi,
                        p.id_user,
                        p.tanggal,
                        p.jam_masuk,
                        p.lat_absen,
                        p.long_absen,
                        p.foto_selfie,
                        p.status,
                        p.alasan_luar_lokasi,
                        u.nama_lengkap,
                        u.nip
                    FROM presensi p
                    LEFT JOIN users u ON p.id_user = u.id_user
                    WHERE p.tanggal = :tanggal
                    AND p.lat_absen IS NOT NULL 
                    AND p.long_absen IS NOT NULL
                    ORDER BY p.jam_masuk DESC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->bindParam(':tanggal', $tanggal);
            $stmt->execute();
            
            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Convert numeric strings to proper numbers
            foreach ($result as &$row) {
                $row['lat_absen'] = (float) $row['lat_absen'];
                $row['long_absen'] = (float) $row['long_absen'];
                $row['id_presensi'] = (int) $row['id_presensi'];
                $row['id_user'] = (int) $row['id_user'];
            }
            
            echo json_encode([
                'success' => true,
                'data' => $result,
                'tanggal' => $tanggal,
                'total' => count($result)
            ]);
        }
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

// Additional endpoint for statistics
if (isset($_GET['stats']) && $_GET['stats'] == 'true') {
    try {
        $tanggal = isset($_GET['tanggal']) ? $_GET['tanggal'] : date('Y-m-d');
        
        // Get statistics for the day
        $statsSql = "SELECT 
                        status,
                        COUNT(*) as count
                     FROM presensi 
                     WHERE tanggal = :tanggal
                     AND lat_absen IS NOT NULL 
                     AND long_absen IS NOT NULL
                     GROUP BY status";
        
        $stmt = $pdo->prepare($statsSql);
        $stmt->bindParam(':tanggal', $tanggal);
        $stmt->execute();
        
        $stats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format stats
        $formattedStats = [
            'total' => 0,
            'hadir' => 0,
            'terlambat' => 0,
            'dinas_luar' => 0,
            'izin' => 0,
            'sakit' => 0,
            'cuti' => 0
        ];
        
        foreach ($stats as $stat) {
            $formattedStats['total'] += $stat['count'];
            
            switch ($stat['status']) {
                case 'Hadir':
                    $formattedStats['hadir'] = $stat['count'];
                    break;
                case 'Terlambat':
                    $formattedStats['terlambat'] = $stat['count'];
                    break;
                case 'Dinas Luar/ Perjalanan Dinas':
                    $formattedStats['dinas_luar'] = $stat['count'];
                    break;
                case 'Izin':
                    $formattedStats['izin'] = $stat['count'];
                    break;
                case 'Sakit':
                    $formattedStats['sakit'] = $stat['count'];
                    break;
                case 'Cuti':
                    $formattedStats['cuti'] = $stat['count'];
                    break;
            }
        }
        
        echo json_encode([
            'success' => true,
            'stats' => $formattedStats,
            'tanggal' => $tanggal
        ]);
        
    } catch(PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
}

$pdo = null;
?>