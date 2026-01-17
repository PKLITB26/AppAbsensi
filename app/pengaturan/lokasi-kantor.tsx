import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { PengaturanAPI } from '../../constants/config';

export default function LokasiKantorScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lokasiKantor, setLokasiKantor] = useState<any[]>([]);
  const [lokasiDinas, setLokasiDinas] = useState<any[]>([]);

  useEffect(() => {
    fetchLokasiData();
  }, []);

  // Refresh data ketika kembali dari halaman tambah lokasi
  useFocusEffect(
    React.useCallback(() => {
      fetchLokasiData();
    }, [])
  );

  const fetchLokasiData = async () => {
    try {
      setLoading(true);
      const response = await PengaturanAPI.getLokasiKantor();
      if (response.success && response.data) {
        const kantor = response.data.filter((item: any) => item.jenis_lokasi === 'tetap');
        const dinas = response.data.filter((item: any) => item.jenis_lokasi === 'dinas');
        setLokasiKantor(kantor);
        setLokasiDinas(dinas);
      }
    } catch (error) {
      console.error('Error fetching lokasi:', error);
      setLokasiKantor([
        { id: 1, nama_lokasi: 'Kantor Pusat', alamat: 'Jl. Sudirman No. 1', jenis_lokasi: 'tetap' }
      ]);
      setLokasiDinas([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteLokasi = async (id: number) => {
    Alert.alert(
      'Konfirmasi',
      'Yakin ingin menghapus lokasi ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              console.log('Menghapus lokasi dengan ID:', id);
              
              const response = await PengaturanAPI.deleteLokasi(id);
              console.log('Response delete lokasi:', response);
              
              if (response.success) {
                Alert.alert('Sukses', 'Lokasi berhasil dihapus');
                fetchLokasiData();
              } else {
                const errorMessage = response.message || 'Gagal menghapus lokasi';
                console.error('Error delete lokasi:', errorMessage);
                Alert.alert('Error', errorMessage);
              }
            } catch (error) {
              console.error('Exception delete lokasi:', error);
              const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal';
              Alert.alert('Error', `Terjadi kesalahan: ${errorMessage}`);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lokasi Kantor</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#004643" />
          <Text style={styles.infoText}>
            Kelola lokasi kantor tetap dan lokasi untuk kegiatan dinas
          </Text>
        </View>

        {/* Lokasi Kantor Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#004643" />
            <Text style={styles.sectionTitle}>Lokasi Kantor</Text>
          </View>
          
          {lokasiKantor.map((lokasi) => (
            <View key={lokasi.id} style={styles.lokasiCard}>
              <View style={styles.lokasiInfo}>
                <Text style={styles.lokasiName}>{lokasi.nama_lokasi}</Text>
                <Text style={styles.lokasiAddress}>{lokasi.alamat}</Text>
                <View style={styles.lokasiType}>
                  <Ionicons name="business-outline" size={12} color="#004643" />
                  <Text style={styles.lokasiTypeText}>Kantor Tetap</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Lokasi Dinas Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionLeft}>
              <Ionicons name="location" size={20} color="#004643" />
              <Text style={styles.sectionTitle}>Lokasi Dinas</Text>
            </View>
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => router.push('/pengaturan/tambah-lokasi')}
            >
              <Ionicons name="add" size={16} color="#004643" />
              <Text style={styles.addBtnText}>Tambah</Text>
            </TouchableOpacity>
          </View>
          
          {lokasiDinas.map((lokasi) => (
            <View key={lokasi.id} style={styles.lokasiCard}>
              <View style={styles.lokasiInfo}>
                <Text style={styles.lokasiName}>{lokasi.nama_lokasi}</Text>
                <Text style={styles.lokasiAddress}>{lokasi.alamat}</Text>
                <View style={styles.lokasiType}>
                  <Ionicons name="location-outline" size={12} color="#FF6B35" />
                  <Text style={[styles.lokasiTypeText, {color: '#FF6B35'}]}>Lokasi Dinas</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.deleteBtn}
                onPress={() => deleteLokasi(lokasi.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#F44336" />
              </TouchableOpacity>
            </View>
          ))}
          
          {lokasiDinas.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={40} color="#CCC" />
              <Text style={styles.emptyText}>Belum ada lokasi dinas</Text>
              <Text style={styles.emptySubtext}>Tap tombol Tambah untuk menambah lokasi</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
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
  content: {
    flex: 1,
    padding: 20
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F7',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center'
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#004643',
    marginLeft: 10
  },
  section: {
    marginBottom: 25
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  sectionLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 4
  },
  lokasiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  lokasiInfo: {
    flex: 1
  },
  lokasiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4
  },
  lokasiAddress: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6
  },
  lokasiType: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  lokasiTypeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#004643',
    marginLeft: 4
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFF5F5'
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
    marginTop: 10
  },
  emptySubtext: {
    fontSize: 12,
    color: '#CCC',
    marginTop: 5,
    textAlign: 'center'
  }
});
