
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { RootStackParamList } from './src/types';

import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddStudentScreen from './src/screens/AddStudentScreen';
import StudentListScreen from './src/screens/StudentListScreen';
import EditStudentScreen from './src/screens/EditStudentScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#246BCE',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#F4F7FC',
          },
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: 'Dashboard' }}
        />

        <Stack.Screen
          name="AddStudent"
          component={AddStudentScreen}
          options={{ title: 'Add Student' }}
        />

        <Stack.Screen
          name="StudentList"
          component={StudentListScreen}
          options={{ title: 'Students' }}
        />

        <Stack.Screen
          name="EditStudent"
          component={EditStudentScreen}
          options={{ title: 'Edit Student' }}
        />

        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ title: 'Change Password' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;