import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function PegawaiAkunIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect ke halaman data pegawai admin
    router.replace('/pegawai-akun/data-pegawai-admin');
  }, []);

  return null;
}
