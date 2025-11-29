import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const RatingStars = ({ 
  rating = 0, 
  size = 20, 
  editable = false, 
  onRatingChange = null,
  color = '#fbbf24',
  emptyColor = '#d1d5db'
}) => {
  // ✅ Ensure rating is between 0 and 5
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));
  
  function handleStarPress(starValue) {
    if (editable === true && onRatingChange !== null) {
      onRatingChange(starValue);
    }
  }

  const stars = [];
  let i = 1;
  while (i <= 5) {
    const isSelected = i <= normalizedRating;
    const starEmoji = isSelected ? '⭐' : '☆';
    const starColor = isSelected ? color : emptyColor;
    
    if (editable === true) {
      // ✅ EDITABLE - with color feedback
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={function() { handleStarPress(i); }}
      activeOpacity={0.6}
      style={{ marginRight: 4 }}
    >
      <Text style={{ 
        fontSize: size,
        color: starColor,
      }}>
        {starEmoji}
      </Text>
    </TouchableOpacity>
      );
    } else {
      // ✅ DISPLAY ONLY - read-only
      stars.push(
        <Text 
          key={i} 
          style={{ 
            fontSize: size,
            color: starColor,
            marginRight: 4,
          }}
        >
          {starEmoji}
        </Text>
      );
    }
    
    i = i + 1;
  }
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {stars}
    </View>
  );
};

export default RatingStars;