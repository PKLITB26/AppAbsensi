import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView, 
  ScrollView,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PengajuanScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState('Izin');
  const [keterangan, setKeterangan] = useState('');

  const handleKirim = () => {
    if (keterangan.trim() === '') {
      Alert.alert("Peringatan", "Mohon isi keterangan pengajuan Anda.");
      return;
    }
    
    // Simulasi pengiriman data
    Alert.alert(
      "Berhasil", 
      "Pengajuan " + selectedType + " Anda telah dikirim dan menunggu persetujuan Admin.",
      [{ text: "OK", onPress: () => router.back() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER CUSTOM */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Form Pengajuan</Text>
        <View style={{ width: 40 }} /> {/* Spacer agar judul tetap di tengah */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* PILIH JENIS KEPERLUAN */}
        <Text style={styles.label}>Jenis Keperluan</Text>
        <View style={styles.chipContainer}>
          {['Izin', 'Sakit', 'Cuti', 'Dinas Luar'].map((item) => (
            <TouchableOpacity 
              key={item} 
              style={[styles.chip, selectedType === item && styles.chipActive]}
              onPress={() => setSelectedType(item)}
            >
              <Text style={[styles.chipText, selectedType === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INPUT KETERANGAN */}
        <Text style={styles.label}>Keterangan / Alasan</Text>
        <TextInput 
          style={styles.input}
          placeholder="Contoh: Mengantar orang tua ke rumah sakit atau keperluan mendadak keluarga"
          multiline
          numberOfLines={5}
          value={keterangan}
          onChangeText={setKeterangan}
        />

        {/* UPLOAD LAMPIRAN (Simulasi) */}
        <Text style={styles.label}>Lampiran (Opsional)</Text>
        <TouchableOpacity style={styles.uploadBtn}>
          <Ionicons name="cloud-upload-outline" size={28} color="#004643" />
          <Text style={styles.uploadText}>Unggah Foto Surat Dokter / Bukti</Text>
        </TouchableOpacity>

        {/* TOMBOL KIRIM */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleKirim}>
          <Text style={styles.submitBtnText}>Kirim Pengajuan</Text>
        </TouchableOpacity>

        <Text style={styles.noteText}>
          *Pengajuan yang sudah dikirim akan muncul di halaman Riwayat setelah disetujui oleh Admin.
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 15, 
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  scrollContent: { padding: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 12, marginTop: 10 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 25 },
  chip: { 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 25, 
    backgroundColor: '#F5F5F5', 
    marginRight: 10, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE'
  },
  chipActive: { backgroundColor: '#004643', borderColor: '#004643' },
  chipText: { color: '#777', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  input: { 
    backgroundColor: '#F9F9F9', 
    borderRadius: 15, 
    padding: 15, 
    textAlignVertical: 'top', 
    borderWidth: 1, 
    borderColor: '#EEEEEE',
    marginBottom: 25,
    fontSize: 14,
    color: '#333'
  },
  uploadBtn: { 
    borderWidth: 1, 
    borderColor: '#004643', 
    borderStyle: 'dashed', 
    borderRadius: 15, 
    padding: 25, 
    alignItems: 'center',
    backgroundColor: '#F0F7F6'
  },
  uploadText: { marginTop: 10, color: '#004643', fontWeight: '600', fontSize: 13 },
  submitBtn: { 
    backgroundColor: '#004643', 
    padding: 18, 
    borderRadius: 15, 
    alignItems: 'center', 
    marginTop: 35,
    elevation: 2
  },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  noteText: { textAlign: 'center', color: '#999', fontSize: 11, marginTop: 20, lineHeight: 16 }
});