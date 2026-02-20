import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import SupplierListScreen from '../screens/gastronom/SupplierListScreen';
import ProductCatalogScreen from '../screens/gastronom/ProductCatalogScreen';
import CartScreen from '../screens/gastronom/CartScreen';
import CheckoutScreen from '../screens/gastronom/CheckoutScreen';
import OrdersScreen from '../screens/gastronom/OrdersScreen';
import OrderDetailScreen from '../screens/gastronom/OrderDetailScreen';
import RestaurantProfileScreen from '../screens/gastronom/RestaurantProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const accentColor = '#BA943A';

function BrowseStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1a1a1a',
        headerTitleStyle: { fontWeight: '600', fontSize: 17 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#fafaf9' },
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen name="Suppliers" component={SupplierListScreen} options={{ title: 'Dashboard', headerShown: false }} />
      <Stack.Screen name="ProductCatalog" component={ProductCatalogScreen} options={{ title: 'Produkte' }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  const { signOut } = useAuth();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1a1a1a',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#fafaf9' },
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen
        name="OrdersList"
        component={OrdersScreen}
        options={{
          title: 'Meine Bestellungen',
          headerRight: () => (
            <TouchableOpacity onPress={signOut} style={{ marginRight: 16 }}>
              <Text style={{ color: accentColor, fontSize: 16, fontWeight: '600' }}>Abmelden</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Bestelldetails' }} />
    </Stack.Navigator>
  );
}

function CartStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1a1a1a',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: '#fafaf9' },
        freezeOnBlur: false,
      }}
    >
      <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Warenkorb' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Kasse' }} />
    </Stack.Navigator>
  );
}

export default function GastronomNavigator() {
  const { signOut } = useAuth();
  const { itemCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' },
        tabBarActiveTintColor: accentColor,
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: { backgroundColor: '#fafaf9' },
        headerTintColor: '#1a1a1a',
      }}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseStack}
        options={{
          title: 'Bestellen',
          headerShown: false,
          tabBarLabel: 'Bestellen',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={{
          title: 'Warenkorb',
          headerShown: false,
          tabBarLabel: 'Warenkorb',
          tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} />,
          tabBarBadge: itemCount() > 0 ? itemCount() : undefined,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersStack}
        options={{
          title: 'Bestellungen',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="receipt" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={RestaurantProfileScreen}
        options={{
          title: 'Profil',
          headerShown: true,
          headerStyle: { backgroundColor: '#fafaf9' },
          headerTintColor: '#1a1a1a',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
