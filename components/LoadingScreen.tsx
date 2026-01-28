import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={['#F8FAFB', '#E8F4F8', '#F0F9FF']}
      style={styles.container}
    >
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#004643" />
        <Text style={styles.text}>Memuat...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#004643',
    fontWeight: '500',
  },
});