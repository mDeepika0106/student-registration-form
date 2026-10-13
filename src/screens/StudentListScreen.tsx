
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Student, StudentListScreenProps } from '../types';
import { API_BASE_URL } from '../api/apiConfig';

const StudentListScreen = ({ navigation }: StudentListScreenProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState('');

  const fetchStudents = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole');

      setUserRole(role ?? '');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/Student`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || `Unable to fetch students (${response.status}).`,
        );
      }

      const data: Student[] = await response.json();
      setStudents(data);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchStudents();
    }, [fetchStudents]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents(false);
  };

  const handleDelete = (student: Student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');

              if (!token) {
                Alert.alert('Session expired', 'Please log in again.');
                navigation.replace('Login');
                return;
              }

              const response = await fetch(
                `${API_BASE_URL}/Student/${student.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              if (response.status === 401) {
                Alert.alert('Session expired', 'Please log in again.');
                navigation.replace('Login');
                return;
              }

              if (response.status === 403) {
                Alert.alert(
                  'Permission denied',
                  'Only Admin users can delete students.',
                );
                return;
              }

              if (!response.ok) {
                const message = await response.text();
                throw new Error(
                  message || `Delete failed (${response.status}).`,
                );
              }

              setStudents(current =>
                current.filter(item => String(item.id) !== String(student.id)),
              );

              Alert.alert('Success', 'Student deleted successfully.');
            } catch (error) {
              Alert.alert(
                'Error',
                error instanceof Error
                  ? error.message
                  : 'Unable to delete the student.',
              );
            }
          },
        },
      ],
    );
  };

  const handleEdit = (student: Student) => {
    navigation.navigate('EditStudent', {
      student,
      onSave: updatedStudent => {
        setStudents(current =>
          current.map(item =>
            String(item.id) === String(updatedStudent.id)
              ? updatedStudent
              : item,
          ),
        );
      },
    });
  };

  const filteredStudents = students.filter(student => {
    const query = search.trim().toLowerCase();

    return (
      student.name?.toLowerCase().includes(query) ||
      student.email?.toLowerCase().includes(query) ||
      student.course?.toLowerCase().includes(query)
    );
  });

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.card}>
      <Text style={styles.studentName}>{item.name}</Text>

      <Text style={styles.detail}>ID: {item.id}</Text>
      <Text style={styles.detail}>Email: {item.email}</Text>
      <Text style={styles.detail}>Mobile: {item.mobileNumber}</Text>
      <Text style={styles.detail}>Place: {item.place}</Text>
      <Text style={styles.detail}>Age: {item.age}</Text>
      <Text style={styles.detail}>Gender: {item.gender}</Text>
      <Text style={styles.detail}>Course: {item.course}</Text>
      <Text style={styles.detail}>College: {item.college}</Text>
      <Text style={styles.detail}>Address: {item.address}</Text>

      {(userRole === 'Admin' || userRole === 'Manager') && (
        <Pressable
          style={styles.editButton}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.buttonText}>Edit</Text>
        </Pressable>
      )}

      {userRole === 'Admin' && (
        <Pressable
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student List</Text>
      <Text style={styles.subtitle}>
        Total students: {students.length}
      </Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search by name, email, or course"
        placeholderTextColor="#777777"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredStudents}
        keyExtractor={item => String(item.id)}
        renderItem={renderStudent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1E3A8A']}
          />
        }
        contentContainerStyle={
          filteredStudents.length === 0 ? styles.emptyContainer : styles.list
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {search.trim()
              ? 'No students match your search.'
              : 'No students found in the database.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#555555',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginTop: 6,
    marginBottom: 16,
  },
  searchInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    color: '#222222',
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E0E5EF',
  },
  studentName: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 10,
  },
  detail: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 5,
  },
  editButton: {
    backgroundColor: '#1E3A8A',
    padding: 12,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButton: {
    backgroundColor: '#B91C1C',
    padding: 12,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default StudentListScreen;

