import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CameraScreen from './screens/CameraScreen';
import TreeListScreen from './screens/TreeListScreen';
import ChallengesScreen from './screens/ChallengesScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import TreeDetailScreen from './screens/TreeDetailScreen';
import { AuthContext } from './context/AuthContext';
import api from './services/api';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="My Trees" component={TreeListScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      setUserToken(token);
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error checking token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    signIn: async (token) => {
      setUserToken(token);
      await AsyncStorage.setItem('userToken', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    signOut: async () => {
      setUserToken(null);
      await AsyncStorage.removeItem('userToken');
      delete api.defaults.headers.common['Authorization'];
    },
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userToken == null ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} />
              <Stack.Screen name="TreeDetail" component={TreeDetailScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}
