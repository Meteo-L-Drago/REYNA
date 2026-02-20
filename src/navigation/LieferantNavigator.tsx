import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSupplierAccess } from '../hooks/useSupplierAccess';
import ProductsScreen from '../screens/lieferant/ProductsScreen';
import AddProductScreen from '../screens/lieferant/AddProductScreen';
import SupplierOrdersScreen from '../screens/lieferant/SupplierOrdersScreen';
import LogistikPackScreen from '../screens/lieferant/LogistikPackScreen';
import BuchhaltungScreen from '../screens/lieferant/BuchhaltungScreen';
import VertriebScreen from '../screens/lieferant/VertriebScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const accentColor = '#BA943A';

function ProductsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1a1a1a',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#fafaf9' },
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Produkte' }} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Neues Produkt' }} />
    </Stack.Navigator>
  );
}

export default function LieferantNavigator() {
  const { user, signOut } = useAuth();
  const { supplierId, isAdmin, isTeamChief, teamType, loading } = useSupplierAccess(user?.id ?? null);

  const showProducts = isAdmin;
  const showOrders = isAdmin || (isTeamChief && teamType === 'logistik');
  const showVersand = isAdmin || isTeamChief || teamType === 'logistik';
  const showRechnungen = isAdmin || (isTeamChief && teamType === 'buchhaltung') || teamType === 'buchhaltung';
  const showVertrieb = isAdmin || (isTeamChief && teamType === 'vertrieb') || teamType === 'vertrieb';

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }
  if (!supplierId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Kein Lieferanten-Zugriff.</Text>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Abmelden</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerRight = () => (
    <TouchableOpacity
      onPress={() => signOut()}
      style={{ marginRight: 16, paddingVertical: 8, paddingHorizontal: 4 }}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.7}
    >
      <Text style={{ color: accentColor, fontSize: 16, fontWeight: '600' }}>Abmelden</Text>
    </TouchableOpacity>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1a1a1a',
        headerRight,
        headerShown: true,
      }}
    >
      {showProducts && (
        <Tab.Screen
          name="ProductsTab"
          component={ProductsStack}
          options={{
            title: 'Produkte',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Ionicons name="cube" size={size} color={color} />,
          }}
        />
      )}
      {showOrders && (
        <Tab.Screen
          name="Orders"
          component={SupplierOrdersScreen}
          options={{
            title: 'Bestellungen',
            tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
          }}
        />
      )}
      {showVersand && (
        <Tab.Screen
          name="Versand"
          component={LogistikPackScreen}
          options={{
            title: 'Versand',
            tabBarIcon: ({ color, size }) => <Ionicons name="basket" size={size} color={color} />,
          }}
        />
      )}
      {showRechnungen && (
        <Tab.Screen
          name="Rechnungen"
          component={BuchhaltungScreen}
          options={{
            title: 'Rechnungen',
            tabBarIcon: ({ color, size }) => <Ionicons name="document-text" size={size} color={color} />,
          }}
        />
      )}
      {showVertrieb && (
        <Tab.Screen
          name="MeineKunden"
          component={VertriebScreen}
          options={{
            title: 'Meine Kunden',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
      )}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  signOutButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: accentColor,
    borderRadius: 12,
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
