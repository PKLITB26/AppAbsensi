import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PegawaiAPI } from '../constants/config';

export default function RefreshProfile() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const forceRefreshProfile = async () => {
    setLoading(true);
    try {
      // Get user data
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        Alert.alert('Error', 'No user data found');
        return;
      }

      const user = JSON.parse(userData);
      const userId = user.id_user || user.id || user.user_id;
      
      if (!userId) {
        Alert.alert('Error', 'No user ID found');
        return;
      }

      console.log('Force refreshing profile for user ID:', userId);
      
      // Call API directly
      const apiResult = await PegawaiAPI.getProfile(userId.toString());
      console.log('API Result:', apiResult);
      
      setResult(apiResult);
      
      if (apiResult.success) {
        // Update AsyncStorage
        const updatedUserData = {
          ...user,
          ...apiResult.data
        };
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        Alert.alert('Success', 'Profile data refreshed successfully!');
      } else {
        Alert.alert('Error', apiResult.message || 'Failed to refresh profile');
      }
      
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert('Error', 'Failed to refresh: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const clearAndRefresh = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      Alert.alert('Success', 'User data cleared. Please login again.');
    } catch (error) {
      Alert.alert('Error', 'Failed to clear data');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Refresh Tool</Text>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={forceRefreshProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Refreshing...' : 'Force Refresh Profile'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.dangerButton]} 
        onPress={clearAndRefresh}
      >
        <Text style={styles.buttonText}>Clear Data & Re-login</Text>
      </TouchableOpacity>
      
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Last API Result:</Text>
          <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
    </View>
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
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
});