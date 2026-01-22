import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function TestLogin() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [rawData, setRawData] = useState<string>('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      console.log('Raw userData string:', userDataStr);
      setRawData(userDataStr || 'No data');
      
      if (userDataStr) {
        const parsed = JSON.parse(userDataStr);
        console.log('Parsed userData:', parsed);
        setUserData(parsed);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data: ' + error);
    }
  };

  const testProfileAccess = () => {
    if (!userData) {
      Alert.alert('Error', 'No user data found');
      return;
    }

    const userId = userData.id_user || userData.id || userData.user_id;
    console.log('Testing with user ID:', userId);
    
    if (!userId) {
      Alert.alert('Error', 'No valid user ID found in data');
      return;
    }

    Alert.alert('Success', `User ID found: ${userId}\nType: ${typeof userId}`);
  };

  const clearData = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      setUserData(null);
      setRawData('');
      Alert.alert('Success', 'User data cleared');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  const goToProfile = () => {
    router.push('/(tabs)/profil');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Login Data Test</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={loadUserData}>
          <Text style={styles.buttonText}>Reload Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testProfileAccess}>
          <Text style={styles.buttonText}>Test Profile Access</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={goToProfile}>
          <Text style={styles.buttonText}>Go to Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearData}>
          <Text style={styles.buttonText}>Clear Data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Raw Data:</Text>
      <View style={styles.dataContainer}>
        <Text style={styles.rawText}>{rawData}</Text>
      </View>

      <Text style={styles.subtitle}>Parsed Data:</Text>
      {userData ? (
        <View style={styles.dataContainer}>
          <Text style={styles.label}>ID User: {userData.id_user || 'NOT FOUND'}</Text>
          <Text style={styles.label}>ID: {userData.id || 'NOT FOUND'}</Text>
          <Text style={styles.label}>User ID: {userData.user_id || 'NOT FOUND'}</Text>
          <Text style={styles.label}>Email: {userData.email || 'NOT FOUND'}</Text>
          <Text style={styles.label}>Role: {userData.role || 'NOT FOUND'}</Text>
          <Text style={styles.label}>Nama: {userData.nama_lengkap || userData.nama || 'NOT FOUND'}</Text>
          <Text style={styles.label}>Jabatan: {userData.jabatan || 'NOT FOUND'}</Text>
          
          <Text style={styles.subtitle}>All Keys:</Text>
          {Object.keys(userData).map((key, index) => (
            <Text key={index} style={styles.keyText}>
              {key}: {typeof userData[key]} = {JSON.stringify(userData[key])}
            </Text>
          ))}
        </View>
      ) : (
        <Text style={styles.noData}>No user data found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dataContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  rawText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  keyText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
    marginBottom: 4,
  },
  noData: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});