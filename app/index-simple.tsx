import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SimpleIndex() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HadirinApp</Text>
      <Text style={styles.subtitle}>Pilih Mode:</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/(tabs)/beranda')}
      >
        <Text style={styles.buttonText}>Mode User</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => router.push('/admin/dashboard-admin' as any)}
      >
        <Text style={styles.buttonText}>Mode Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#004643',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#666',
  },
  button: {
    backgroundColor: '#004643',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});