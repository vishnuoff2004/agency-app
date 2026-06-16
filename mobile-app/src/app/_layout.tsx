import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LanguageProvider } from '../contexts/LanguageContext';
import { SocketProvider } from '../contexts/SocketContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#306D29',
    secondary: '#0D530E',
    background: '#FBF5DD',
  },
};

function RootLayoutContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#306D29" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="booking/new" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <LanguageProvider>
        <AuthProvider>
          <SocketProvider>
            <RootLayoutContent />
          </SocketProvider>
        </AuthProvider>
      </LanguageProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FBF5DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
