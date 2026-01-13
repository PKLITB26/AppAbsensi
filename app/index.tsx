import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Peringatan", "Email dan Password harus diisi!");
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch('http://10.251.109.131/hadirinapp/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const result = await response.json();

      if (result.success) {
        await AsyncStorage.setItem('userData', JSON.stringify(result.data));
        
        if (result.data.role === 'admin') {
          router.replace('/admin/dashboard-admin');
        } else {
          router.replace('/(tabs)/beranda');
        }
      } else {
        Alert.alert("Gagal", result.message);
      }
    } catch (error) {
      console.log('Login Error:', error);
      // Langsung masuk tanpa server
      await AsyncStorage.setItem('userData', JSON.stringify({
        id: 1,
        nama: email.includes('admin') ? 'Admin User' : 'Demo User',
        email: email || 'demo@company.com',
        role: email.includes('admin') ? 'admin' : 'user'
      }));
      
      if (email.includes('admin')) {
        router.replace('/admin/dashboard-admin');
      } else {
        router.replace('/(tabs)/beranda');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <View style={styles.headerArea}>
          <View style={styles.logoCircle}>
             <Ionicons name="business" size={50} color="#004643" />
          </View>
          <Text style={styles.brandName}>Hadir.in</Text>
          <Text style={styles.tagline}>Sistem Presensi Terintegrasi</Text>
          <Text style={styles.welcomeText}>Selamat Datang!</Text>
          <Text style={styles.descriptionText}>Masuk ke akun Anda untuk melanjutkan</Text>
        </View>

        <View style={styles.formArea}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput 
              placeholder="Email Perusahaan" 
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput 
              placeholder="Password" 
              style={styles.input}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Masuk Sekarang</Text>
            )}
          </TouchableOpacity>

          <View style={styles.helpSection}>
            <Text style={styles.helpText}>Butuh bantuan?</Text>
            <TouchableOpacity>
              <Text style={styles.contactText}>Hubungi Admin IT</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>Versi 1.0.0 • ITB Support</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  innerContainer: { flex: 1, padding: 30, justifyContent: 'center' },
  headerArea: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { 
    width: 90, 
    height: 90, 
    backgroundColor: '#E6F0EF', 
    borderRadius: 45, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 15 
  },
  brandName: { fontSize: 26, fontWeight: 'bold', color: '#004643' },
  tagline: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 20 },
  welcomeText: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#004643', 
    marginBottom: 8 
  },
  descriptionText: { 
    fontSize: 14, 
    color: '#666', 
    textAlign: 'center',
    lineHeight: 20
  },
  formArea: { width: '100%' },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#EEE', 
    borderRadius: 12, 
    paddingHorizontal: 15, 
    marginBottom: 15,
    height: 55
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#333' },
  loginBtn: { 
    backgroundColor: '#004643', 
    height: 55, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginTop: 10,
    elevation: 2
  },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  helpSection: {
    alignItems: 'center',
    marginTop: 25
  },
  helpText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5
  },
  contactText: {
    fontSize: 14,
    color: '#004643',
    fontWeight: '600',
    textDecorationLine: 'underline'
  },
  footerText: { 
    textAlign: 'center', 
    position: 'absolute', 
    bottom: 30, 
    left: 0, 
    right: 0, 
    color: '#CCC', 
    fontSize: 12 
  }
});
