import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  type?: 'list' | 'stats' | 'form' | 'simple';
  count?: number;
  message?: string;
}

export default function SkeletonLoader({ 
  type = 'simple',
  count = 3,
  message = 'Memuat...' 
}: SkeletonLoaderProps) {
  
  const renderSkeletonCards = () => {
    switch (type) {
      case 'list':
        return Array.from({ length: count }, (_, index) => (
          <View key={index} style={styles.listCard}>
            <View style={styles.avatar} />
            <View style={styles.listContent}>
              <View style={[styles.line, { width: '70%' }]} />
              <View style={[styles.line, { width: '50%', height: 12 }]} />
            </View>
          </View>
        ));
      
      case 'stats':
        return (
          <View style={styles.statsRow}>
            {Array.from({ length: 4 }, (_, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIcon} />
                <View style={[styles.line, { width: '60%', height: 16 }]} />
                <View style={[styles.line, { width: '40%', height: 12 }]} />
              </View>
            ))}
          </View>
        );
      
      case 'form':
        return Array.from({ length: count }, (_, index) => (
          <View key={index} style={styles.formCard}>
            <View style={[styles.line, { width: '40%', height: 14 }]} />
            <View style={styles.input} />
          </View>
        ));
      
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ActivityIndicator size="large" color="#004643" />
        <Text style={styles.text}>{message}</Text>
      </View>
      
      {type !== 'simple' && (
        <View style={styles.skeletonContent}>
          {renderSkeletonCards()}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
  skeletonContent: {
    paddingHorizontal: 20,
  },
  
  // List skeleton
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  line: {
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  
  // Stats skeleton
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    marginBottom: 8,
  },
  
  // Form skeleton
  formCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    height: 48,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 8,
  },
});