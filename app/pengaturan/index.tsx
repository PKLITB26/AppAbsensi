import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppHeader } from '../../components';

export default function PengaturanScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      
      <AppHeader 
        title="Pengaturan"
        showBack={true}
      />

      <View style={styles.contentContainer}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>ABSENSI</Text>
          <View style={styles.settingGroup}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/pengaturan/jam-kerja' as any)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="time-outline" size={22} color="#1976D2" />
                </View>
                <Text style={styles.settingText}>Jam Kerja</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/pengaturan/kalender-libur' as any)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="calendar-outline" size={22} color="#F44336" />
                </View>
                <Text style={styles.settingText}>Kalender Libur</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/pengaturan/lokasi-kantor' as any)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="location-outline" size={22} color="#4CAF50" />
                </View>
                <Text style={styles.settingText}>Lokasi Kantor</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>TENTANG</Text>
          <View style={styles.settingGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="information-circle-outline" size={22} color="#9C27B0" />
                </View>
                <Text style={styles.settingText}>Versi Aplikasi</Text>
              </View>
              <Text style={styles.versionText}>1.0.0</Text>
            </View>
          </View>
        </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFB' 
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F8FAFB'
  },
  scrollView: {
    flex: 1
  },
  section: {
    marginTop: 20
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6D6D72',
    paddingHorizontal: 16,
    paddingBottom: 8,
    letterSpacing: -0.08
  },
  settingGroup: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 10,
    overflow: 'hidden'
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  settingText: {
    fontSize: 17,
    color: '#000',
    letterSpacing: -0.41
  },
  divider: {
    height: 0.5,
    backgroundColor: '#C6C6C8',
    marginLeft: 60
  },
  versionText: {
    fontSize: 17,
    color: '#8E8E93',
    letterSpacing: -0.41
  }
});
