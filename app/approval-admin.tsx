import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Image, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PengajuanData {
  id_pengajuan: number;
  id_user: number;
  nama_lengkap: string;
  nip: string;
  jenis_pengajuan: string;
  tanggal_mulai: string;
  tanggal_selesai?: string;
  jam_mulai?: string;
  jam_selesai?: string;
  alasan_text: string;
  lokasi_dinas?: string;
  dokumen_foto?: string;
  status: 'pending' | 'approved' | 'rejected';
  tanggal_pengajuan: string;
  is_retrospektif: boolean;
}

export default function ApprovalAdminScreen() {
  const router = useRouter();
  const [pengajuan, setPengajuan] = useState<PengajuanData[]>([]);
  const [filteredPengajuan, setFilteredPengajuan] = useState<PengajuanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedJenis, setSelectedJenis] = useState<string[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showJenisDropdown, setShowJenisDropdown] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPengajuan, setSelectedPengajuan] = useState<PengajuanData | null>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');

  useEffect(() => {
    fetchPengajuan();
  }, []);

  useEffect(() => {
    filterPengajuan();
  }, [selectedFilters, selectedJenis, pengajuan]);

  const fetchPengajuan = async () => {
    try {
      const response = await fetch('http://10.251.109.131/hadirinapp/approval.php');
      const result = await response.json();
      
      if (result.success) {
        setPengajuan(result.data);
        setFilteredPengajuan(result.data);
      } else {
        Alert.alert('Error', 'Gagal memuat data pengajuan');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP Apache dan MySQL sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const filterPengajuan = () => {
    let filtered = pengajuan;
    
    // Filter by status
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(item => selectedFilters.includes(item.status));
    }
    
    // Filter by jenis pengajuan
    if (selectedJenis.length > 0) {
      filtered = filtered.filter(item => selectedJenis.includes(item.jenis_pengajuan));
    }
    
    setFilteredPengajuan(filtered);
  };

  const getJenisLabel = (jenis: string) => {
    const labels: { [key: string]: string } = {
      'cuti_sakit': 'Cuti Sakit',
      'cuti_tahunan': 'Cuti Tahunan',
      'izin_pribadi': 'Izin Pribadi',
      'pulang_cepat_terencana': 'Pulang Cepat',
      'pulang_cepat_mendadak': 'Pulang Cepat Mendadak',
      'koreksi_presensi': 'Koreksi Presensi',
      'lembur_weekday': 'Lembur Weekday',
      'lembur_weekend': 'Lembur Weekend',
      'lembur_holiday': 'Lembur Holiday',
      'dinas_lokal': 'Dinas Lokal',
      'dinas_luar_kota': 'Dinas Luar Kota',
      'dinas_luar_negeri': 'Dinas Luar Negeri'
    };
    return labels[jenis] || jenis;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'approved': return 'Disetujui';
      case 'rejected': return 'Ditolak';
      default: return status;
    }
  };

  const handleApproval = (pengajuan: PengajuanData, action: 'approve' | 'reject') => {
    setSelectedPengajuan(pengajuan);
    setApprovalAction(action);
    setApprovalNote('');
    setModalVisible(true);
  };

  const submitApproval = async () => {
    if (!selectedPengajuan) return;

    try {
      const response = await fetch('http://10.251.109.131/hadirinapp/approval.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_pengajuan: selectedPengajuan.id_pengajuan,
          action: approvalAction,
          catatan_approval: approvalNote
        })
      });

      const result = await response.json();
      if (result.success) {
        fetchPengajuan();
        setModalVisible(false);
        Alert.alert('Sukses', `Pengajuan berhasil ${approvalAction === 'approve' ? 'disetujui' : 'ditolak'}`);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memproses approval');
    }
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleJenisFilter = (jenis: string) => {
    setSelectedJenis(prev => 
      prev.includes(jenis) 
        ? prev.filter(j => j !== jenis)
        : [...prev, jenis]
    );
  };

  const removeFilter = (type: 'status' | 'jenis', value: string) => {
    if (type === 'status') {
      setSelectedFilters(prev => prev.filter(s => s !== value));
    } else {
      setSelectedJenis(prev => prev.filter(j => j !== value));
    }
  };

  const renderFilterButtons = () => (
    <View style={styles.filterButtonsContainer}>
      <View style={styles.statusButtonContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <Ionicons name="funnel-outline" size={18} color="#004643" />
          <Text style={styles.filterButtonText}>Status</Text>
          <Ionicons name={showStatusDropdown ? "chevron-up" : "chevron-down"} size={16} color="#004643" />
        </TouchableOpacity>
        {renderStatusDropdown()}
      </View>
      
      <View style={styles.jenisButtonContainer}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowJenisDropdown(!showJenisDropdown)}
        >
          <Ionicons name="list-outline" size={18} color="#004643" />
          <Text style={styles.filterButtonText}>Jenis</Text>
          <Ionicons name={showJenisDropdown ? "chevron-up" : "chevron-down"} size={16} color="#004643" />
        </TouchableOpacity>
        {renderJenisDropdown()}
      </View>
    </View>
  );

  const renderStatusDropdown = () => {
    if (!showStatusDropdown) return null;
    
    const statusOptions = [
      { key: 'pending', label: 'Menunggu', count: pengajuan.filter(p => p.status === 'pending').length },
      { key: 'approved', label: 'Disetujui', count: pengajuan.filter(p => p.status === 'approved').length },
      { key: 'rejected', label: 'Ditolak', count: pengajuan.filter(p => p.status === 'rejected').length }
    ];

    return (
      <View style={styles.dropdown}>
        {statusOptions.map(option => (
          <TouchableOpacity
            key={option.key}
            style={styles.dropdownItem}
            onPress={() => toggleStatusFilter(option.key)}
          >
            <View style={styles.checkboxContainer}>
              <View style={[styles.checkbox, selectedFilters.includes(option.key) && styles.checkboxActive]}>
                {selectedFilters.includes(option.key) && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.dropdownText}>{option.label} ({option.count})</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderJenisDropdown = () => {
    if (!showJenisDropdown) return null;
    
    const jenisOptions = [
      { key: 'cuti_sakit', label: 'Cuti Sakit' },
      { key: 'cuti_tahunan', label: 'Cuti Tahunan' },
      { key: 'izin_pribadi', label: 'Izin Pribadi' },
      { key: 'pulang_cepat_terencana', label: 'Pulang Cepat' },
      { key: 'pulang_cepat_mendadak', label: 'Pulang Mendadak' },
      { key: 'koreksi_presensi', label: 'Koreksi Presensi' },
      { key: 'lembur_weekday', label: 'Lembur Weekday' },
      { key: 'lembur_weekend', label: 'Lembur Weekend' },
      { key: 'lembur_holiday', label: 'Lembur Holiday' },
      { key: 'dinas_lokal', label: 'Dinas Lokal' },
      { key: 'dinas_luar_kota', label: 'Dinas Luar Kota' },
      { key: 'dinas_luar_negeri', label: 'Dinas Luar Negeri' }
    ];

    return (
      <View style={styles.jenisDropdown}>
        <FlatList
          data={jenisOptions}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          renderItem={({ item: option }) => {
            const count = pengajuan.filter(p => p.jenis_pengajuan === option.key).length;
            return (
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => toggleJenisFilter(option.key)}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, selectedJenis.includes(option.key) && styles.checkboxActive]}>
                    {selectedJenis.includes(option.key) && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <Text style={styles.dropdownText}>{option.label} ({count})</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  const renderActiveFilters = () => {
    const allFilters = [
      ...selectedFilters.map(s => ({ type: 'status' as const, value: s, label: getStatusLabel(s) })),
      ...selectedJenis.map(j => ({ type: 'jenis' as const, value: j, label: getJenisLabel(j) }))
    ];

    if (allFilters.length === 0) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        {allFilters.map((filter, index) => (
          <View key={`${filter.type}-${filter.value}`} style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>{filter.label}</Text>
            <TouchableOpacity onPress={() => removeFilter(filter.type, filter.value)}>
              <Ionicons name="close" size={14} color="#004643" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      {renderFilterButtons()}
      {renderActiveFilters()}
    </View>
  );

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
          <Text style={styles.headerTitle}>Approval Pengajuan</Text>
        </View>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>{filteredPengajuan.length} Pengajuan</Text>
        </View>
      </View>
      
      {renderFilterTabs()}
    </View>
  );

  const renderPengajuanCard = ({ item }: { item: PengajuanData }) => (
    <View style={styles.pengajuanCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.nama_lengkap?.charAt(0) || 'P'}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.nama_lengkap}</Text>
            <Text style={styles.userNip}>NIP: {item.nip}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.pengajuanInfo}>
          <Text style={styles.jenisLabel}>{getJenisLabel(item.jenis_pengajuan)}</Text>
          {item.is_retrospektif && (
            <View style={styles.retrospektifBadge}>
              <Text style={styles.retrospektifText}>Retrospektif</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.tanggalText}>
          {item.tanggal_mulai} {item.tanggal_selesai && item.tanggal_selesai !== item.tanggal_mulai ? `- ${item.tanggal_selesai}` : ''}
        </Text>
        
        {(item.jam_mulai || item.jam_selesai) && (
          <Text style={styles.jamText}>
            {item.jam_mulai} {item.jam_selesai ? `- ${item.jam_selesai}` : ''}
          </Text>
        )}

        {item.lokasi_dinas && (
          <Text style={styles.lokasiText}>📍 {item.lokasi_dinas}</Text>
        )}

        <Text style={styles.alasanText} numberOfLines={2}>
          {item.alasan_text}
        </Text>

        {item.dokumen_foto && (
          <View style={styles.dokumenInfo}>
            <Ionicons name="document-attach" size={16} color="#666" />
            <Text style={styles.dokumenText}>Dokumen terlampir</Text>
          </View>
        )}
      </View>

      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.rejectBtn}
            onPress={() => handleApproval(item, 'reject')}
          >
            <Ionicons name="close" size={16} color="#F44336" />
            <Text style={styles.rejectBtnText}>Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.approveBtn}
            onPress={() => handleApproval(item, 'approve')}
          >
            <Ionicons name="checkmark" size={16} color="#fff" />
            <Text style={styles.approveBtnText}>Setujui</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.timestampText}>
        Diajukan: {new Date(item.tanggal_pengajuan).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#004643" />
            <Text style={styles.loadingText}>Memuat data pengajuan...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredPengajuan}
            keyExtractor={(item) => item.id_pengajuan.toString()}
            ListHeaderComponent={renderHeader}
            stickyHeaderIndices={[0]}
            renderItem={renderPengajuanCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={80} color="#ccc" />
                <Text style={styles.emptyText}>Belum ada pengajuan</Text>
              </View>
            }
          />
        )}

        {/* Approval Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {approvalAction === 'approve' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedPengajuan && (
                <View style={styles.modalBody}>
                  <Text style={styles.modalPengajuanInfo}>
                    {selectedPengajuan.nama_lengkap} - {getJenisLabel(selectedPengajuan.jenis_pengajuan)}
                  </Text>
                  
                  <Text style={styles.modalLabel}>
                    {approvalAction === 'approve' ? 'Catatan (opsional):' : 'Alasan penolakan:'}
                  </Text>
                  <TextInput
                    style={styles.modalTextInput}
                    placeholder={approvalAction === 'approve' ? 'Tambahkan catatan...' : 'Berikan alasan penolakan...'}
                    value={approvalNote}
                    onChangeText={setApprovalNote}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                      style={styles.modalCancelBtn}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalCancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.modalSubmitBtn, { 
                        backgroundColor: approvalAction === 'approve' ? '#4CAF50' : '#F44336' 
                      }]}
                      onPress={submitApproval}
                    >
                      <Text style={styles.modalSubmitText}>
                        {approvalAction === 'approve' ? 'Setujui' : 'Tolak'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
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
  filterContainer: {
    marginTop: 15,
    position: 'relative',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statusButtonContainer: {
    position: 'relative',
    width: '40%',
  },
  jenisButtonContainer: {
    position: 'relative',
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  jenisDropdown: {
  position: 'absolute',
  top: 50,
  left: 0,
  right: 0,
  backgroundColor: '#fff',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E9ECEF',
},
  dropdownItem: {
    paddingHorizontal: 7,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#004643',
    borderColor: '#004643',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0EF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#004643',
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
  pengajuanCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F0EF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#004643',
    fontWeight: 'bold',
    fontSize: 16
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  userNip: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    marginBottom: 12,
  },
  pengajuanInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jenisLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#004643',
    flex: 1,
  },
  retrospektifBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  retrospektifText: {
    fontSize: 10,
    color: '#F57C00',
    fontWeight: 'bold',
  },
  tanggalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  jamText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lokasiText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  alasanText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  dokumenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dokumenText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectBtnText: {
    color: '#F44336',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  timestampText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalPengajuanInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#666',
    fontWeight: 'bold',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});