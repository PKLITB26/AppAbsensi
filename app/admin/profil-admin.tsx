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
  const [editModal, setEditModal] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [showPasswordLama, setShowPasswordLama] = useState(false);
  const [showPasswordBaru, setShowPasswordBaru] = useState(false);
  const [showKonfirmasiPassword, setShowKonfirmasiPassword] = useState(false);
  const [editData, setEditData] = useState({
    email: "",
    passwordLama: "",
    passwordBaru: "",
    konfirmasiPassword: "",
  });

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
      setEditData({
        email: fallbackProfile.email || "",
        passwordLama: "",
        passwordBaru: "",
        konfirmasiPassword: "",
      });
      
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
          setEditData({
            email: result.user.email || "",
            passwordLama: "",
            passwordBaru: "",
            konfirmasiPassword: "",
          });
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

  const updateProfile = async () => {
    if (!editData.email) {
      Alert.alert("Error", "Email harus diisi");
      return;
    }

    // Jika ubah password
    if (editData.passwordBaru) {
      if (!editData.passwordLama) {
        Alert.alert("Error", "Password lama harus diisi untuk ubah password");
        return;
      }
      if (editData.passwordBaru !== editData.konfirmasiPassword) {
        Alert.alert("Error", "Password baru dan konfirmasi tidak cocok");
        return;
      }
      if (editData.passwordBaru.length < 6) {
        Alert.alert("Error", "Password minimal 6 karakter");
        return;
      }
    }

    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.ADMIN), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          user_id: profile?.id_user,
          email: editData.email,
          password_lama: editData.passwordLama || null,
          password_baru: editData.passwordBaru || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Sukses", "Profil berhasil diupdate");
        setEditModal(false);
        fetchProfile();
      } else {
        Alert.alert("Error", result.message || "Gagal update profil");
      }
    } catch (error) {
      console.error("Update Error:", error);
      Alert.alert("Error", "Gagal update profil");
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
        {/* HEADER PROFIL */}
        <View style={styles.profileHeader}>
          <View style={styles.imageWrapper}>
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="shield-checkmark" size={50} color="#fff" />
            </View>
            <View style={styles.statusDot} />
          </View>
          <Text style={styles.userName}>Administrator</Text>
          <Text style={styles.userRole}>
            {profile?.role?.toUpperCase() || "ADMIN"}
          </Text>
          <View style={styles.badge}>
            <Ionicons name="key" size={12} color="#004643" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>ID: {profile?.id_user}</Text>
          </View>
        </View>

        {/* INFO AKUN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="person-circle-outline" size={18} color="#004643" />
              <Text style={styles.sectionTitle}>Informasi Akun</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={16} color="#004643" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <InfoItem
              icon="mail-outline"
              label="Email"
              value={profile?.email || "-"}
            />
            <InfoItem
              icon="shield-checkmark-outline"
              label="Role"
              value={profile?.role || "admin"}
            />
            <InfoItem icon="key-outline" label="Password" value="••••••••" />
          </View>
        </View>

        {/* PENGATURAN & LAINNYA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="settings-outline" size={18} color="#004643" />
              <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <MenuLink
              icon="notifications-outline"
              title="Pengaturan Notifikasi"
            />
            <MenuLink icon="help-circle-outline" title="Pusat Bantuan" />
          </View>
        </View>

        {/* TOMBOL LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF4D4D" />
          <Text style={styles.logoutText}>Keluar Akun</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Edit */}
      <Modal visible={editModal} transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profil Admin</Text>

            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={editData.email}
              onChangeText={(text) => setEditData({ ...editData, email: text })}
              placeholder="Masukkan email"
              keyboardType="email-address"
            />

            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Ubah Password (Opsional)</Text>

            <Text style={styles.inputLabel}>Password Lama</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={editData.passwordLama}
                onChangeText={(text) =>
                  setEditData({ ...editData, passwordLama: text })
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
                value={editData.passwordBaru}
                onChangeText={(text) =>
                  setEditData({ ...editData, passwordBaru: text })
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
                value={editData.konfirmasiPassword}
                onChangeText={(text) =>
                  setEditData({ ...editData, konfirmasiPassword: text })
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

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={updateProfile}
              >
                <Text style={styles.saveBtnText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Konfirmasi Logout */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: Platform.OS === 'ios' ? 50 : 30,
          }}
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

function InfoItem({ icon, label, value }: any) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon} size={20} color="#004643" style={styles.infoIcon} />
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function MenuLink({ icon, title }: any) {
  return (
    <TouchableOpacity 
      style={styles.menuLink}
      activeOpacity={0.6}
    >
      <View style={styles.menuLinkLeft}>
        <Ionicons name={icon} size={20} color="#555" />
        <Text style={styles.menuLinkText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFB" },
  profileHeader: {
    backgroundColor: "#fff",
    alignItems: "center",
    paddingVertical: 35,
    paddingTop: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageWrapper: { position: "relative", marginBottom: 15 },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#004643",
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#004643",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#E6F0EF",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#004643",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#333",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  userRole: { 
    fontSize: 14, 
    color: "#777", 
    marginTop: 4,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  badge: {
    backgroundColor: "#E6F0EF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: { color: "#004643", fontSize: 12, fontWeight: "bold" },
  section: { marginTop: 25, paddingHorizontal: 20 },
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
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 30,
    marginHorizontal: 20,
  },

  logoutText: {
    marginLeft: 10,
    color: "#FF4D4D",
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
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
  eyeButton: { padding: 12 }
});
