import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface SkeletonLoaderProps {
  message?: string;
  type?: string;
  count?: number;
}

export default function SkeletonLoader({ 
  message = 'Memuat...' 
}: SkeletonLoaderProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#004643" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    fontWeight: '500',
  },
});