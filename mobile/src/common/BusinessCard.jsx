import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

function BusinessCard(props) {
  const business = props.business;
  const userLocation = props.userLocation;
  const onPress = props.onPress;

  // ⭐ GET RATING DATA
  const ratingSummary = business.ratingSummary;
  const hasRatingSummary = ratingSummary !== null && ratingSummary !== undefined;

  let averageRating = 0.0;
  let totalRatings = 0;
  let displayRating = '0.0';
  let hasRealRating = false;

  if (hasRatingSummary === true) {
    averageRating = ratingSummary.averageRating;
    totalRatings = ratingSummary.totalRatings;
    
    const hasRatings = totalRatings > 0;
    if (hasRatings === true) {
      hasRealRating = true;
      displayRating = averageRating.toFixed(1);
    }
  }

  // Get business name
  let businessName = 'Unnamed Business';
  const hasBusinessName = business.businessName !== null && business.businessName !== undefined;
  const hasName = business.name !== null && business.name !== undefined;
  
  if (hasBusinessName === true) {
    businessName = business.businessName;
  } else if (hasName === true) {
    businessName = business.name;
  }

  // Get category
  let category = 'General';
  const hasCategory = business.category !== null && business.category !== undefined;
  if (hasCategory === true) {
    category = business.category;
  }

  // Get location
  let locationText = 'Location not set';
  const hasAddress = business.address !== null && business.address !== undefined;
  const hasLocation = business.location !== null && business.location !== undefined;
  
  if (hasAddress === true) {
    locationText = business.address + ', Carlow';
  } else if (hasLocation === true) {
    locationText = business.location + ', Carlow';
  }

  // Get phone
  const phoneNumber = business.phoneNumber;
  const hasPhone = phoneNumber !== null && phoneNumber !== undefined;

  // Get image
  const imageUrl = business.imageUrl;
  const hasImage = imageUrl !== null && imageUrl !== undefined;

  // Get status
  const status = business.status;
  const isActive = status === 'ACTIVE';

  // Calculate distance
  let distance = null;
  const hasUserLocation = userLocation !== null && userLocation !== undefined;
  const hasBusinessLat = business.lat !== null && business.lat !== undefined;
  const hasBusinessLng = business.lng !== null && business.lng !== undefined;
  const canCalculateDistance = hasUserLocation === true && hasBusinessLat === true && hasBusinessLng === true;
  
  if (canCalculateDistance === true) {
    distance = calculateDistance(userLocation.lat, userLocation.lng, business.lat, business.lng);
  }

  const hasDistance = distance !== null;

  // Get category icon
  const categoryIcon = getCategoryIcon(category);

  function handlePress() {
    onPress(business);
  }

  return (
    <TouchableOpacity 
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white rounded-lg mb-3 overflow-hidden"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
      }}
    >
      {/* Image or Fallback */}
      {hasImage === true && (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-36 bg-gray-200"
          resizeMode="cover"
        />
      )}
      
      {hasImage === false && (
        <View className="w-full h-36 bg-gradient-to-br from-purple-400 to-blue-500 items-center justify-center">
          <Text className="text-6xl">{categoryIcon}</Text>
        </View>
      )}

      {/* Category Badge - Top right corner */}
      <View className="absolute top-2 right-2 bg-blue-500/90 px-2 py-0.5 rounded">
        <Text className="text-white text-xs font-bold uppercase">
          {category}
        </Text>
      </View>

      {/* Info Section */}
      <View className="p-2.5">
        {/* Business Name */}
        <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1}>
          {businessName}
        </Text>

        {/* Location & Distance Row */}
        <View className="flex-row items-center mb-1.5">
          <Text className="text-xs text-gray-600 flex-1" numberOfLines={1}>
            📍 {locationText}
          </Text>
          {hasDistance === true && (
            <Text className="text-xs font-semibold text-blue-600 ml-2">
              🚶 {distance} km
            </Text>
          )}
        </View>

        {/* Bottom Row - Rating & Status */}
        <View className="flex-row justify-between items-center">
          {/* Rating */}
          <View className="flex-row items-center">
            <Text className="text-xs mr-0.5">⭐</Text>
            <Text className="text-xs font-bold text-gray-900 mr-1">
              {displayRating}
            </Text>
            <Text className="text-xs text-gray-500">
              ({totalRatings})
            </Text>
          </View>

          {/* Status Badge */}
          {isActive === true && (
            <View className="bg-green-100 px-2 py-0.5 rounded">
              <Text className="text-xs text-green-700 font-semibold">Open</Text>
            </View>
          )}
        </View>

        {/* Phone number */}
        {hasPhone === true && (
          <Text className="text-xs text-gray-500 mt-1">
            📞 {phoneNumber}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const cosLat1 = Math.cos(lat1Rad);
  const cosLat2 = Math.cos(lat2Rad);
  
  const a = sinDLat * sinDLat + cosLat1 * cosLat2 * sinDLon * sinDLon;
  const sqrtA = Math.sqrt(a);
  const sqrt1MinusA = Math.sqrt(1 - a);
  const c = 2 * Math.atan2(sqrtA, sqrt1MinusA);
  const distance = R * c;
  
  const distanceFixed = distance.toFixed(1);
  return distanceFixed;
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    'Hair': '💇',
    'Hair Salon': '💇',
    'Salon': '💇',
    'Beauty': '💅',
    'Beauty Salon': '💅',
    'Spa': '💆',
    'Barber': '✂️',
  };
  
  const hasIcon = icons[category] !== null && icons[category] !== undefined;
  if (hasIcon === true) {
    return icons[category];
  }
  
  return '🏪';
}

export default BusinessCard;