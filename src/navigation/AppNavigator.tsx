import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import GastronomNavigator from './GastronomNavigator';
import LieferantNavigator from './LieferantNavigator';
import RoleSelectScreen from '../screens/auth/RoleSelectScreen';

const LOAD_TIMEOUT_MS = 5000;

export default function AppNavigator() {
  const { session, profile, loading, signOut } = useAuth();
  const [loadTimeout, setLoadTimeout] = useState(false);

  useEffect(() => {
    if (!loading) {
      setLoadTimeout(false);
      return;
    }
    const t = setTimeout(() => setLoadTimeout(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading && !loadTimeout) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#BA943A" />
      </View>
    );
  }
  if (loadTimeout) {
    return (
      <View style={[styles.centered, styles.timeoutBox]}>
        <Text style={styles.timeoutText}>Laden dauert zu lange.</Text>
        <Text style={styles.timeoutHint}>Prüfe Verbindung. Migration 011 ausgeführt?</Text>
        <TouchableOpacity style={styles.timeoutButton} onPress={() => signOut()}>
          <Text style={styles.timeoutButtonText}>Abmelden</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!session) {
    return <AuthNavigator />;
  }

  if (!profile || !profile.role) {
    return <RoleSelectScreen navigation={{ replace: () => {} }} />;
  }

  if (profile.role === 'lieferant') {
    return <LieferantNavigator />;
  }

  return <GastronomNavigator />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
  },
  timeoutBox: { padding: 24 },
  timeoutText: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 8 },
  timeoutHint: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  timeoutButton: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#BA943A', borderRadius: 12 },
  timeoutButtonText: { color: '#fff', fontWeight: '600' },
});
