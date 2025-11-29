import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  icon,
  multiline = false,
  numberOfLines = 1,
  editable = true,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`mb-4 ${className}`}>
      {label && (
        <Text className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </Text>
      )}
      
      <View className="relative">
        {icon && (
          <View className="absolute left-3 top-3 z-10">
            <Text className="text-lg">{icon}</Text>
          </View>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9ca3af"
          className={`
            border
            ${error ? 'border-red-500' : isFocused ? 'border-blue-500' : 'border-gray-300'}
            rounded-lg
            px-4
            ${icon ? 'pl-12' : 'px-4'}
            ${multiline ? 'py-3' : 'py-3'}
            bg-gray-50
            text-gray-900
            text-base
            ${!editable ? 'bg-gray-100' : ''}
          `}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3"
          >
            <Text className="text-lg">{showPassword ? '👁️' : '🔒'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-red-500 text-xs mt-1">
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;