import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showStats?: boolean;
  statsText?: string;
  rightComponent?: React.ReactNode;
  fallbackRoute?: string;
}

export default function AppHeader({
  title,
  showBack = false,
  onBackPress,
  showStats = false,
  statsText,
  rightComponent,
  fallbackRoute
}: AppHeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push((fallbackRoute || '/(tabs)/beranda') as any);
      }
    }
  };

  return (
    <View style={styles.headerSection}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          {showBack && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={20} color="#004643" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        
        {showStats && statsText && (
          <View style={styles.headerStats}>
            <Text style={styles.statsText}>{statsText}</Text>
          </View>
        )}
        
        {rightComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerSection: {
    backgroundColor: "#fff",
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    padding: 10,
    marginRight: 15,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#004643",
  },
  headerStats: {
    backgroundColor: "#E6F0EF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statsText: { 
    fontSize: 12, 
    fontWeight: "bold", 
    color: "#004643" 
  },
});