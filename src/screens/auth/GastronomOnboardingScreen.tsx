import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const accentColor = '#BA943A';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export interface AddressData {
  formatted: string;
  street: string;
  postal_code: string;
  city: string;
  country: string;
  place_id?: string;
}

function parseAddressComponents(components: Array<{ long_name: string; types: string[] }>): Partial<AddressData> {
  const get = (type: string) => components.find((c) => c.types.includes(type))?.long_name || '';
  const streetNumber = get('street_number');
  const route = get('route');
  const street = [route, streetNumber].filter(Boolean).join(' ').trim() || get('subpremise') || get('premise');
  return {
    street: street || get('street_address'),
    postal_code: get('postal_code'),
    city: get('locality') || get('administrative_area_level_2') || get('administrative_area_level_1'),
    country: get('country'),
    formatted: '',
  };
}

export default function GastronomOnboardingScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [restaurantName, setRestaurantName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const addressDisplay = addressData?.formatted || '';
  const canProceedStep1 = !!addressDisplay && !!restaurantName.trim() && !!contactName.trim();
  const canProceedStep2 = !!phone.trim() && !!email.trim();

  function handleWeiterStep1() {
    if (canProceedStep1) setStep(2);
  }

  function handleWeiterStep2() {
    if (canProceedStep2) {
      navigation.navigate('Register', {
        role: 'gastronom',
        restaurantData: {
          addressData,
          restaurantName: restaurantName.trim(),
          contactName: contactName.trim(),
          phone: phone.trim(),
          email: email.trim(),
        },
      });
    }
  }

  function handlePlaceSelect(data: { description: string; place_id?: string }, details: any) {
    if (details?.address_components) {
      const parsed = parseAddressComponents(details.address_components);
      setAddressData({
        formatted: data.description,
        street: parsed.street || data.description,
        postal_code: parsed.postal_code || '–',
        city: parsed.city || '–',
        country: parsed.country || 'Deutschland',
        place_id: data.place_id,
      });
    } else {
      setAddressData({
        formatted: data.description,
        street: data.description,
        postal_code: '–',
        city: '–',
        country: 'Deutschland',
        place_id: data.place_id,
      });
    }
  }

  function handleManualAddressChange(text: string) {
    if (!GOOGLE_API_KEY) {
      setAddressData({
        formatted: text,
        street: text,
        postal_code: '–',
        city: '–',
        country: 'Deutschland',
      });
    }
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else navigation.goBack();
  }

  const inputStyle = styles.input;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: accentColor }]}>Erzähl uns etwas über dich</Text>
        <Text style={styles.subheading}>
          {step === 1 ? 'Dein Betrieb' : 'Kontaktdaten'}
        </Text>

        <View style={styles.formCard}>
          {step === 1 ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Name des Restaurants/Lokals</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="z.B. Restaurant Sonne"
                  placeholderTextColor="#9ca3af"
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Standort</Text>
                {GOOGLE_API_KEY ? (
                  <View style={styles.placesContainer}>
                    <GooglePlacesAutocomplete
                      placeholder="Adresse suchen (Straße, Stadt)..."
                      onPress={(data, details) => handlePlaceSelect(data, details)}
                      query={{
                        key: GOOGLE_API_KEY,
                        language: 'de',
                        components: 'country:de',
                        types: 'address',
                      }}
                      fetchDetails={true}
                      debounce={300}
                      styles={{
                        textInputContainer: { backgroundColor: 'transparent', paddingHorizontal: 0 },
                        textInput: {
                          backgroundColor: '#f9fafb',
                          borderRadius: 10,
                          padding: 16,
                          fontSize: 16,
                          color: '#1a1a1a',
                          borderWidth: 1,
                          borderColor: '#e5e7eb',
                          height: 52,
                        },
                        listView: { backgroundColor: '#fff', borderRadius: 10, marginTop: 4 },
                      }}
                    />
                  </View>
                ) : (
                  <TextInput
                    style={inputStyle}
                    placeholder="Straße, PLZ und Stadt eingeben"
                    placeholderTextColor="#9ca3af"
                    value={addressDisplay}
                    onChangeText={handleManualAddressChange}
                    autoCapitalize="words"
                  />
                )}
              </View>

              <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                <Text style={styles.label}>Ansprechpartner</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="Vollständiger Name"
                  placeholderTextColor="#9ca3af"
                  value={contactName}
                  onChangeText={setContactName}
                  autoCapitalize="words"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Telefonnummer</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="+49 123 456789"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                <Text style={styles.label}>E-Mail</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="name@beispiel.de"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.weiterButton, { backgroundColor: (step === 1 ? canProceedStep1 : canProceedStep2) ? accentColor : '#d1d5db' }]}
          onPress={step === 1 ? handleWeiterStep1 : handleWeiterStep2}
          activeOpacity={0.85}
          disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
        >
          <Text style={styles.weiterButtonText}>WEITER</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login', { role: 'gastronom' })} style={styles.kontoLink}>
          <Text style={[styles.kontoLinkText, { color: accentColor }]}>Hast du bereits ein Konto?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  iconButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  stepDotActive: {
    backgroundColor: accentColor,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldGroupLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  placesContainer: {
    marginBottom: 0,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  footer: {
    marginTop: 24,
  },
  weiterButton: {
    paddingVertical: 18,
    borderRadius: 30,
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
