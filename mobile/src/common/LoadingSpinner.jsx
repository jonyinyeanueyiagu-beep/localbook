import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const LoadingSpinner = ({ 
  size = 'large', 
  color = '#3b82f6',
  text,
  fullScreen = false,
}) => {
  if (fullScreen) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size={size} color={color} />
        {text && (
          <Text className="text-gray-600 mt-4 text-base">
            {text}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="justify-center items-center py-8">
      <ActivityIndicator size={size} color={color} />
      {text && (
        <Text className="text-gray-600 mt-3 text-sm">
          {text}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;