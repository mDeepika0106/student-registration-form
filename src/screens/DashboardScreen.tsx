
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DashboardScreenProps } from '../types';

const DashboardScreen = ({ navigation }: DashboardScreenProps) => {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        setUserRole(role ?? '');
      } catch (error) {
        console.error('Error loading user role:', error);
      }
    };

    loadUserRole();
  }, []);

  const handleLogout = (): void => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('authToken');
            await AsyncStorage.removeItem('username');
            await AsyncStorage.removeItem('userRole');

            navigation.replace('Login');
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert(
              'Error',
              'Unable to logout. Please try again.',
            );
          }
        },
      },
    ]);
  };

  const menuItems = [
    ...(userRole === 'Admin' ||
    userRole === 'Manager' ||
    userRole === 'Staff'
      ? [
          {
            title: 'Add Student',
            description: 'Enter a new student’s details',
            action: () => navigation.navigate('AddStudent'),
          },
        ]
      : []),

    {
      title: 'View Students',
      description: 'Search and view student records',
      action: () => navigation.navigate('StudentList'),
    },

    ...(userRole === 'Admin'
      ? [
          {
            title: 'Create User Account',
            description: 'Create an account for a user',
            action: () => navigation.navigate('CreateUser'),
          },
        ]
      : []),

    {
      title: 'Change Password',
      description: 'Update your password',
      action: () => navigation.navigate('ChangePassword'),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Student Registration</Text>
        <Text style={styles.subtitle}>
          Welcome to your dashboard
        </Text>

        <View style={styles.roleContainer}>
          <Text style={styles.roleLabel}>Your Role: </Text>
          <Text style={styles.roleValue}>
            {userRole || 'Loading...'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Dashboard Menu</Text>

      {menuItems.map((item) => (
        <Pressable
          key={item.title}
          style={({ pressed }) => [
            styles.menuCard,
            pressed && styles.menuCardPressed,
          ]}
          onPress={item.action}
        >
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuDescription}>
              {item.description}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>
      ))}

      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#2563EB',
    padding: 24,
    borderRadius: 16,
    marginBottom: 28,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#DBEAFE',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  roleLabel: {
    fontSize: 13,
    color: '#374151',
  },
  roleValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 14,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuCardPressed: {
    opacity: 0.7,
  },
  menuTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  menuTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  menuDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  arrow: {
    fontSize: 30,
    color: '#2563EB',
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

