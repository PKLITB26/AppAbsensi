import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

interface UserProfile {
  id_user: number;
  nama_lengkap: string;
  email: string;
  nip?: string;
  no_telepon?: string;
  jabatan?: string;
  divisi?: string;
  jenis_kelamin?: string;
  alamat?: string;
  tanggal_lahir?: string;
  foto_profil?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [hasNIP, setHasNIP] = useState(false);
  const [editData, setEditData] = useState({
    nip: '',
    jenis_kelamin: '',
    jabatan: '',
    divisi: '',
    no_telepon: '',
    alamat: '',
    tanggal_lahir: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      console.log('Fetching profile data...');
      const response = await fetch('http://10.251.109.131/hadirinapp/profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 1 })
      });
      
      console.log('Profile response status:', response.status);
      const result = await response.json();
      console.log('Profile API Result:', result);
      
      if (result.success) {
        setProfile(result.data);
        setHasNIP(result.has_nip);
        setEditData({
          nip: result.data.nip || '',
          jenis_kelamin: result.data.jenis_kelamin || '',
          jabatan: result.data.jabatan || '',
          divisi: result.data.divisi || '',
          no_telepon: result.data.no_telepon || '',
          alamat: result.data.alamat || '',
          tanggal_lahir: result.data.tanggal_lahir || ''
        });
      } else {
        console.log('Profile API Error:', result.message);
        Alert.alert('Error', 'Gagal memuat profil: ' + result.message);
      }
    } catch (error) {
      console.log('Profile Fetch Error:', error);
      Alert.alert('Error', 'Gagal memuat profil');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      console.log('Updating profile with data:', editData);
      const response = await fetch('http://10.251.109.131/hadirinapp/profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1,
          action: 'update',
          no_telepon: editData.no_telepon,
          alamat: editData.alamat
        })
      });
      
      console.log('Update response status:', response.status);
      const result = await response.json();
      console.log('Update API Result:', result);
      
      if (result.success) {
        Alert.alert('Sukses', 'Profil berhasil diupdate');
        setEditModal(false);
        fetchProfile();
      } else {
        Alert.alert('Error', result.message || 'Gagal update profil');
      }
    } catch (error) {
      console.log('Update Error:', error);
      Alert.alert('Error', 'Gagal update profil');
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
            <Image 
              source={{ 
                uri: profile?.foto_profil || `https://ui-avatars.com/api/?name=${profile?.nama_lengkap}&background=004643&color=fff&size=128`
              }} 
              style={styles.profileImage} 
            />
            <TouchableOpacity style={styles.editIcon}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{profile?.nama_lengkap || 'User'}</Text>
          <Text style={styles.userRole}>{profile?.jabatan || 'Pegawai'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NIP: {profile?.nip || 'Belum ada'}</Text>
          </View>
        </View>

        {/* INFO PRIBADI */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
            <TouchableOpacity 
              style={styles.editBtn}
              onPress={() => setEditModal(true)}
            >
              <Ionicons name="create-outline" size={16} color="#004643" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoCard}>
            <InfoItem icon="mail-outline" label="Email" value={profile?.email || '-'} />
            <InfoItem icon="call-outline" label="Telepon" value={profile?.no_telepon || 'Belum diisi'} />
            <InfoItem icon="business-outline" label="Jabatan" value={profile?.jabatan || 'Belum diisi'} />
            <InfoItem icon="briefcase-outline" label="Divisi" value={profile?.divisi || 'Belum diisi'} />
            <InfoItem icon="person-outline" label="Jenis Kelamin" value={profile?.jenis_kelamin || 'Belum diisi'} />
            <InfoItem icon="location-outline" label="Alamat" value={profile?.alamat || 'Belum diisi'} />
            <InfoItem icon="calendar-outline" label="Tanggal Lahir" value={profile?.tanggal_lahir || 'Belum diisi'} />
          </View>
        </View>

        {/* PENGATURAN & LAINNYA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pengaturan Aplikasi</Text>
          <View style={styles.infoCard}>
            <MenuLink icon="shield-checkmark-outline" title="Ubah Password" />
            <MenuLink icon="notifications-outline" title="Pengaturan Notifikasi" />
            <MenuLink icon="help-circle-outline" title="Pusat Bantuan" />
          </View>
        </View>

        {/* TOMBOL LOGOUT */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace('/')}>
          <Ionicons name="log-out-outline" size={20} color="#FF4D4D" />
          <Text style={styles.logoutText}>Keluar Akun</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Hadir.in v1.0.0 (Stable)</Text>

      </ScrollView>
      
      {/* Modal Edit */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{hasNIP ? 'Edit Profil' : 'Lengkapi Profil'}</Text>
            
            {!hasNIP && (
              <>
                <Text style={styles.inputLabel}>NIP</Text>
                <TextInput
                  style={styles.input}
                  value={editData.nip}
                  onChangeText={(text) => setEditData({...editData, nip: text})}
                  placeholder="Masukkan NIP"
                />
                
                <Text style={styles.inputLabel}>Jenis Kelamin</Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity 
                    style={[styles.genderBtn, editData.jenis_kelamin === 'Laki-laki' && styles.genderBtnActive]}
                    onPress={() => setEditData({...editData, jenis_kelamin: 'Laki-laki'})}
                  >
                    <Text style={[styles.genderText, editData.jenis_kelamin === 'Laki-laki' && styles.genderTextActive]}>Laki-laki</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.genderBtn, editData.jenis_kelamin === 'Perempuan' && styles.genderBtnActive]}
                    onPress={() => setEditData({...editData, jenis_kelamin: 'Perempuan'})}
                  >
                    <Text style={[styles.genderText, editData.jenis_kelamin === 'Perempuan' && styles.genderTextActive]}>Perempuan</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.inputLabel}>Jabatan</Text>
                <TextInput
                  style={styles.input}
                  value={editData.jabatan}
                  onChangeText={(text) => setEditData({...editData, jabatan: text})}
                  placeholder="Masukkan jabatan"
                />
                
                <Text style={styles.inputLabel}>Divisi</Text>
                <TextInput
                  style={styles.input}
                  value={editData.divisi}
                  onChangeText={(text) => setEditData({...editData, divisi: text})}
                  placeholder="Masukkan divisi"
                />
                
                <Text style={styles.inputLabel}>Tanggal Lahir</Text>
                <TextInput
                  style={styles.input}
                  value={editData.tanggal_lahir}
                  onChangeText={(text) => setEditData({...editData, tanggal_lahir: text})}
                  placeholder="YYYY-MM-DD"
                />
              </>
            )}
            
            <Text style={styles.inputLabel}>No. Telepon</Text>
            <TextInput
              style={styles.input}
              value={editData.no_telepon}
              onChangeText={(text) => setEditData({...editData, no_telepon: text})}
              placeholder="Masukkan nomor telepon"
            />
            
            <Text style={styles.inputLabel}>Alamat</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editData.alamat}
              onChangeText={(text) => setEditData({...editData, alamat: text})}
              placeholder="Masukkan alamat"
              multiline
              numberOfLines={3}
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
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  profileHeader: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 2 },
  imageWrapper: { position: 'relative', marginBottom: 15 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#004643' },
  editIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#004643', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  userRole: { fontSize: 14, color: '#777', marginTop: 4 },
  badge: { backgroundColor: '#E6F0EF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 10 },
  badgeText: { color: '#004643', fontSize: 12, fontWeight: 'bold' },
  section: { marginTop: 25, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6F0EF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  editBtnText: { marginLeft: 4, fontSize: 12, color: '#004643', fontWeight: '500' },
  infoCard: { backgroundColor: '#fff', borderRadius: 15, paddingVertical: 10, elevation: 1 },
  infoItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
  infoIcon: { width: 35 },
  infoLabel: { fontSize: 11, color: '#999' },
  infoValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  menuLink: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuLinkLeft: { flexDirection: 'row', alignItems: 'center' },
  menuLinkText: { marginLeft: 15, fontSize: 14, color: '#333' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30, marginBottom: 10 },
  logoutText: { marginLeft: 10, color: '#FF4D4D', fontWeight: 'bold', fontSize: 16 },
  versionText: { textAlign: 'center', color: '#BBB', fontSize: 11, marginBottom: 30 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 15, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 14 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#f5f5f5' },
  saveBtn: { backgroundColor: '#004643' },
  cancelBtnText: { textAlign: 'center', color: '#666', fontWeight: '500' },
  saveBtnText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },
  genderContainer: { flexDirection: 'row', marginBottom: 15 },
  genderBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginHorizontal: 5, alignItems: 'center' },
  genderBtnActive: { backgroundColor: '#004643', borderColor: '#004643' },
  genderText: { color: '#666' },
  genderTextActive: { color: '#fff', fontWeight: 'bold' }
});
