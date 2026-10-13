
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AddStudentScreenProps } from '../types';
import { API_BASE_URL } from '../api/apiConfig';

const AddStudentScreen = ({ navigation }: AddStudentScreenProps) => {
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [course, setCourse] = useState('');
  const [college, setCollege] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const renderInput = (
    label: string,
    value: string,
    setter: (text: string) => void,
    placeholder: string,
    keyboardType: 'default' | 'email-address' | 'phone-pad' | 'numeric' = 'default',
  ) => (
    <View style={styles.field} key={label}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setter}
        placeholder={placeholder}
        placeholderTextColor="#888888"
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        editable={!loading}
      />
    </View>
  );

  const handleAddStudent = async () => {
    if (
      !name.trim() ||
      !email.trim() ||
      !mobileNumber.trim() ||
      !age.trim() ||
      !gender.trim() ||
      !course.trim()
    ) {
      Alert.alert('Validation', 'Please fill in all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }

    if (!/^\d+$/.test(mobileNumber.trim())) {
      Alert.alert('Validation', 'Mobile number should contain digits only.');
      return;
    }

    if (!Number.isInteger(Number(age)) || Number(age) <= 0) {
      Alert.alert('Validation', 'Please enter a valid age.');
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }

      const student = {
        name: name.trim(),
        place: place.trim(),
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        age: Number(age),
        gender: gender.trim(),
        course: course.trim(),
        college: college.trim(),
        address: address.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/Student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(student),
      });

      if (response.status === 401) {
        Alert.alert('Session expired', 'Please log in again.');
        navigation.replace('Login');
        return;
      }

      if (response.status === 403) {
        Alert.alert(
          'Permission denied',
          'Your role does not have permission to add students.',
        );
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed (${response.status}).`);
      }

      Alert.alert('Success', 'Student added to the database successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
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
      <Text style={styles.title}>Add Student</Text>
      <Text style={styles.subtitle}>
        Enter the student details below.
      </Text>

      {renderInput('Name *', name, setName, 'Enter full name')}
      {renderInput('Place', place, setPlace, 'Enter place')}
      {renderInput(
        'Email *',
        email,
        setEmail,
        'Enter email address',
        'email-address',
      )}
      {renderInput(
        'Mobile Number *',
        mobileNumber,
        setMobileNumber,
        'Enter mobile number',
        'phone-pad',
      )}
      {renderInput('Age *', age, setAge, 'Enter age', 'numeric')}
      {renderInput('Gender *', gender, setGender, 'Enter gender')}
      {renderInput('Course *', course, setCourse, 'Enter course')}
      {renderInput('College', college, setCollege, 'Enter college')}
      {renderInput('Address', address, setAddress, 'Enter address')}

      <Pressable
        style={[styles.button, loading && styles.disabledButton]}
        onPress={handleAddStudent}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Save Student</Text>
        )}
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  content: {
    padding: 20,
    paddingBottom: 35,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666666',
    marginBottom: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    color: '#222222',
    fontSize: 15,
  },
  button: {
    height: 50,
    backgroundColor: '#1E3A8A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddStudentScreen;

