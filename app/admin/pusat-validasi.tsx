import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Alert, ActivityIndicator, Modal, Image, ScrollView, TextInput, Platform, RefreshControl 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PusatValidasiAPI } from '../../constants/config';

interface LuarLokasiItem {
  id_presensi: number;
  id_user: number;
  tanggal: string;
  jam_masuk: string;
  lat_absen: number;
  long_absen: number;
  foto_selfie: string;
  alasan_luar_lokasi: string;
  nama_lengkap: string;
  nip: string;
  jabatan: string;
  divisi: string;
}

interface AbsenDinasItem {
  id: number;
  id_dinas: number;
  id_user: number;
  tanggal_absen: string;
  jam_masuk: string;
  latitude_masuk: number;
  longitude_masuk: number;
  foto_masuk: string;
  status: string;
  nama_lengkap: string;
  nip: string;
  nama_kegiatan: string;
  nomor_spt: string;
  alamat_lengkap: string;
}

interface PengajuanItem {
  id_pengajuan: number;
  id_user: number;
  jenis_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_mulai: string;
  jam_selesai: string;
  alasan_text: string;
  lokasi_dinas: string;
  dokumen_foto: string;
  is_retrospektif: boolean;
  tanggal_pengajuan: string;
  nama_lengkap: string;
  nip: string;
  jabatan: string;
  divisi: string;
}

interface Statistics {
  luar_lokasi: number;
  absen_dinas: number;
  pengajuan: number;
  total: number;
}

