import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  RefreshControl, 
  Alert, 
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const ManageAppointmentScreen = function(props) {
  const navigation = props.navigation;
  const authContext = useAuth();
  const user = authContext.user;
  const token = authContext.token;
  
  const [activeTab, setActiveTab] = useState('today');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessId, setBusinessId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0
  });

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  // Update current time every minute
  useEffect(function() {
    const timer = setInterval(function() {
      setCurrentTime(new Date());
    }, 60000);
    
    return function() {
      clearInterval(timer);
    };
  }, []);

  // Fetch business ID once on mount
  useEffect(function() {
    fetchBusinessId();
  }, []);

  // Fetch appointments when tab or businessId changes
  useEffect(function() {
    if (businessId !== null && businessId !== undefined) {
      fetchAppointments();
    }
  }, [activeTab, businessId]);

  const fetchBusinessId = useCallback(async function() {
    try {
      if (!user?.id) {
        console.log('❌ No user found');
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/businesses/owner/${user.id}`;
      console.log('🔍 Fetching business for user:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Business data:', data);
        
        const foundBusinessId = Array.isArray(data) ? data[0]?.id : data?.id;

        if (foundBusinessId) {
          console.log('🏢 Business ID found:', foundBusinessId);
          setBusinessId(foundBusinessId);
        } else {
          console.log('❌ No business found for this user');
          Alert.alert('No Business', 'You need to create a business profile first.');
          setLoading(false);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch business:', errorText);
        Alert.alert('Error', 'Failed to load business information.');
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error fetching business:', error);
      Alert.alert('Error', 'Failed to load business information');
      setLoading(false);
    }
  }, [user, token]);

  const fetchAppointments = useCallback(async function() {
    try {
      console.log('📥 Fetching appointments for business...');
      
      if (!businessId) {
        console.log('❌ No business ID');
        setLoading(false);
        return;
      }

      const url = `${API_BASE_URL}/appointments/business/${businessId}`;
      console.log('🔗 Fetching from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Appointments received:', data.length);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const newStats = {
          today: 0,
          upcoming: 0,
          completed: 0,
          cancelled: 0
        };

        const filtered = data.filter(appointment => {
          const appointmentDate = new Date(appointment.appointmentDateTime);
          const status = appointment.status;

          // Update stats
          if (status === 'COMPLETED') newStats.completed++;
          if (status === 'CANCELLED') newStats.cancelled++;
          if (appointmentDate >= todayStart && appointmentDate <= todayEnd && status === 'CONFIRMED') {
            newStats.today++;
          }
          if (appointmentDate > todayEnd && status === 'CONFIRMED') {
            newStats.upcoming++;
          }

          // Filter based on active tab
          if (activeTab === 'today') {
            return appointmentDate >= todayStart && 
                   appointmentDate <= todayEnd && 
                   status === 'CONFIRMED';
          } else if (activeTab === 'upcoming') {
            return appointmentDate > todayEnd && status === 'CONFIRMED';
          } else if (activeTab === 'past') {
            return appointmentDate < todayStart || 
                   status === 'CANCELLED' || 
                   status === 'COMPLETED';
          }
          return false;
        });

        setStats(newStats);

        const sorted = filtered.sort((a, b) => {
          const dateA = new Date(a.appointmentDateTime);
          const dateB = new Date(b.appointmentDateTime);
          return activeTab === 'past' ? dateB - dateA : dateA - dateB;
        });

        console.log('✅ Filtered appointments:', sorted.length);
        setAppointments(sorted);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch:', errorText);
        Alert.alert('Error', 'Failed to load appointments');
      }
    } catch (error) {
      console.error('❌ Error fetching appointments:', error);
      Alert.alert('Error', `Network error: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, activeTab, token]);

  const handleComplete = useCallback(function(appointmentId) {
    Alert.alert(
      'Complete Appointment',
      'Mark this appointment as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          style: 'default',
          onPress: async function() {
            try {
              const url = `${API_BASE_URL}/appointments/${appointmentId}/complete?userId=${user.id}`;
              console.log('✅ Completing appointment:', url);

              const response = await fetch(url, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Appointment completed! ✅');
                fetchAppointments();
              } else {
                const errorText = await response.text();
                console.error('❌ Failed to complete:', errorText);
                Alert.alert('Error', 'Failed to complete appointment');
              }
            } catch (error) {
              console.error('❌ Error:', error);
              Alert.alert('Error', 'Network error');
            }
          },
        },
      ]
    );
  }, [user, token, fetchAppointments]);

  const handleCancel = useCallback(function(appointmentId) {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async function() {
            try {
              const url = `${API_BASE_URL}/appointments/${appointmentId}/cancel?userId=${user.id}`;
              console.log('❌ Cancelling appointment:', url);

              const response = await fetch(url, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Success', 'Appointment cancelled');
                fetchAppointments();
              } else {
                const errorText = await response.text();
                console.error('❌ Failed to cancel:', errorText);
                Alert.alert('Error', 'Failed to cancel appointment');
              }
            } catch (error) {
              console.error('❌ Error:', error);
              Alert.alert('Error', 'Network error');
            }
          },
        },
      ]
    );
  }, [user, token, fetchAppointments]);

  function formatDateShort(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  function isAppointmentNow(appointment) {
    const appointmentDateTime = new Date(appointment.appointmentDateTime);
    const appointmentEnd = new Date(appointmentDateTime.getTime() + 60 * 60000);
    return currentTime >= appointmentDateTime && currentTime <= appointmentEnd;
  }

  function isAppointmentSoon(appointment) {
    const appointmentDateTime = new Date(appointment.appointmentDateTime);
    const timeDiff = appointmentDateTime - currentTime;
    const minutesDiff = timeDiff / 60000;
    return minutesDiff > 0 && minutesDiff <= 30;
  }

  function getRelativeTime(appointment) {
    const appointmentDateTime = new Date(appointment.appointmentDateTime);
    const timeDiff = appointmentDateTime - currentTime;
    const minutesDiff = Math.floor(timeDiff / 60000);
    const hoursDiff = Math.floor(minutesDiff / 60);
    const daysDiff = Math.floor(hoursDiff / 24);

    if (isAppointmentNow(appointment)) return 'Now';
    if (isAppointmentSoon(appointment)) return `${minutesDiff}m`;
    if (daysDiff > 0) return `${daysDiff}d`;
    if (hoursDiff > 0) return `${hoursDiff}h`;
    return 'Soon';
  }

  function getStatusConfig(status) {
    const upperStatus = status?.toUpperCase() || '';
    const configs = {
      'CONFIRMED': { bgColor: '#8b5cf6', textColor: '#ffffff', label: 'Confirmed' },
      'CANCELLED': { bgColor: '#ef4444', textColor: '#ffffff', label: 'Cancelled' },
      'COMPLETED': { bgColor: '#a855f7', textColor: '#ffffff', label: 'Completed' },
      'NO_SHOW': { bgColor: '#6b7280', textColor: '#ffffff', label: 'No Show' },
    };
    return configs[upperStatus] || { bgColor: '#7c3aed', textColor: '#ffffff', label: status || 'Unknown' };
  }

  function renderAppointmentCard({ item }) {
    const appointmentDateTime = new Date(item.appointmentDateTime);
    const statusConfig = getStatusConfig(item.status);
    const appointmentNow = isAppointmentNow(item);
    const appointmentSoon = isAppointmentSoon(item);
    
    const clientName = item.user?.name || 'Unknown Client';
    const serviceName = item.service?.serviceName || 'Service';
    const servicePrice = (item.service?.price || 0).toFixed(2);
    const serviceDuration = item.service?.durationMinutes || 60;

    const isUpcoming = activeTab === 'today' || activeTab === 'upcoming';
    const isConfirmed = item.status === 'CONFIRMED';
    const showActionButtons = isUpcoming && isConfirmed;

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthName = monthNames[appointmentDateTime.getMonth()];
    const day = appointmentDateTime.getDate();

    const hours = appointmentDateTime.getHours();
    const minutes = appointmentDateTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const timeString = `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;

    let accentColor = '#8b5cf6';
    if (appointmentNow) accentColor = '#a855f7';
    else if (appointmentSoon) accentColor = '#c084fc';

    const showTimeIndicator = isUpcoming && isConfirmed;

    return (
      <View style={{
        backgroundColor: '#ffffff',
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{
            width: 4,
            backgroundColor: accentColor,
          }} />
          
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', padding: 16 }}>
              {/* Date Box */}
              <View style={{
                width: 70,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#faf5ff',
                borderRadius: 12,
                paddingVertical: 12,
                marginRight: 16,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#7c3aed',
                  letterSpacing: 1,
                }}>
                  {monthName}
                </Text>
                <Text style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: '#111827',
                  lineHeight: 36,
                }}>
                  {day}
                </Text>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: accentColor,
                  marginTop: 4,
                }}>
                  {timeString}
                </Text>
              </View>

              {/* Details */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#111827',
                    flex: 1,
                    marginRight: 8,
                  }}>
                    {clientName}
                  </Text>
                  
                  <View style={{
                    backgroundColor: statusConfig.bgColor,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      color: statusConfig.textColor,
                      fontSize: 11,
                      fontWeight: '700',
                    }}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <Text style={{
                  fontSize: 15,
                  color: '#374151',
                  marginBottom: 12,
                  fontWeight: '500',
                }}>
                  {serviceName}
                </Text>

                {showTimeIndicator && (
                  <View style={{
                    backgroundColor: appointmentNow ? '#faf5ff' : appointmentSoon ? '#f3e8ff' : '#f9fafb',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                    borderWidth: 1,
                    borderColor: appointmentNow ? '#c084fc' : appointmentSoon ? '#d8b4fe' : '#e5e7eb',
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: appointmentNow ? '#6b21a8' : appointmentSoon ? '#7e22ce' : '#374151',
                    }}>
                      {appointmentNow && '🟣 '}
                      {appointmentSoon && '⏰ '}
                      {getRelativeTime(item)}
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 4 }}>⏱️</Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>
                      {serviceDuration}min
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 4 }}>💰</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#8b5cf6' }}>
                      €{servicePrice}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Notes */}
            {item.notes && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <View style={{ 
                  backgroundColor: '#faf5ff', 
                  borderRadius: 12, 
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#e9d5ff'
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#6b21a8', marginBottom: 4 }}>
                    📝 NOTES
                  </Text>
                  <Text style={{ fontSize: 14, color: '#374151', lineHeight: 20 }}>
                    {item.notes}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            {showActionButtons && (
              <View style={{
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    borderRightWidth: 1,
                    borderRightColor: '#f3f4f6',
                  }}
                  onPress={() => handleComplete(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>✅</Text>
                  <Text style={{ color: '#8b5cf6', fontSize: 15, fontWeight: '700' }}>
                    Complete
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  onPress={() => handleCancel(item.id)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>✕</Text>
                  <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '700' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  function renderEmpty() {
    const emptyMessages = {
      today: { emoji: '📅', title: 'No appointments today', subtitle: 'Enjoy your free time!' },
      upcoming: { emoji: '🗓️', title: 'No upcoming appointments', subtitle: 'New bookings will appear here' },
      past: { emoji: '📋', title: 'No past appointments', subtitle: 'Completed appointments will appear here' },
    };

    const message = emptyMessages[activeTab];

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 100, paddingHorizontal: 32 }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#faf5ff',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          borderWidth: 2,
          borderColor: '#e9d5ff',
        }}>
          <Text style={{ fontSize: 50 }}>
            {message.emoji}
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          {message.title}
        </Text>
        <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 }}>
          {message.subtitle}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf5ff' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={{ marginTop: 16, color: '#7c3aed', fontSize: 15, fontWeight: '600' }}>
          Loading appointments...
        </Text>
      </View>
    );
  }

  const isTodayTab = activeTab === 'today';
  const isUpcomingTab = activeTab === 'upcoming';
  const isPastTab = activeTab === 'past';

  return (
    <View style={{ flex: 1, backgroundColor: '#faf5ff' }}>
      {/* Header */}
      <View style={{
        backgroundColor: '#8b5cf6',
        paddingTop: 48,
        paddingBottom: 0,
      }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 }}>
            Appointments
          </Text>
          <Text style={{ fontSize: 14, color: '#e9d5ff' }}>
            Manage your business bookings
          </Text>
        </View>

        {/* Tabs */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          marginHorizontal: 20,
          borderRadius: 12,
          padding: 4,
          marginBottom: 16,
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: isTodayTab ? '#ffffff' : 'transparent',
            }}
            onPress={() => setActiveTab('today')}
            activeOpacity={0.8}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
              color: isTodayTab ? '#8b5cf6' : '#e9d5ff',
            }}>
              Today
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: isUpcomingTab ? '#ffffff' : 'transparent',
            }}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
              color: isUpcomingTab ? '#8b5cf6' : '#e9d5ff',
            }}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: isPastTab ? '#ffffff' : 'transparent',
            }}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.8}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
              color: isPastTab ? '#8b5cf6' : '#e9d5ff',
            }}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{
          height: 20,
          backgroundColor: '#faf5ff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }} />
      </View>

      {/* Appointments Count */}
      {appointments.length > 0 && (
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <Text style={{ fontSize: 14, color: '#7c3aed', fontWeight: '600' }}>
            {appointments.length} {appointments.length === 1 ? 'appointment' : 'appointments'}
          </Text>
        </View>
      )}

      {/* Appointments List */}
      <FlatList
        data={appointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => {
              setRefreshing(true);
              fetchAppointments();
            }}
            colors={['#8b5cf6']}
            tintColor="#8b5cf6"
          />
        }
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
};

export default ManageAppointmentScreen;