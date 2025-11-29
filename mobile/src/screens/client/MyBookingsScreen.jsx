import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const screenDimensions = Dimensions.get('window');
const SCREEN_WIDTH = screenDimensions. width;

function MyBookingsScreen(props) {
  const navigation = props.navigation;
  const authContext = useAuth();
  const user = authContext.user;
  const token = authContext.token;
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [tempRescheduleDate, setTempRescheduleDate] = useState(new Date());
  const [rescheduleTime, setRescheduleTime] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduling, setRescheduling] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingBookedSlots, setLoadingBookedSlots] = useState(false);

  // ✅ NEW: Track which bookings have ratings
  const [bookingRatings, setBookingRatings] = useState({});
  const [checkingRatings, setCheckingRatings] = useState({});

  const API_BASE_URL = 'http://192.168.1.15:8080/api';

  useEffect(function() {
    const timer = setInterval(function() {
      const newCurrentTime = new Date();
      setCurrentTime(newCurrentTime);
    }, 60000);
    
    return function() {
      clearInterval(timer);
    };
  }, []);

  useEffect(function() {
    fetchBookings();
  }, [activeTab]);

  useEffect(function() {
    const unsubscribe = navigation.addListener('focus', function() {
      console.log('🔄 Screen focused - refreshing bookings');
      fetchBookings();
    });
    
    return unsubscribe;
  }, [navigation, activeTab]);

  // ✅ NEW: Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('👀 Screen focused - checking for new ratings');
      fetchBookings();
      return () => {};
    }, [activeTab])
  );

  useEffect(function() {
    const isModalShowing = showRescheduleModal === true;
    if (isModalShowing === true) {
      generateTimeSlots();
    }
  }, [rescheduleDate, showRescheduleModal]);

  function generateTimeSlots() {
    const slots = [];
    const startHour = 9;
    const endHour = 18;

    let hour = startHour;
    while (hour < endHour) {
      const hourString = hour.toString();
      const paddedHourString = hourString.padStart(2, '0');
      const slot1 = paddedHourString + ':00';
      const slot2 = paddedHourString + ':30';
      slots.push(slot1);
      slots.push(slot2);
      hour = hour + 1;
    }
    
    setAvailableSlots(slots);
  }

  async function fetchBookedSlots(date) {
  try {
    const businessId = selectedBooking?.business?. id;
    if (!businessId) {
      console.log('⚠️ No business ID');
      setBookedSlots([]);
      return;
    }

    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('📅 Fetching booked slots for:', dateString, 'Business:', businessId);

    setLoadingBookedSlots(true);

    const url = API_BASE_URL + '/appointments/business/' + businessId + '/booked-slots?  date=' + dateString;
    console.log('📤 URL:', url);

    const authHeader = 'Bearer ' + token;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Booked slots:', data);
      setBookedSlots(data);  // Array of times like ["09:00", "09:30", "10:00"]
    } else {
      console.log('⚠️ No booked slots found');
      setBookedSlots([]);
    }
  } catch (error) {
    console.error('❌ Error fetching booked slots:', error);
    setBookedSlots([]);
  } finally {
    setLoadingBookedSlots(false);
  }
}

// ✅ UPDATE useEffect to fetch booked slots
useEffect(function() {
  const isModalShowing = showRescheduleModal === true;
  if (isModalShowing === true) {
    generateTimeSlots();
    fetchBookedSlots(rescheduleDate);  // ✅ ADD THIS
  }
}, [rescheduleDate, showRescheduleModal]);

