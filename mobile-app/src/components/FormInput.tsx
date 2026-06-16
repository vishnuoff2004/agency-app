import React, { useState, forwardRef } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle, KeyboardTypeOptions } from 'react-native';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string | null;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoFocus?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
}

const FormInput = forwardRef<TextInput, FormInputProps>(({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoFocus = false,
  disabled = false,
  style,
  inputMode,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label !== '' && <Text style={styles.label}>{label}</Text>}
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a0aec0"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoFocus={autoFocus}
        editable={!disabled}
        inputMode={inputMode}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 83, 14, 0.12)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1a1a2e',
  },
  inputFocused: {
    borderColor: '#306D29',
    backgroundColor: 'rgba(48, 109, 41, 0.02)',
  },
  inputError: {
    borderColor: '#c53030',
  },
  inputDisabled: {
    backgroundColor: '#f1f1f1',
    color: '#a0aec0',
  },
  errorText: {
    color: '#c53030',
    fontSize: 12,
    marginTop: 4,
  },
});

export default FormInput;
