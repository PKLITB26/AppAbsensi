import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  PanResponder,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { API_CONFIG, getApiUrl, PegawaiAkunAPI } from "../../constants/config";
import { AppHeader } from "../../components";

interface PegawaiData {
  id_pegawai?: number;
  id_user?: number;
  nama_lengkap: string;
  email?: string;
  password?: string;
  has_password?: boolean;
  nip?: string;
  jenis_kelamin?: string;
  jabatan?: string;
  divisi?: string;
  no_telepon?: string;
  status_pegawai?: string;
  foto_profil?: string;
  role?: string;
}

export default function DataPegawaiAdminScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [pegawai, setPegawai] = useState<PegawaiData[]>([]);
  const [filteredPegawai, setFilteredPegawai] = useState<PegawaiData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedPegawai, setSelectedPegawai] = useState<PegawaiData | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showActionModal) {
      translateY.setValue(0);
    }
  }, [showActionModal]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          setShowActionModal(false);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;



  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPegawai(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPegawai();
      // Set navigation bar translucent
      if (Platform.OS === 'android') {
        NavigationBar.setBackgroundColorAsync('transparent');
      }
    }, []),
  );

  useEffect(() => {
    if (params.refresh) {
      fetchPegawai();
    }
  }, [params.refresh]);

  useEffect(() => {
    filterPegawai();
  }, [searchQuery, pegawai]);

  const filterPegawai = () => {
    let filtered = pegawai;
    if (searchQuery.trim() !== "") {
      filtered = pegawai.filter(
        (p) =>
          p.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.email &&
            p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.jabatan &&
            p.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (p.nip && p.nip.includes(searchQuery)),
      );
    }
    setFilteredPegawai(filtered);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredPegawai.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredPegawai.slice(startIndex, endIndex);

  const fetchPegawai = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      console.log('Fetching data from:', getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI));
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.DATA_PEGAWAI),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (result.success) {
        setPegawai(result.data);
        setFilteredPegawai(result.data);
      } else {
        Alert.alert("Error", result.message || "Gagal memuat data pegawai");
      }
    } catch (error) {
      console.error('Fetch error:', error);
      Alert.alert(
        "Koneksi Error",
        "Pastikan XAMPP nyala dan HP satu Wi-Fi dengan laptop.\n\nDetail: " + (error as Error).message,
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const deletePegawai = async (id: number, nama: string) => {
    try {
      const result = await PegawaiAkunAPI.deletePegawai(id);
      if (result.success) {
        Alert.alert("Sukses", result.message);
        fetchPegawai(); // Refresh data
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "Gagal menghapus data pegawai");
    }
  };



  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      {/* HEADER */}
      <AppHeader 
        title="Data Pegawai"
        showBack={true}
        showStats={true}
        statsText={`${filteredPegawai.length} Pegawai`}
        fallbackRoute="/admin/dashboard-admin"
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#004643" />
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          {/* Fixed Search and Sort */}
          <View style={styles.fixedControls}>
            {/* Search Container */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Cari pegawai"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor="#999"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery('')}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>


          </View>

          {/* Scrollable List */}
          <FlatList
            data={currentData}
            keyExtractor={(item) =>
              item.id_pegawai?.toString() ||
              item.id_user?.toString() ||
              Math.random().toString()
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#004643"]}
                tintColor="#004643"
              />
            }
            style={styles.flatList}
            ListFooterComponent={() => {
              if (totalPages <= 1) return null;
              return (
                <View style={styles.paginationContainer}>
                  <TouchableOpacity
                    style={[
                      styles.pageBtn,
                      currentPage === 1 && styles.pageBtnDisabled,
                    ]}
                    onPress={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={16}
                      color={currentPage === 1 ? "#ccc" : "#004643"}
                    />
                  </TouchableOpacity>

                  <View style={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <TouchableOpacity
                          key={page}
                          style={[
                            styles.pageNumber,
                            currentPage === page && styles.pageNumberActive,
                          ]}
                          onPress={() => setCurrentPage(page)}
                        >
                          <Text
                            style={[
                              styles.pageNumberText,
                              currentPage === page &&
                                styles.pageNumberTextActive,
                            ]}
                          >
                            {page}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.pageBtn,
                      currentPage === totalPages && styles.pageBtnDisabled,
                    ]}
                    onPress={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={currentPage === totalPages ? "#ccc" : "#004643"}
                    />
                  </TouchableOpacity>
                </View>
              );
            }}
            renderItem={({ item }) => (
              <View style={styles.pegawaiCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.nama_lengkap?.charAt(0) || "P"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pegawaiName}>{item.nama_lengkap}</Text>
                  <Text style={styles.pegawaiEmail}>
                    {item.email || "Email belum diisi"}
                  </Text>
                  <Text style={styles.pegawaiNip}>
                    NIP: {item.nip || "Belum diisi"}
                  </Text>
                </View>
                <View style={styles.pegawaiActions}>
                  <TouchableOpacity
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.email &&
                          item.email.trim() !== "" &&
                          item.has_password === true &&
                          item.nama_lengkap &&
                          item.nama_lengkap.trim() !== "" &&
                          item.nip &&
                          item.nip.trim() !== ""
                            ? "#E8F5E9"
                            : "#FFEBEE",
                      },
                    ]}
                    onPress={() => {
                      if (
                        !(
                          item.email &&
                          item.email.trim() !== "" &&
                          item.has_password === true &&
                          item.nama_lengkap &&
                          item.nama_lengkap.trim() !== "" &&
                          item.nip &&
                          item.nip.trim() !== ""
                        )
                      ) {
                        const missing = [];
                        if (!item.email || item.email.trim() === "")
                          missing.push("Email");
                        if (item.has_password !== true)
                          missing.push("Password");
                        if (
                          !item.nama_lengkap ||
                          item.nama_lengkap.trim() === ""
                        )
                          missing.push("Nama Lengkap");
                        if (!item.nip || item.nip.trim() === "")
                          missing.push("NIP");
                        Alert.alert(
                          "Informasi Belum Lengkap",
                          `Data yang kurang: ${missing.join(", ")}`,
                          [{ text: "OK" }],
                        );
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            item.email &&
                            item.email.trim() !== "" &&
                            item.has_password === true &&
                            item.nama_lengkap &&
                            item.nama_lengkap.trim() !== "" &&
                            item.nip &&
                            item.nip.trim() !== ""
                              ? "#2E7D32"
                              : "#F44336",
                        },
                      ]}
                    >
                      {item.email &&
                      item.email.trim() !== "" &&
                      item.has_password === true &&
                      item.nama_lengkap &&
                      item.nama_lengkap.trim() !== "" &&
                      item.nip &&
                      item.nip.trim() !== ""
                        ? "Lengkap"
                        : "Belum Lengkap"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => {
                      setSelectedPegawai(item);
                      setShowActionModal(true);
                    }}
                  >
                    <Ionicons name="ellipsis-vertical" size={18} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentInsetAdjustmentBehavior="never"
            contentContainerStyle={[styles.listContent, { 
              paddingBottom: Platform.OS === 'android' ? 0 : 20 
            }]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={80} color="#ccc" />
                <Text style={styles.emptyText}>Belum ada data pegawai</Text>
              </View>
            }
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.floatingAddBtn}
        onPress={() => router.push("/pegawai-akun/add-data-pegawai" as any)}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowActionModal(false)}
        accessible={true}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetContainer}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [{ translateY }],
                },
              ]}
            >
              <View style={styles.modalHeader} {...panResponder.panHandlers}>
                <View style={styles.modalHandle} />
              </View>
              
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActionModal(false);
                  router.push(
                    `/pegawai-akun/detail/${selectedPegawai?.id_pegawai || selectedPegawai?.id_user}` as any
                  );
                }}
              >
                <Ionicons name="eye-outline" size={20} color="#2196F3" />
                <Text style={[styles.actionText, { color: "#2196F3" }]}>Lihat Detail</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActionModal(false);
                  router.push(
                    `/pegawai-akun/detail/edit/${selectedPegawai?.id_pegawai || selectedPegawai?.id_user}` as any
                  );
                }}
              >
                <Ionicons name="create-outline" size={20} color="#FF9800" />
                <Text style={[styles.actionText, { color: "#FF9800" }]}>Edit Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => {
                  setShowActionModal(false);
                  Alert.alert(
                    "Konfirmasi Hapus",
                    `Apakah Anda yakin ingin menghapus data ${selectedPegawai?.nama_lengkap}?`,
                    [
                      { text: "Batal", style: "cancel" },
                      {
                        text: "Hapus",
                        style: "destructive",
                        onPress: () =>
                          deletePegawai(
                            selectedPegawai?.id_pegawai || selectedPegawai?.id_user || 0,
                            selectedPegawai?.nama_lengkap || ""
                          ),
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#F44336" />
                <Text style={[styles.actionText, { color: "#F44336" }]}>Hapus Data</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
  },

  contentWrapper: {
    flex: 1,
    backgroundColor: "#F8FAFB",
  },
  fixedControls: {
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FAFBFC",
  },
  flatList: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#F8FAFB"
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  searchIcon: {
    marginRight: 10
  },
  clearBtn: {
    padding: 4
  },
  sortContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 15,
    marginBottom: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    gap: 6,
    minWidth: 70,
    justifyContent: "center",
  },

  sortBtnActive: { 
    backgroundColor: "#004643", 
    borderColor: "#004643",
  },
  sortText: { 
    fontSize: 13, 
    color: "#666", 
    fontWeight: "600" 
  },
  sortTextActive: { color: "#fff" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 5, paddingTop: 20, paddingBottom: 20 },
  pegawaiCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E6F0EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { color: "#004643", fontWeight: "bold", fontSize: 20 },
  pegawaiName: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  pegawaiEmail: { color: "#888", fontSize: 12, marginBottom: 2 },
  pegawaiNip: { color: "#666", fontSize: 12, marginBottom: 2 },
  pegawaiActions: { alignItems: "flex-end", justifyContent: "space-between" },
  moreBtn: { 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: "#F5F5F5",
    marginTop: 8
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: { fontSize: 10, fontWeight: "bold" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: { fontSize: 16, color: "#ccc", marginTop: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayTouchable: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#C4C4C4",
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  floatingAddBtn: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#004643",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 10,
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  pageBtnDisabled: {
    backgroundColor: "#F0F0F0",
  },
  pageNumbers: {
    flexDirection: "row",
    marginHorizontal: 15,
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  pageNumberActive: {
    backgroundColor: "#004643",
  },
  pageNumberText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  pageNumberTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
});
