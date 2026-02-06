import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { API_CONFIG, getApiUrl } from "../../constants/config";
import { SkeletonLoader } from "../../components";

interface AdminProfile {
  id_user: number;
  email: string;
  role: string;
  nama_lengkap?: string;
  foto_profil?: string;
  no_telepon?: string;
}

export default function ProfilAdminScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  const fetchProfile = async () => {
    try {
      console.log("Fetching admin profile...");

      // Get user data from AsyncStorage
      const userDataStr = await AsyncStorage.getItem("userData");
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      
      if (!userData) {
        Alert.alert('Error', 'Silakan login ulang');
        router.replace('/');
        return;
      }
      
      // Gunakan data dari AsyncStorage sebagai fallback
      const fallbackProfile = {
        id_user: userData.id_user || userData.id,
        email: userData.email,
        role: userData.role || 'admin',
        nama_lengkap: userData.nama_lengkap || 'Administrator',
        foto_profil: userData.foto_profil || null,
        no_telepon: userData.no_telepon || ''
      };
      
      setProfile(fallbackProfile);
      
        // Coba ambil dari server (opsional)
        try {
          const userId = userData.id_user || userData.id;
          const url = getApiUrl(`${API_CONFIG.ENDPOINTS.ADMIN}/profile`);
          console.log("Profile URL:", url);

          const response = await fetch(url, {
            method: "GET",
            headers: { 
              "Content-Type": "application/json",
              "user-id": userId.toString()
            }
          });
          const result = await response.json();

          console.log("Profile Response:", JSON.stringify(result, null, 2));

          if (result.success && result.data) {
            console.log("User data from server:", result.data);
            setProfile(result.data);
            
            // Update AsyncStorage with latest data
            const updatedUserData = {
              ...userData,
              ...result.data
            };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
          }
        } catch (serverError) {
          console.log("Server error (using fallback):", serverError);
          // Tetap gunakan data fallback
        }
    } catch (error) {
      console.error("Error fetching profile:", error);
      Alert.alert("Error", "Gagal memuat profil admin");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('userToken');
      setLogoutModal(false);
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Gagal keluar dari akun');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader type="form" count={3} message="Memuat profil admin..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#004643', '#2E7D32']}
          style={styles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        {/* HEADER PROFIL - Card dengan Layout Existing */}
        <View style={styles.profileCard}>
          <View style={styles.profileContainer}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.nama_lengkap || 'Administrator'}</Text>
              <Text style={styles.profileEmail}>{profile?.email || 'admin@example.com'}</Text>
            </View>
            <View style={styles.profileImageWrapper}>
              {profile?.foto_profil ? (
                <Image 
                  source={{ uri: getApiUrl(profile.foto_profil) }} 
                  style={styles.profileAvatar}
                />
              ) : (
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={40} color="#004643" />
                </View>
              )}
              <TouchableOpacity style={styles.editPhotoBtn}>
                <Ionicons name="add" size={16} color="#004643" />
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.editProfileBtn}
            onPress={() => router.push('/profile-admin/edit-profil' as any)}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* MENU CONTAINER dengan background */}
        <View style={styles.menuContainer}>
        {/* PENGATURAN AKUN */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PENGATURAN AKUN</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/pengaturan-profile-admin/pengaturan-keamanan' as any)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="lock-closed-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#F57C00" />
                </View>
                <Text style={styles.menuText}>Keamanan</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="notifications-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#1976D2" />
                </View>
                <Text style={styles.menuText}>Notifikasi</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* INFORMASI UMUM */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INFORMASI UMUM</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="information-circle-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#7B1FA2" />
                </View>
                <Text style={styles.menuText}>Tentang Aplikasi</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="document-text-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#388E3C" />
                </View>
                <Text style={styles.menuText}>Syarat dan Ketentuan</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                  <Ionicons name="shield-checkmark-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#00897B" />
                </View>
                <Text style={styles.menuText}>Kebijakan Privasi</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        {/* BANTUAN DAN DUKUNGAN */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BANTUAN DAN DUKUNGAN</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFF9C4' }]}>
                  <Ionicons name="help-circle-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#F9A825" />
                </View>
                <Text style={styles.menuText}>Bantuan dan Dukungan</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setLogoutModal(true)}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                  <Ionicons name="log-out-outline" size={Platform.OS === 'ios' ? 20 : 22} color="#D32F2F" />
                </View>
                <Text style={styles.menuText}>Keluar Akun</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Modal Konfirmasi Logout */}
      <Modal 
        visible={logoutModal} 
        transparent 
        statusBarTranslucent={true}
        animationType="none"
      >
        <TouchableOpacity 
          style={styles.logoutModalOverlay}
          activeOpacity={1}
          onPress={() => setLogoutModal(false)}
        >
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutModalHeader}>
              <Ionicons name="log-out-outline" size={32} color="#FF4D4D" />
              <Text style={styles.logoutModalTitle}>Keluar Akun</Text>
              <Text style={styles.logoutModalMessage}>
                Apakah Anda yakin ingin keluar dari akun?
              </Text>
            </View>
            
            <View style={styles.logoutModalButtons}>
              <TouchableOpacity 
                style={styles.logoutCancelBtn}
                onPress={() => setLogoutModal(false)}
              >
                <Text style={styles.logoutCancelText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoutConfirmBtn}
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: {
    paddingBottom: 20,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    zIndex: -1,
  },
  
  // Profile Card (dengan gradient background)
  profileCard: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileAvatar: {
    width: Platform.OS === 'ios' ? 85 : 90,
    height: Platform.OS === 'ios' ? 85 : 90,
    borderRadius: Platform.OS === 'ios' ? 42.5 : 45,
    backgroundColor: '#E6F0EF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  editPhotoBtn: {
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
  editProfileBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#004643',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 14,
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#004643',
  },
  
  // Menu Container
  menuContainer: {
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 15,
    paddingBottom: 20,
    marginTop: -10,
  },
  
  // Section
  section: {
    marginTop: 15,
    paddingHorizontal: 15,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 10,
    marginLeft: 5,
    letterSpacing: 0.5,
  },
  
  // Menu Card
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 14 : 16,
    paddingHorizontal: 15,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  
  // Modal
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === 'android' ? 0 : 50,
  },
  logoutModalContent: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    width: '85%', 
    maxWidth: 320 
  },
  logoutModalHeader: { 
    alignItems: 'center', 
    marginBottom: 24 
  },
  logoutModalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333', 
    marginTop: 12, 
    marginBottom: 8 
  },
  logoutModalMessage: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    lineHeight: 22 
  },
  logoutModalButtons: { 
    flexDirection: 'row', 
    gap: 12 
  },
  logoutCancelBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center' 
  },
  logoutCancelText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#666' 
  },
  logoutConfirmBtn: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    backgroundColor: '#FF4D4D', 
    alignItems: 'center' 
  },
  logoutConfirmText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#fff' 
  },
});
