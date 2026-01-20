import { Stack } from 'expo-router';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="data-pegawai-admin" />
        <Stack.Screen name="akun-login-admin" />
        <Stack.Screen name="add-data-pegawai" />
        <Stack.Screen name="daftar-pegawai" />
        <Stack.Screen name="add-user" />
        <Stack.Screen name="users" />
        <Stack.Screen name="pengajuan" />
        <Stack.Screen name="modal" />
      </Stack>
    </ErrorBoundary>
  );
}