// ✅ UPDATE time slots rendering in the modal
{availableSlots.map(function(time, index) {
  const isSelected = rescheduleTime === time;
  const isBooked = bookedSlots.includes(time);  // ✅ CHECK IF BOOKED
  
  let buttonBgColor = '#f9fafb';
  let buttonBorderColor = '#e5e7eb';
  let textColor = '#374151';

  // ✅ GRAY OUT BOOKED SLOTS
  if (isBooked === true) {
    buttonBgColor = '#f3f4f6';
    buttonBorderColor = '#d1d5db';
    textColor = '#9ca3af';
  } else if (isSelected === true) {
    buttonBgColor = '#7c3aed';
    buttonBorderColor = '#7c3aed';
    textColor = '#ffffff';
  }

  let marginRight = '3. 5%';
  const indexPlusOne = index + 1;
  const remainder = indexPlusOne % 3;
  const isLastInRow = remainder === 0;
  
  if (isLastInRow === true) {
    marginRight = 0;
  }

  return (
    <TouchableOpacity
      key={index}
      style={{
        width: '31%',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 2,
        marginBottom: 12,
        backgroundColor: buttonBgColor,
        borderColor: buttonBorderColor,
        marginRight: marginRight,
        opacity: isBooked === true ? 0.5 : 1,  // ✅ MORE TRANSPARENT
      }}
      onPress={function() {
        // ✅ ONLY SELECT IF NOT BOOKED
        if (isBooked === false) {
          setRescheduleTime(time);
        }
      }}
      disabled={isBooked === true}  // ✅ DISABLE BOOKED SLOTS
      activeOpacity={isBooked === true ? 1 : 0.7}
    >
      <Text style={{
        textAlign: 'center',
        fontWeight: '700',
        fontSize: 14,
        color: textColor,
      }}>
        {formatTime12Hour(time)}
        {isBooked === true && '\n❌'}  // ✅ SHOW X FOR BOOKED
      </Text>
    </TouchableOpacity>
  );
})}

  // ✅ NEW: Check if booking has a rating
  async function checkForExistingRating(bookingId) {
    try {
      console.log('🔍 Checking rating for appointment:', bookingId);

      // Don't check multiple times
      if (checkingRatings[bookingId] === true) {
        return;
      }

      setCheckingRatings(prev => ({
        ...prev,
        [bookingId]: true
      }));

      const url = API_BASE_URL + '/ratings/appointment/' + bookingId;
      console.log('📤 Request URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Response Status:', response.status);

      if (response.ok) {
        console.log('✅ Rating found for appointment:', bookingId);
        setBookingRatings(prev => ({
          ...prev,
          [bookingId]: true  // ✅ Has rating
        }));
      } else if (response.status === 404) {
        console.log('⚠️ No rating found for appointment:', bookingId);
        setBookingRatings(prev => ({
          ...prev,
          [bookingId]: false  // ✅ No rating
        }));
      } else {
        console.error('❌ Unexpected response:', response.status);
        setBookingRatings(prev => ({
          ...prev,
          [bookingId]: false
        }));
      }
    } catch (error) {
      console.error('❌ Error checking rating:', error);
      setBookingRatings(prev => ({
        ...prev,
        [bookingId]: false
      }));
    } finally {
      setCheckingRatings(prev => ({
        ...prev,
        [bookingId]: false
      }));
    }
  }

  async function fetchBookings() {
    try {
      let userId = null;
      const hasUser = user !== null && user !== undefined;
      if (hasUser === true) {
        userId = user.id;
      }
      
      console.log('📥 Fetching bookings for user:', userId);
      
      const apiUrl = API_BASE_URL + '/appointments/user/' + userId;
      console.log('🔗 API URL:', apiUrl);

      const hasUserId = userId !== null && userId !== undefined;
      if (hasUserId === false) {
        console.log('❌ No user ID found');
        setLoading(false);
        return;
      }

      const authHeader = 'Bearer ' + token;
      const requestHeaders = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      };
      
      const requestOptions = {
        method: 'GET',
        headers: requestHeaders,
      };
      
      const response = await fetch(apiUrl, requestOptions);

      const responseStatus = response.status;
      console.log('📡 Response status:', responseStatus);

      const isResponseOk = response.ok;
      if (isResponseOk === true) {
        const data = await response.json();
        console.log('✅ Bookings received:', data.length);

        const now = new Date();
        const filteredBookings = [];
        
        let dataIndex = 0;
        while (dataIndex < data.length) {
          const appointment = data[dataIndex];
          const appointmentDateTimeString = appointment.appointmentDateTime;
          const appointmentDate = new Date(appointmentDateTimeString);
          
          const isUpcomingTab = activeTab === 'upcoming';
          if (isUpcomingTab === true) {
            const isFutureAppointment = appointmentDate >= now;
            const appointmentStatus = appointment.status;
            const isConfirmed = appointmentStatus === 'CONFIRMED';
            const shouldInclude = isFutureAppointment === true && isConfirmed === true;
            
            if (shouldInclude === true) {
              filteredBookings.push(appointment);
            }
          } else {
            const isPastAppointment = appointmentDate < now;
            const appointmentStatus = appointment.status;
            const isCancelled = appointmentStatus === 'CANCELLED';
            const isCompleted = appointmentStatus === 'COMPLETED';
            const shouldInclude = isPastAppointment === true || isCancelled === true || isCompleted === true;
            
            if (shouldInclude === true) {
              filteredBookings.push(appointment);
            }
          }
          
          dataIndex = dataIndex + 1;
        }

        const sortedBookings = filteredBookings.sort(function(a, b) {
          const dateAString = a.appointmentDateTime;
          const dateBString = b. appointmentDateTime;
          const dateA = new Date(dateAString);
          const dateB = new Date(dateBString);
          
          const isUpcomingTab = activeTab === 'upcoming';
          if (isUpcomingTab === true) {
            const difference = dateA - dateB;
            return difference;
          } else {
            const difference = dateB - dateA;
            return difference;
          }
        });

        const sortedBookingsLength = sortedBookings.length;
        const logMessage = '📋 ' + activeTab + ' bookings: ' + sortedBookingsLength. toString();
        console.log(logMessage);
        
        setBookings(sortedBookings);

        // ✅ NEW: Check ratings for completed bookings
        let bookingIndex = 0;
        while (bookingIndex < sortedBookings.length) {
          const booking = sortedBookings[bookingIndex];
          const bookingStatus = booking.status;
          const isCompleted = bookingStatus === 'COMPLETED';
          
          if (isCompleted === true) {
            const bookingId = booking.id;
            checkForExistingRating(bookingId);
          }
          
          bookingIndex = bookingIndex + 1;
        }

      } else {
        const errorText = await response.text();
        console. error('❌ Failed to fetch bookings:', errorText);
        Alert.alert('Error', 'Failed to load bookings');
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      Alert.alert('Error', 'Network error.  Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    fetchBookings();
  }

  function handleCancelBooking(bookingId) {
    const alertButtons = [
      { 
        text: 'Keep Booking', 
        style: 'cancel' 
      },
      {
        text: 'Cancel Booking',
        style: 'destructive',
        onPress: function() {
          cancelBooking(bookingId);
        },
      },
    ];
    
    Alert.alert(
      'Cancel Booking? ',
      'This action cannot be undone. Are you sure? ',
      alertButtons
    );
  }

  async function cancelBooking(bookingId) {
    try {
      console.log('🗑️ Cancelling booking:', bookingId);

      const userId = user. id;
      const apiUrl = API_BASE_URL + '/appointments/' + bookingId. toString() + '/cancel? userId=' + userId. toString();
      
      const authHeader = 'Bearer ' + token;
      const requestHeaders = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      };
      
      const requestOptions = {
        method: 'PUT',
        headers: requestHeaders,
      };
      
      const response = await fetch(apiUrl, requestOptions);

      const isResponseOk = response.ok;
      if (isResponseOk === true) {
        console. log('✅ Booking cancelled');
        Alert.alert('Cancelled', 'Your booking has been cancelled');
        fetchBookings();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to cancel:', errorText);
        Alert.alert('Error', 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('❌ Error cancelling booking:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  }

  // ✅ NEW: Handle navigate to review screen
  function handleLeaveReview(booking) {
  console.log('⭐ Navigating to review screen for booking:', booking.id);
  
  const business = booking.business;
  const businessId = business.id;
  const businessName = business.businessName;
  const appointmentId = booking.id;
  const userId = user. id;
  
  // ❌ CHANGE THIS LINE:
  navigation.navigate('RateBusiness', {  // ← Changed from 'RateBusinessScreen'
    businessId: businessId,
    businessName: businessName,
    appointmentId: appointmentId,
    userId: userId,
  });
}

  function handleOpenRescheduleModal(booking) {
    const bookingId = booking.id;
    console.log('📅 Opening reschedule modal for booking:', bookingId);
    
    setSelectedBooking(booking);
    
    const tomorrow = new Date();
    const currentDays = tomorrow.getDate();
    const tomorrowDays = currentDays + 1;
    tomorrow.setDate(tomorrowDays);
    
    setRescheduleDate(tomorrow);
    setTempRescheduleDate(tomorrow);
    setRescheduleTime(null);
    setShowDatePicker(false);
    setShowRescheduleModal(true);
  }

  function handleCloseRescheduleModal() {
    console.log('❌ Closing reschedule modal');
    
    setShowRescheduleModal(false);
    setSelectedBooking(null);
    
    const tomorrow = new Date();
    const currentDays = tomorrow.getDate();
    const tomorrowDays = currentDays + 1;
    tomorrow.setDate(tomorrowDays);
    
    setRescheduleDate(tomorrow);
    setTempRescheduleDate(tomorrow);
    setRescheduleTime(null);
    setShowDatePicker(false);
  }

  function formatDate(date) {
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formattedDate;
  }

  function formatDateShort(date) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = date.getMonth();
    const monthName = monthNames[month];
    const day = date.getDate();
    const year = date.getFullYear();
    const dayString = day.toString();
    const yearString = year.toString();
    const formatted = monthName + ' ' + dayString + ', ' + yearString;
    return formatted;
  }

  function formatTime12Hour(time24) {
    const parts = time24.split(':');
    const hours = parts[0];
    const minutes = parts[1];
    const hourNumber = parseInt(hours);
    
    let ampm = 'AM';
    const isAfternoon = hourNumber >= 12;
    if (isAfternoon === true) {
      ampm = 'PM';
    }
    
    let hour12 = hourNumber % 12;
    const isMidnight = hour12 === 0;
    if (isMidnight === true) {
      hour12 = 12;
    }
    
    const hour12String = hour12.toString();
    const formattedTime = hour12String + ':' + minutes + ' ' + ampm;
    return formattedTime;
  }

  async function handleRescheduleConfirm() {
    const hasRescheduleTime = rescheduleTime !== null && rescheduleTime !== undefined;
    if (hasRescheduleTime === false) {
      Alert.alert('Missing Information', 'Please select a time for your appointment');
      return;
    }

    console.log('🔄 Starting reschedule process.. .');
    
    const bookingId = selectedBooking.id;
    console.log('📋 Booking ID:', bookingId);
    console.log('📅 New Date:', rescheduleDate);
    console.log('⏰ New Time:', rescheduleTime);
    
    const userId = user.id;
    console.log('👤 User ID:', userId);

    setRescheduling(true);

    try {
      const dateISOString = rescheduleDate.toISOString();
      const dateParts = dateISOString. split('T');
      const dateStr = dateParts[0];
      const newDateTime = dateStr + 'T' + rescheduleTime + ':00';

      console.log('📤 New DateTime:', newDateTime);

      const encodedDateTime = encodeURIComponent(newDateTime);
      const bookingIdString = bookingId.toString();
      const userIdString = userId.toString();
      const url = API_BASE_URL + '/appointments/' + bookingIdString + '/reschedule?newDateTime=' + encodedDateTime + '&userId=' + userIdString;
      
      console.log('📤 FULL URL:', url);

      const authHeader = 'Bearer ' + token;
      const requestHeaders = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      };
      
      const requestOptions = {
        method: 'PUT',
        headers: requestHeaders,
      };
      
      const response = await fetch(url, requestOptions);

      const responseStatus = response.status;
      console.log('📥 Response status:', responseStatus);

      const responseText = await response.text();
      console.log('📥 Response text:', responseText);

      const isResponseOk = response.ok;
      if (isResponseOk === true) {
        let data;
        try {
          data = JSON.parse(responseText);
          console.log('✅ Reschedule successful!  Data:', data);
        } catch (parseError) {
          console.log('✅ Reschedule successful!  (no JSON response)');
        }
        
        handleCloseRescheduleModal();
        
        const formattedDate = formatDateShort(rescheduleDate);
        const formattedTime = formatTime12Hour(rescheduleTime);
        const successMessage = 'Rescheduled to ' + formattedDate + ' at ' + formattedTime;
        
        const alertButtons = [
          {
            text: 'OK',
            onPress: function() {
              fetchBookings();
            },
          },
        ];
        
        Alert.alert('Rescheduled!  ✓', successMessage, alertButtons);
      } else {
        console.error('❌ Reschedule failed with status:', responseStatus);
        console.error('❌ Response text:', responseText);
        
        let errorMessage = 'Failed to reschedule appointment';
        try {
          const errorData = JSON.parse(responseText);
          const message = errorData.message;
          const error = errorData.error;
          
          const hasMessage = message !== null && message !== undefined;
          if (hasMessage === true) {
            errorMessage = message;
          } else {
            const hasError = error !== null && error !== undefined;
            if (hasError === true) {
              errorMessage = error;
            }
          }
        } catch (parseError) {
          const hasResponseText = responseText !== null && responseText !== undefined;
          if (hasResponseText === true) {
            errorMessage = responseText;
          }
        }
        
        Alert.alert('Unable to Reschedule', errorMessage);
      }
    } catch (error) {
      const errorMessage = error.message;
      console.error('❌ Network Error:', error);
      console.error('❌ Error details:', errorMessage);
      
      const alertMessage = 'Network error: ' + errorMessage;
      Alert.alert('Connection Error', alertMessage);
    } finally {
      setRescheduling(false);
    }
  }

  function isAppointmentNow(booking) {
    const appointmentDateTimeString = booking.appointmentDateTime;
    const appointmentDateTime = new Date(appointmentDateTimeString);
    const appointmentDateTimeMillis = appointmentDateTime.getTime();
    const sixtyMinutesInMillis = 60 * 60000;
    const appointmentEndTimeMillis = appointmentDateTimeMillis + sixtyMinutesInMillis;
    const appointmentEndTime = new Date(appointmentEndTimeMillis);
    
    const isAfterStart = currentTime >= appointmentDateTime;
    const isBeforeEnd = currentTime <= appointmentEndTime;
    const isBetween = isAfterStart === true && isBeforeEnd === true;
    
    return isBetween;
  }

  function isAppointmentSoon(booking) {
    const appointmentDateTimeString = booking. appointmentDateTime;
    const appointmentDateTime = new Date(appointmentDateTimeString);
    const timeDiff = appointmentDateTime - currentTime;
    const minutesDiff = timeDiff / 60000;
    
    const isPositive = minutesDiff > 0;
    const isWithin30Min = minutesDiff <= 30;
    const isSoon = isPositive === true && isWithin30Min === true;
    
    return isSoon;
  }

  function getRelativeTime(booking) {
    const appointmentDateTimeString = booking.appointmentDateTime;
    const appointmentDateTime = new Date(appointmentDateTimeString);
    const timeDiff = appointmentDateTime - currentTime;
    const minutesDiff = Math.floor(timeDiff / 60000);
    const hoursDiff = Math.floor(minutesDiff / 60);
    const daysDiff = Math. floor(hoursDiff / 24);

    const isNow = isAppointmentNow(booking);
    if (isNow === true) {
      return 'Now';
    }
    
    const isSoon = isAppointmentSoon(booking);
    if (isSoon === true) {
      const minutesString = minutesDiff.toString();
      const message = minutesString + 'm';
      return message;
    }
    
    const hasDays = daysDiff > 0;
    if (hasDays === true) {
      const daysString = daysDiff.toString();
      const message = daysString + 'd';
      return message;
    }
    
    const hasHours = hoursDiff > 0;
    if (hasHours === true) {
      const hoursString = hoursDiff.toString();
      const message = hoursString + 'h';
      return message;
    }
    
    return 'Soon';
  }

  function getStatusConfig(status) {
    let upperStatus = '';
    const hasStatus = status !== null && status !== undefined;
    if (hasStatus === true) {
      upperStatus = status.toUpperCase();
    }

    const isConfirmed = upperStatus === 'CONFIRMED';
    if (isConfirmed === true) {
      const config = {
        bgColor: '#10b981',
        textColor: '#ffffff',
        label: 'Confirmed'
      };
      return config;
    }
    
    const isCancelled = upperStatus === 'CANCELLED';
    if (isCancelled === true) {
      const config = {
        bgColor: '#ef4444',
        textColor: '#ffffff',
        label: 'Cancelled'
      };
      return config;
    }
    
    const isCompleted = upperStatus === 'COMPLETED';
    if (isCompleted === true) {
      const config = {
        bgColor: '#8b5cf6',
        textColor: '#ffffff',
        label: 'Completed'
      };
      return config;
    }
    
    const isNoShow = upperStatus === 'NO_SHOW';
    if (isNoShow === true) {
      const config = {
        bgColor: '#6b7280',
        textColor: '#ffffff',
        label: 'No Show'
      };
      return config;
    }
    
    let displayLabel = 'Unknown';
    if (hasStatus === true) {
      displayLabel = status;
    }
    
    const config = {
      bgColor: '#3b82f6',
      textColor: '#ffffff',
      label: displayLabel
    };
    return config;
  }

  function renderBookingCard(renderProps) {
    const item = renderProps.item;
    const itemStatus = item.status;
    const statusConfig = getStatusConfig(itemStatus);
    
    const appointmentNow = isAppointmentNow(item);
    const appointmentSoon = isAppointmentSoon(item);
    
    const appointmentDateTimeString = item.appointmentDateTime;
    const appointmentDate = new Date(appointmentDateTimeString);

    let businessName = 'Business';
    const hasBusiness = item.business !== null && item.business !== undefined;
    if (hasBusiness === true) {
      const hasBusinessName = item.business.businessName !== null && item.business. businessName !== undefined;
      if (hasBusinessName === true) {
        businessName = item.business.businessName;
      }
    }

    let serviceName = 'Service';
    const hasService = item.service !== null && item.service !== undefined;
    if (hasService === true) {
      const hasServiceName = item.service.serviceName !== null && item.service.serviceName !== undefined;
      if (hasServiceName === true) {
        serviceName = item.service.serviceName;
      }
    }

    let durationMinutes = 60;
    if (hasService === true) {
      const hasDurationMinutes = item.service. durationMinutes !== null && item. service.durationMinutes !== undefined;
      if (hasDurationMinutes === true) {
        durationMinutes = item.service.durationMinutes;
      }
    }

    let price = 0.00;
    if (hasService === true) {
      const hasPrice = item.service.price !== null && item.service.price !== undefined;
      if (hasPrice === true) {
        price = item.service.price;
      }
    }

    const formattedPrice = price.toFixed(2);

    const isUpcoming = activeTab === 'upcoming';
    const isConfirmed = itemStatus === 'CONFIRMED';
    const showActionButtons = isUpcoming === true && isConfirmed === true;

    // ✅ NEW: Check if completed and not reviewed
    const isCompleted = itemStatus === 'COMPLETED';
    const bookingId = item.id;
    const hasRating = bookingRatings[bookingId];
    const isCheckingRating = checkingRatings[bookingId];
    const showReviewButton = isCompleted === true && hasRating === false && isCheckingRating !== true;
    const showReviewedBadge = isCompleted === true && hasRating === true;

    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = appointmentDate.getMonth();
    const monthName = monthNames[month];
    const day = appointmentDate.getDate();
    const dayString = day.toString();

    const hours = appointmentDate.getHours();
    const minutes = appointmentDate.getMinutes();
    const minutesString = minutes.toString();
    const paddedMinutes = minutesString. padStart(2, '0');
    
    let ampm = 'AM';
    const isAfternoon = hours >= 12;
    if (isAfternoon === true) {
      ampm = 'PM';
    }
    
    let hour12 = hours % 12;
    const isMidnight = hour12 === 0;
    if (isMidnight === true) {
      hour12 = 12;
    }
    
    const hour12String = hour12.toString();
    const timeString = hour12String + ':' + paddedMinutes + ' ' + ampm;

    let accentColor = '#7c3aed';
    if (appointmentNow === true) {
      accentColor = '#ef4444';
    } else if (appointmentSoon === true) {
      accentColor = '#f59e0b';
    }

    const showTimeIndicator = isUpcoming === true && isConfirmed === true;

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
              <View style={{
                width: 70,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                paddingVertical: 12,
                marginRight: 16,
              }}>
                <Text style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#6b7280',
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
                  {dayString}
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

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#111827',
                    flex: 1,
                    marginRight: 8,
                  }}>
                    {businessName}
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

                {showTimeIndicator === true && (
                  <View style={{
                    backgroundColor: appointmentNow === true ? '#fee2e2' : appointmentSoon === true ? '#fef3c7' : '#f3f4f6',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                  }}>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: appointmentNow === true ? '#991b1b' : appointmentSoon === true ? '#92400e' : '#374151',
                    }}>
                      {appointmentNow === true && '🔴 '}
                      {appointmentSoon === true && '⏰ '}
                      {getRelativeTime(item)}
                    </Text>
                  </View>
                )}

                {/* ✅ NEW: Show "✅ Reviewed" badge if already reviewed */}
                {showReviewedBadge === true && (
                  <View style={{
                    backgroundColor: '#d1fae5',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    alignSelf: 'flex-start',
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Text style={{ fontSize: 14, marginRight: 4 }}>✅</Text>
                    <Text style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#059669',
                    }}>
                      Reviewed
                    </Text>
                  </View>
                )}

                <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 4 }}>⏱️</Text>
                    <Text style={{ fontSize: 13, color: '#6b7280', fontWeight: '600' }}>
                      {durationMinutes}min
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 4 }}>💰</Text>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#7c3aed' }}>
                      €{formattedPrice}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ✅ UPDATED: Action buttons - show reschedule/cancel OR review button */}
            {showActionButtons === true && (
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
                  onPress={function() {
                    handleOpenRescheduleModal(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>📅</Text>
                  <Text style={{ color: '#7c3aed', fontSize: 15, fontWeight: '700' }}>
                    Reschedule
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
                  onPress={function() {
                    const itemId = item.id;
                    handleCancelBooking(itemId);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 16, marginRight: 6 }}>✕</Text>
                  <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '700' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ✅ NEW: Review button for completed appointments without ratings */}
            {showReviewButton === true && (
              <View style={{
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
              }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 14,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    backgroundColor: '#faf5ff',
                  }}
                  onPress={function() {
                    handleLeaveReview(item);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>⭐</Text>
                  <Text style={{ color: '#7c3aed', fontSize: 16, fontWeight: '700' }}>
                    Leave Review
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  }

  function renderEmptyState() {
    const isUpcoming = activeTab === 'upcoming';
    
    let emoji = '📋';
    let title = 'No Past Bookings';
    let description = 'Your booking history will appear here';
    
    if (isUpcoming === true) {
      emoji = '📅';
      title = 'No Upcoming Bookings';
      description = 'Book a service to get started';
    }

    return (
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 100, paddingHorizontal: 32 }}>
        <View style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#f3f4f6',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 50 }}>
            {emoji}
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          {title}
        </Text>
        <Text style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
          {description}
        </Text>
        {isUpcoming === true && (
          <TouchableOpacity
            style={{
              backgroundColor: '#7c3aed',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              shadowColor: '#7c3aed',
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
            }}
            onPress={function() {
              navigation.goBack();
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
              Explore Services
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const minDate = new Date();
  const minDateCurrentDays = minDate.getDate();
  const minDateNewDays = minDateCurrentDays + 1;
  minDate.setDate(minDateNewDays);
  
  const maxDate = new Date();
  const maxDateCurrentDays = maxDate.getDate();
  const maxDateNewDays = maxDateCurrentDays + 60;
  maxDate.setDate(maxDateNewDays);

  const hasRescheduleTime = rescheduleTime !== null && rescheduleTime !== undefined;

  const isUpcomingTab = activeTab === 'upcoming';
  const isPastTab = activeTab === 'past';

  const bookingsCount = bookings.length;
  const bookingsCountString = bookingsCount. toString();

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{
        backgroundColor: '#7c3aed',
        paddingTop: 48,
        paddingBottom: 0,
      }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 }}>
            My Bookings
          </Text>
          <Text style={{ fontSize: 14, color: '#e9d5ff' }}>
            Manage your appointments
          </Text>
        </View>

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
              backgroundColor: isUpcomingTab === true ? '#ffffff' : 'transparent',
            }}
            onPress={function() {
              setActiveTab('upcoming');
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
              color: isUpcomingTab === true ? '#7c3aed' : '#e9d5ff',
            }}>
              Upcoming
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 8,
              backgroundColor: isPastTab === true ? '#ffffff' : 'transparent',
            }}
            onPress={function() {
              setActiveTab('past');
            }}
            activeOpacity={0.8}
          >
            <Text style={{
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
              color: isPastTab === true ?  '#7c3aed' : '#e9d5ff',
            }}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{
          height: 20,
          backgroundColor: '#f9fafb',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }} />
      </View>

      {loading === true ?  (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 15 }}>Loading... </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {bookingsCount > 0 && (
            <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6b7280', fontWeight: '600' }}>
                {bookingsCountString} {bookingsCount === 1 ? 'booking' : 'bookings'}
              </Text>
            </View>
          )}
          
          <FlatList
            data={bookings}
            renderItem={renderBookingCard}
            keyExtractor={function(item) {
              const hasId = item.id !== null && item.id !== undefined;
              if (hasId === true) {
                const itemId = item.id;
                const itemIdString = itemId.toString();
                return itemIdString;
              }
              return '';
            }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      )}

      {/* Reschedule Modal */}
      <Modal
        visible={showRescheduleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseRescheduleModal}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0. 6)' }}>
          <View style={{
            flex: 1,
            marginTop: 60,
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 20,
              borderBottomWidth: 1,
              borderBottomColor: '#f3f4f6',
            }}>
              <TouchableOpacity
                onPress={handleCloseRescheduleModal}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                }}
                activeOpacity={0.7}
              >
                <Text style={{ color: '#6b7280', fontSize: 16, fontWeight: '600' }}>✕ Close</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827' }}>
                Reschedule
              </Text>
              <View style={{ width: 70 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {selectedBooking && (
                <View style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 }}>
                    CURRENT BOOKING
                  </Text>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                    {(function() {
                      const hasService = selectedBooking.service !== null && selectedBooking.service !== undefined;
                      if (hasService === true) {
                        const hasServiceName = selectedBooking.service. serviceName !== null && selectedBooking. service.serviceName !== undefined;
                        if (hasServiceName === true) {
                          return selectedBooking.service.serviceName;
                        }
                      }
                      return 'Service';
                    })()}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>
                    {(function() {
                      const appointmentDateTimeString = selectedBooking.appointmentDateTime;
                      const appointmentDate = new Date(appointmentDateTimeString);
                      const dateStr = formatDateShort(appointmentDate);
                      const hours = appointmentDate.getHours();
                      const minutes = appointmentDate.getMinutes();
                      const minutesString = minutes.toString();
                      const paddedMinutes = minutesString.padStart(2, '0');
                      
                      let ampm = 'AM';
                      const isAfternoon = hours >= 12;
                      if (isAfternoon === true) {
                        ampm = 'PM';
                      }
                      
                      let hour12 = hours % 12;
                      const isMidnight = hour12 === 0;
                      if (isMidnight === true) {
                        hour12 = 12;
                      }
                      
                      const hour12String = hour12. toString();
                      const timeStr = hour12String + ':' + paddedMinutes + ' ' + ampm;
                      
                      return dateStr + ' at ' + timeStr;
                    })()}
                  </Text>
                </View>
              )}

              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
                Select New Date
              </Text>

              {showDatePicker === false && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#ffffff',
                    borderWidth: 2,
                    borderColor: '#7c3aed',
                    borderRadius: 14,
                    padding: 18,
                    marginBottom: 28,
                    alignItems: 'center',
                  }}
                  onPress={function() {
                    console.log('📅 Opening date picker');
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 4 }}>
                    {formatDateShort(rescheduleDate)}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#7c3aed', fontWeight: '600' }}>
                    Tap to change
                  </Text>
                </TouchableOpacity>
              )}

              {showDatePicker === true && (
                <View style={{
                  backgroundColor: '#ffffff',
                  borderWidth: 2,
                  borderColor: '#7c3aed',
                  borderRadius: 14,
                  marginBottom: 28,
                  overflow: 'hidden',
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#f5f3ff',
                  }}>
                    <TouchableOpacity
                      onPress={function() {
                        console.log('❌ Cancel date picker');
                        setShowDatePicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#7c3aed', fontWeight: '600', fontSize: 15 }}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={{ fontWeight: '700', color: '#111827', fontSize: 15 }}>Pick a Date</Text>
                    <TouchableOpacity
                      onPress={function() {
                        console.log('✅ Confirm date:', tempRescheduleDate);
                        setRescheduleDate(tempRescheduleDate);
                        setRescheduleTime(null);
                        setShowDatePicker(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ color: '#7c3aed', fontWeight: '700', fontSize: 15 }}>Done</Text>
                    </TouchableOpacity>
                  </View>

                  <DateTimePicker
                    value={tempRescheduleDate}
                    mode="date"
                    display="inline"
                    onChange={function(event, date) {
                      console.log('📅 Date changed to:', date);
                      if (date) {
                        setTempRescheduleDate(date);
                      }
                    }}
                    minimumDate={minDate}
                    maximumDate={maxDate}
                    accentColor="#7c3aed"
                    themeVariant="light"
                    style={{ backgroundColor: '#ffffff', height: 350 }}
                  />
                </View>
              )}

              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 }}>
                Select New Time
              </Text>

              <View style={{
                backgroundColor: '#ffffff',
                borderRadius: 14,
                padding: 4,
                marginBottom: 24,
              }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {availableSlots.map(function(time, index) {
                    const isSelected = rescheduleTime === time;
                    const indexPlusOne = index + 1;
                    const remainder = indexPlusOne % 3;
                    const isLastInRow = remainder === 0;

                    let buttonBgColor = '#f9fafb';
                    let buttonBorderColor = '#e5e7eb';
                    let textColor = '#374151';

                    if (isSelected === true) {
                      buttonBgColor = '#7c3aed';
                      buttonBorderColor = '#7c3aed';
                      textColor = '#ffffff';
                    }

                    let marginRight = '3. 5%';
                    if (isLastInRow === true) {
                      marginRight = 0;
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        style={{
                          width: '31%',
                          paddingVertical: 14,
                          borderRadius: 10,
                          borderWidth: 2,
                          marginBottom: 12,
                          backgroundColor: buttonBgColor,
                          borderColor: buttonBorderColor,
                          marginRight: marginRight,
                        }}
                        onPress={function() {
                          setRescheduleTime(time);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          textAlign: 'center',
                          fontWeight: '700',
                          fontSize: 14,
                          color: textColor,
                        }}>
                          {formatTime12Hour(time)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {hasRescheduleTime === true && (
                <View style={{
                  backgroundColor: '#d1fae5',
                  borderWidth: 2,
                  borderColor: '#6ee7b7',
                  padding: 18,
                  borderRadius: 14,
                  marginBottom: 24,
                  alignItems: 'center',
                }}>
                  <Text style={{ color: '#065f46', fontWeight: '700', fontSize: 16, marginBottom: 10 }}>
                    ✓ New Appointment
                  </Text>
                  <Text style={{ color: '#111827', fontWeight: '600', fontSize: 15, marginBottom: 4 }}>
                    {formatDateShort(rescheduleDate)}
                  </Text>
                  <Text style={{ color: '#111827', fontWeight: '700', fontSize: 17 }}>
                    {formatTime12Hour(rescheduleTime)}
                  </Text>
                </View>
              )}

              <View style={{ height: 100 }} />
            </ScrollView>

            {hasRescheduleTime === true && (
              <View style={{
                backgroundColor: '#ffffff',
                borderTopWidth: 1,
                borderTopColor: '#f3f4f6',
                paddingHorizontal: 20,
                paddingVertical: 16,
                paddingBottom: 32,
              }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 16,
                    borderRadius: 14,
                    backgroundColor: rescheduling === true ? '#a78bfa' : '#7c3aed',
                    shadowColor: '#7c3aed',
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                  }}
                  onPress={handleRescheduleConfirm}
                  disabled={rescheduling}
                  activeOpacity={0.8}
                >
                  {rescheduling === true ? (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={{ color: '#ffffff', fontSize: 17, fontWeight: '700', marginLeft: 10 }}>
                        Rescheduling...
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ color: '#ffffff', textAlign: 'center', fontSize: 17, fontWeight: '700' }}>
                      Confirm Reschedule
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default MyBookingsScreen;