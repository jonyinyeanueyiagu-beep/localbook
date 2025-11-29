import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const BusinessHours = ({ business }) => {
  console.log('🕐 BusinessHours component rendered');
  
  if (!business) {
    console.log('❌ No business provided');
    return null;
  }
  
  console.log('🕐 Raw openingHours:', business.openingHours);
  console.log('🕐 Type:', typeof business.openingHours);
  
  // Check if hours exist
  if (!business.openingHours) {
    console.log('⚠️ No opening hours set');
    return null;
  }
  
  // Parse the hours - handle both string and object
  let hours;
  try {
    let hoursData = business.openingHours;
    
    // If it's a string, parse it
    if (typeof hoursData === 'string') {
      console.log('📝 Parsing string...');
      hoursData = JSON.parse(hoursData);
      console.log('✅ First parse done:', hoursData);
      
      // Check if it's STILL a string (double-encoded)
      if (typeof hoursData === 'string') {
        console.log('📝 Double-encoded! Parsing again...');
        hoursData = JSON.parse(hoursData);
        console.log('✅ Second parse done:', hoursData);
      }
    }
    
    hours = hoursData;
    console.log('✅ Final hours object:', hours);
    
  } catch (error) {
    console.error('❌ Parse error:', error);
    console.error('❌ Problem data:', business.openingHours);
    return null;
  }
  
  // Verify we have a valid object
  if (!hours || typeof hours !== 'object') {
    console.log('❌ Hours is not an object:', typeof hours);
    return null;
  }
  
  // Get current day
  const now = new Date();
  const dayIndex = now.getDay();
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = daysOfWeek[dayIndex];
  
  console.log('📅 Today is:', today);
  
  const todayHours = hours[today];
  console.log('🕐 Today\'s hours:', todayHours);
  
  // Check if open now
  let isOpenNow = false;
  let statusText = 'CLOSED';
  let statusColor = '#dc2626';
  
  if (todayHours && todayHours.enabled) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;
    
    if (currentTime >= openTime && currentTime < closeTime) {
      isOpenNow = true;
      statusText = 'OPEN NOW';
      statusColor = '#10b981';
    }
    
    console.log('⏰ Time check:', { currentTime, openTime, closeTime, isOpenNow });
  }
  
  // Format time for display
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };
  
  // Get today's hours text
  let todayHoursText = 'Closed all day';
  if (todayHours && todayHours.enabled) {
    todayHoursText = `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`;
  }
  
  console.log('✅ Rendering component with status:', statusText);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🕐</Text>
        </View>
        <Text style={styles.title}>Opening Hours</Text>
      </View>
      
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>
      
      {/* Today's Hours */}
      <View style={styles.todaySection}>
        <Text style={styles.todayLabel}>TODAY</Text>
        <Text style={styles.todayHours}>{todayHoursText}</Text>
      </View>
      
      {/* Weekly Schedule */}
      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>Weekly Schedule</Text>
        {daysOfWeek.map((day, index) => {
          const dayName = day.charAt(0).toUpperCase() + day.slice(1);
          const dayHours = hours[day];
          const isToday = day === today;
          
          let hoursText = 'Closed';
          if (dayHours && dayHours.enabled) {
            hoursText = `${formatTime(dayHours.open)} - ${formatTime(dayHours.close)}`;
          }
          
          return (
            <View 
              key={day} 
              style={[
                styles.scheduleRow,
                isToday && styles.scheduleRowToday
              ]}
            >
              <Text style={[
                styles.dayName,
                isToday && styles.dayNameToday
              ]}>
                {dayName}
              </Text>
              <Text style={[
                styles.dayHours,
                isToday && styles.dayHoursToday,
                (!dayHours || !dayHours.enabled) && styles.closedText
              ]}>
                {hoursText}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f5f3ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  todaySection: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 6,
    letterSpacing: 1,
  },
  todayHours: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  scheduleContainer: {
    marginTop: 8,
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scheduleRowToday: {
    backgroundColor: '#faf5ff',
    paddingHorizontal: 12,
    marginHorizontal: -12,
    borderRadius: 8,
    borderBottomWidth: 0,
  },
  dayName: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  dayNameToday: {
    color: '#7c3aed',
    fontWeight: '700',
  },
  dayHours: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  dayHoursToday: {
    color: '#111827',
    fontWeight: '700',
  },
  closedText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
});

export default BusinessHours;