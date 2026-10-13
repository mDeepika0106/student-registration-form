import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../api/apiConfig';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateUser'>;

const roles = ['Admin', 'Manager', 'Staff', 'Viewer'];

const CreateUserScreen = ({ navigation }: Props) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Validation', 'Please fill in all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Validation', 'Enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Validation',
        'Password must contain at least 6 characters.',
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');
      const currentRole = await AsyncStorage.getItem('userRole');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }

      if (currentRole?.toLowerCase() !== 'admin') {
        Alert.alert(
          'Access denied',
          'Only Admin users can create accounts.',
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/User`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          role,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }

      if (response.status === 403) {
        Alert.alert(
          'Access denied',
          'Only Admin users can create accounts.',
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.message || `Account creation failed (${response.status}).`,
        );
      }

      Alert.alert(
        'Success',
        `Account created successfully for ${username.trim()}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Unable to connect to the server.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Create User Account</Text>
      <Text style={styles.subtitle}>
        Create login credentials and assign a role.
      </Text>

      <Text style={styles.label}>Username *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        placeholderTextColor="#888"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        editable={!loading}
      />

      <Text style={styles.label}>Email *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email address"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <Text style={styles.label}>Password *</Text>
      <TextInput
        style={styles.input}
        placeholder="Minimum 6 characters"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <Text style={styles.label}>Confirm Password *</Text>
      <TextInput
        style={styles.input}
        placeholder="Re-enter password"
        placeholderTextColor="#888"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      <Text style={styles.label}>Select Role *</Text>
      <View style={styles.roleContainer}>
        {roles.map(item => (
          <Pressable
            key={item}
            disabled={loading}
            style={[
              styles.roleButton,
              role === item && styles.selectedRole,
            ]}
            onPress={() => setRole(item)}
          >
            <Text
              style={[
                styles.roleText,
                role === item && styles.selectedRoleText,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.submitButton, loading && styles.disabled]}
        onPress={handleCreateUser}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitText}>Create Account</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#246BCE',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 7,
  },
  input: {
    height: 49,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D7E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#222',
    marginBottom: 17,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: '#246BCE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
  },
  selectedRole: {
    backgroundColor: '#246BCE',
  },
  roleText: {
    color: '#246BCE',
    fontWeight: '600',
  },
  selectedRoleText: {
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#246BCE',
    minHeight: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreateUserScreen;