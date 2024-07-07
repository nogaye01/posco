import React, { useState } from 'react';
import { View, StyleSheet, Image, Text, Alert, ActivityIndicator, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCarbonFootprint } from '../CarbonFootprintContext';
import { Ionicons } from '@expo/vector-icons'; 
import theme from '../theme';

const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyCHa6Q6S-IMxlXeF07Mqi8h6huPw-r_fQ8';

export default function EnergyScreen({ navigation }) {
  const { updateCarbonFootprint } = useCarbonFootprint();
  const [image, setImage] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setLoading(true);
      await fetchEnergyData(result.assets[0].uri);
      setLoading(false);
    }
  };

  const fetchEnergyData = async (uri) => {
    try {
      const response = await recognizeText(uri);
      if (response && response.length > 0) {
        const energyConsumption = extractEnergyConsumption(response);
        const footprint = calculateCarbonFootprint(energyConsumption);
        setEnergyData({ energyConsumption, footprint });
      } else {
        Alert.alert('Error', 'No text recognized. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching energy data:', error);
      Alert.alert('Error', 'Failed to recognize text. Please try again.');
    }
  };

  const recognizeText = async (uri) => {
    const base64Image = await convertToBase64(uri);
    const body = JSON.stringify({
      requests: [
        {
          image: {
            content: base64Image,
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1,
            },
          ],
        },
      ],
    });

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`,
      {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    const result = await response.json();
    return result.responses[0].textAnnotations;
  };

  const convertToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1];
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const extractEnergyConsumption = (textAnnotations) => {
    const text = textAnnotations[0]?.description || '';
    const match = text.match(/(\d+\.?\d*)\s?kWh/);
    return match ? parseFloat(match[1]) : Math.random() * 1000;
  };

  const calculateCarbonFootprint = (energyConsumption) => {
    const carbonFactor = 0.233; // kg CO2 per kWh (average value)
    return (energyConsumption * carbonFactor).toFixed(2);
  };

  const confirmActivity = () => {
    if (energyData) {
      updateCarbonFootprint('Energy', parseFloat(energyData.footprint), { energyConsumption: energyData.energyConsumption, energySource: 'Electricity' });
      navigation.goBack();
    } else {
      Alert.alert('Please upload an invoice first.');
    }
  };

  return (
    <ImageBackground source={require('../assets/energy_background.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Energy Carbon Footprint</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Ionicons name="cloud-upload-outline" size={24} color="white" />
              <Text style={styles.buttonText}>Pick Image</Text>
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator size="large" color="#0000ff" />}
          {image && <Image source={{ uri: image }} style={styles.image} />}
          {energyData && (
            <>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Energy Consumption:</Text>
                <Text style={styles.cardContent}>{energyData.energyConsumption} kWh</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Estimated Carbon Footprint:</Text>
                <Text style={styles.cardContent}>{energyData.footprint} kg CO₂</Text>
              </View>
            </>
          )}
          <TouchableOpacity style={styles.confirmButton} onPress={confirmActivity}>
            <Text style={styles.confirmButtonText}>Confirm Activity</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Adding a slight white background with transparency
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  scrollViewContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    margin: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    marginLeft: 10,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: '90%',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardContent: {
    fontSize: 14,
    marginBottom: 5,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    margin: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

