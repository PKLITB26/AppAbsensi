import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, Switch, Alert, KeyboardAvoidingView, Platform, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PengaturanAPI } from '../../constants/config';

interface JamKerjaHari {
  hari: string;
  jam_masuk: string;
  batas_absen: string;
  jam_pulang: string;
  is_kerja: boolean;
}

export default function JamKerjaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [editJamMasuk, setEditJamMasuk] = useState('');
  const [editBatasAbsen, setEditBatasAbsen] = useState('');
  const [editJamPulang, setEditJamPulang] = useState('');
  const [jamKerjaList, setJamKerjaList] = useState<JamKerjaHari[]>([
    { hari: 'Senin', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '17:00', is_kerja: true },
    { hari: 'Selasa', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '17:00', is_kerja: true },
    { hari: 'Rabu', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '17:00', is_kerja: true },
    { hari: 'Kamis', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '17:00', is_kerja: true },
    { hari: 'Jumat', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '16:30', is_kerja: true },
    { hari: 'Sabtu', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '12:00', is_kerja: false },
    { hari: 'Minggu', jam_masuk: '08:00', batas_absen: '08:30', jam_pulang: '17:00', is_kerja: false }
  ]);

  useEffect(() => {
    fetchJamKerja();
  }, []);

  const fetchJamKerja = async () => {
    try {
      setLoading(true);
      const response = await PengaturanAPI.getJamKerja();
      if (response.success && response.data) {
        setJamKerjaList(response.data);
      }
    } catch (error) {
      console.error('Error fetching jam kerja:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHariKerja = (index: number) => {
    const updated = [...jamKerjaList];
    updated[index].is_kerja = !updated[index].is_kerja;
    setJamKerjaList(updated);
  };

  const handleEditJam = (item: JamKerjaHari, index: number) => {
    setEditIndex(index);
    setEditJamMasuk(item.jam_masuk);
    setEditBatasAbsen(item.batas_absen);
    setEditJamPulang(item.jam_pulang);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editJamMasuk || !editBatasAbsen || !editJamPulang) {
      Alert.alert('Error', 'Semua jam harus diisi');
      return;
    }
    const updated = [...jamKerjaList];
    updated[editIndex].jam_masuk = editJamMasuk;
    updated[editIndex].batas_absen = editBatasAbsen;
    updated[editIndex].jam_pulang = editJamPulang;
    setJamKerjaList(updated);
    setShowEditModal(false);
  };

  const formatJam = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await PengaturanAPI.saveJamKerja({ jam_kerja: jamKerjaList });
      
      if (response.success) {
        Alert.alert('Sukses', 'Pengaturan jam kerja berhasil disimpan', [
          { 
            text: 'OK', 
            onPress: () => router.back()
          }
        ]);
      } else {
        Alert.alert('Error', response.message || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat menyimpan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Jam Kerja</Text>
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#004643" />
          <Text style={styles.infoText}>
            Atur jam kerja per hari. Hari libur akan ditandai merah di kalender
          </Text>
        </View>

        {jamKerjaList.map((item, index) => (
          <View key={index} style={styles.hariCard}>
            <View style={styles.hariInfo}>
              <View style={styles.hariLeft}>
                <Text style={styles.hariNama}>{item.hari}</Text>
                <Text style={styles.hariJam}>
                  {item.is_kerja ? `${item.jam_masuk} - ${item.jam_pulang}` : 'Libur'}
                </Text>
                {item.is_kerja && (
                  <Text style={styles.hariBatas}>
                    Batas absen: {item.batas_absen}
                  </Text>
                )}
              </View>
              
              <View style={styles.hariRight}>
                <Switch
                  value={item.is_kerja}
                  onValueChange={() => toggleHariKerja(index)}
                  trackColor={{ false: '#E0E0E0', true: '#A8D5BA' }}
                  thumbColor={item.is_kerja ? '#004643' : '#f4f3f4'}
                />
                
                <TouchableOpacity 
                  style={[styles.editBtn, !item.is_kerja && styles.editBtnDisabled]}
                  onPress={() => item.is_kerja && handleEditJam(item, index)}
                  disabled={!item.is_kerja}
                >
                  <Ionicons 
                    name="create-outline" 
                    size={20} 
                    color={item.is_kerja ? '#004643' : '#ccc'} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveBtnText}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="none" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Edit Jam Kerja {editIndex >= 0 ? jamKerjaList[editIndex].hari : ''}
            </Text>
            
            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Jam Masuk</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="08:00"
                  value={editJamMasuk}
                  onChangeText={(text) => setEditJamMasuk(formatJam(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Batas Absen</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="08:30"
                  value={editBatasAbsen}
                  onChangeText={(text) => setEditBatasAbsen(formatJam(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalLabel}>Jam Pulang</Text>
              <View style={styles.modalInputWrapper}>
                <Ionicons name="time-outline" size={20} color="#666" />
                <TextInput
                  style={styles.modalInput}
                  placeholder="17:00"
                  value={editJamPulang}
                  onChangeText={(text) => setEditJamPulang(formatJam(text))}
                  keyboardType="numeric"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalBtnCancel}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalBtnCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalBtnSave}
                onPress={handleSaveEdit}
              >
                <Text style={styles.modalBtnSaveText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: { 
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
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
  contentContainer: {
    flex: 1,
    marginTop: 100
  },
  content: {
    padding: 20,
    paddingBottom: 100
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
  hariCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  hariInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  hariLeft: {
    flex: 1
  },
  hariNama: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  hariJam: {
    fontSize: 14,
    color: '#666'
  },
  hariBatas: {
    fontSize: 12,
    color: '#999',
    marginTop: 2
  },
  hariRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    minWidth: 100,
    justifyContent: 'flex-end'
  },
  editBtn: {
    padding: 8,
    backgroundColor: '#F0F8F7',
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  },
  editBtnDisabled: {
    backgroundColor: '#F5F5F5'
  },
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#004643',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnDisabled: {
    backgroundColor: '#999'
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(248, 250, 251, 0.98)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '85%'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalInputGroup: {
    marginBottom: 15
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  modalInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    marginLeft: 10
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20
  },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  modalBtnCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  modalBtnSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#004643',
    alignItems: 'center'
  },
  modalBtnSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  }
});
