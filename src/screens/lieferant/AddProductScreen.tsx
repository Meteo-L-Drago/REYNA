import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { uploadProductImage } from '../../lib/storage';

const accentColor = '#BA943A';

export default function AddProductScreen({ route, navigation }: any) {
  const { supplierId } = route.params;
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('Stück');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Berechtigung', 'Zugriff auf die Foto-Bibliothek ist erforderlich.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageBase64(asset.base64 ?? null);
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Fehler', 'Produktname eingeben.');
      return;
    }
    const priceCents = Math.round(parseFloat(price.replace(',', '.')) * 100);
    if (isNaN(priceCents) || priceCents < 0) {
      Alert.alert('Fehler', 'Gültigen Preis eingeben.');
      return;
    }
    setLoading(true);

    let imageUrl: string | null = null;
    if (imageBase64 || imageUri) {
      const source = imageBase64 ?? imageUri!;
      const upload = await uploadProductImage(supplierId, source);
      if (upload.error) {
        const saveWithoutImage = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Bild-Upload fehlgeschlagen',
            `${upload.error} Produkt trotzdem ohne Bild speichern?`,
            [{ text: 'Abbrechen', onPress: () => resolve(false) }, { text: 'Ohne Bild speichern', onPress: () => resolve(true) }]
          );
        });
        if (!saveWithoutImage) {
          setLoading(false);
          return;
        }
      } else {
        imageUrl = upload.url;
      }
    }

    const { error } = await supabase.from('products').insert({
      supplier_id: supplierId,
      name: name.trim(),
      price: priceCents,
      unit: unit.trim() || 'Stück',
      description: description.trim() || null,
      category: category.trim() || null,
      image_url: imageUrl,
      is_available: true,
    });

    setLoading(false);
    if (error) {
      Alert.alert('Fehler', error.message);
      return;
    }
    Alert.alert('Gespeichert', 'Produkt wurde hinzugefügt.');
    navigation.goBack();
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Neues Produkt</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#9ca3af" />
            <Text style={styles.imagePlaceholderText}>Bild hinzufügen</Text>
            <Text style={styles.imageHint}>Tippe zum Auswählen</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Produktname *"
        placeholderTextColor="#9ca3af"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Preis (z.B. 12.50)"
        placeholderTextColor="#9ca3af"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Einheit (z.B. kg, Stück)"
        placeholderTextColor="#9ca3af"
        value={unit}
        onChangeText={setUnit}
      />
      <TextInput
        style={styles.input}
        placeholder="Kategorie (z.B. Getränke, Frischware)"
        placeholderTextColor="#9ca3af"
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Beschreibung (optional)"
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Wird gespeichert...' : 'Speichern'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 200,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  imageHint: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: accentColor,
    borderRadius: 30,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
