import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PengaturanScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* FIXED HEADER */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pengaturan</Text>
        </View>
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFB' 
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  contentContainer: {
    flex: 1,
    marginTop: 120
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backBtn: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: '#F5F5F5'
  },
  headerTitle: { 
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004643'
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
