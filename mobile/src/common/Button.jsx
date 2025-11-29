import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

const Button = ({ 
  onPress, 
  title, 
  variant = 'primary', 
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  className = '',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 active:bg-blue-600';
      case 'secondary':
        return 'bg-gray-200 active:bg-gray-300';
      case 'success':
        return 'bg-green-500 active:bg-green-600';
      case 'danger':
        return 'bg-red-500 active:bg-red-600';
      case 'outline':
        return 'bg-transparent border-2 border-blue-500 active:bg-blue-50';
      default:
        return 'bg-blue-500 active:bg-blue-600';
    }
  };

  const getTextClasses = () => {
    switch (variant) {
      case 'primary':
      case 'success':
      case 'danger':
        return 'text-white';
      case 'secondary':
        return 'text-gray-700';
      case 'outline':
        return 'text-blue-500';
      default:
        return 'text-white';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-3 py-2';
      case 'medium':
        return 'px-6 py-3';
      case 'large':
        return 'px-8 py-4';
      default:
        return 'px-6 py-3';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-lg
        items-center
        justify-center
        flex-row
        ${disabled || loading ? 'opacity-50' : 'opacity-100'}
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'secondary' || variant === 'outline' ? '#3b82f6' : '#ffffff'} 
          size="small"
        />
      ) : (
        <>
          {icon && <Text className="mr-2">{icon}</Text>}
          <Text className={`${getTextClasses()} ${getTextSizeClasses()} font-semibold`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;