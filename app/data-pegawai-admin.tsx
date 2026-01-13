import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PegawaiData {
  id_pegawai?: number;
  id_user?: number;
  nama_lengkap: string;
  email?: string;
  nip?: string;
  jenis_kelamin?: string;
  jabatan?: string;
  divisi?: string;
  no_telepon?: string;
  status_pegawai?: string;
  foto_profil?: string;
  role?: string;
}

export default function DataPegawaiAdminScreen() {
  const router = useRouter();
  const [pegawai, setPegawai] = useState<PegawaiData[]>([]);
  const [filteredPegawai, setFilteredPegawai] = useState<PegawaiData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPegawai();
  }, []);

  useEffect(() => {
    filterPegawai();
  }, [searchQuery, pegawai]);

  const filterPegawai = () => {
    if (searchQuery.trim() === '') {
      setFilteredPegawai(pegawai);
    } else {
      const filtered = pegawai.filter(p =>
        p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.jabatan && p.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.nip && p.nip.includes(searchQuery))
      );
      setFilteredPegawai(filtered);
    }
  };

  const fetchPegawai = async () => {
    try {
      console.log('Fetching pegawai data...');
      const response = await fetch('http://10.251.109.131/hadirinapp/data-pegawai.php');
      console.log('Response status:', response.status);
      
      const result = await response.json();
      console.log('API Result:', result);
      
      if (result.success) {
        setPegawai(result.data);
        setFilteredPegawai(result.data);
        console.log('Pegawai data set:', result.data);
      } else {
        console.log('API Error:', result.message);
        Alert.alert('Error', 'Gagal memuat data pegawai');
      }
    } catch (error) {
      console.log('Fetch Error:', error);
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
    } finally {
      setLoading(false);
    }
  };

  const showActionMenu = (id: number) => {
    Alert.alert(
      'Pilih Aksi',
      'Pilih tindakan yang ingin dilakukan:',
      [
        {
          text: 'Lihat Detail',
          onPress: () => {
            Alert.alert('Info', 'Fitur lihat detail akan segera tersedia');
          }
        },
        {
          text: 'Edit',
          onPress: () => {
            Alert.alert('Info', 'Fitur edit akan segera tersedia');
          }
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => deletePegawai(id)
        },
        {
          text: 'Batal',
          style: 'cancel'
        }
      ]
    );
  };

  const deletePegawai = async (id: number) => {
    Alert.alert(
      'Konfirmasi',
      'Yakin ingin menghapus data pegawai ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch('http://10.251.109.131/hadirinapp/data-pegawai.php', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_pegawai: id })
              });
              
              const result = await response.json();
              if (result.success) {
                fetchPegawai();
                Alert.alert('Sukses', 'Data pegawai berhasil dihapus');
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus data pegawai');
            }
          }
        }
      ]
    );
  };



  const renderHeader = () => (
    <View style={styles.stickyHeader}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Data Pegawai</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{filteredPegawai.length} Pegawai</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama, email, jabatan, atau NIP..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data pegawai...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPegawai}
          keyExtractor={(item) => item.id_pegawai?.toString() || item.id_user?.toString() || Math.random().toString()}
          ListHeaderComponent={renderHeader}
          stickyHeaderIndices={[0]}
          renderItem={({ item }) => (
            <View style={styles.pegawaiCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nama_lengkap?.charAt(0) || 'P'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pegawaiName}>{item.nama_lengkap}</Text>
                <Text style={styles.pegawaiEmail}>{item.email || 'Email belum diisi'}</Text>
                <Text style={styles.pegawaiNip}>NIP: {item.nip || 'Belum diisi'}</Text>
              </View>
              <View style={styles.pegawaiActions}>
                <View style={[styles.statusBadge, {
                  backgroundColor: item.nip ? '#E8F5E9' : '#FFF3E0'
                }]}>
                  <Text style={[styles.statusText, {
                    color: item.nip ? '#2E7D32' : '#F57C00'
                  }]}>
                    {item.nip ? 'Lengkap' : 'Belum Lengkap'}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.detailBtn}
                    onPress={() => Alert.alert('Info', 'Fitur lihat detail akan segera tersedia')}
                  >
                    <Ionicons name="eye-outline" size={15} color="#2196F3" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.editBtn}
                    onPress={() => Alert.alert('Info', 'Fitur edit akan segera tersedia')}
                  >
                    <Ionicons name="create-outline" size={15} color="#FF9800" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.deleteBtn}
                    onPress={() => deletePegawai(item.id_pegawai || item.id_user || 0)}
                  >
                    <Ionicons name="trash-outline" size={15} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>Belum ada data pegawai</Text>
            </View>
          }
        />
      )}
      
      {/* Floating Add Button */}
      <TouchableOpacity 
        style={styles.floatingAddBtn}
        onPress={() => router.push('/add-data-pegawai')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  stickyHeader: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
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
    color: '#004643',
    flex: 1
  },
  headerStats: {
    backgroundColor: '#E6F0EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  statsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#004643'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#666'
  },
  listContent: {
    paddingBottom: 20,
  },
  pegawaiCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 15,
    marginBottom: 0,
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: '#E6F0EF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  avatarText: { color: '#004643', fontWeight: 'bold', fontSize: 20 },
  pegawaiName: { fontWeight: 'bold', fontSize: 16, color: '#333', marginBottom: 2 },
  pegawaiEmail: { color: '#888', fontSize: 12, marginBottom: 2 },
  pegawaiNip: { color: '#666', fontSize: 12, marginBottom: 2 },
  pegawaiActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 5
  },
  detailBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#E3F2FD'
  },
  editBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFF3E0'
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginBottom: 8 
  },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100
  },
  emptyText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 16
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFEBEE'
  },
  floatingAddBtn: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#004643',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8
  }
});
