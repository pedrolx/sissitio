import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export function Input(props: TextInputProps) {
  return <TextInput style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D2D2D2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Inter',
    fontSize: 16,
  },
});