import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getApiUrl, API_CONFIG } from '../../constants/config';

export default function AddDataPegawaiForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    nip: '',
    jenis_kelamin: '',
    jabatan: '',
    divisi: '',
    no_telepon: '',
    alamat: '',
    tanggal_lahir: ''
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [existingEmails, setExistingEmails] = useState<string[]>([]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      const formattedDate = formatDate(date);
      setFormData({...formData, tanggal_lahir: formattedDate});
    }
  };

  const generateEmail = (nama: string) => {
    if (!nama.trim()) return '';
    
    const words = nama.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .trim()
      .split(' ')
      .filter(word => word.length > 0);
    
    if (words.length === 0) return '';
    
    const firstName = words[0];
    let baseEmail = `${firstName}001@itb.ac.id`;
    
    // Cek duplikat dan increment angka
    if (!existingEmails.includes(baseEmail)) {
      return baseEmail;
    }
    
    // Cari nomor yang belum dipakai
    for (let i = 2; i <= 999; i++) {
      const paddedNumber = i.toString().padStart(3, '0');
      const numberedEmail = `${firstName}${paddedNumber}@itb.ac.id`;
      
      if (!existingEmails.includes(numberedEmail)) {
        return numberedEmail;
      }
    }
    
    // Jika sampai 999 masih duplikat, pakai 4 digit
    for (let i = 1000; i <= 9999; i++) {
      const numberedEmail = `${firstName}${i}@itb.ac.id`;
      
      if (!existingEmails.includes(numberedEmail)) {
        return numberedEmail;
      }
    }
    
    return `${firstName}${Date.now()}@itb.ac.id`; // fallback
  };

  const fetchExistingEmails = async () => {
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CHECK_EMAILS));
      const result = await response.json();
      if (result.success) {
        setExistingEmails(result.emails || []);
      }
    } catch (error) {
      console.log('Error fetching emails:', error);
    }
  };

  useEffect(() => {
    fetchExistingEmails();
  }, []);

  const handleNameChange = (text: string) => {
    setFormData({
      ...formData, 
      nama_lengkap: text
    });
  };

  const formatDateInput = (text: string) => {
    // Hapus semua karakter selain angka
    const numbers = text.replace(/[^0-9]/g, '');
    
    // Format otomatis DD/MM/YYYY
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else if (numbers.length <= 8) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const handleDateInputChange = (text: string) => {
    const formatted = formatDateInput(text);
    setFormData({...formData, tanggal_lahir: formatted});
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!formData.nama_lengkap || !formData.nip || !formData.email || !formData.password) {
      Alert.alert('Error', 'Nama Lengkap, Email, NIP, dan Password harus diisi!');
      return;
    }

    const dataToSend = formData;

    setLoading(true);
    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Sukses', 'Data pegawai berhasil ditambahkan!', [
          { text: 'OK', onPress: () => {
              // Reset form
              setFormData({
                nama_lengkap: '',
                email: '',
                password: '',
                nip: '',
                jenis_kelamin: '',
                jabatan: '',
                divisi: '',
                no_telepon: '',
                alamat: '',
                tanggal_lahir: ''
              });
              router.back();
            }
          }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Gagal menambahkan data pegawai');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
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
          <Text style={styles.headerTitle}>Tambah Data Pegawai</Text>
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Lengkap</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama lengkap"
                value={formData.nama_lengkap}
                onChangeText={handleNameChange}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>NIP</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan NIP"
                value={formData.nip}
                onChangeText={(text) => setFormData({...formData, nip: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Kelamin</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, formData.jenis_kelamin === 'Laki-laki' && styles.roleActive]}
                onPress={() => setFormData({...formData, jenis_kelamin: 'Laki-laki'})}
              >
                <Text style={[styles.roleText, formData.jenis_kelamin === 'Laki-laki' && styles.roleTextActive]}>
                  Laki-laki
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, formData.jenis_kelamin === 'Perempuan' && styles.roleActive]}
                onPress={() => setFormData({...formData, jenis_kelamin: 'Perempuan'})}
              >
                <Text style={[styles.roleText, formData.jenis_kelamin === 'Perempuan' && styles.roleTextActive]}>
                  Perempuan
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jabatan</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="briefcase-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan jabatan"
                value={formData.jabatan}
                onChangeText={(text) => setFormData({...formData, jabatan: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Divisi</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="business-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan divisi"
                value={formData.divisi}
                onChangeText={(text) => setFormData({...formData, divisi: text})}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>No. Telepon</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan nomor telepon"
                value={formData.no_telepon}
                onChangeText={(text) => setFormData({...formData, no_telepon: text})}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alamat</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Masukkan alamat"
                value={formData.alamat}
                onChangeText={(text) => setFormData({...formData, alamat: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tanggal Lahir</Text>
            <View style={styles.dateInputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="DD/MM/YYYY"
                  value={formData.tanggal_lahir}
                  onChangeText={handleDateInputChange}
                  keyboardType="numeric"
                  maxLength={10}
                />
                <TouchableOpacity onPress={showDatePickerModal} style={styles.calendarButton}>
                  <Ionicons name="calendar" size={20} color="#004643" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan email"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.helperText}>*Email wajib diisi untuk akun login</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry
              />
            </View>
            <Text style={styles.helperText}>*Password wajib diisi untuk akun login</Text>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

        </View>
      </ScrollView>

      {/* Sticky Save Button */}
      <View style={styles.stickyFooter}>
        <TouchableOpacity 
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.submitText}>Simpan Data Pegawai</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    paddingBottom: 15,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
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
  formContainer: {
    padding: 20,
    paddingBottom: 100
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 45,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  textArea: {
    textAlignVertical: 'top',
    paddingTop: 15
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  roleActive: {
    backgroundColor: '#004643'
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  roleTextActive: {
    color: '#fff'
  },
  submitBtn: {
    backgroundColor: '#004643',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc'
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic'
  },
  dateInputContainer: {
    position: 'relative'
  },
  calendarButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F0F8F0'
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
  }
});
