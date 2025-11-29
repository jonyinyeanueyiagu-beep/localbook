import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_USER_KEY = '@localbook_user';
const STORAGE_TOKEN_KEY = '@localbook_token';

export const API_BASE_URL = 'http://192.168.1.15:8080/api';

const AuthContext = createContext(null);

// ✅ Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function AuthProvider(props) {
  const children = props.children;
  
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    let mounted = true;
    
    async function restoreAuth() {
      try {
        const storedUserPromise = AsyncStorage.getItem(STORAGE_USER_KEY);
        const storedTokenPromise = AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        
        const results = await Promise.all([storedUserPromise, storedTokenPromise]);
        const storedUser = results[0];
        const storedToken = results[1];
        
        if (mounted === true) {
          const hasStoredUser = storedUser !== null && storedUser !== undefined;
          if (hasStoredUser === true) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
          }
          
          const hasStoredToken = storedToken !== null && storedToken !== undefined;
          if (hasStoredToken === true) {
            setToken(storedToken);
          }
        }
      } catch (e) {
        console.warn('Auth restore failed', e);
      } finally {
        if (mounted === true) {
          setLoading(false);
        }
      }
    }
    
    restoreAuth();
    
    return function() {
      mounted = false;
    };
  }, []);

  async function safeParseJson(res) {
    const text = await res.text();
    const hasText = text !== null && text !== undefined && text.length > 0;
    
    if (hasText === false) {
      return null;
    }
    
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      return text;
    }
  }

  async function authFetch(path, options) {
    let finalOptions = {};
    const hasOptions = options !== null && options !== undefined;
    if (hasOptions === true) {
      finalOptions = options;
    }
    
    const isFullUrl = path.startsWith('http');
    let url = '';
    if (isFullUrl === true) {
      url = path;
    } else {
      url = API_BASE_URL + path;
    }
    
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const hasOptionsHeaders = finalOptions.headers !== null && finalOptions.headers !== undefined;
    if (hasOptionsHeaders === true) {
      const optionHeaderKeys = Object.keys(finalOptions.headers);
      let keyIndex = 0;
      while (keyIndex < optionHeaderKeys.length) {
        const key = optionHeaderKeys[keyIndex];
        const value = finalOptions.headers[key];
        headers[key] = value;
        keyIndex = keyIndex + 1;
      }
    }
    
    const hasToken = token !== null && token !== undefined;
    if (hasToken === true) {
      const authHeader = 'Bearer ' + token;
      headers.Authorization = authHeader;
    }

    const init = {};
    const optionKeys = Object.keys(finalOptions);
    let optionIndex = 0;
    while (optionIndex < optionKeys.length) {
      const key = optionKeys[optionIndex];
      const value = finalOptions[key];
      init[key] = value;
      optionIndex = optionIndex + 1;
    }
    init.headers = headers;

    const res = await fetch(url, init);
    const data = await safeParseJson(res);
    
    const isResponseOk = res.ok;
    if (isResponseOk === false) {
      let message = 'Request failed';
      
      const hasData = data !== null && data !== undefined;
      if (hasData === true) {
        const hasDataMessage = data.message !== null && data.message !== undefined;
        if (hasDataMessage === true) {
          message = data.message;
        } else {
          message = data;
        }
      } else {
        const statusText = res.statusText;
        const hasStatusText = statusText !== null && statusText !== undefined;
        if (hasStatusText === true) {
          message = statusText;
        }
      }
      
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    
    return data;
  }

  async function persistAuth(userObj, tokenStr) {
    try {
      const hasUserObj = userObj !== null && userObj !== undefined;
      if (hasUserObj === true) {
        const userJson = JSON.stringify(userObj);
        await AsyncStorage.setItem(STORAGE_USER_KEY, userJson);
      }
      
      const hasTokenStr = tokenStr !== null && tokenStr !== undefined;
      if (hasTokenStr === true) {
        await AsyncStorage.setItem(STORAGE_TOKEN_KEY, tokenStr);
      }
    } catch (e) {
      console.warn('Failed to persist auth', e);
    }
  }

  async function clearPersistedAuth() {
    try {
      await AsyncStorage.removeItem(STORAGE_USER_KEY);
      await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
      await AsyncStorage.removeItem('expoPushToken');
    } catch (e) {
      console.warn('Failed to clear persisted auth', e);
    }
  }

  // ✅ NEW: Register push token
  async function registerPushToken(userId) {
    try {
      console.log('📱 Registering push token for user:', userId);
      
      // Check if device supports push notifications
      const isDevice = true; // You can add Device.isDevice check from expo-device
      if (isDevice === false) {
        console.log('⚠️ Must use physical device for Push Notifications');
        return;
      }
      
      // Request permissions
      const existingPermissions = await Notifications.getPermissionsAsync();
      let finalStatus = existingPermissions.status;
      
      const isGranted = finalStatus === 'granted';
      if (isGranted === false) {
        const newPermissions = await Notifications.requestPermissionsAsync();
        finalStatus = newPermissions.status;
      }
      
      const isNowGranted = finalStatus === 'granted';
      if (isNowGranted === false) {
        console.log('⚠️ Push notification permission denied');
        return;
      }
      
      // Get Expo push token
      let expoPushToken = await AsyncStorage.getItem('expoPushToken');
      const hasStoredToken = expoPushToken !== null && expoPushToken !== undefined;
      
      if (hasStoredToken === false) {
       const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '0b50f5ad-0bfa-4d76-8187-26e91973f41f',
        });
        expoPushToken = tokenData.data;
        await AsyncStorage.setItem('expoPushToken', expoPushToken);
        console.log('📱 New Expo Push Token:', expoPushToken);
      } else {
        console.log('📱 Using stored Expo Push Token:', expoPushToken);
      }
      
      // Register with backend
      const registerUrl = API_BASE_URL + '/notifications/mobile/register-token';
      const requestBody = {
        userId: userId,
        pushToken: expoPushToken,
        platform: Platform.OS,
        type: 'expo',
      };
      const requestBodyJson = JSON.stringify(requestBody);
      
      const requestOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBodyJson,
      };
      
      const response = await fetch(registerUrl, requestOptions);
      const data = await safeParseJson(response);
      
      const isResponseOk = response.ok;
      if (isResponseOk === true) {
        console.log('✅ Push token registered with backend');
      } else {
        console.log('⚠️ Failed to register push token:', data);
      }
    } catch (error) {
      console.error('❌ Error registering push token:', error);
    }
  }

  // ✅ NEW: Unregister push token
  async function unregisterPushToken(userId) {
    try {
      console.log('📱 Unregistering push token for user:', userId);
      
      const unregisterUrl = API_BASE_URL + '/notifications/mobile/unregister-token/' + userId;
      
      const requestOptions = {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      };
      
      const response = await fetch(unregisterUrl, requestOptions);
      const data = await safeParseJson(response);
      
      const isResponseOk = response.ok;
      if (isResponseOk === true) {
        await AsyncStorage.removeItem('expoPushToken');
        console.log('✅ Push token unregistered');
      } else {
        console.log('⚠️ Failed to unregister push token:', data);
      }
    } catch (error) {
      console.error('❌ Error unregistering push token:', error);
    }
  }

  async function login(email, password) {
    setLoading(true);
    
    try {
      const loginUrl = API_BASE_URL + '/users/login';
      console.log('🔵 Login URL:', loginUrl);
      
      const requestBody = {
        email: email,
        password: password,
      };
      const requestBodyJson = JSON.stringify(requestBody);
      
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBodyJson,
      };
      
      const response = await fetch(loginUrl, requestOptions);
      const data = await safeParseJson(response);
      
      console.log('📥 Login response:', data);
      
      const isResponseOk = response.ok;
      if (isResponseOk === false) {
        let message = 'Login failed';
        
        const hasData = data !== null && data !== undefined;
        if (hasData === true) {
          const hasDataMessage = data.message !== null && data.message !== undefined;
          if (hasDataMessage === true) {
            message = data.message;
          } else {
            const dataString = data.toString();
            message = dataString;
          }
        }
        
        console.log('❌ Login failed:', message);
        const result = { success: false, error: message };
        return result;
      }

      let receivedUser = data;
      const hasUserProperty = data.user !== null && data.user !== undefined;
      if (hasUserProperty === true) {
        receivedUser = data.user;
      }
      
      console.log('👤 User object:', receivedUser);

      let receivedToken = null;
      const hasToken = data.token !== null && data.token !== undefined;
      const hasAccessToken = data.accessToken !== null && data.accessToken !== undefined;
      
      if (hasToken === true) {
        receivedToken = data.token;
      } else if (hasAccessToken === true) {
        receivedToken = data.accessToken;
      }

      setUser(receivedUser);
      
      const hasReceivedToken = receivedToken !== null && receivedToken !== undefined;
      if (hasReceivedToken === true) {
        setToken(receivedToken);
      }

      await persistAuth(receivedUser, receivedToken);

      // ✅ NEW: Register push token after successful login
      const hasUserId = receivedUser.id !== null && receivedUser.id !== undefined;
      if (hasUserId === true) {
        await registerPushToken(receivedUser.id);
      }

      console.log('✅ Login successful');
      const result = { success: true, user: receivedUser, token: receivedToken };
      return result;
    } catch (error) {
      const errorMessage = error.message;
      let finalErrorMessage = 'Network error';
      const hasErrorMessage = errorMessage !== null && errorMessage !== undefined;
      if (hasErrorMessage === true) {
        finalErrorMessage = errorMessage;
      }
      
      console.error('❌ Login error:', error);
      const result = { success: false, error: finalErrorMessage };
      return result;
    } finally {
      setLoading(false);
    }
  }

  async function register(userData) {
    setLoading(true);
    
    try {
      console.log('🔵 Register data:', userData);
      
      let endpoint = '';
      const userRole = userData.role;
      const isClient = userRole === 'CLIENT';
      const isBusinessOwner = userRole === 'BUSINESS_OWNER';
      
      if (isClient === true) {
        endpoint = API_BASE_URL + '/users/register/client';
      } else if (isBusinessOwner === true) {
        endpoint = API_BASE_URL + '/users/register/business-owner';
      } else {
        const errorResult = { success: false, error: 'Invalid role' };
        return errorResult;
      }
      
      console.log('📤 Registration endpoint:', endpoint);
      
      const requestBody = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
      };
      
      const hasPhoneNumber = userData.phoneNumber !== null && userData.phoneNumber !== undefined;
      if (hasPhoneNumber === true) {
        requestBody.phoneNumber = userData.phoneNumber;
      }
      
      if (isBusinessOwner === true) {
        const hasBusinessName = userData.businessName !== null && userData.businessName !== undefined;
        if (hasBusinessName === true) {
          requestBody.businessName = userData.businessName;
        }
        
        const hasLocation = userData.location !== null && userData.location !== undefined;
        if (hasLocation === true) {
          requestBody.location = userData.location;
        }
        
        const hasCategory = userData.category !== null && userData.category !== undefined;
        if (hasCategory === true) {
          requestBody.category = userData.category;
        }
        
        const hasDescription = userData.description !== null && userData.description !== undefined;
        if (hasDescription === true) {
          requestBody.description = userData.description;
        }
      }
      
      console.log('📤 Request body:', requestBody);
      
      const requestBodyJson = JSON.stringify(requestBody);
      const requestOptions = {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: requestBodyJson,
      };
      
      const response = await fetch(endpoint, requestOptions);
      const responseStatus = response.status;
      console.log('📥 Response status:', responseStatus);
      
      const data = await safeParseJson(response);
      console.log('📥 Response data:', data);
      
      const isResponseOk = response.ok;
      if (isResponseOk === false) {
        let message = 'Registration failed';
        
        const hasData = data !== null && data !== undefined;
        if (hasData === true) {
          const hasDataMessage = data.message !== null && data.message !== undefined;
          if (hasDataMessage === true) {
            message = data.message;
          } else {
            const dataString = data.toString();
            message = dataString;
          }
        }
        
        console.log('❌ Registration failed:', message);
        const result = { success: false, error: message };
        return result;
      }

      let receivedUser = data;
      const hasUserProperty = data.user !== null && data.user !== undefined;
      if (hasUserProperty === true) {
        receivedUser = data.user;
      }

      let receivedToken = null;
      const hasToken = data.token !== null && data.token !== undefined;
      const hasAccessToken = data.accessToken !== null && data.accessToken !== undefined;
      
      if (hasToken === true) {
        receivedToken = data.token;
      } else if (hasAccessToken === true) {
        receivedToken = data.accessToken;
      }

      const hasReceivedToken = receivedToken !== null && receivedToken !== undefined;
      if (hasReceivedToken === true) {
        setUser(receivedUser);
        setToken(receivedToken);
        await persistAuth(receivedUser, receivedToken);
        
        // ✅ NEW: Register push token after successful registration
        const hasUserId = receivedUser.id !== null && receivedUser.id !== undefined;
        if (hasUserId === true) {
          await registerPushToken(receivedUser.id);
        }
      }

      console.log('✅ Registration successful');
      const result = { success: true, user: receivedUser, token: receivedToken };
      return result;
    } catch (error) {
      const errorMessage = error.message;
      let finalErrorMessage = 'Network error';
      const hasErrorMessage = errorMessage !== null && errorMessage !== undefined;
      if (hasErrorMessage === true) {
        finalErrorMessage = errorMessage;
      }
      
      console.error('❌ Registration error:', error);
      const result = { success: false, error: finalErrorMessage };
      return result;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    // ✅ NEW: Unregister push token before logout
    const hasUser = user !== null && user !== undefined;
    if (hasUser === true) {
      const hasUserId = user.id !== null && user.id !== undefined;
      if (hasUserId === true) {
        await unregisterPushToken(user.id);
      }
    }
    
    setUser(null);
    setToken(null);
    await clearPersistedAuth();
    console.log('✅ Logout successful');
  }

  const contextValue = {
    user: user,
    token: token,
    loading: loading,
    login: login,
    register: register,
    logout: logout,
    authFetch: authFetch,
    registerPushToken: registerPushToken, // ✅ NEW: Expose for manual registration
    unregisterPushToken: unregisterPushToken, // ✅ NEW: Expose for manual unregistration
    API_BASE_URL: API_BASE_URL,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  const hasContext = ctx !== null && ctx !== undefined;
  if (hasContext === false) {
    const error = new Error('useAuth must be used within an AuthProvider');
    throw error;
  }
  return ctx;
}