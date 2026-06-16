import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'jwt_token';
const USER_KEY = 'user_profile';

const isWeb = Platform.OS === 'web';

export async function setToken(token: string): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  } catch (error) {
    console.error('SecureStore: Failed to save token', error);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    if (isWeb) {
      return localStorage.getItem(TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('SecureStore: Failed to get token', error);
    return null;
  }
}

export async function deleteToken(): Promise<void> {
  try {
    if (isWeb) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch (error) {
    console.error('SecureStore: Failed to delete token', error);
  }
}

export async function setUser(user: any): Promise<void> {
  try {
    if (isWeb) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    }
  } catch (error) {
    console.error('SecureStore: Failed to save user profile', error);
  }
}

export async function getUser(): Promise<any | null> {
  try {
    if (isWeb) {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } else {
      const data = await SecureStore.getItemAsync(USER_KEY);
      return data ? JSON.parse(data) : null;
    }
  } catch (error) {
    console.error('SecureStore: Failed to get user profile', error);
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  try {
    if (isWeb) {
      localStorage.removeItem(USER_KEY);
    } else {
      await SecureStore.deleteItemAsync(USER_KEY);
    }
  } catch (error) {
    console.error('SecureStore: Failed to delete user profile', error);
  }
}
