import { Stack } from 'expo-router';

export default function ProfileAdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit-profil" />
    </Stack>
  );
}
