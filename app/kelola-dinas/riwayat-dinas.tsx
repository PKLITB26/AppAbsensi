import React, { useState, useEffect } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { KelolaDinasAPI } from "../../constants/config";
import { AppHeader } from "../../components";
import CustomCalendar from "../../components/CustomCalendar";

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
  const [selectedDateFilter, setSelectedDateFilter] = useState("hari_ini");
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dateSelectionStep, setDateSelectionStep] = useState<'start' | 'end'>('start');
  const [riwayatDinas, setRiwayatDinas] = useState<RiwayatDinas[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRiwayatDinas();
  }, [currentPage, selectedDateFilter, searchQuery, dateRange]);

  const fetchRiwayatDinas = async () => {
    try {
      setLoading(true);
      const params = {
        filter_date: selectedDateFilter,
        start_date: selectedDateFilter === 'pilih_tanggal' ? dateRange.start : '',
        end_date: selectedDateFilter === 'pilih_tanggal' ? dateRange.end : '',
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
      };

      console.log("Fetching riwayat dinas with params:", params);
      const response = await KelolaDinasAPI.getRiwayatDinas();

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
      case "pilih_tanggal":
        if (dateRange.start && dateRange.end) {
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          filtered = riwayatDinas.filter((item) => {
            const itemDate = new Date(item.tanggal_mulai);
            return itemDate >= startDate && itemDate <= endDate;
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

  const filteredData = getFilteredData();
  const currentData = filteredData;

      <Modal 
        visible={showDateRangePicker} 
        transparent
        animationType="none"
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenModal}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowDateRangePicker(false)}
          />
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {dateSelectionStep === 'start' ? 'Pilih Tanggal Mulai' : 'Pilih Tanggal Selesai'}
              </Text>
              <TouchableOpacity onPress={() => setShowDateRangePicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <CustomCalendar
              events={[]}
              onDatePress={(date) => {
                const dateString = date.toISOString().split('T')[0];
                if (dateSelectionStep === 'start') {
                  setDateRange({...dateRange, start: dateString});
                  setDateSelectionStep('end');
                } else {
                  setDateRange({...dateRange, end: dateString});
                  setSelectedDateFilter('pilih_tanggal');
                  setShowDateRangePicker(false);
                  setDateSelectionStep('start');
                }
              }}
            />
          </View>
        </View>
      </Modal>

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
    <View style={styles.container}>
      <StatusBar style="dark" translucent={true} backgroundColor="transparent" />

      {/* HEADER */}
      <AppHeader 
        title="Riwayat Dinas"
        showBack={true}
        showStats={true}
        statsText={`${totalRecords} Riwayat`}
        fallbackRoute="/kelola-dinas"
      />

      <View style={styles.contentContainer}>
        {/* Fixed Search and Sort */}
        <View style={styles.fixedControls}>
          {/* Search Container */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search-outline" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama kegiatan atau nomor SPT..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#999"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Date Filter */}
          <View style={styles.filterCard}>
            <View style={styles.filterHeader}>
              <Ionicons name="calendar-outline" size={20} color="#004643" />
              <Text style={styles.filterTitle}>Filter Periode</Text>
            </View>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
              {[
                { key: 'hari_ini', label: 'Hari Ini' },
                { key: 'minggu_ini', label: 'Minggu Ini' },
                { key: 'bulan_ini', label: 'Bulan Ini' },
                { key: 'pilih_tanggal', label: 'Pilih Tanggal' }
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    selectedDateFilter === filter.key && styles.filterChipActive
                  ]}
                  onPress={() => {
                    if (filter.key === 'pilih_tanggal') {
                      setShowStartDatePicker(true);
                    } else {
                      setSelectedDateFilter(filter.key);
                      setDateRange({ start: '', end: '' });
                    }
                  }}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedDateFilter === filter.key && styles.filterChipTextActive
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedDateFilter === 'pilih_tanggal' && dateRange.start && dateRange.end && (
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateText}>
                  Periode: {new Date(dateRange.start).toLocaleDateString('id-ID')} - {new Date(dateRange.end).toLocaleDateString('id-ID')}
                </Text>
              </View>
            )}

            <View style={styles.resultSummary}>
              <Text style={styles.resultText}>
                Menampilkan {filteredData.length} riwayat dinas
              </Text>
            </View>
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
        />
      </View>

      <Modal 
        visible={showDateRangePicker} 
        transparent
        animationType="none"
        statusBarTranslucent={true}
      >
        <View style={styles.fullScreenModal}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowDateRangePicker(false)}
          />
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                {dateSelectionStep === 'start' ? 'Pilih Tanggal Mulai' : 'Pilih Tanggal Selesai'}
              </Text>
              <TouchableOpacity onPress={() => setShowDateRangePicker(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <CustomCalendar
              events={[]}
              onDatePress={(date) => {
                const dateString = date.toISOString().split('T')[0];
                if (dateSelectionStep === 'start') {
                  setDateRange({...dateRange, start: dateString});
                  setDateSelectionStep('end');
                } else {
                  setDateRange({...dateRange, end: dateString});
                  setSelectedDateFilter('pilih_tanggal');
                  setShowDateRangePicker(false);
                  setDateSelectionStep('start');
                }
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#F8FAFB'
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    gap: 10
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12
  },
  filterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 16,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8
  },
  filterChips: {
    marginBottom: 10
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  filterChipActive: {
    backgroundColor: '#004643',
    borderColor: '#004643'
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  filterChipTextActive: {
    color: '#fff'
  },
  selectedDateInfo: {
    backgroundColor: '#F0F8F7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10
  },
  selectedDateText: {
    fontSize: 12,
    color: '#004643',
    fontWeight: '500'
  },
  resultSummary: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  dinasCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
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

  // Calendar Modal Styles
  fullScreenModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  calendarModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dateRangeModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004643'
  },
  dateInputs: {
    marginBottom: 20
  },
  dateInputGroup: {
    marginBottom: 15
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  dateInputText: {
    fontSize: 14,
    color: '#333'
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center'
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#004643',
    alignItems: 'center'
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
});