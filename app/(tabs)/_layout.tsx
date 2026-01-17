import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: '#004643',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { 
          height: 70, 
          paddingBottom: 10,
          paddingTop: 10,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0'
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500'
        }
      }}
    >
      <Tabs.Screen 
        name="beranda" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "home" : "home-outline"} 
              size={24} 
              color={color} 
            />
          )
        }} 
      />
      <Tabs.Screen 
        name="riwayat" 
        options={{ 
          title: 'Lacak',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "location" : "location-outline"} 
              size={24} 
              color={color} 
            />
          )
        }} 
      />
      <Tabs.Screen 
        name="profil" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons 
              name={focused ? "person" : "person-outline"} 
              size={24} 
              color={color} 
            />
          )
        }} 
      />
    </Tabs>
  );
}