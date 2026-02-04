import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="pengajuan" />
        <Stack.Screen name="modal" />
        <Stack.Screen name="approval-admin" />
        <Stack.Screen name="notifikasi-admin" />
        <Stack.Screen name="laporan" />
        <Stack.Screen name="kelola-dinas" />
        <Stack.Screen name="pegawai-akun" />
        <Stack.Screen name="pengaturan" />
      </Stack>
    </ErrorBoundary>
  );
}