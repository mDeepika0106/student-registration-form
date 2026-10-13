import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ChangePasswordScreenProps } from '../types';

const ChangePasswordScreen = ({
  navigation,
}: ChangePasswordScreenProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChangePassword = (): void => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        'Weak Password',
        'Your new password must contain at least 8 characters.',
      );
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(
        'Invalid Password',
        'Your new password must differ from your current password.',
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        'Password Mismatch',
        'The new password and confirmation do not match.',
      );
      return;
    }

    Alert.alert(
      'Validation Successful',
      'The password fields are valid. Backend integration is still required to change your password.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Change Password</Text>

        <Text style={styles.description}>
          Enter your existing password and choose a new one.
        </Text>

        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter current password"
          placeholderTextColor="#888"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
        />

        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter new password"
          placeholderTextColor="#888"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Confirm New Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Re-enter new password"
          placeholderTextColor="#888"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPasswords}
          autoCapitalize="none"
        />

        <Pressable
          style={styles.showPassword}
          onPress={() => setShowPasswords(previous => !previous)}
        >
          <Text style={styles.showPasswordText}>
            {showPasswords ? 'Hide passwords' : 'Show passwords'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.submitButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.submitButtonText}>Update Password</Text>
        </Pressable>

        <Pressable
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  heading: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#246BCE',
  },
  description: {
    color: '#666',
    marginTop: 7,
    marginBottom: 22,
    lineHeight: 20,
  },
  label: {
    color: '#263445',
    fontWeight: '600',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D5DDE8',
    borderRadius: 8,
    padding: 12,
    color: '#222',
    marginBottom: 17,
  },
  showPassword: {
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  showPasswordText: {
    color: '#246BCE',
  },
  submitButton: {
    backgroundColor: '#246BCE',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#246BCE',
    borderRadius: 8,
    padding: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: '#246BCE',
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;