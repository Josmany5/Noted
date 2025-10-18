// ============================================
// NOTED - Main App Component
// ============================================

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from './src/screens/HomeScreen';
import { NoteDetailScreen } from './src/screens/NoteDetailScreen';
import { db } from './src/services';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Initialize database
    const initDatabase = async () => {
      try {
        await db.init();
        console.log('✅ App initialized successfully');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    };

    initDatabase();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NoteDetail" component={NoteDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
