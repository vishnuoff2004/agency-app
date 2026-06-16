import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  id?: string;
}

export default function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isInteractionDisabled = disabled || loading;

  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryBtn;
      case 'outline':
        return styles.outlineBtn;
      case 'danger':
        return styles.dangerBtn;
      case 'primary':
      default:
        return styles.primaryBtn;
    }
  };

  const getButtonTextStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return styles.smBtn;
      case 'lg':
        return styles.lgBtn;
      case 'md':
      default:
        return styles.mdBtn;
    }
  };

  const getSizeTextStyles = () => {
    switch (size) {
      case 'sm':
        return styles.smText;
      case 'lg':
        return styles.lgText;
      case 'md':
      default:
        return styles.mdText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isInteractionDisabled}
      style={[
        styles.baseBtn,
        getButtonStyles(),
        getSizeStyles(),
        isInteractionDisabled && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'secondary' ? '#306D29' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <Text style={[styles.baseText, getButtonTextStyles(), getSizeTextStyles(), textStyle]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryBtn: {
    backgroundColor: '#306D29',
    borderColor: '#306D29',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderColor: '#0D530E',
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderColor: '#306D29',
  },
  dangerBtn: {
    backgroundColor: '#c53030',
    borderColor: '#c53030',
  },
  smBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  mdBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  lgBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#0D530E',
  },
  outlineText: {
    color: '#306D29',
  },
  dangerText: {
    color: '#FFFFFF',
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 16,
  },
});
