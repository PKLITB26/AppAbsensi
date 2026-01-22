import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from 'react-native-calendars';
import { API_CONFIG, getApiUrl, PengaturanAPI } from "../../constants/config";

interface JamKerjaHari {
  hari: string;
  is_kerja: boolean;
}

interface HariLibur {
  id: number;
  tanggal: string;
  nama_libur: string;
  jenis: string;
}

interface PresensiData {
  id_presensi: number;
  nama_lengkap: string;
  nip: string;
  tanggal: string;
  jam_masuk: string;
  lat_absen: number;
  long_absen: number;
  foto_selfie?: string;
  status: string;
  alasan_luar_lokasi?: string;
}

export default function TrackingAdminScreen() {
  const router = useRouter();
  const [presensiData, setPresensiData] = useState<PresensiData[]>([]);
  const [filteredData, setFilteredData] = useState<PresensiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPresensi, setSelectedPresensi] = useState<PresensiData | null>(
    null,
  );
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<{ [key: string]: number }>(
    {},
  );
  const [hariLibur, setHariLibur] = useState<HariLibur[]>([]);
  const [jamKerja, setJamKerja] = useState<JamKerjaHari[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const statusOptions = [
    "Hadir",
    "Terlambat",
    "Dinas Luar/ Perjalanan Dinas",
    "Izin",
    "Sakit",
    "Cuti",
    "Pulang Cepat",
    "Mangkir/ Alpha",
  ];

  useFocusEffect(
    useCallback(() => {
      fetchHariLibur();
      fetchJamKerja();
    }, []),
  );

  useEffect(() => {
    fetchPresensiData();
    fetchHariLibur();
    fetchJamKerja();
  }, [selectedDate]);

  useEffect(() => {
    filterData();
  }, [presensiData, selectedStatus, searchText]);

  const fetchPresensiData = async () => {
    try {
      const response = await fetch(
        `${getApiUrl(API_CONFIG.ENDPOINTS.TRACKING)}?tanggal=${selectedDate}`,
      );
      const result = await response.json();

      if (result.success) {
        setPresensiData(result.data);
      }
    } catch (error) {
      console.log("Error fetching data:", error);
      // Fallback data
      setPresensiData([
        {
          id_presensi: 1,
          nama_lengkap: "John Doe",
          nip: "123456",
          tanggal: selectedDate,
          jam_masuk: "08:00:00",
          lat_absen: -6.8915,
          long_absen: 107.6107,
          status: "Hadir",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHariLibur = async () => {
    try {
      console.log("=== FETCHING HARI LIBUR ===");
      const response = await PengaturanAPI.getHariLibur();
      console.log("Response:", JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        console.log("Jumlah hari libur:", response.data.length);
        response.data.forEach((item: any) => {
          console.log(`- ${item.tanggal}: ${item.nama_libur}`);
        });
        setHariLibur(response.data);
      } else {
        console.log("Response tidak success atau data kosong");
      }
    } catch (error) {
      console.log("Error fetching hari libur:", error);
    }
  };



  const fetchJamKerja = async () => {
    try {
      const response = await PengaturanAPI.getJamKerja();
      if (response.success && response.data) {
        setJamKerja(response.data);
      }
    } catch (error) {
      console.log("Error fetching jam kerja:", error);
    }
  };

  const isWeekend = (dateString: string) => {
    if (jamKerja.length === 0) return false;
    const date = new Date(dateString);
    const dayIndex = date.getDay();
    const hariMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const namaHari = hariMap[dayIndex];
    const jamKerjaHari = jamKerja.find(jk => jk.hari === namaHari);
    return jamKerjaHari ? !jamKerjaHari.is_kerja : false;
  };

  const generateWeekendDates = (year: number, month: number) => {
    const weekendDates: any = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const testDate = new Date(year, month, day);
      const dateString = testDate.toISOString().split('T')[0];
      if (isWeekend(dateString)) {
        weekendDates[dateString] = {
          marked: true,
          dotColor: '#F44336',
          textColor: '#F44336'
        };
      }
    }
    return weekendDates;
  };

  const filterData = () => {
    let filtered = presensiData;

    if (selectedStatus.length > 0) {
      filtered = filtered.filter((item) =>
        selectedStatus.includes(item.status),
      );
    }

    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.nama_lengkap.toLowerCase().includes(searchText.toLowerCase()) ||
          item.nip.includes(searchText),
      );
    }

    setFilteredData(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hadir":
        return "#4CAF50";
      case "Terlambat":
        return "#FF9800";
      case "Dinas Luar/ Perjalanan Dinas":
        return "#2196F3";
      case "Izin":
        return "#9C27B0";
      case "Sakit":
        return "#F44336";
      case "Cuti":
        return "#607D8B";
      case "Pulang Cepat":
        return "#FF5722";
      case "Mangkir/ Alpha":
        return "#424242";
      default:
        return "#666";
    }
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const toggleStatusFilter = (status: string) => {
    setSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const getStats = () => {
    const total = filteredData.length;
    const hadir = filteredData.filter((p) => p.status === "Hadir").length;
    const terlambat = filteredData.filter(
      (p) => p.status === "Terlambat",
    ).length;
    const dinasLuar = filteredData.filter(
      (p) => p.status === "Dinas Luar/ Perjalanan Dinas",
    ).length;

    return { total, hadir, terlambat, dinasLuar };
  };

  const formatDateShort = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };





  const isHoliday = (dateString: string) => {
    const result = hariLibur.some((h) => h.tanggal === dateString);
    if (result) {
      console.log(`${dateString} adalah hari libur`);
    }
    return result;
  };

  const getHolidayInfo = (dateString: string) => {
    return hariLibur.find((h) => h.tanggal === dateString);
  };



  const renderHeader = () => (
    <View style={styles.stickyHeader}>
      {/* Date Selector */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateLabel}>
          Tanggal: {formatDateShort(selectedDate)}
        </Text>
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => setShowCalendarModal(true)}
        >
          <Ionicons name="calendar-outline" size={16} color="#004643" />
          <Text style={styles.calendarBtnText}>Pilih Tanggal</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{getStats().total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#4CAF50" }]}>
            {getStats().hadir}
          </Text>
          <Text style={styles.statLabel}>Hadir</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#FF9800" }]}>
            {getStats().terlambat}
          </Text>
          <Text style={styles.statLabel}>Terlambat</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: "#2196F3" }]}>
            {getStats().dinasLuar}
          </Text>
          <Text style={styles.statLabel}>Dinas</Text>
        </View>
      </View>

      {/* Alert Section */}
      {getStats().total > 0 && (
        <View style={styles.alertContainer}>
          {filteredData.filter((p) => {
            const distance = calculateDistance(
              p.lat_absen,
              p.long_absen,
              -6.8915,
              107.6107,
            );
            return distance > 500;
          }).length > 0 && (
            <TouchableOpacity
              style={styles.alertCard}
              onPress={() =>
                Alert.alert(
                  "Peringatan Lokasi",
                  `${
                    filteredData.filter((p) => {
                      const distance = calculateDistance(
                        p.lat_absen,
                        p.long_absen,
                        -6.8915,
                        107.6107,
                      );
                      return distance > 500;
                    }).length
                  } pegawai absen dari lokasi >500m dari kantor`,
                )
              }
            >
              <Ionicons name="warning" size={20} color="#FF9800" />
              <Text style={styles.alertText}>
                {
                  filteredData.filter((p) => {
                    const distance = calculateDistance(
                      p.lat_absen,
                      p.long_absen,
                      -6.8915,
                      107.6107,
                    );
                    return distance > 500;
                  }).length
                }{" "}
                lokasi mencurigakan
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filters */}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama atau NIP..."
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowStatusFilter(!showStatusFilter)}
        >
          <Ionicons name="filter" size={20} color="#004643" />
        </TouchableOpacity>
      </View>

      {showStatusFilter && (
        <View style={styles.statusFilterContainer}>
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.statusFilterChip,
                selectedStatus.includes(status) &&
                  styles.statusFilterChipActive,
              ]}
              onPress={() => toggleStatusFilter(status)}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  selectedStatus.includes(status) &&
                    styles.statusFilterTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderPresensiItem = ({ item }: { item: PresensiData }) => {
    const distance = calculateDistance(
      item.lat_absen,
      item.long_absen,
      -6.8915,
      107.6107,
    );

    return (
      <TouchableOpacity
        style={styles.presensiCard}
        onPress={() => {
          setSelectedPresensi(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.nama_lengkap?.charAt(0) || "P"}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{item.nama_lengkap}</Text>
              <Text style={styles.userNip}>NIP: {item.nip}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.infoText}>Jam Masuk: {item.jam_masuk}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text
              style={[
                styles.infoText,
                distance > 500 && { color: "#F44336", fontWeight: "bold" },
              ]}
            >
              Jarak: {distance}m dari kantor {distance > 500 ? "⚠️" : ""}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={16} color="#666" />
            <Text style={styles.infoText}>
              Koordinat: {item.lat_absen.toFixed(4)},{" "}
              {item.long_absen.toFixed(4)}
            </Text>
          </View>

          {item.alasan_luar_lokasi && (
            <View style={styles.infoRow}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#FF9800"
              />
              <Text style={styles.infoText}>
                Alasan: {item.alasan_luar_lokasi}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item?.id_presensi?.toString() || index.toString()}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        renderItem={renderPresensiItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              fetchPresensiData();
              fetchHariLibur();
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>Belum ada data presensi</Text>
          </View>
        }
      />

      {/* Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Lokasi Presensi</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedPresensi && (
              <View style={styles.modalBody}>
                <Text style={styles.modalUserName}>
                  {selectedPresensi.nama_lengkap}
                </Text>
                <Text style={styles.modalUserNip}>
                  NIP: {selectedPresensi.nip}
                </Text>

                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>
                    Informasi Presensi
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Tanggal: {selectedPresensi.tanggal}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Jam Masuk: {selectedPresensi.jam_masuk}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Status: {selectedPresensi.status}
                  </Text>
                </View>

                <View style={styles.modalInfoSection}>
                  <Text style={styles.modalSectionTitle}>Lokasi GPS</Text>
                  <Text style={styles.modalInfoText}>
                    Latitude: {selectedPresensi.lat_absen}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Longitude: {selectedPresensi.long_absen}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    Jarak dari kantor:{" "}
                    {calculateDistance(
                      selectedPresensi.lat_absen,
                      selectedPresensi.long_absen,
                      -6.8915,
                      107.6107,
                    )}
                    m
                  </Text>
                  {calculateDistance(
                    selectedPresensi.lat_absen,
                    selectedPresensi.long_absen,
                    -6.8915,
                    107.6107,
                  ) > 500 && (
                    <View style={styles.warningBox}>
                      <Ionicons name="warning" size={16} color="#FF9800" />
                      <Text style={styles.warningText}>
                        Lokasi di luar radius normal (500m)
                      </Text>
                    </View>
                  )}
                </View>

                {selectedPresensi.alasan_luar_lokasi && (
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalSectionTitle}>
                      Alasan Luar Lokasi
                    </Text>
                    <Text style={styles.modalInfoText}>
                      {selectedPresensi.alasan_luar_lokasi}
                    </Text>
                  </View>
                )}

                {selectedPresensi.foto_selfie && (
                  <View style={styles.modalInfoSection}>
                    <Text style={styles.modalSectionTitle}>Foto Selfie</Text>
                    <Image
                      source={{ uri: selectedPresensi.foto_selfie }}
                      style={styles.modalPhoto}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Calendar Modal */}
      {showCalendarModal && (
        <Modal visible={showCalendarModal} transparent>
          <View style={styles.calendarModalOverlay}>
            <View style={styles.calendarModalContainer}>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarTitle}>Pilih Tanggal</Text>
                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setShowCalendarModal(false);
                }}
                onMonthChange={(month) => {
                  setCurrentCalendarDate(new Date(month.year, month.month - 1, 1));
                }}
                markedDates={{
                  [selectedDate]: {
                    selected: true,
                    selectedColor: '#004643'
                  },
                  ...hariLibur.reduce((acc, holiday) => {
                    acc[holiday.tanggal] = {
                      ...acc[holiday.tanggal],
                      marked: true,
                      dotColor: '#F44336',
                      textColor: '#F44336'
                    };
                    return acc;
                  }, {} as any),
                  ...generateWeekendDates(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth())
                }}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#004643',
                  selectedDayBackgroundColor: '#004643',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#004643',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#F44336',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#004643',
                  disabledArrowColor: '#d9e1e8',
                  monthTextColor: '#004643',
                  indicatorColor: '#004643',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontWeight: '400',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: 16,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 14
                }}
              />
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFB" },
  stickyHeader: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    elevation: 2,
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#004643",
  },
  calendarBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E6F0EF",
    borderWidth: 1,
    borderColor: "#004643",
    gap: 4,
  },
  calendarBtnText: {
    fontSize: 12,
    color: "#004643",
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#004643",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  alertContainer: {
    marginBottom: 15,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    gap: 8,
  },
  alertText: {
    fontSize: 12,
    color: "#F57C00",
    fontWeight: "600",
    flex: 1,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterBtn: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statusFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  statusFilterChip: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  statusFilterChipActive: {
    backgroundColor: "#004643",
    borderColor: "#004643",
  },
  statusFilterText: {
    fontSize: 12,
    color: "#666",
  },
  statusFilterTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingBottom: 30,
  },
  presensiCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 15,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6F0EF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#004643",
    fontWeight: "bold",
    fontSize: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
  },
  userNip: {
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
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#ccc",
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    flex: 1,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  modalUserNip: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  modalInfoSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#004643",
    marginBottom: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  modalPhoto: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "cover",
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: "#F57C00",
    fontWeight: "600",
    flex: 1,
  },
  calendarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  calendarModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
});
