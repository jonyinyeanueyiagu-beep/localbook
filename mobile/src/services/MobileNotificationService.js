import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class MobileNotificationService {  // ✅ Changed name
  
  navigationRef = null;

  setNavigationRef(ref) {
    this.navigationRef = ref;
  }

  async initialize() {
    try {
      console.log('🔔 Initializing mobile push notifications...');
      
      if (!Device.isDevice) {
        console.log('⚠️ Must use physical device for Push Notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return;
      }

      const token = await this.getExpoPushToken();
      console.log('📱 Expo Push Token:', token);

      this.setupNotificationListeners();
      
      console.log('✅ Mobile notifications initialized');
      
    } catch (error) {
      console.error('Error initializing mobile notifications:', error);
    }
  }

  async getExpoPushToken() {
    try {
      let token = await AsyncStorage.getItem('expoPushToken');
      
      if (!token) {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: 'YOUR_EXPO_PROJECT_ID',
        });
        token = tokenData.data;
        
        console.log('📱 New Expo Push Token:', token);
        await AsyncStorage.setItem('expoPushToken', token);
      }
      
      await this.sendTokenToBackend(token);
      
      return token;
    } catch (error) {
      console.error('Error getting Expo push token:', error);
      return null;
    }
  }

  async sendTokenToBackend(token) {
    try {
      const userId = await AsyncStorage.getItem('userId');
      
      if (!userId) {
        console.log('⚠️ No user ID found, skipping token upload');
        return;
      }

      console.log('📤 Sending mobile push token to backend...');
      
      await api.post('/notifications/mobile/register-token', {  // ✅ Changed endpoint
        userId: parseInt(userId),
        pushToken: token,
        platform: Platform.OS,
        type: 'expo',
      });
      
      console.log('✅ Mobile push token registered with backend');
    } catch (error) {
      console.error('❌ Error sending token to backend:', error);
    }
  }

  setupNotificationListeners() {
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📩 Mobile notification received:', notification);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Mobile notification tapped:', response);
      this.handleNotificationPress(response.notification);
    });
  }

  handleNotificationPress(notification) {
    const data = notification.request.content.data;
    
    if (!this.navigationRef) {
      console.log('⚠️ Navigation ref not set');
      return;
    }

    if (data?.type === 'appointment') {
      this.navigationRef.navigate('ManageAppointments');
    } else if (data?.type === 'rating') {
      this.navigationRef.navigate('BusinessRatings');
    } else if (data?.type === 'business_approved') {
      this.navigationRef.navigate('BusinessHome');
    }
  }

  async scheduleMobilePushNotification(title, body, data = {}, seconds = 1) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data,
        sound: true,
      },
      trigger: { seconds: seconds },
    });
  }

  async unregisterToken() {
    try {
      const token = await AsyncStorage.getItem('expoPushToken');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        await api.delete(`/notifications/mobile/unregister-token/${userId}`);  // ✅ Changed endpoint
        await AsyncStorage.removeItem('expoPushToken');
        console.log('✅ Mobile push token unregistered');
      }
    } catch (error) {
      console.error('Error unregistering mobile token:', error);
    }
  }

  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

export default new MobileNotificationService();  // ✅ Changed export name