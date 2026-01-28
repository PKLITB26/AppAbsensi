<?php
// File helper untuk mengatasi masalah CORS
// Salin kode ini ke bagian atas setiap file PHP API Anda
// HANYA GUNAKAN JIKA BELUM ADA HEADER CORS

// Cek apakah header sudah di-set sebelumnya
if (!headers_sent()) {
    // Set CORS headers untuk web browser
    header("Access-Control-Allow-Origin: http://localhost:8081");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 3600");
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
    
    // Set content type
    header("Content-Type: application/json; charset=UTF-8");
}
?>