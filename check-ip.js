// Script untuk mengecek IP yang bisa diakses dari HP
const os = require('os');

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal dan non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        ips.push({
          interface: name,
          ip: interface.address
        });
      }
    }
  }
  
  return ips;
}

console.log('IP Addresses yang tersedia:');
console.log('============================');
const ips = getLocalIPs();

if (ips.length === 0) {
  console.log('Tidak ada IP eksternal ditemukan');
} else {
  ips.forEach((item, index) => {
    console.log(`${index + 1}. ${item.interface}: ${item.ip}`);
  });
  
  console.log('\nGunakan salah satu IP di atas untuk mengganti di config.ts');
  console.log('Contoh: BASE_URL: \'http://' + ips[0].ip + '/hadirinapp\'');
}

console.log('\nCara menggunakan:');
console.log('1. Jalankan: node check-ip.js');
console.log('2. Pilih IP yang sesuai dengan jaringan HP Anda');
console.log('3. Update config.ts dengan IP tersebut');
console.log('4. Pastikan HP dan komputer dalam jaringan yang sama');