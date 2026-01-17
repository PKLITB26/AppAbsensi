import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import { getApiUrl, API_CONFIG } from '../../../../constants/config';

export default function EditPegawai() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    nip: '',
    no_telepon: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    jabatan: '',
    divisi: '',
    status_pegawai: '',
    alamat: '',
  });

  useEffect(() => {
    fetchPegawaiDetail();
  }, [id]);

  const fetchPegawaiDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.DETAIL_PEGAWAI)}?id=${id}`);
      const result = await response.json();
      
      if (result.success) {
        setFormData({
          nama_lengkap: result.data.nama_lengkap || '',
          email: result.data.email || '',
          password: result.data.password || '',
          nip: result.data.nip || '',
          no_telepon: result.data.no_telepon || '',
          tanggal_lahir: result.data.tanggal_lahir || '',
          jenis_kelamin: result.data.jenis_kelamin || '',
          jabatan: result.data.jabatan || '',
          divisi: result.data.divisi || '',
          status_pegawai: result.data.status_pegawai || '',
          alamat: result.data.alamat || '',
        });
      } else {
        Alert.alert('Error', result.message || 'Gagal memuat data pegawai');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.UPDATE_PEGAWAI), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          ...formData
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Berhasil', 'Data pegawai berhasil diperbarui', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Gagal memperbarui data pegawai');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat data pegawai...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#004643" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Pegawai</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Informasi Pribadi */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color="#004643" />
            <Text style={styles.cardTitle}>Informasi Pribadi</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Lengkap *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.nama_lengkap}
                onChangeText={(text) => setFormData({...formData, nama_lengkap: text})}
                placeholder="Masukkan nama lengkap"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>NIP *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.nip}
                onChangeText={(text) => setFormData({...formData, nip: text})}
                placeholder="Masukkan NIP"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>No. Telepon</Text>
              <TextInput
                style={styles.textInput}
                value={formData.no_telepon}
                onChangeText={(text) => setFormData({...formData, no_telepon: text})}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tanggal Lahir</Text>
              <TextInput
                style={styles.textInput}
                value={formData.tanggal_lahir}
                onChangeText={(text) => setFormData({...formData, tanggal_lahir: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jenis Kelamin</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity 
                  style={[styles.genderBtn, formData.jenis_kelamin === 'Laki-laki' && styles.genderBtnActive]}
                  onPress={() => setFormData({...formData, jenis_kelamin: 'Laki-laki'})}
                >
                  <Text style={[styles.genderText, formData.jenis_kelamin === 'Laki-laki' && styles.genderTextActive]}>
                    Laki-laki
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.genderBtn, formData.jenis_kelamin === 'Perempuan' && styles.genderBtnActive]}
                  onPress={() => setFormData({...formData, jenis_kelamin: 'Perempuan'})}
                >
                  <Text style={[styles.genderText, formData.jenis_kelamin === 'Perempuan' && styles.genderTextActive]}>
                    Perempuan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Informasi Kepegawaian */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="briefcase-outline" size={20} color="#004643" />
            <Text style={styles.cardTitle}>Informasi Kepegawaian</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Jabatan</Text>
              <TextInput
                style={styles.textInput}
                value={formData.jabatan}
                onChangeText={(text) => setFormData({...formData, jabatan: text})}
                placeholder="Masukkan jabatan"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Divisi</Text>
              <TextInput
                style={styles.textInput}
                value={formData.divisi}
                onChangeText={(text) => setFormData({...formData, divisi: text})}
                placeholder="Masukkan divisi"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Status Kepegawaian</Text>
              <TextInput
                style={styles.textInput}
                value={formData.status_pegawai}
                onChangeText={(text) => setFormData({...formData, status_pegawai: text})}
                placeholder="Masukkan status kepegawaian"
              />
            </View>
          </View>
        </View>

        {/* Informasi Akun Login */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="key-outline" size={20} color="#004643" />
            <Text style={styles.cardTitle}>Informasi Akun Login</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                placeholder="Masukkan email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                placeholder="Masukkan password"
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Alamat */}
        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="location-outline" size={20} color="#004643" />
            <Text style={styles.cardTitle}>Alamat</Text>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alamat Lengkap</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.alamat}
                onChangeText={(text) => setFormData({...formData, alamat: text})}
                placeholder="Masukkan alamat lengkap"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Sticky Save Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Simpan Data Pegawai</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formCard: {
    backgroundColor: '#fff',
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#E6F0EF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFBFC',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004643',
    marginLeft: 8,
  },
  cardContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderBtnActive: {
    backgroundColor: '#004643',
    borderColor: '#004643',
  },
  genderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#004643',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  saveButtonText: {
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
    paddingBottom: 20
  },
});