export default function PusatValidasiScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('luar_lokasi');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [luarLokasiData, setLuarLokasiData] = useState<LuarLokasiItem[]>([]);
  const [absenDinasData, setAbsenDinasData] = useState<AbsenDinasItem[]>([]);
  const [pengajuanData, setPengajuanData] = useState<PengajuanItem[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    luar_lokasi: 0,
    absen_dinas: 0,
    pengajuan: 0,
    total: 0
  });
  
  // Modal states
  const [showActionModal, setShowActionModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [])
  );

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchLuarLokasi(),
        fetchAbsenDinas(),
        fetchPengajuan(),
        fetchStatistics()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLuarLokasi = async () => {
    try {
      const result = await PusatValidasiAPI.getLuarLokasi();
      if (result.success) {
        setLuarLokasiData(result.data);
      }
    } catch (error) {
      console.error('Error fetching luar lokasi:', error);
    }
  };

  const fetchAbsenDinas = async () => {
    try {
      const result = await PusatValidasiAPI.getAbsenDinas();
      if (result.success) {
        setAbsenDinasData(result.data);
      }
    } catch (error) {
      console.error('Error fetching absen dinas:', error);
    }
  };

  const fetchPengajuan = async () => {
    try {
      const result = await PusatValidasiAPI.getPengajuan();
      if (result.success) {
        setPengajuanData(result.data);
      }
    } catch (error) {
      console.error('Error fetching pengajuan:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const result = await PusatValidasiAPI.getStatistik();
      if (result.success) {
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleApprove = async (type: string, item: any) => {
    setActionLoading(true);
    try {
      const id = type === 'luar_lokasi' ? item.id_presensi : 
                 type === 'absen_dinas' ? item.id : item.id_pengajuan;
      
      const result = await PusatValidasiAPI.setujui(type, id);
      
      if (result.success) {
        Alert.alert('Berhasil', 'Item berhasil disetujui');
        await fetchAllData();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menyetujui item');
    } finally {
      setActionLoading(false);
      setShowActionModal(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Error', 'Catatan penolakan wajib diisi');
      return;
    }

    setActionLoading(true);
    try {
      const id = selectedType === 'luar_lokasi' ? selectedItem.id_presensi : 
                 selectedType === 'absen_dinas' ? selectedItem.id : selectedItem.id_pengajuan;
      
      const result = await PusatValidasiAPI.tolak(selectedType, id, rejectReason);
      
      if (result.success) {
        Alert.alert('Berhasil', 'Item berhasil ditolak');
        await fetchAllData();
        setRejectReason('');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal menolak item');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const openActionModal = (type: string, item: any) => {
    setSelectedType(type);
    setSelectedItem(item);
    setShowActionModal(true);
  };

  const openRejectModal = () => {
    setShowActionModal(false);
    setShowRejectModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatJenisPengajuan = (jenis: string) => {
    const jenisMap: { [key: string]: string } = {
      'cuti_sakit': 'Cuti Sakit',
      'cuti_tahunan': 'Cuti Tahunan',
      'izin_pribadi': 'Izin Pribadi',
      'pulang_cepat_terencana': 'Pulang Cepat',
      'pulang_cepat_mendadak': 'Pulang Cepat',
      'koreksi_presensi': 'Koreksi Presensi',
      'lembur_weekday': 'Lembur',
      'lembur_weekend': 'Lembur Weekend',
      'lembur_holiday': 'Lembur Libur',
      'dinas_lokal': 'Dinas Lokal',
      'dinas_luar_kota': 'Dinas Luar Kota',
      'dinas_luar_negeri': 'Dinas Luar Negeri'
    };
    return jenisMap[jenis] || jenis;
  };

  const renderLuarLokasiItem = ({ item }: { item: LuarLokasiItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardAccent} />
      <View style={styles.itemHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nama_lengkap}</Text>
          <Text style={styles.userDetail}>NIP: {item.nip} • {item.jabatan}</Text>
        </View>
        <Text style={styles.timeText}>{item.jam_masuk}</Text>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.infoRow}>
          <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
          <Text style={styles.infoText}>Absen di luar ketentuan yang berlaku</Text>
        </View>
        <View style={styles.reasonBox}>
          <Ionicons name="quote" size={16} color="#004643" style={styles.reasonIcon} />
          <Text style={styles.reasonText}>{item.alasan_luar_lokasi}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.photoBtn}>
            <Ionicons name="camera-outline" size={16} color="#004643" />
            <Text style={styles.photoBtnText}>Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="map-outline" size={16} color="#004643" />
            <Text style={styles.locationBtnText}>Lokasi</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.approveBtn}
          onPress={() => handleApprove('luar_lokasi', item)}
          disabled={actionLoading}
        >
          <Text style={styles.approveBtnText}>✓ Setuju</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectBtn}
          onPress={() => openActionModal('luar_lokasi', item)}
        >
          <Text style={styles.rejectBtnText}>✗ Tolak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAbsenDinasItem = ({ item }: { item: AbsenDinasItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardAccent} />
      <View style={styles.itemHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nama_lengkap}</Text>
          <Text style={styles.userDetail}>NIP: {item.nip}</Text>
        </View>
        <Text style={styles.timeText}>{item.jam_masuk}</Text>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.infoRow}>
          <Ionicons name="briefcase-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.nama_kegiatan}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-text-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.nomor_spt}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.alamat_lengkap}</Text>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.photoBtn}>
            <Ionicons name="camera-outline" size={16} color="#004643" />
            <Text style={styles.photoBtnText}>Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="map-outline" size={16} color="#004643" />
            <Text style={styles.locationBtnText}>Lokasi</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.approveBtn}
          onPress={() => handleApprove('absen_dinas', item)}
          disabled={actionLoading}
        >
          <Text style={styles.approveBtnText}>✓ Setuju</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectBtn}
          onPress={() => openActionModal('absen_dinas', item)}
        >
          <Text style={styles.rejectBtnText}>✗ Tolak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPengajuanItem = ({ item }: { item: PengajuanItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.cardAccent} />
      <View style={styles.itemHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.nama_lengkap}</Text>
          <Text style={styles.userDetail}>NIP: {item.nip} • {item.jabatan}</Text>
        </View>
        <View style={styles.pengajuanBadge}>
          <Text style={styles.pengajuanBadgeText}>{formatJenisPengajuan(item.jenis_pengajuan)}</Text>
        </View>
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatDate(item.tanggal_mulai)}
            {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai && 
              ` - ${formatDate(item.tanggal_selesai)}`}
          </Text>
        </View>
        {(item.jam_mulai || item.jam_selesai) && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {item.jam_mulai} {item.jam_selesai && `- ${item.jam_selesai}`}
            </Text>
          </View>
        )}
        <View style={styles.reasonBox}>
          <Ionicons name="quote" size={16} color="#004643" style={styles.reasonIcon} />
          <Text style={styles.reasonText}>{item.alasan_text}</Text>
        </View>
        {item.dokumen_foto && (
          <TouchableOpacity style={styles.documentBtn}>
            <Ionicons name="document-attach-outline" size={16} color="#004643" />
            <Text style={styles.documentBtnText}>Lihat Dokumen</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.approveBtn}
          onPress={() => handleApprove('pengajuan', item)}
          disabled={actionLoading}
        >
          <Text style={styles.approveBtnText}>✓ Setuju</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectBtn}
          onPress={() => openActionModal('pengajuan', item)}
        >
          <Text style={styles.rejectBtnText}>✗ Tolak</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case 'luar_lokasi': return luarLokasiData;
      case 'absen_dinas': return absenDinasData;
      case 'pengajuan': return pengajuanData;
      default: return [];
    }
  };

  const renderCurrentTab = () => {
    const data = getCurrentData();
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      );
    }

    if (data.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>Tidak ada item yang perlu divalidasi</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={data}
        keyExtractor={(item: any) => {
          if (activeTab === 'luar_lokasi') return item.id_presensi.toString();
          if (activeTab === 'absen_dinas') return item.id.toString();
          return item.id_pengajuan.toString();
        }}
        renderItem={({ item }) => {
          if (activeTab === 'luar_lokasi') return renderLuarLokasiItem({ item });
          if (activeTab === 'absen_dinas') return renderAbsenDinasItem({ item });
          return renderPengajuanItem({ item });
        }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent={true} backgroundColor="transparent" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        overScrollMode="never"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={['#004643', '#2E7D32']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>Pusat Validasi</Text>
            </View>
            <Text style={styles.headerSubtitle}>Kelola persetujuan dan validasi data</Text>
          </View>
        </View>

        {/* Tab Navigation - Flat Design */}
        <View style={styles.tabSection}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'luar_lokasi' && styles.activeTab]}
              onPress={() => setActiveTab('luar_lokasi')}
            >
              <Text style={[styles.tabText, activeTab === 'luar_lokasi' && styles.activeTabText]}>
                Luar Lokasi
              </Text>
              {statistics.luar_lokasi > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statistics.luar_lokasi}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'absen_dinas' && styles.activeTab]}
              onPress={() => setActiveTab('absen_dinas')}
            >
              <Text style={[styles.tabText, activeTab === 'absen_dinas' && styles.activeTabText]}>
                Absen Dinas
              </Text>
              {statistics.absen_dinas > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statistics.absen_dinas}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'pengajuan' && styles.activeTab]}
              onPress={() => setActiveTab('pengajuan')}
            >
              <Text style={[styles.tabText, activeTab === 'pengajuan' && styles.activeTabText]}>
                Pengajuan
              </Text>
              {statistics.pengajuan > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{statistics.pengajuan}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {renderCurrentTab()}
        </View>
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.actionModalContainer}>
            <Text style={styles.actionModalTitle}>Konfirmasi Aksi</Text>
            <Text style={styles.actionModalText}>
              Pilih aksi untuk item dari {selectedItem?.nama_lengkap}
            </Text>
            
            <View style={styles.actionModalButtons}>
              <TouchableOpacity
                style={styles.modalApproveBtn}
                onPress={() => handleApprove(selectedType, selectedItem)}
                disabled={actionLoading}
              >
                <Text style={styles.modalApproveBtnText}>
                  {actionLoading ? 'Memproses...' : '✓ Setujui'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalRejectBtn}
                onPress={openRejectModal}
              >
                <Text style={styles.modalRejectBtnText}>✗ Tolak</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContainer}>
            <Text style={styles.rejectModalTitle}>Alasan Penolakan</Text>
            <Text style={styles.rejectModalText}>
              Berikan alasan penolakan untuk {selectedItem?.nama_lengkap}
            </Text>
            
            <TextInput
              style={styles.rejectInput}
              placeholder="Masukkan alasan penolakan..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.rejectModalButtons}>
              <TouchableOpacity
                style={styles.rejectConfirmBtn}
                onPress={handleReject}
                disabled={actionLoading || !rejectReason.trim()}
              >
                <Text style={styles.rejectConfirmBtnText}>
                  {actionLoading ? 'Memproses...' : 'Tolak'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rejectCancelBtn}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
              >
                <Text style={styles.rejectCancelBtnText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: -1,
  },
  scrollContent: { paddingBottom: 30 },
  headerSection: { 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'ios' ? 60 : 40, 
    marginBottom: 20 
  },
  headerInfo: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  
  tabSection: { 
    marginTop: 20, 
    marginHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 25,
    padding: 4,
    backdropFilter: 'blur(10px)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginHorizontal: 2,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#004643',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    elevation: 2,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  
  content: { 
    marginTop: 20,
    flex: 1,
  },
  listContent: { 
    padding: 20,
    paddingBottom: 30,
  },
  
  // Item Card
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    position: 'relative',
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    position: 'relative',
  },
  cardAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: '#004643',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  userInfo: { 
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  userDetail: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 70, 67, 0.2)',
  },
  pengajuanBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: 140,
    borderWidth: 1,
    borderColor: 'rgba(25, 118, 210, 0.2)',
  },
  pengajuanBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1976D2',
    textAlign: 'center',
  },
  
  // Item Content
  itemContent: { 
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
    fontWeight: '500',
  },
  reasonBox: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#004643',
    position: 'relative',
  },
  reasonIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.3,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    fontStyle: 'italic',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    gap: 6,
    elevation: 1,
    shadowColor: '#004643',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 70, 67, 0.2)',
  },
  photoBtnText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '600',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    gap: 6,
    elevation: 1,
    shadowColor: '#004643',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 70, 67, 0.2)',
  },
  locationBtnText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '600',
  },
  documentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 12,
    elevation: 1,
    shadowColor: '#004643',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 70, 67, 0.2)',
  },
  documentBtnText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '600',
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  approveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  rejectBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  actionModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  actionModalButtons: {
    gap: 12,
  },
  modalApproveBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalApproveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalRejectBtn: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalRejectBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCancelBtn: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Reject Modal
  rejectModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  rejectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  rejectModalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  rejectInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    marginBottom: 20,
  },
  rejectModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectConfirmBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectConfirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectCancelBtn: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectCancelBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});