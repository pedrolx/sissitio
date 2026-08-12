import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export function Button({ title, onPress, loading, variant = 'primary', disabled }: ButtonProps) {
  let bgColor = '#3E7C59'; // primary
  if (variant === 'secondary') bgColor = '#C17F59';
  if (variant === 'danger') bgColor = '#C17F59';

  const styles = StyleSheet.create({
    button: {
      backgroundColor: disabled ? '#A2B5A3' : bgColor,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginVertical: 8,
    },
    text: {
      color: '#FFFFFF',
      fontFamily: 'Inter',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  return (
    <TouchableOpacity style={styles.button} onPress={onPress} disabled={disabled || loading}>
      {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
}
