import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { API_CONFIG, getApiUrl } from "../../constants/config";
import AppHeader from "../../components/AppHeader";

export default function PengaturanKeamananScreen() {
  const router = useRouter();
  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    passwordLama: "",
    passwordBaru: "",
    konfirmasiPassword: "",
  });

  useEffect(() => {
    loadCurrentData();
  }, []);

  const loadCurrentData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      console.log('Raw userData from AsyncStorage:', userDataStr);
      
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      console.log('Parsed userData:', userData);
      
      if (userData) {
        const email = userData.email || "";
        const userId = userData.id_user;
        
        console.log('Extracted email:', email);
        console.log('Extracted user ID:', userId);
        
        setCurrentEmail(email);
        setFormData(prev => ({ ...prev, email: email }));
        
        if (!userId) {
          console.warn('User ID not found in userData');
          Alert.alert("Warning", "Data pengguna tidak lengkap. Silakan login ulang.");
        }
      } else {
        console.warn('No userData found in AsyncStorage');
        Alert.alert("Error", "Data pengguna tidak ditemukan. Silakan login ulang.");
        router.replace("/");
      }
    } catch (error) {
      console.error("Error loading current data:", error);
      Alert.alert("Error", "Gagal memuat data pengguna");
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.email) {
      Alert.alert("Error", "Email harus diisi");
      return;
    }

    // Jika ubah password
    if (formData.passwordBaru) {
      if (!formData.passwordLama) {
        Alert.alert("Error", "Password lama harus diisi untuk ubah password");
        return;
      }
      if (formData.passwordBaru !== formData.konfirmasiPassword) {
        Alert.alert("Error", "Password baru dan konfirmasi tidak cocok");
        return;
      }
      if (formData.passwordBaru.length < 6) {
        Alert.alert("Error", "Password minimal 6 karakter");
        return;
      }
    }

    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;

      if (!userData) {
        Alert.alert("Error", "Silakan login ulang");
        router.replace("/");
        return;
      }

      // Debug user data
      console.log('User data from AsyncStorage:', userData);
      const userId = userData.id_user;
      console.log('Extracted user ID:', userId);

      if (!userId) {
        Alert.alert("Error", "ID pengguna tidak ditemukan. Silakan login ulang.");
        router.replace("/");
        return;
      }

      const requestBody: any = {
        action: "update",
        user_id: parseInt(String(userId)),
        email: formData.email.trim()
      };

      // Only include password fields if user wants to change password
      if (formData.passwordBaru && formData.passwordBaru.trim()) {
        requestBody.password_lama = formData.passwordLama.trim();
        requestBody.password_baru = formData.passwordBaru.trim();
      }

      console.log('Sending update request:', requestBody);

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (result.success) {
        // Clear cache jika password diubah
        if (formData.passwordBaru) {
          await AsyncStorage.removeItem('userData');
          await AsyncStorage.removeItem('userToken');
          Alert.alert("Sukses", "Profil berhasil diubah. Silakan login ulang.", [
            { text: "OK", onPress: () => router.replace('/') }
          ]);
        } else {
          // Update email di AsyncStorage
          const updatedUserData = { ...userData, email: formData.email.trim() };
          await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
          
          Alert.alert("Sukses", "Email berhasil diubah", [
            { text: "OK", onPress: () => router.back() }
          ]);
        }
        
        // Reset password fields
        setFormData(prev => ({
          ...prev,
          passwordLama: "",
          passwordBaru: "",
          konfirmasiPassword: "",
        }));
      } else {
        Alert.alert("Error", result.message || "Gagal update profil");
      }
    } catch (error) {
      console.error("Update Profile Error:", error);
      Alert.alert("Error", "Gagal update profil");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Pengaturan Keamanan" showBack />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* FORM UBAH EMAIL & PASSWORD */}
        <View style={styles.content}>
          {/* EDIT EMAIL */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="mail" size={24} color="#004643" />
              <Text style={styles.cardTitle}>Email Admin</Text>
            </View>

            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Masukkan email"
              keyboardType="email-address"
            />
          </View>

          {/* UBAH PASSWORD */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#004643" />
              <Text style={styles.cardTitle}>Ubah Password (Opsional)</Text>
            </View>

            <Text style={styles.inputLabel}>Password Lama</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.passwordLama}
                onChangeText={(text) =>
                  setFormData({ ...formData, passwordLama: text })
                }
                placeholder="Kosongkan jika tidak ubah password"
                secureTextEntry={!showPasswordLama}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPasswordLama(!showPasswordLama)}
              >
                <Ionicons 
                  name={showPasswordLama ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Password Baru</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.passwordBaru}
                onChangeText={(text) =>
                  setFormData({ ...formData, passwordBaru: text })
                }
                placeholder="Minimal 6 karakter"
                secureTextEntry={!showPasswordBaru}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowPasswordBaru(!showPasswordBaru)}
              >
                <Ionicons 
                  name={showPasswordBaru ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.konfirmasiPassword}
                onChangeText={(text) =>
                  setFormData({ ...formData, konfirmasiPassword: text })
                }
                placeholder="Ulangi password baru"
                secureTextEntry={!showKonfirmasiPassword}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowKonfirmasiPassword(!showKonfirmasiPassword)}
              >
                <Ionicons 
                  name={showKonfirmasiPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleUpdateProfile}
            >
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            </TouchableOpacity>
          </View>

          {/* INFO KEAMANAN */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={20} color="#FF9800" />
              <Text style={styles.infoTitle}>Tips Keamanan</Text>
            </View>
            <Text style={styles.infoText}>• Gunakan email yang valid dan aktif</Text>
            <Text style={styles.infoText}>• Password minimal 6 karakter</Text>
            <Text style={styles.infoText}>• Kombinasikan huruf besar, kecil, dan angka</Text>
            <Text style={styles.infoText}>• Jangan gunakan password yang mudah ditebak</Text>
            <Text style={styles.infoText}>• Ubah password secara berkala</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 14,
  },
  eyeButton: {
    padding: 12,
  },
  saveButton: {
    backgroundColor: '#004643',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
});
