import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function NavbarLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#004643',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0'
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="dashboard-admin"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking-admin"
        options={{
          title: 'Lacak',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "location" : "location-outline"} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil-admin"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
