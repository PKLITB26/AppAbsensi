import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: '#004643',
      tabBarStyle: { height: 60, paddingBottom: 10 }
    }}>
      <Tabs.Screen 
        name="beranda" 
        options={{ 
          title: 'Beranda',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="riwayat" 
        options={{ 
          title: 'Riwayat',
          tabBarIcon: ({ color }) => <Ionicons name="time" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="presensi" 
        options={{ 
          title: 'Presensi',
          tabBarIcon: ({ color }) => <Ionicons name="alarm-outline" size={28} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{ 
          title: 'Inbox',
          tabBarIcon: ({ color }) => <Ionicons name="mail" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profil" 
        options={{ 
          title: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="pengajuan" 
        options={{ 
          title: 'Pengajuan',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}