import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

// Business Screens
import BusinessHomeScreen from '../screens/business/BusinessHomeScreen';
import ManageAppointmentsScreen from '../screens/business/ManageAppointmentsScreen';
import ManageServicesScreen from '../screens/business/ManageServicesScreen';
import BusinessProfileScreen from '../screens/business/BusinessProfileScreen';

const Tab = createBottomTabNavigator();

const BusinessNav= () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#22c55e',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={BusinessHomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={ManageAppointmentsScreen}
        options={{
          title: 'Appointments',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Services"
        component={ManageServicesScreen}
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={BusinessProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24 }}>🏪</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BusinessNav;