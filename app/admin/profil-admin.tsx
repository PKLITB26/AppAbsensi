import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { API_CONFIG, getApiUrl } from "../../constants/config";

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
      const userId = userData?.id_user || userData?.id;

      console.log("User Data:", userData);
      console.log("User ID:", userId);

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
        console.log("User data:", result.user);
        setProfile(result.user);
        setEditData({
          email: result.user.email || "",
          passwordLama: "",
          passwordBaru: "",
          konfirmasiPassword: "",
        });
      } else {
        console.log("Failed to load profile:", result);
        Alert.alert("Error", result.message || "Gagal memuat profil admin");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      Alert.alert("Error", "Gagal memuat profil: " + errorMessage);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Memuat profil...</Text>
        </View>
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
              <Ionicons name="person" size={50} color="#fff" />
            </View>
          </View>
          <Text style={styles.userName}>Administrator</Text>
          <Text style={styles.userRole}>
            {profile?.role?.toUpperCase() || "ADMIN"}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ID: {profile?.id_user}</Text>
          </View>
        </View>

        {/* INFO AKUN */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informasi Akun</Text>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setEditModal(true)}
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
          <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>
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
          onPress={() => router.replace("/")}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF4D4D" />
          <Text style={styles.logoutText}>Keluar Akun</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Edit */}
      <Modal visible={editModal} transparent animationType="fade">
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
            <TextInput
              style={styles.input}
              value={editData.passwordLama}
              onChangeText={(text) =>
                setEditData({ ...editData, passwordLama: text })
              }
              placeholder="Kosongkan jika tidak ubah password"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Password Baru</Text>
            <TextInput
              style={styles.input}
              value={editData.passwordBaru}
              onChangeText={(text) =>
                setEditData({ ...editData, passwordBaru: text })
              }
              placeholder="Minimal 6 karakter"
              secureTextEntry
            />

            <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
            <TextInput
              style={styles.input}
              value={editData.konfirmasiPassword}
              onChangeText={(text) =>
                setEditData({ ...editData, konfirmasiPassword: text })
              }
              placeholder="Ulangi password baru"
              secureTextEntry
            />

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
    <TouchableOpacity style={styles.menuLink}>
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
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 2,
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
  userName: { fontSize: 22, fontWeight: "bold", color: "#333" },
  userRole: { fontSize: 14, color: "#777", marginTop: 4 },
  badge: {
    backgroundColor: "#E6F0EF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 10,
  },
  badgeText: { color: "#004643", fontSize: 12, fontWeight: "bold" },
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "bold", color: "#333" },
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
    borderRadius: 15,
    paddingVertical: 10,
    elevation: 1,
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
    marginBottom: 10,
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
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
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
});
