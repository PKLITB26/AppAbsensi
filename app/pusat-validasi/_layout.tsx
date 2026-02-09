import { Stack } from 'expo-router';

export default function PusatValidasiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="absen-dinas/index" />
    </Stack>
  );
}
