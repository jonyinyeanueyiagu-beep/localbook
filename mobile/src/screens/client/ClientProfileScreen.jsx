import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

function ClientProfileScreen(props) {
  const navigation = props.navigation;
  const authContext = useAuth();
  const user = authContext.user;
  const token = authContext.token;
  const logout = authContext.logout;

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [notifications, setNotifications] = useState({
    enable24hrReminder: true,
    enable30minReminder: true,
    enableStartReminder: true,
    enableBookingNotifications: true,
    enableCancellationNotifications: true,
    enableRescheduleNotifications: true,
  });

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  const faqData = [
    {
      id: 1,
      question: 'How far in advance can I book? ',
      answer: 'You can book appointments up to 90 days in advance. This gives you plenty of time to plan ahead for your appointments.',
      icon: '📅'
    },
    {
      id: 2,
      question: 'What is the minimum booking notice?',
      answer: 'You must book at least 2 hours before your desired appointment time. This ensures businesses have adequate time to prepare.',
      icon: '⏰'
    },
    {
      id: 3,
      question: 'Can I cancel my booking?',
      answer: 'Yes!  You can cancel for free up to 24 hours before your appointment.  Cancellations within 24 hours may be subject to business policies.',
      icon: '❌'
    },
    {
      id: 4,
      question: 'How many bookings can I make per day?',
      answer: 'You can make up to 5 bookings per day. This helps ensure fair access to services for all customers.',
      icon: '📊'
    },
    {
      id: 5,
      question: 'When will I receive booking reminders?',
      answer: 'You\'ll receive reminder notifications 24 hours and 30 minutes before your appointment, plus when it starts.',
      icon: '🔔'
    },
    {
      id: 6,
      question: 'Are same-day bookings allowed?',
      answer: 'Yes, if the business has enabled same-day bookings and slots are available at least 2 hours from now.',
      icon: '⚡'
    },
    {
      id: 7,
      question: 'What if a business is in Carlow only?',
      answer: 'LocalBook Carlow focuses on local businesses.  All businesses must be physically located in County Carlow and verified with an R93 eircode.',
      icon: '📍'
    },
    {
      id: 8,
      question: 'How do I contact support?',
      answer: 'You can reach us at support@localbook.ie or call +353 1 234 5678. We\'re here to help Monday-Friday, 9am-5pm.',
      icon: '💬'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchNotificationSettings();
    }
  }, [user]);

  async function fetchNotificationSettings() {
    if (!user?. id) return;

    setLoadingSettings(true);
    try {
      const url = `${API_BASE_URL}/notifications/mobile/settings/${user.id}`;
      console.log('📥 Fetching notification settings:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Notification settings loaded:', data);

        setNotifications({
          enable24hrReminder: data.enable24hrReminder,
          enable30minReminder: data.enable30minReminder,
          enableStartReminder: data.enableStartReminder,
          enableBookingNotifications: data. enableBookingNotifications,
          enableCancellationNotifications: data.enableCancellationNotifications,
          enableRescheduleNotifications: data.enableRescheduleNotifications,
        });
      } else {
        console.log('⚠️ Failed to load settings, using defaults');
      }
    } catch (error) {
      console.error('❌ Error fetching notification settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  }

  async function toggleNotification(key) {
    const newValue = !notifications[key];
    
    // Optimistic update
    setNotifications(prev => ({
      ...prev,
      [key]: newValue
    }));

    try {
      const url = `${API_BASE_URL}/notifications/mobile/settings/${user. id}`;
      console.log('📤 Updating notification setting:', key, '=', newValue);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ... notifications,
          [key]: newValue
        }),
      });

      if (response.ok) {
        console.log('✅ Notification setting updated');
      } else {
        // Revert on failure
        setNotifications(prev => ({
          ...prev,
          [key]: !newValue
        }));
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } catch (error) {
      console. error('❌ Error updating notification setting:', error);
      // Revert on error
      setNotifications(prev => ({
        ...prev,
        [key]: !newValue
      }));
      Alert.alert('Error', 'Network error. Please try again.');
    }
  }

  function handleRefresh() {
    setRefreshing(true);
    fetchNotificationSettings(). finally(() => {
      setRefreshing(false);
    });
  }

  function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }

  function handleOpenFaqModal() {
    setShowFaqModal(true);
    setExpandedFaq(null);
  }

  function handleCloseFaqModal() {
    setShowFaqModal(false);
    setExpandedFaq(null);
  }

  function toggleFaq(faqId) {
    setExpandedFaq(expandedFaq === faqId ?  null : faqId);
  }

  function handleViewMyBookings() {
    navigation.navigate('MyBookings');
  }

  function handleHelp() {
    Alert.alert(
      'Help & Support',
      'Need help?\n\n📧 Email: support@localbook.ie\n📞 Phone: +353 1 234 5678\n\nWe\'re here to help you! ',
      [{ text: 'OK' }]
    );
  }

  const userName = user?.name || 'Guest';
  const userEmail = user?.email || 'No email';
  const userPhone = user?.phoneNumber || 'Not provided';
  
  const userInitials = (() => {
    if (user?.name) {
      const nameParts = user.name.split(' ');
      const firstLetter = nameParts[0]?.charAt(0).toUpperCase() || '?';
      const lastLetter = nameParts[1]?.charAt(0).toUpperCase() || '';
      return firstLetter + lastLetter;
    }
    return '?';
  })();

  const joinDate = new Date();
  const formattedJoinDate = joinDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#7c3aed']}
            tintColor="#7c3aed"
          />
        }
      >
        {/* Header */}
        <View style={{
          backgroundColor: '#7c3aed',
          paddingTop: 56,
          paddingBottom: 32,
          paddingHorizontal: 20,
          marginBottom: 16
        }}>
          <View style={{ alignItems: 'center' }}>
            <View style={{
              backgroundColor: '#ffffff',
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}>
              <Text style={{
                color: '#7c3aed',
                fontSize: 32,
                fontWeight: '700'
              }}>
                {userInitials}
              </Text>
            </View>
            <Text style={{
              color: '#ffffff',
              fontSize: 22,
              fontWeight: '700',
              marginBottom: 4
            }}>
              {userName}
            </Text>
            <Text style={{
              color: '#e9d5ff',
              fontSize: 14
            }}>
              {userEmail}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          
          {/* Profile Information */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 16
            }}>
              Profile Information
            </Text>

            {/* Email */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6'
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#ede9fe',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 18 }}>📧</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: '600',
                  marginBottom: 2
                }}>
                  EMAIL
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#111827',
                  fontWeight: '600'
                }}>
                  {userEmail}
                </Text>
              </View>
            </View>

            {/* Phone */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6'
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#dbeafe',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 18 }}>📱</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: '600',
                  marginBottom: 2
                }}>
                  PHONE
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#111827',
                  fontWeight: '600'
                }}>
                  {userPhone}
                </Text>
              </View>
            </View>

            {/* Member Since */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#d1fae5',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Text style={{ fontSize: 18 }}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 12,
                  color: '#6b7280',
                  fontWeight: '600',
                  marginBottom: 2
                }}>
                  MEMBER SINCE
                </Text>
                <Text style={{
                  fontSize: 16,
                  color: '#111827',
                  fontWeight: '600'
                }}>
                  {formattedJoinDate}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.5,
            shadowRadius: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 16
            }}>
              Quick Actions
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={handleViewMyBookings}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#f5f3ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>📅</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: 2
                  }}>
                    My Bookings
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#6b7280'
                  }}>
                    View and manage appointments
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 20, color: '#d1d5db' }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
                borderBottomWidth: 1,
                borderBottomColor: '#f3f4f6',
              }}
              onPress={handleOpenFaqModal}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#fef3c7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>❓</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: 2
                  }}>
                    FAQ & Booking Rules
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#6b7280'
                  }}>
                    Common questions & platform policies
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 20, color: '#d1d5db' }}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 14,
              }}
              onPress={handleHelp}
            >
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#dcfce7',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 20 }}>💬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#111827',
                    marginBottom: 2
                  }}>
                    Help & Support
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: '#6b7280'
                  }}>
                    Contact our support team
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 20, color: '#d1d5db' }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Notification Settings */}
          <View style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 3
          }}>
            <Text style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#111827',
              marginBottom: 16
            }}>
              Notification Settings
            </Text>

            {loadingSettings ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#7c3aed" />
                <Text style={{ marginTop: 8, color: '#6b7280', fontSize: 13 }}>
                  Loading settings...
                </Text>
              </View>
            ) : (
              <>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      24 Hour Reminder
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      Day before appointment
                    </Text>
                  </View>
                  <Switch
                    value={notifications.enable24hrReminder}
                    onValueChange={() => toggleNotification('enable24hrReminder')}
                    trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                    thumbColor={notifications.enable24hrReminder ? '#7c3aed' : '#f4f4f5'}
                  />
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      30 Minute Reminder
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      Before appointment starts
                    </Text>
                  </View>
                  <Switch
                    value={notifications. enable30minReminder}
                    onValueChange={() => toggleNotification('enable30minReminder')}
                    trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                    thumbColor={notifications.enable30minReminder ?  '#7c3aed' : '#f4f4f5'}
                  />
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      Start Reminder
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      When appointment starts
                    </Text>
                  </View>
                  <Switch
                    value={notifications.enableStartReminder}
                    onValueChange={() => toggleNotification('enableStartReminder')}
                    trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                    thumbColor={notifications.enableStartReminder ? '#7c3aed' : '#f4f4f5'}
                  />
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      Booking Confirmations
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      When booking is confirmed
                    </Text>
                  </View>
                  <Switch
                    value={notifications.enableBookingNotifications}
                    onValueChange={() => toggleNotification('enableBookingNotifications')}
                    trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                    thumbColor={notifications.enableBookingNotifications ? '#7c3aed' : '#f4f4f5'}
                  />
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f3f4f6'
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      Cancellations
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      When booking is cancelled
                    </Text>
                  </View>
                  <Switch
                    value={notifications.enableCancellationNotifications}
                    onValueChange={() => toggleNotification('enableCancellationNotifications')}
                    trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                    thumbColor={notifications. enableCancellationNotifications ?  '#7c3aed' : '#f4f4f5'}
                  />
                </View>

                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 12
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: '#111827',
                      marginBottom: 2
                    }}>
                      Reschedules
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: '#6b7280'
                    }}>
                      When booking is rescheduled
                    </Text>
                  </View>
                  <Switch
                    value={notifications.enableRescheduleNotifications}
                    onValueChange={() => toggleNotification('enableRescheduleNotifications')}
                    trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                    thumbColor={notifications.enableRescheduleNotifications ? '#7c3aed' : '#f4f4f5'}
                  />
                </View>
              </>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={{
              backgroundColor: '#ef4444',
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginBottom: 24,
            }}
            onPress={handleLogout}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 16,
              fontWeight: '700'
            }}>
              Logout
            </Text>
          </TouchableOpacity>

          {/* App Info */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{
              color: '#9ca3af',
              fontSize: 12,
              marginBottom: 4
            }}>
              LocalBook Carlow
            </Text>
            <Text style={{
              color: '#d1d5db',
              fontSize: 11
            }}>
              Version 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FAQ Modal */}
      <Modal
        visible={showFaqModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseFaqModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <View style={{
            flex: 1,
            marginTop: 80,
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingTop: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#e5e7eb',
              backgroundColor: '#ffffff'
            }}>
              <View style={{ width: 40 }} />
              <Text style={{
                fontSize: 18,
                fontWeight: '700',
                color: '#111827'
              }}>
                FAQ & Booking Rules
              </Text>
              <TouchableOpacity
                onPress={handleCloseFaqModal}
                activeOpacity={0.7}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#f3f4f6',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ fontSize: 24, color: '#6b7280', fontWeight: '300' }}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 16,
                paddingBottom: 40
              }}
              showsVerticalScrollIndicator={true}
            >
              <View style={{
                backgroundColor: '#eff6ff',
                borderLeftWidth: 4,
                borderLeftColor: '#3b82f6',
                borderRadius: 12,
                padding: 14,
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start'
              }}>
                <Text style={{ fontSize: 20, marginRight: 10 }}>📋</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: '#1e40af',
                    marginBottom: 4
                  }}>
                    Platform Policies
                  </Text>
                  <Text style={{
                    fontSize: 12,
                    color: '#1e3a8a',
                    lineHeight: 18
                  }}>
                    These rules ensure fair access and quality service for all LocalBook Carlow users.
                  </Text>
                </View>
              </View>

              {faqData.map((faq) => (
                <View
                  key={faq.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 0.5,
                    borderColor: expandedFaq === faq.id ? '#7c3aed' : '#e5e7eb',
                    borderRadius: 12,
                    marginBottom: 10,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOpacity: expandedFaq === faq.id ? 0.1 : 0,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 }
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      backgroundColor: expandedFaq === faq.id ? '#faf5ff' : '#ffffff'
                    }}
                  >
                    <View style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: expandedFaq === faq.id ? '#ede9fe' : '#f9fafb',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ fontSize: 16 }}>{faq.icon}</Text>
                    </View>
                    <Text style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: '600',
                      color: expandedFaq === faq.id ? '#7c3aed' : '#111827',
                      lineHeight: 20
                    }}>
                      {faq.question}
                    </Text>
                    <View style={{
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Text style={{
                        fontSize: 16,
                        color: expandedFaq === faq.id ? '#7c3aed' : '#9ca3af',
                        transform: [{ rotate: expandedFaq === faq.id ? '180deg' : '0deg' }]
                      }}>
                        ▼
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {expandedFaq === faq.id && (
                    <View style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      backgroundColor: '#faf5ff',
                      borderTopWidth: 1,
                      borderTopColor: '#e9d5ff'
                    }}>
                      <Text style={{
                        fontSize: 13,
                        color: '#4b5563',
                        lineHeight: 20
                      }}>
                        {faq. answer}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              <View style={{
                backgroundColor: '#f0fdf4',
                borderRadius: 12,
                padding: 14,
                marginTop: 8,
                borderWidth: 1,
                borderColor: '#bbf7d0'
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 8
                }}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>💬</Text>
                  <Text style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#166534'
                  }}>
                    Still have questions?
                  </Text>
                </View>
                <Text style={{
                  fontSize: 13,
                  color: '#15803d',
                  marginBottom: 12,
                  lineHeight: 19
                }}>
                  Our support team is here to help you Monday-Friday, 9am-5pm. 
                </Text>
                <View style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6
                  }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>📧</Text>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#166534'
                    }}>
                      support@localbook.ie
                    </Text>
                  </View>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 14, marginRight: 8 }}>📞</Text>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: '#166534'
                    }}>
                      +353 1 234 5678
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default ClientProfileScreen;