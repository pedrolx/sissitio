import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetInfo } from '../hooks/useNetInfo';

export function OfflineBanner() {
  const { isConnected } = useNetInfo();

  if (isConnected === null) return null;
  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ Modo offline – Dados salvos localmente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#C17F59',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Inter',
  },
});