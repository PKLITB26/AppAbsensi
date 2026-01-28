import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KelolaDinasAPI } from "../../constants/config";
import { AppHeader } from "../../components";

interface RiwayatDinas {
  id: number;
  namaKegiatan: string;
  nomorSpt: string;
  lokasi: string;
  jamKerja: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  status: "selesai" | "dibatalkan";
  pegawai: Array<{
    nama: string;
    status: "hadir" | "terlambat" | "tidak_hadir";
    jamAbsen?: string;
  }>;
}

export default function RiwayatDinasScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDateFilter, setSelectedDateFilter] = useState("semua");
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [riwayatDinas, setRiwayatDinas] = useState<RiwayatDinas[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRiwayatDinas();
  }, [currentPage, selectedDateFilter, searchQuery, selectedDate]);

  const fetchRiwayatDinas = async () => {
    try {
      setLoading(true);
      const params = {
        filter_date: selectedDateFilter,
        selected_date:
          selectedDateFilter === "tanggal_tertentu"
            ? selectedDate.toISOString().split("T")[0]
            : "",
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
      };

      console.log("Fetching riwayat dinas with params:", params);
      const response = await KelolaDinasAPI.getRiwayatDinas(params);

      if (response && response.data) {
        setRiwayatDinas(response.data);
        setTotalRecords(response.pagination?.total_records || 0);
        setTotalPages(response.pagination?.total_pages || 0);
      } else {
        console.warn("Invalid response format:", response);
        setRiwayatDinas([]);
        setTotalRecords(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching riwayat dinas:", error);
      setRiwayatDinas([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hadir":
        return "#4CAF50";
      case "terlambat":
        return "#FF9800";
      case "tidak_hadir":
        return "#F44336";
      default:
        return "#666";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "hadir":
        return "Hadir";
      case "terlambat":
        return "Terlambat";
      case "tidak_hadir":
        return "Tidak Hadir";
      default:
        return status;
    }
  };

  const getDinasStatusColor = (status: string) => {
    switch (status) {
      case "selesai":
        return "#4CAF50";
      case "dibatalkan":
        return "#F44336";
      default:
        return "#666";
    }
  };

  // Filter data based on selected date filter
  const getFilteredData = () => {
    let filtered = riwayatDinas;
    const today = new Date();

    switch (selectedDateFilter) {
      case "hari_ini":
        filtered = riwayatDinas.filter((item) => {
          const itemDate = new Date(item.tanggal_mulai);
          return itemDate.toDateString() === today.toDateString();
        });
        break;
      case "minggu_ini":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        filtered = riwayatDinas.filter((item) => {
          const itemDate = new Date(item.tanggal_mulai);
          return itemDate >= startOfWeek && itemDate <= endOfWeek;
        });
        break;
      case "bulan_ini":
        filtered = riwayatDinas.filter((item) => {
          const itemDate = new Date(item.tanggal_mulai);
          return (
            itemDate.getMonth() === today.getMonth() &&
            itemDate.getFullYear() === today.getFullYear()
          );
        });
        break;
      case "tanggal_tertentu":
        if (selectedDate) {
          filtered = riwayatDinas.filter((item) => {
            const itemDate = new Date(item.tanggal_mulai);
            return itemDate.toDateString() === selectedDate.toDateString();
          });
        }
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.namaKegiatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.nomorSpt.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  };

  const filteredData = riwayatDinas;
  const currentData = riwayatDinas;

  const renderCalendarModal = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate.toDateString() === date.toDateString();
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedDay,
            isToday && styles.todayDay,
          ]}
          onPress={() => {
            setSelectedDate(date);
            setSelectedDateFilter("tanggal_tertentu");
            setShowCalendar(false);
          }}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.selectedDayText,
              isToday && styles.todayDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>,
      );
    }

    return (
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={() =>
                  setSelectedDate(new Date(currentYear, currentMonth - 1, 1))
                }
              >
                <Ionicons name="chevron-back" size={24} color="#004643" />
              </TouchableOpacity>
              <Text style={styles.calendarTitle}>
                {selectedDate.toLocaleDateString("id-ID", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setSelectedDate(new Date(currentYear, currentMonth + 1, 1))
                }
              >
                <Ionicons name="chevron-forward" size={24} color="#004643" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day) => (
                <Text key={day} style={styles.weekDayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>{days}</View>

            <TouchableOpacity
              style={styles.closeCalendarBtn}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={styles.closeCalendarText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderRiwayatCard = ({ item }: { item: RiwayatDinas }) => {
    const hadirCount = item.pegawai.filter((p) => p.status === "hadir").length;
    const totalPegawai = item.pegawai.length;

    return (
      <View style={styles.dinasCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitle}>
            <Text style={styles.kegiatanName}>{item.namaKegiatan}</Text>
            <Text style={styles.sptNumber}>{item.nomorSpt}</Text>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getDinasStatusColor(item.status) + "20" },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getDinasStatusColor(item.status) },
                ]}
              >
                {item.status === "selesai" ? "Selesai" : "Dibatalkan"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.lokasi}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              {new Date(item.tanggal_mulai).toLocaleDateString("id-ID")} -{" "}
              {new Date(item.tanggal_selesai).toLocaleDateString("id-ID")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>{item.jamKerja}</Text>
          </View>
        </View>

        <View style={styles.statusSummary}>
          <Text style={styles.summaryText}>
            Kehadiran: {hadirCount}/{totalPegawai} Hadir
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(hadirCount / totalPegawai) * 100}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.pegawaiList}>
          {item.pegawai.map((pegawai, index) => (
            <View key={index} style={styles.pegawaiItem}>
              <View style={styles.pegawaiInfo}>
                <Text style={styles.pegawaiName}>{pegawai.nama}</Text>
                {pegawai.jamAbsen && (
                  <Text style={styles.jamAbsen}>({pegawai.jamAbsen})</Text>
                )}
              </View>
              <View
                style={[
                  styles.pegawaiStatusBadge,
                  { backgroundColor: getStatusColor(pegawai.status) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.pegawaiStatusText,
                    { color: getStatusColor(pegawai.status) },
                  ]}
                >
                  {getStatusLabel(pegawai.status)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <AppHeader 
        title="Riwayat Dinas"
        showBack={true}
        showStats={true}
        statsText={`${totalRecords} Riwayat`}
      />

      <View style={styles.contentContainer}>
        {/* Fixed Search and Sort */}
        <View style={styles.fixedControls}>
          {/* Search Container */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama kegiatan atau nomor SPT..."
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

          {/* Date Filter */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="calendar-outline" size={20} color="#004643" />
              <Text style={styles.filterTitle}>Filter Tanggal</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterChips}
            >
              {[
                { key: "semua", label: "Semua" },
                { key: "hari_ini", label: "Hari Ini" },
                { key: "minggu_ini", label: "Minggu Ini" },
                { key: "bulan_ini", label: "Bulan Ini" },
                { key: "tanggal_tertentu", label: "Pilih Tanggal" },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    selectedDateFilter === filter.key && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    if (filter.key === "tanggal_tertentu") {
                      setShowCalendar(true);
                    } else {
                      setSelectedDateFilter(filter.key);
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedDateFilter === filter.key &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {selectedDateFilter === "tanggal_tertentu" && (
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateText}>
                  Tanggal terpilih: {selectedDate.toLocaleDateString("id-ID")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Riwayat List */}
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderRiwayatCard}
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={() => fetchRiwayatDinas()}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {loading
                  ? "Memuat data..."
                  : "Tidak ada riwayat dinas ditemukan"}
              </Text>
            </View>
          )}
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
                            currentPage === page && styles.pageNumberTextActive,
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
        />
      </View>

      {renderCalendarModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFB" },
  contentContainer: {
    flex: 1,
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
    backgroundColor: "#F8FAFB",
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
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
  },
  clearBtn: {
    padding: 4
  },

  filterCard: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  filterChips: {
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    backgroundColor: "#004643",
    borderColor: "#004643",
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  selectedDateInfo: {
    backgroundColor: "#F0F8F7",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedDateText: {
    fontSize: 12,
    color: "#004643",
    fontWeight: "500",
  },
  resultSummary: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  resultText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },

  listContent: {
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dinasCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  cardTitle: { flex: 1 },
  headerRight: {
    alignItems: "flex-end",
  },
  kegiatanName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  sptNumber: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  cardInfo: { marginBottom: 15 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  statusSummary: { marginBottom: 15 },
  summaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: "#4CAF50",
    borderRadius: 3,
  },
  pegawaiList: { marginBottom: 10 },
  pegawaiItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  pegawaiInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pegawaiName: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  jamAbsen: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  pegawaiStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pegawaiStatusText: {
    fontSize: 10,
    fontWeight: "bold",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    marginTop: 10,
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

  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarModal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: "90%",
    maxWidth: 350,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
    textAlign: "center",
    width: 40,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  selectedDay: {
    backgroundColor: "#004643",
    borderRadius: 20,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: "#004643",
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: "#333",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "bold",
  },
  todayDayText: {
    color: "#004643",
    fontWeight: "bold",
  },
  closeCalendarBtn: {
    backgroundColor: "#004643",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  closeCalendarText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
