import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../types';

const accentColor = '#BA943A';

const TEST_PASSWORD = 'ReynaTest123!';
const TEST_GASTRONOM = { email: 'gastronom@test.com', password: TEST_PASSWORD };
const TEST_GROSSHAENDLER = { email: 'lieferant@test.com', password: TEST_PASSWORD };
const TEST_ACCOUNTS = {
  admin: { email: 'lieferant@test.com', password: TEST_PASSWORD },
  logistik: { email: 'test-logistik@reyna.demo', password: TEST_PASSWORD },
  buchhaltung: { email: 'test-buchhaltung@reyna.demo', password: TEST_PASSWORD },
  vertrieb: { email: 'test-vertrieb@reyna.demo', password: TEST_PASSWORD },
};

type LoginMode = 'email' | 'phone';

function formatPhoneForSupabase(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = '49' + cleaned.slice(1);
  else if (!cleaned.startsWith('49')) cleaned = '49' + cleaned;
  return '+' + cleaned;
}

export default function LoginScreen({ navigation, route }: any) {
  const role: UserRole = route.params?.role ?? 'gastronom';
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<LoginMode>('email');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTestZugang, setShowTestZugang] = useState(false);
  useEffect(() => {
    if (route.params?.openTestZugang) setShowTestZugang(true);
  }, [route.params?.openTestZugang]);

  async function handleEmailLogin() {
    if (!usernameOrEmail.trim() || !password) {
      Alert.alert('Fehler', 'E-Mail und Passwort eingeben.');
      return;
    }
    const email = usernameOrEmail.trim();
    if (!email.includes('@')) {
      Alert.alert('Hinweis', 'Bitte gib deine E-Mail-Adresse ein.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Anmeldung fehlgeschlagen', error.message);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      Alert.alert('Fehler', 'Handynummer eingeben.');
      return;
    }
    setLoading(true);
    const formattedPhone = formatPhoneForSupabase(phone.trim());
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    setLoading(false);
    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    setOtpSent(true);
    Alert.alert('Code gesendet', 'Du hast eine SMS mit dem Bestätigungscode erhalten.');
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) {
      Alert.alert('Fehler', 'Code eingeben.');
      return;
    }
    setLoading(true);
    const formattedPhone = formatPhoneForSupabase(phone.trim());
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp.trim(),
      type: 'sms',
    });
    setLoading(false);
    if (error) {
      Alert.alert('Verifizierung fehlgeschlagen', error.message);
    }
  }

  const handleLogin = () => {
    if (mode === 'email') handleEmailLogin();
    else if (otpSent) handleVerifyOtp();
    else handleSendOtp();
  };

  async function handleTestLoginGastronom() {
    setUsernameOrEmail(TEST_GASTRONOM.email);
    setPassword(TEST_GASTRONOM.password);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: TEST_GASTRONOM.email,
      password: TEST_GASTRONOM.password,
    });
    setLoading(false);
    if (error) {
      Alert.alert(
        'Test-Account nicht gefunden',
        'Erstelle den Account: node scripts/seed-test-accounts.js',
      );
    }
  }

  async function handleTestLoginGrosshaendler() {
    setUsernameOrEmail(TEST_GROSSHAENDLER.email);
    setPassword(TEST_GROSSHAENDLER.password);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: TEST_GROSSHAENDLER.email,
      password: TEST_GROSSHAENDLER.password,
    });
    setLoading(false);
    if (error) {
      Alert.alert(
        'Test-Account nicht gefunden',
        'Erstelle den Account: node scripts/seed-test-accounts.js',
      );
    }
  }

  async function handleTestZugang(role: keyof typeof TEST_ACCOUNTS) {
    setShowTestZugang(false);
    const cred = TEST_ACCOUNTS[role];
    if (!cred) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: cred.email, password: cred.password });
    setLoading(false);
    if (error) {
      Alert.alert('Test-Zugang', 'Accounts anlegen: node scripts/seed-test-accounts.js');
    }
  }

  const canSubmit =
    mode === 'email'
      ? !!usernameOrEmail.trim() && !!password
      : !!phone.trim() && (otpSent ? !!otp.trim() : true);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + 16 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: accentColor }]}>Willkommen zurück!</Text>
        <Text style={styles.subheading}>Melde dich bei deinem Konto an</Text>

        <View style={styles.formCard}>
          {mode === 'email' ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nutzername oder E-Mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@beispiel.de"
                  placeholderTextColor="#9ca3af"
                  value={usernameOrEmail}
                  onChangeText={setUsernameOrEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                <Text style={styles.label}>Passwort</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Passwort eingeben"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                />
              </View>
              {__DEV__ && (
                <TouchableOpacity style={styles.modeSwitch} onPress={() => setMode('phone')}>
                  <Text style={[styles.modeSwitchText, { color: accentColor }]}>Mit Handynummer anmelden</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Handynummer</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+49 123 456789"
                  placeholderTextColor="#9ca3af"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
              {otpSent && (
                <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                  <Text style={styles.label}>Bestätigungscode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Code aus der SMS"
                    placeholderTextColor="#9ca3af"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}
              <TouchableOpacity style={styles.modeSwitch} onPress={() => { setMode('email'); setOtpSent(false); setOtp(''); }}>
                <Text style={[styles.modeSwitchText, { color: accentColor }]}>Mit E-Mail anmelden</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: loading || !canSubmit ? '#d1d5db' : accentColor }]}
          onPress={handleLogin}
          disabled={loading || !canSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.loginButtonText}>
            {loading ? 'Bitte warten...' : mode === 'email' ? 'ANMELDEN' : otpSent ? 'VERIFIZIEREN' : 'CODE SENDEN'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Welcome', { showRoleSelect: true })}
        >
          <Text style={[styles.linkText, { color: accentColor }]}>Noch kein Konto? Jetzt registrieren</Text>
        </TouchableOpacity>
        {__DEV__ && (
          role === 'gastronom' ? (
            <TouchableOpacity style={[styles.testLoginButton, styles.testZugangHighlight]} onPress={handleTestLoginGastronom}>
              <Text style={[styles.testLoginText, { color: accentColor, fontWeight: '700' }]}>Test-Login: Gastronom</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.testLoginButton, styles.testZugangHighlight]} onPress={() => setShowTestZugang(true)}>
              <Text style={[styles.testLoginText, { color: accentColor, fontWeight: '700' }]}>Test-Zugang</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      <Modal visible={showTestZugang} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowTestZugang(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalTitle, { color: accentColor }]}>Test-Zugang</Text>
            <Text style={styles.modalSubtitle}>Rolle wählen – direkt ohne Anmeldung</Text>
            {(['admin', 'logistik', 'buchhaltung', 'vertrieb'] as const).map((r) => (
              <TouchableOpacity key={r} style={styles.modalOption} onPress={() => handleTestZugang(r)} activeOpacity={0.8}>
                <Text style={styles.modalOptionText}>
                  {r === 'admin' ? 'Admin (Lieferant)' : r === 'logistik' ? 'Logistik' : r === 'buchhaltung' ? 'Buchhaltung' : 'Vertrieb'}
                </Text>
                <Text style={styles.modalOptionEmail}>{TEST_ACCOUNTS[r].email}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowTestZugang(false)}>
              <Text style={styles.modalCancelText}>Abbrechen</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  iconButton: {
    padding: 4,
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
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeSwitch: {
    marginTop: 16,
    alignItems: 'center',
  },
  modeSwitchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 24,
  },
  loginButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
  },
  linkButton: {
    marginTop: 20,
    marginBottom: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  testLoginButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  testZugangHighlight: {
    borderWidth: 2,
    borderColor: accentColor,
    borderRadius: 12,
    paddingVertical: 14,
  },
  testLoginText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  modalOption: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalOptionEmail: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  modalCancel: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '600',
  },
});
