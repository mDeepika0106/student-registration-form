import React, { useState } from 'react';
import {
  Alert,
  KeyboardTypeOptions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type {
  EditStudentScreenProps,
  Student,
} from '../types';

type EditableStudentFields = Omit<Student, 'id'>;

type InputOptions = {
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
};

const EditStudentScreen = ({
  navigation,
  route,
}: EditStudentScreenProps) => {
  const selectedStudent = route.params.student;

  const [formData, setFormData] = useState<EditableStudentFields>({
    name: selectedStudent.name,
    place: selectedStudent.place,
    email: selectedStudent.email,
    mobileNumber: selectedStudent.mobileNumber,
    age: String(selectedStudent.age),
    gender: selectedStudent.gender,
    course: selectedStudent.course,
    college: selectedStudent.college,
    address: selectedStudent.address,
  });

  const updateField = (
    field: keyof EditableStudentFields,
    value: string,
  ): void => {
    setFormData(previous => ({
      ...previous,
      [field]: value,
    }));
  };

  const renderInput = (
    field: keyof EditableStudentFields,
    label: string,
    placeholder: string,
    options: InputOptions = {},
  ) => (
    <View style={styles.inputContainer} key={field}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={[
          styles.input,
          options.multiline ? styles.multilineInput : undefined,
        ]}
        value={String(formData[field])}
        onChangeText={(value: string) => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor="#888"
        keyboardType={options.keyboardType ?? 'default'}
        multiline={options.multiline ?? false}
        textAlignVertical={options.multiline ? 'top' : 'center'}
        autoCapitalize={field === 'email' ? 'none' : 'sentences'}
      />
    </View>
  );

  const handleUpdate = (): void => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.mobileNumber.trim() ||
      !formData.course.trim()
    ) {
      Alert.alert(
        'Missing Information',
        'Name, email, mobile number, and course are required.',
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      Alert.alert('Invalid Email', 'Enter a valid email address.');
      return;
    }

    if (!/^\d{10}$/.test(formData.mobileNumber.trim())) {
      Alert.alert(
        'Invalid Mobile Number',
        'Enter a 10-digit mobile number.',
      );
      return;
    }

   const updatedStudent: Student = {
  ...formData,
  id: selectedStudent.id,
  name: formData.name.trim(),
  email: formData.email.trim(),
  mobileNumber: formData.mobileNumber.trim(),
  age: String(formData.age).trim(),
};

    route.params.onSave?.(updatedStudent);

    Alert.alert('Success', 'Student details updated successfully.', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.heading}>Edit Student</Text>
        <Text style={styles.description}>
          Update the student's information.
        </Text>

        {renderInput('name', 'Student Name *', 'Enter full name')}
        {renderInput('place', 'Place', 'Enter place')}
        {renderInput(
          'email',
          'Email Address *',
          'Enter email',
          { keyboardType: 'email-address' },
        )}
        {renderInput(
          'mobileNumber',
          'Mobile Number *',
          'Enter 10-digit mobile number',
          { keyboardType: 'phone-pad' },
        )}
        {renderInput(
          'age',
          'Age',
          'Enter age',
          { keyboardType: 'numeric' },
        )}
        {renderInput('gender', 'Gender', 'Enter gender')}
        {renderInput('course', 'Course *', 'Enter course')}
        {renderInput('college', 'College', 'Enter college name')}
        {renderInput(
          'address',
          'Address',
          'Enter complete address',
          { multiline: true },
        )}

        <Pressable style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.buttonText}>Save Changes</Text>
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
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
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
    marginTop: 6,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#263445',
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#D5DDE8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#222',
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 90,
  },
  updateButton: {
    backgroundColor: '#246BCE',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#246BCE',
    padding: 13,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelText: {
    color: '#246BCE',
    fontWeight: '600',
  },
});

export default EditStudentScreen;