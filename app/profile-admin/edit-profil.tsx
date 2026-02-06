import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppHeader from '../../components/AppHeader';
import { API_CONFIG, getApiUrl } from '../../constants/config';

interface ProfileData {
  nama_lengkap: string;
  email: string;
  no_telepon: string;
  foto_profil: string | null;
}

export default function EditProfilAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    nama_lengkap: '',
    email: '',
    no_telepon: '',
    foto_profil: null
  });
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (!userData) {
        Alert.alert('Error', 'Silakan login ulang');
        router.replace('/');
        return;
      }

      // Set data dari AsyncStorage sebagai fallback
      setProfile({
        nama_lengkap: userData.nama_lengkap || '',
        email: userData.email || '',
        no_telepon: userData.no_telepon || '',
        foto_profil: userData.foto_profil || null
      });

      // Coba ambil dari server
      try {
        const userId = userData.id_user || userData.id;
        const url = getApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN}/profile`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'user-id': userId.toString()
          }
        });

        const result = await response.json();
        
        if (result.success && result.data) {
          setProfile({
            nama_lengkap: result.data.nama_lengkap || '',
            email: result.data.email || '',
            no_telepon: result.data.no_telepon || '',
            foto_profil: result.data.foto_profil || null
          });
        }
      } catch (serverError) {
        console.log('Server error (using fallback):', serverError);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Izin akses galeri diperlukan');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih foto');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!profile.nama_lengkap.trim()) {
      newErrors.nama_lengkap = 'Nama lengkap tidak boleh kosong';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profile.email.trim()) {
      newErrors.email = 'Email tidak boleh kosong';
    } else if (!emailRegex.test(profile.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (profile.no_telepon && profile.no_telepon.trim()) {
      const phoneRegex = /^[0-9]{10,15}$/;
      if (!phoneRegex.test(profile.no_telepon.replace(/\s/g, ''))) {
        newErrors.no_telepon = 'Nomor telepon harus 10-15 digit angka';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (!userData) {
        Alert.alert('Error', 'Silakan login ulang');
        router.replace('/');
        return;
      }

      const userId = userData.id_user || userData.id;
      const formData = new FormData();
      
      formData.append('nama_lengkap', profile.nama_lengkap);
      formData.append('email', profile.email);
      formData.append('no_telepon', profile.no_telepon);

      if (newPhoto) {
        const filename = newPhoto.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('foto_profil', {
          uri: newPhoto,
          name: filename,
          type: type,
        } as any);
      }

      const url = getApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN}/profile`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'user-id': userId.toString()
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Update AsyncStorage
        const updatedUserData = {
          ...userData,
          nama_lengkap: profile.nama_lengkap,
          email: profile.email,
          no_telepon: profile.no_telepon,
          foto_profil: result.data?.foto_profil || profile.foto_profil
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));

        Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Gagal memperbarui profil');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Edit Profil" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
          <Text style={styles.loadingText}>Memuat profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const photoUri = newPhoto || (profile.foto_profil ? getApiUrl(profile.foto_profil) : null);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="Edit Profil" 
        showBack
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          {/* Row 1: Nama Lengkap + Foto */}
          <View style={styles.rowWithPhoto}>
            <View style={styles.inputSection}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={[styles.input, errors.nama_lengkap && styles.inputError]}
                value={profile.nama_lengkap}
                onChangeText={(text) => {
                  setProfile({ ...profile, nama_lengkap: text });
                  if (errors.nama_lengkap) {
                    setErrors({ ...errors, nama_lengkap: '' });
                  }
                }}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#999"
              />
              {errors.nama_lengkap && (
                <Text style={styles.errorText}>{errors.nama_lengkap}</Text>
              )}
            </View>
            
            <View style={styles.photoSection}>
              <TouchableOpacity onPress={pickImage} style={styles.photoWrapper}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Ionicons name="person-outline" size={40} color="#004643" />
                  </View>
                )}
                <View style={styles.photoEditBtn}>
                  <Ionicons name="camera-outline" size={16} color="#004643" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Row 2: Email */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={profile.email}
              onChangeText={(text) => {
                setProfile({ ...profile, email: text });
                if (errors.email) {
                  setErrors({ ...errors, email: '' });
                }
              }}
              placeholder="Masukkan email"
              placeholderTextColor="##999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Row 3: Nomor Telepon */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput
              style={[styles.input, errors.no_telepon && styles.inputError]}
              value={profile.no_telepon}
              onChangeText={(text) => {
                setProfile({ ...profile, no_telepon: text });
                if (errors.no_telepon) {
                  setErrors({ ...errors, no_telepon: '' });
                }
              }}
              placeholder="Masukkan nomor telepon"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            {errors.no_telepon && (
              <Text style={styles.errorText}>{errors.no_telepon}</Text>
            )}
          </View>

          {/* Tombol Simpan di kanan bawah */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.saveButtonInline, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#004643" />
              ) : (
                <Text style={styles.saveButtonInlineText}>Simpan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rowWithPhoto: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  inputSection: {
    flex: 1,
    paddingVertical: 8,
  },
  buttonContainer: {
    alignItems: 'flex-end',
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    fontSize: 15,
    color: '#333',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  inputError: {
    color: '#D32F2F',
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  photoSection: {
    marginLeft: 16,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  photoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E6F0EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#004643',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  saveButtonInline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#004643',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonInlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#004643',
  },
});
