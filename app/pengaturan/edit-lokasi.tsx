import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PengaturanAPI } from '../../constants/config';
import { AppHeader } from '../../components';

export default function EditLokasiScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    namaLokasi: '',
    alamat: '',
    latitude: null as number | null,
    longitude: null as number | null,
    radius: '100',
    jenis: 'dinas' as 'tetap' | 'dinas'
  });

  useEffect(() => {
    fetchLokasiData();
  }, []);

  const fetchLokasiData = async () => {
    try {
      setLoading(true);
      const response = await PengaturanAPI.getLokasiKantor();
      if (response.success && response.data) {
        const lokasiId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
        const lokasi = response.data.find((item: any) => item.id == lokasiId);
        if (lokasi) {
          setFormData({
            namaLokasi: lokasi.nama_lokasi,
            alamat: lokasi.alamat,
            latitude: lokasi.latitude,
            longitude: lokasi.longitude,
            radius: lokasi.radius?.toString() || '100',
            jenis: lokasi.jenis_lokasi
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data lokasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.namaLokasi.trim() || !formData.alamat.trim()) {
      Alert.alert('Info', 'Nama lokasi dan alamat wajib diisi');
      return;
    }

    if (!formData.radius || parseInt(formData.radius) < 10 || parseInt(formData.radius) > 1000) {
      Alert.alert('Info', 'Radius harus antara 10-1000 meter');
      return;
    }

    try {
      setLoading(true);
      const lokasiId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);
      const response = await PengaturanAPI.updateLokasi(lokasiId, {
        nama_lokasi: formData.namaLokasi.trim(),
        alamat: formData.alamat.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        radius: parseInt(formData.radius),
        jenis_lokasi: formData.jenis
      });

      if (response.success) {
        Alert.alert('Sukses', 'Lokasi berhasil diupdate', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Info', response.message || 'Gagal mengupdate lokasi');
      }
    } catch (error) {
      Alert.alert('Info', 'Terjadi kesalahan saat mengupdate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />
      <AppHeader 
        title="Edit Lokasi"
        showBack={true}
        fallbackRoute="/pengaturan"
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#004643" />
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              Edit informasi lokasi absensi. {Platform.OS === 'web' ? 'Fitur peta tidak tersedia di web.' : 'Gunakan input manual untuk koordinat.'}
            </Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nama Lokasi *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Contoh: Kantor Pusat"
              value={formData.namaLokasi}
              onChangeText={(text) => setFormData({ ...formData, namaLokasi: text })}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Alamat Lengkap *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Alamat lengkap..."
              value={formData.alamat}
              onChangeText={(text) => setFormData({ ...formData, alamat: text })}
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Latitude</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="navigate-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Contoh: -6.2088"
              value={formData.latitude?.toString() || ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                setFormData({ ...formData, latitude: isNaN(num) ? null : num });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Longitude</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="navigate-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Contoh: 106.8456"
              value={formData.longitude?.toString() || ''}
              onChangeText={(text) => {
                const num = parseFloat(text);
                setFormData({ ...formData, longitude: isNaN(num) ? null : num });
              }}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Radius Absensi (meter) *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="radio-outline" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Masukkan radius dalam meter (10-1000)"
              value={formData.radius}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                if (numericValue === '' || numericValue.length <= 4) {
                  setFormData({ ...formData, radius: numericValue });
                }
              }}
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.unitText}>m</Text>
          </View>
          <Text style={styles.helperText}>Rentang: 10-1000 meter</Text>
        </View>
      </ScrollView>

      <View style={styles.buttonFooter}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.submitText}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  content: {
    flex: 1,
    paddingHorizontal: 5,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8F7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 15,
    alignItems: 'flex-start'
  },
  infoText: {
    fontSize: 12,
    color: '#004643',
    lineHeight: 16
  },
  infoContent: {
    flex: 1,
    marginLeft: 12
  },
  formGroup: {
    marginBottom: 16,
    marginHorizontal: 15
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
    marginLeft: 10
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 12
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 8
  },
  helperText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    marginLeft: 4
  },
  buttonFooter: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5
  },
  submitBtn: {
    backgroundColor: '#004643',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc'
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});