import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, TextInput, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface PegawaiOption {
  id_pegawai: number;
  nama_lengkap: string;
  nip: string;
}

export default function AddAkunLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'pegawai',
    id_pegawai: ''
  });
  const [pegawaiList, setPegawaiList] = useState<PegawaiOption[]>([]);
  const [filteredPegawai, setFilteredPegawai] = useState<PegawaiOption[]>([]);
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchPegawaiList();
  }, []);

  const fetchPegawaiList = async () => {
    try {
      const response = await fetch('http://10.251.109.131/hadirinapp/data-pegawai.php');
      const result = await response.json();
      
      if (result.success) {
        setPegawaiList(result.data || []);
        setFilteredPegawai(result.data || []);
      }
    } catch (error) {
      console.log('Error fetching pegawai list:', error);
    }
  };

  const filterPegawai = (text: string) => {
    setSearchText(text);
    if (text === '') {
      setFilteredPegawai(pegawaiList);
    } else {
      const filtered = pegawaiList.filter(pegawai => 
        pegawai.nama_lengkap.toLowerCase().includes(text.toLowerCase()) ||
        pegawai.nip?.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPegawai(filtered);
    }
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Email dan Password harus diisi!');
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        id_pegawai: selectedPegawai?.id_pegawai || null
      };
      
      const response = await fetch('http://10.251.109.131/hadirinapp/akun-login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Sukses', 'Akun login berhasil ditambahkan!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Gagal menambahkan akun login');
      }
    } catch (error) {
      Alert.alert('Koneksi Error', 'Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.');
    } finally {
      setLoading(false);
    }
  };

  const selectPegawai = (pegawai: PegawaiOption) => {
    setSelectedPegawai(pegawai);
    setFormData({
      ...formData, 
      id_pegawai: pegawai.id_pegawai.toString(),
      // Auto-fill email based on name
      email: pegawai.nama_lengkap.toLowerCase().replace(/\s+/g, '.') + '@itb.ac.id'
    });
    setShowDropdown(false);
    setSearchText('');
    setFilteredPegawai(pegawaiList);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#004643" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tambah Akun Login</Text>
        </View>
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pilih Pegawai</Text>
            <TouchableOpacity 
              style={styles.dropdownWrapper}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <Text style={[styles.dropdownText, !selectedPegawai && styles.placeholderText]}>
                {selectedPegawai 
                  ? `${selectedPegawai.nama_lengkap} - ${selectedPegawai.nip?.substring(0,5) || 'No NIP'}` 
                  : 'Pilih Pegawai...'}
              </Text>
              <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#666" />
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={styles.dropdownContainer}>
                <View style={styles.searchWrapper}>
                  <Ionicons name="search-outline" size={16} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Cari nama atau NIP..."
                    value={searchText}
                    onChangeText={filterPegawai}
                  />
                </View>
                <View style={styles.dropdownList}>
                  {filteredPegawai.map((item) => (
                    <TouchableOpacity
                      key={item.id_pegawai.toString()}
                      style={styles.dropdownItem}
                      onPress={() => selectPegawai(item)}
                    >
                      <Text style={styles.pegawaiName}>{item.nama_lengkap}</Text>
                      <Text style={styles.pegawaiNip}>NIP: {item.nip?.substring(0,5) || 'Belum ada'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="contoh@email.com"
                value={formData.email}
                onChangeText={(text) => setFormData({...formData, email: text})}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Masukkan password"
                value={formData.password}
                onChangeText={(text) => setFormData({...formData, password: text})}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Role</Text>
            <View style={styles.roleContainer}>
              <TouchableOpacity 
                style={[styles.roleBtn, formData.role === 'pegawai' && styles.roleActive]}
                onPress={() => setFormData({...formData, role: 'pegawai'})}
              >
                <Text style={[styles.roleText, formData.role === 'pegawai' && styles.roleTextActive]}>
                  Pegawai
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.roleBtn, formData.role === 'admin' && styles.roleActive]}
                onPress={() => setFormData({...formData, role: 'admin'})}
              >
                <Text style={[styles.roleText, formData.role === 'admin' && styles.roleTextActive]}>
                  Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
                <Text style={styles.submitText}>Simpan Akun Login</Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
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
    padding: 20
  },
  inputGroup: {
    marginBottom: 20,
    position: 'relative'
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  inputIcon: {
    marginRight: 12
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  dropdownWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 45,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  placeholderText: {
    color: '#999'
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 5,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    maxHeight: 250,
    zIndex: 1000
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    margin: 10,
    height: 40
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  dropdownList: {
    maxHeight: 180
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  pegawaiName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  pegawaiNip: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
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
    borderRadius: 12,
    marginTop: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc'
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  }
});
