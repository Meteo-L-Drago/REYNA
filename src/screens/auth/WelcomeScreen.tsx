import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { UserRole } from '../../types';

export default function WelcomeScreen({ navigation }: any) {
  const route = useRoute<any>();
  const [showRoleSelect, setShowRoleSelect] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (route.params?.showRoleSelect) {
      setShowRoleSelect(true);
      setSelectedRole(null);
    }
  }, [route.params?.showRoleSelect]);

  function handleLoslegen() {
    setShowRoleSelect(true);
    setSelectedRole(null);
  }

  function handleWeiter() {
    if (selectedRole === 'gastronom') {
      navigation.navigate('GastronomOnboarding');
    } else if (selectedRole === 'lieferant') {
      navigation.navigate('Register', { role: 'lieferant' });
    }
  }

  // Akzentfarbe: warmes Gold/Ocker vom Welcome-Hintergrund (Referenz)
  const accentColor = '#BA943A';

  function handleBack() {
    setShowRoleSelect(false);
  }

  function handleHelp() {
    Alert.alert('Hilfe', 'Wähle die Option, die dein Unternehmen am besten beschreibt. Als Gastronom bestellst du Ware bei Lieferanten. Als Lieferant bietest du Produkte an und erhältst Bestellungen.');
  }

  function handleBereitsKonto() {
    navigation.navigate('Login', { role: selectedRole ?? 'gastronom' });
  }

  if (showRoleSelect) {
    return (
      <View style={[styles.roleSelectScreen, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.roleHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={28} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleHelp} style={styles.iconButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="help-circle-outline" size={28} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.roleContent}>
          <Text style={[styles.roleHeading, { color: accentColor }]}>Erzähl uns etwas über dich</Text>
          <Text style={styles.roleQuestion}>Was beschreibt dein Unternehmen am besten?</Text>
          <View style={styles.roleBars}>
            <TouchableOpacity
              style={[
                styles.roleBar,
                selectedRole === 'gastronom' && [styles.roleBarSelected, { borderColor: accentColor, backgroundColor: 'rgba(186, 148, 58, 0.08)' }],
              ]}
              onPress={() => setSelectedRole('gastronom')}
              activeOpacity={0.8}
            >
              <View style={styles.roleBarInner}>
                <Text style={styles.roleBarText}>Ein Restaurant, Café, Bar oder ähnlich</Text>
                <View style={[styles.radioOuter, selectedRole === 'gastronom' && { borderColor: accentColor }]}>
                  {selectedRole === 'gastronom' && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleBar,
                selectedRole === 'lieferant' && [styles.roleBarSelected, { borderColor: accentColor, backgroundColor: 'rgba(186, 148, 58, 0.08)' }],
              ]}
              onPress={() => setSelectedRole('lieferant')}
              activeOpacity={0.8}
            >
              <View style={styles.roleBarInner}>
                <Text style={styles.roleBarText}>Ein Lieferant, Hersteller oder ähnlich</Text>
                <View style={[styles.radioOuter, selectedRole === 'lieferant' && { borderColor: accentColor }]}>
                  {selectedRole === 'lieferant' && <View style={[styles.radioInner, { backgroundColor: accentColor }]} />}
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.roleFooter}>
          <TouchableOpacity
            style={[styles.weiterButton, { backgroundColor: selectedRole ? accentColor : '#d1d5db' }]}
            onPress={handleWeiter}
            activeOpacity={0.85}
            disabled={!selectedRole}
          >
            <Text style={styles.weiterButtonText}>WEITER</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleBereitsKonto} style={styles.kontoLink}>
            <Text style={[styles.kontoLinkText, { color: accentColor }]}>Hast du bereits ein Konto?</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { width: winWidth, height: winHeight } = Dimensions.get('window');

  return (
    <ImageBackground
      source={require('../../../assets/pexels-cottonbro-4676401.jpg')}
      style={[styles.welcomeWrapper, { width: winWidth, minHeight: winHeight }]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 48 }]}>
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>REYNA</Text>
          <Text style={styles.slogan}>Bestellen. Bekommen. Verdienen.</Text>
        </View>
        <View style={styles.spacer} />
        <TouchableOpacity
          style={[styles.loslegenButton, { backgroundColor: accentColor }]}
          onPress={handleLoslegen}
          activeOpacity={0.85}
        >
          <Text style={styles.loslegenText}>Loslegen</Text>
        </TouchableOpacity>
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.testZugangButton, { borderWidth: 2, borderColor: accentColor, borderRadius: 30, paddingVertical: 14, paddingHorizontal: 32 }]}
            onPress={() => navigation.navigate('Login', { role: 'lieferant', openTestZugang: true })}
          >
            <Text style={[styles.testZugangText, { color: accentColor, fontWeight: '700' }]}>Test-Zugang</Text>
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  welcomeWrapper: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoBlock: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 52,
    fontWeight: '800',
    letterSpacing: 14,
    color: '#1a1a1a',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  slogan: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2d2d2d',
    marginTop: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  spacer: {
    flex: 1,
  },
  loslegenButton: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loslegenText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  testZugangButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  testZugangText: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleSelectScreen: {
    flex: 1,
    backgroundColor: '#fafaf9',
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconButton: {
    padding: 4,
  },
  roleContent: {
    flex: 1,
  },
  roleHeading: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    color: '#0f172a',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  roleQuestion: {
    fontSize: 17,
    color: '#334155',
    marginBottom: 24,
    lineHeight: 24,
  },
  roleBars: {
  },
  roleBar: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  roleBarSelected: {
    borderWidth: 2,
  },
  roleBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleBarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  roleFooter: {
    marginTop: 24,
  },
  weiterButton: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  weiterButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  kontoLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  kontoLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
