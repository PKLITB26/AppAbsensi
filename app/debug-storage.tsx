import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DebugStorage() {
  const [userData, setUserData] = useState<any>(null);
  const [allKeys, setAllKeys] = useState<string[]>([]);

  useEffect(() => {
    loadDebugData();
  }, []);

  const loadDebugData = async () => {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      setAllKeys(keys);
      
      // Get userData specifically
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const parsed = JSON.parse(userDataStr);
        setUserData(parsed);
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      alert('Storage cleared');
      loadDebugData();
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AsyncStorage Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={loadDebugData}>
        <Text style={styles.buttonText}>Refresh</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={clearStorage}>
        <Text style={styles.buttonText}>Clear Storage</Text>
      </TouchableOpacity>
      
      <Text style={styles.subtitle}>All Keys ({allKeys.length}):</Text>
      {allKeys.map((key, index) => (
        <Text key={index} style={styles.key}>- {key}</Text>
      ))}
      
      <Text style={styles.subtitle}>User Data:</Text>
      {userData ? (
        <View style={styles.dataContainer}>
          <Text style={styles.dataText}>{JSON.stringify(userData, null, 2)}</Text>
        </View>
      ) : (
        <Text style={styles.noData}>No userData found</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  key: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  dataContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  noData: {
    fontStyle: 'italic',
    color: '#666',
  },
});