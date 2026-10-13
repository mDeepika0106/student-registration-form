
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type Student = {
  id: number | string;
  name: string;
  place: string;
  email: string;
  mobileNumber: string;
  age: number | string;
  gender: string;
  course: string;
  college: string;
  address: string;
};

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  AddStudent: undefined;
  StudentList: undefined;
  EditStudent: {
    student: Student;
    onSave?: (updatedStudent: Student) => void;
  };
  ChangePassword: undefined;
  CreateUser: undefined;
};

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

export type DashboardScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Dashboard'
>;

export type AddStudentScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'AddStudent'
>;

export type StudentListScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'StudentList'
>;

export type EditStudentScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'EditStudent'
>;

export type ChangePasswordScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ChangePassword'
>;

export type CreateUserScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'CreateUser'
>;

