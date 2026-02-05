import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { API_CONFIG, getApiUrl } from "../../constants/config";
import { SkeletonLoader } from "../../components";

interface AdminProfile {
  id_user: number;
  email: string;
  role: string;
}

export default function ProfilAdminScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

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
        role: userData.role || 'admin'
      };
      
      setProfile(fallbackProfile);
      
      // Coba ambil dari server (opsional)
      try {
        const userId = userData.id_user || userData.id;
        const url = getApiUrl(API_CONFIG.ENDPOINTS.ADMIN);
        console.log("URL:", url);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId || null }),
        });
        const result = await response.json();

        console.log("Profile Response:", JSON.stringify(result, null, 2));

        if (result.success && result.user) {
          console.log("User data from server:", result.user);
          setProfile(result.user);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER PROFIL - DANA Style */}
        <LinearGradient
          colors={['#004643', '#2E7D32']}
          style={styles.profileHeader}
        >
          <View style={styles.profileContainer}>
            <View style={styles.profileImageWrapper}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={32} color="#fff" />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Administrator</Text>
              <Text style={styles.profileId}>ID: ADM{String(profile?.id_user).padStart(3, '0')}</Text>
            </View>
            <TouchableOpacity 
              style={styles.logoutIconBtn}
              onPress={() => setLogoutModal(true)}
            >
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* MENU PENGATURAN */}
        <View style={styles.menuSection}>
          <View style={styles.menuGroup}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/pengaturan-profile-admin/pengaturan-keamanan' as any)}
            >
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="shield-checkmark" size={20} color="#004643" />
                </View>
                <Text style={styles.menuText}>Pengaturan Keamanan</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="notifications" size={20} color="#004643" />
                </View>
                <Text style={styles.menuText}>Pengaturan Notifikasi</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconContainer}>
                  <Ionicons name="information-circle" size={20} color="#004643" />
                </View>
                <Text style={styles.menuText}>Info Umum</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
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
  profileHeader: {
    paddingTop: Platform.OS === 'ios' ? 70 : 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: -15,
    marginHorizontal: 20,
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValueContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 1.5,
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageWrapper: {
    marginRight: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  profileInfo: {
    flex: 1,
  },
  logoutIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FF4D4D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    elevation: 3,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  section: { marginTop: 20, paddingHorizontal: 20 },
  menuSection: { marginTop: -15, paddingHorizontal: 20 },
  menuGroup: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 0,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#333",
    letterSpacing: 0.3,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F0EF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editBtnText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#004643",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  infoIcon: { width: 35 },
  infoLabel: { fontSize: 11, color: "#999" },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "500" },
  menuLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  menuLinkLeft: { flexDirection: "row", alignItems: "center" },
  menuLinkText: { marginLeft: 15, fontSize: 14, color: "#333" },
  logoutSection: {
    marginTop: 30,
    marginBottom: 30,
    marginHorizontal: 20,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF4D4D",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#FF4D4D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  logoutText: {
    marginLeft: 10,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  versionText: {
    textAlign: "center",
    color: "#BBB",
    fontSize: 11,
    marginBottom: 30,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === 'android' ? 0 : 50,
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  divider: { height: 1, backgroundColor: "#E0E0E0", marginVertical: 15 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5 },
  cancelBtn: { backgroundColor: "#f5f5f5" },
  saveBtn: { backgroundColor: "#004643" },
  cancelBtnText: { textAlign: "center", color: "#666", fontWeight: "500" },
  saveBtnText: { textAlign: "center", color: "#fff", fontWeight: "bold" },
  logoutModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '85%', maxWidth: 320 },
  logoutModalHeader: { alignItems: 'center', marginBottom: 24 },
  logoutModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginTop: 12, marginBottom: 8 },
  logoutModalMessage: { fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 22 },
  logoutModalButtons: { flexDirection: 'row', gap: 12 },
  logoutCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F5F5F5', alignItems: 'center' },
  logoutCancelText: { fontSize: 16, fontWeight: '600', color: '#666' },
  logoutConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#FF4D4D', alignItems: 'center' },
  logoutConfirmText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15 },
  passwordInput: { flex: 1, padding: 12, fontSize: 14 },
  eyeButton: { padding: 12 },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Platform.OS === 'android' ? 0 : 50,
  },
});
