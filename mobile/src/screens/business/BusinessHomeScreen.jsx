import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import LoadingSpinner from '../../common/LoadingSpinner';
import Button from '../../common/Button';

function BusinessHomeScreen(props) {
  const navigation = props.navigation;
  const authContext = useAuth();
  const user = authContext.user;
  const token = authContext.token;

  const loadingState = useState(true);
  const loading = loadingState[0];
  const setLoading = loadingState[1];

  const refreshingState = useState(false);
  const refreshing = refreshingState[0];
  const setRefreshing = refreshingState[1];

  const statsState = useState({
    todayAppointments: 0,
    weekAppointments: 0,
    monthRevenue: 0,
    totalCustomers: 0,
  });
  const stats = statsState[0];
  const setStats = statsState[1];

  const scheduleState = useState([]);
  const todaySchedule = scheduleState[0];
  const setTodaySchedule = scheduleState[1];

  const ratingsState = useState({
    averageRating: 0,
    totalRatings: 0,
    positiveCount: 0,
    negativeCount: 0,
    neutralCount: 0,
  });
  const ratings = ratingsState[0];
  const setRatings = ratingsState[1];

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  useEffect(function() {
    fetchDashboardData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused - refreshing ratings');
      if (user && user.businessId) {
        const businessId = Number(user.businessId);
        if (!  isNaN(businessId) && businessId > 0) {
          fetchBusinessRatings(businessId);
        }
      }
      return () => {
        console.  log('Screen unfocused');
      };
    }, [user])
  );

  async function fetchDashboardData() {
    try {
      if (!user || !user.businessId) {
        console.error('Cannot fetch dashboard - missing user or businessId');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const businessId = Number(user.businessId);
      
      if (isNaN(businessId) || businessId <= 0) {
        console.error('Invalid businessId:', user.businessId);
        Alert.alert('Error', 'Invalid business ID: ' + user.businessId);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const url = API_BASE_URL + '/businesses/' + businessId + '/dashboard';
      console.log('=== FETCHING DASHBOARD ===');
      console.log('Full URL:', url);
      console.log('Business ID (type):', typeof businessId, businessId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });

      console.log('=== RESPONSE RECEIVED ===');
      console. log('Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('=== DASHBOARD DATA RECEIVED ===');
        
        if (data.stats) {
          console.log('Stats:', data.stats);
          setStats({
            todayAppointments: data.stats.todayAppointments || 0,
            weekAppointments: data.stats.weekAppointments || 0,
            monthRevenue: data.stats.  monthRevenue || 0,
            totalCustomers: data.stats.totalCustomers || 0,
          });
          console.log('📊 Stats set - Today:', data.stats.todayAppointments);
        }
        
        const schedule = data.todaySchedule || [];
        console.log('Raw schedule count:', schedule.length);
        console.log('Raw schedule data:', JSON.stringify(schedule, null, 2));
        
        // ✅ UPDATED FILTER: Show ALL today's appointments (including completed)
        const today = new Date();
        const todayString = today.toISOString().  split('T')[0]; // YYYY-MM-DD
        
        const filteredSchedule = schedule.filter(apt => {
          const appointmentDateTime = apt.appointmentDateTime;
          const appointmentDate = appointmentDateTime.split('T')[0];
          const isToday = appointmentDate === todayString;
          
          console.log(`Appointment ${apt.id}: Date=${appointmentDate}, Status=${apt.status}, IsToday=${isToday}`);
          
          return isToday;  // ✅ Show ALL today's appointments
        });
        
        console. log('✅ Filtered today schedule count:', filteredSchedule.length);
        console.log('Filtered schedule:', JSON.stringify(filteredSchedule, null, 2));
        setTodaySchedule(filteredSchedule);

        await fetchBusinessRatings(businessId);
      } else {
        console.  error('=== ERROR RESPONSE ===');
        const errorText = await response.text();
        console.error('Status:', response.status);
        console.error('Error body:', errorText);
        
        Alert.alert(
          'Error Loading Dashboard', 
          'Status: ' + response.status + '\n' +
          'Please check backend logs for details.'
        );
      }
    } catch (error) {
      console.error('=== NETWORK ERROR ===');
      console.  error('Error message:', error. message);
      
      Alert.alert(
        'Network Error', 
        'Could not connect to server.\n\n' +
        'Error: ' + error.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function fetchBusinessRatings(businessId) {
    try {
      console.log('📥 Fetching ratings for business:', businessId);
      
      const url = API_BASE_URL + '/ratings/business/' + businessId;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        let avgRating = 0;
        let totalCount = 0;
        let positiveCount = 0;
        let negativeCount = 0;
        let neutralCount = 0;

        if (data.ratings) {
          // ✅ Calculate sentiment distribution
          let ratingIndex = 0;
          while (ratingIndex < data.ratings.length) {
            const rating = data.ratings[ratingIndex];
            if (rating.sentiment === 'positive') {
              positiveCount = positiveCount + 1;
            } else if (rating.sentiment === 'negative') {
              negativeCount = negativeCount + 1;
            } else if (rating.sentiment === 'neutral') {
              neutralCount = neutralCount + 1;
            }
            ratingIndex = ratingIndex + 1;
          }

          avgRating = data.averageRating || 0;
          totalCount = data.totalRatings || data.ratings.length;
        } else if (Array.isArray(data)) {
          totalCount = data.length;
          
          // ✅ Calculate sentiment distribution
          let ratingIndex = 0;
          while (ratingIndex < data.length) {
            const rating = data[ratingIndex];
            if (rating.sentiment === 'positive') {
              positiveCount = positiveCount + 1;
            } else if (rating.sentiment === 'negative') {
              negativeCount = negativeCount + 1;
            } else if (rating.sentiment === 'neutral') {
              neutralCount = neutralCount + 1;
            }
            ratingIndex = ratingIndex + 1;
          }

          if (data.length > 0) {
            const sum = data.reduce(function(acc, r) {
              return acc + (r.rating || 0);
            }, 0);
            avgRating = sum / data.length;
          }
        }
        
        console.log('✅ Ratings updated - Total:', totalCount, 'Average:', avgRating);
        console.log('😊 Positive:', positiveCount, '😐 Neutral:', neutralCount, '😞 Negative:', negativeCount);
        
        setRatings({
          averageRating: avgRating,
          totalRatings: totalCount,
          positiveCount: positiveCount,
          negativeCount: negativeCount,
          neutralCount: neutralCount,
        });
      } else {
        console.error('❌ Failed to fetch ratings:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching ratings:', error);
    }
  }

  function onRefresh() {
    console.log('🔄 Manual refresh triggered');
    setRefreshing(true);
    fetchDashboardData();
  }

  function formatTime(dateTime) {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function formatRevenue(amount) {
    if (amount === 0) {
      return '0.  00';
    }
    return amount.toFixed(2);
  }

  function renderStars(rating) {
    const stars = [];
    const roundedRating = Math.round(rating);
    
    let i = 1;
    while (i <= 5) {
      if (i <= roundedRating) {
        stars.push(
          <Text key={i} style={{ fontSize: 20 }}>⭐</Text>
        );
      } else {
        stars.push(
          <Text key={i} style={{ fontSize: 20, color: '#d1d5db' }}>☆</Text>
        );
      }
      i = i + 1;
    }
    
    return stars;
  }

  if (loading) {
    return <LoadingSpinner fullScreen={true} text="Loading dashboard..." />;
  }

  let businessName = '';
  if (user && user.businessName) {
    businessName = user.businessName;
  } else if (user && user.name) {
    businessName = user.name;
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f9fafb' }}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          tintColor="#7c3aed"
          colors={['#7c3aed']}
        />
      }
    >
      {/* Header */}
      <View style={{ 
        backgroundColor: '#7c3aed', 
        paddingTop: 56, 
        paddingBottom: 24, 
        paddingHorizontal: 20 
      }}>
        <Text style={{ 
          color: '#ffffff', 
          fontSize: 24, 
          fontWeight: '700', 
          marginBottom: 4 
        }}>
          Good Morning!   👋
        </Text>
        <Text style={{ color: '#e9d5ff', fontSize: 16 }}>
          {businessName}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={{ paddingHorizontal: 20, marginTop: 0, marginBottom: 16 }}>
        <View style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: 16, 
          padding: 16, 
          shadowColor: '#000', 
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 }
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#7c3aed' }}>
                {stats.todayAppointments}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Today</Text>
            </View>

            <View style={{ 
              alignItems: 'center', 
              borderLeftWidth: 1, 
              borderRightWidth: 1, 
              borderColor: '#e5e7eb', 
              paddingHorizontal: 24 
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#a855f7' }}>
                {stats.weekAppointments}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>This Week</Text>
            </View>

            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: '#c084fc' }}>
                ${formatRevenue(stats.monthRevenue)}
              </Text>
              <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Revenue</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Ratings Card */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <TouchableOpacity 
          onPress={function() { navigation.navigate('BusinessRatings'); }}
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 16, 
            padding: 20, 
            shadowColor: '#7c3aed', 
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            borderWidth: 2,
            borderColor: '#f3e8ff',
          }}
        >
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 16 
          }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
              ⭐ Customer Ratings
            </Text>
            <TouchableOpacity 
              onPress={function() { navigation.navigate('BusinessRatings'); }}
              style={{ 
                backgroundColor: '#f3e8ff', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 20 
              }}
            >
              <Text style={{ color: '#7c3aed', fontSize: 12, fontWeight: '600' }}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#faf5ff',
            padding: 20,
            borderRadius: 16
          }}>
            <Text style={{ 
              fontSize: 56, 
              fontWeight: '700', 
              color: '#7c3aed', 
              marginRight: 16 
            }}>
              {ratings.averageRating.  toFixed(1)}
            </Text>
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 4, marginBottom: 8 }}>
                {renderStars(ratings.averageRating)}
              </View>
              <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
                {ratings.  totalRatings} {ratings.totalRatings === 1 ? 'rating' : 'ratings'}
              </Text>
            </View>
          </View>

          {/* ✅ NEW: Sentiment Distribution */}
          {ratings.totalRatings > 0 ?   (
            <View style={{ 
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#e9d5ff',
              flexDirection: 'row',
              justifyContent: 'space-around'
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>😊</Text>
                <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '700', marginTop: 4 }}>
                  {ratings.positiveCount}
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>Positive</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>😐</Text>
                <Text style={{ fontSize: 12, color: '#f59e0b', fontWeight: '700', marginTop: 4 }}>
                  {ratings.  neutralCount}
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>Neutral</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24 }}>😞</Text>
                <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '700', marginTop: 4 }}>
                  {ratings. negativeCount}
                </Text>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>Negative</Text>
              </View>
            </View>
          ) : (
            <View style={{ 
              alignItems: 'center', 
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: '#e9d5ff',
              marginTop: 16
            }}>
              <Text style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
                No ratings yet.   Complete appointments to receive customer ratings! 
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: '700', 
          color: '#111827', 
          marginBottom: 12 
        }}>
          Quick Actions
        </Text>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: 16, 
              padding: 16, 
              shadowColor: '#000', 
              shadowOpacity: 0.05,
              shadowRadius: 4,
              flex: 1, 
              marginRight: 8, 
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#f3e8ff'
            }}
            onPress={function() { navigation.navigate('ManageAppointments'); }}
          >
            <View style={{
              backgroundColor: '#f3e8ff',
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}>
              <Text style={{ fontSize: 28 }}>📋</Text>
            </View>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: '#7c3aed', 
              textAlign: 'center' 
            }}>
              Appointments
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              backgroundColor: '#ffffff', 
              borderRadius: 16, 
              padding: 16, 
              shadowColor: '#000', 
              shadowOpacity: 0.05,
              shadowRadius: 4,
              flex: 1, 
              marginLeft: 8, 
              alignItems: 'center',
              borderWidth: 2,
              borderColor: '#f3e8ff'
            }}
            onPress={function() { navigation.navigate('ManageServices'); }}
          >
            <View style={{
              backgroundColor: '#f3e8ff',
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}>
              <Text style={{ fontSize: 28 }}>⚙️</Text>
            </View>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: '#7c3aed', 
              textAlign: 'center' 
            }}>
              Services
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Today's Schedule */}
      <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 12 
        }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
            Today's Schedule 📅
          </Text>
          <TouchableOpacity 
            onPress={function() { navigation.navigate('ManageAppointments'); }}
            style={{
              backgroundColor: '#f3e8ff',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16
            }}
          >
            <Text style={{ color: '#7c3aed', fontWeight: '600', fontSize: 13 }}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {todaySchedule.length === 0 ? (
          <View style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 16, 
            padding: 32, 
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#f3e8ff'
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎉</Text>
            <Text style={{ 
              color: '#7c3aed', 
              fontWeight: '600', 
              textAlign: 'center',
              fontSize: 16
            }}>
              No appointments today
            </Text>
            <Text style={{ color: '#9ca3af', fontSize: 14, marginTop: 4 }}>
              Enjoy your free time!
            </Text>
          </View>
        ) : (
          todaySchedule.map(function(appointment) {
            console.log('📋 Appointment data:', JSON.stringify(appointment, null, 2));

            const isCompleted = appointment.status === 'COMPLETED';
            const isCancelled = appointment.status === 'CANCELLED';
            
            // Get user name
            let userName = 'Unknown';
            if (appointment.user && appointment.user.name) {
              userName = appointment.user.name;
            } else if (appointment.userName) {
              userName = appointment.  userName;
            } else if (appointment.clientName) {
              userName = appointment.clientName;
            }

            // Get service details with multiple fallbacks
            let serviceName = 'Service';
            let serviceDuration = 0;
            let servicePrice = 0;

            if (appointment.service) {
              serviceName = appointment.service.name || appointment.service.serviceName || 'Service';
              serviceDuration = appointment.service.  duration || appointment.service.  durationMinutes || 0;
              servicePrice = appointment.service.price || 0;
            } else if (appointment.serviceName) {
              serviceName = appointment.serviceName;
              serviceDuration = appointment.serviceDuration || 0;
              servicePrice = appointment.servicePrice || 0;
            }

            console.log('Service Name:', serviceName);
            console.  log('Service Duration:', serviceDuration);
            console.log('Service Price:', servicePrice);

            const appointmentNotes = appointment.notes || '';

            return (
              <View 
                key={appointment.  id}
                style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: 16, 
                  padding: 16, 
                  shadowColor: '#000', 
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  marginBottom: 12,
                  borderWidth: 2,
                  borderColor: '#f3e8ff'
                }}
              >
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 12 
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      backgroundColor: '#ede9fe', 
                      paddingHorizontal: 12, 
                      paddingVertical: 6, 
                      borderRadius: 20, 
                      marginRight: 12 
                    }}>
                      <Text style={{ 
                        color: '#7c3aed', 
                        fontWeight: '700', 
                        fontSize: 15 
                      }}>
                        {formatTime(appointment.appointmentDateTime)}
                      </Text>
                    </View>
                    {isCompleted ?   (
                      <View style={{ 
                        backgroundColor: '#dcfce7', 
                        paddingHorizontal: 8, 
                        paddingVertical: 4, 
                        borderRadius: 12 
                      }}>
                        <Text style={{ 
                          color: '#16a34a', 
                          fontSize: 11, 
                          fontWeight: '700' 
                        }}>
                          ✓ DONE
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ 
                    color: '#7c3aed', 
                    fontWeight: '700', 
                    fontSize: 16 
                  }}>
                    €{servicePrice.  toFixed(2)}
                  </Text>
                </View>

                <Text style={{ 
                  fontSize: 17, 
                  fontWeight: '700', 
                  color: '#111827', 
                  marginBottom: 4 
                }}>
                  {userName}
                </Text>

                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  marginBottom: 12 
                }}>
                  <View style={{
                    backgroundColor: '#f3e8ff',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 8
                  }}>
                    <Text style={{ 
                      fontSize: 13, 
                      color: '#7c3aed',
                      fontWeight: '600'
                    }}>
                      {serviceName}
                    </Text>
                  </View>
                  {serviceDuration > 0 ?   (
                    <View style={{
                      backgroundColor: '#ede9fe',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 12, marginRight: 2 }}>⏱️</Text>
                      <Text style={{ 
                        fontSize: 13, 
                        color: '#6b7280',
                        fontWeight: '600'
                      }}>
                        {serviceDuration} min
                      </Text>
                    </View>
                  ) : null}
                </View>

                {appointmentNotes ?   (
                  <View style={{ 
                    backgroundColor: '#fef3c7', 
                    paddingHorizontal: 12, 
                    paddingVertical: 8, 
                    borderRadius: 8, 
                    marginBottom: 12 
                  }}>
                    <Text style={{ fontSize: 12, color: '#78350f' }}>
                      💬 {appointmentNotes}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity 
                  style={{ 
                    backgroundColor: '#f3e8ff', 
                    borderRadius: 8, 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: '#e9d5ff'
                  }}
                  onPress={function() { }}
                >
                  <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '600', 
                    color: '#7c3aed' 
                  }}>
                    📞 Call
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </View>

      {/* Business Profile Link */}
      <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: 16, 
            padding: 16, 
            shadowColor: '#7c3aed', 
            shadowOpacity: 0.1,
            shadowRadius: 8,
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderWidth: 2,
            borderColor: '#f3e8ff'
          }}
          onPress={function() { navigation.navigate('BusinessProfile'); }}
        >
          <View>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '700', 
              color: '#7c3aed', 
              marginBottom: 4 
            }}>
              My Business Profile
            </Text>
            <Text style={{ fontSize: 14, color: '#6b7280' }}>
              Update contact info, and more
            </Text>
          </View>
          <View style={{
            backgroundColor: '#f3e8ff',
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Text style={{ fontSize: 24 }}>🏪</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default BusinessHomeScreen;