import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  count: number;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  color: string;
  actionUrl: string;
  time: string;
}

export default function NotifikasiAdmin() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Dummy data sementara
      const dummyData = [
        {
          id: 1,
          type: 'approval',
          title: 'Persetujuan Cuti',
          message: '3 pengajuan cuti menunggu persetujuan',
          count: 3,
          priority: 'high' as const,
          icon: 'checkbox-outline',
          color: '#FF6B6B',
          actionUrl: '/approval-admin',
          time: '2 menit yang lalu'
        }
      ];
      setNotifications(dummyData);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    router.push(notification.actionUrl as any);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFA726';
      case 'low': return '#66BB6A';
      default: return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="notifications" size={24} color="#fff" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Notifikasi</Text>
        </View>
        <TouchableOpacity style={styles.markAllBtn}>
          <Ionicons name="checkmark-done" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadNotifications} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>Tidak ada notifikasi</Text>
          </View>
        ) : (
          <View style={styles.notificationList}>
            {notifications.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={styles.notificationCard}
                onPress={() => handleNotificationPress(notif)}
              >
                <View style={[styles.iconContainer, { backgroundColor: notif.color + '20' }]}>
                  <Ionicons name={notif.icon as any} size={24} color={notif.color} />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{notif.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(notif.priority) }]}>
                      <Text style={styles.priorityText}>{notif.priority.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.notificationMessage}>{notif.message}</Text>
                  <Text style={styles.notificationTime}>{notif.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFB' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#004643',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  headerIcon: { marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  markAllBtn: { padding: 8 },
  placeholder: { width: 40 },
  notificationList: { padding: 20, paddingTop: 120 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1 },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: { fontSize: 8, fontWeight: 'bold', color: '#fff' },
  notificationMessage: { fontSize: 14, color: '#666', marginBottom: 4 },
  notificationTime: { fontSize: 12, color: '#999' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: { fontSize: 14, color: '#999', marginTop: 10 },
});
