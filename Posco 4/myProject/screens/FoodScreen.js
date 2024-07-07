import React, { useState } from 'react';
import { View, StyleSheet, Button, Image, Text, Alert, ActivityIndicator, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCarbonFootprint } from '../CarbonFootprintContext';
import { Ionicons } from '@expo/vector-icons'; 
import theme from '../theme';

const CLARIFAI_API_KEY = 'ebd573e4c12f4032bfce2aa491066103';
const EDAMAM_FOOD_API_ID = '4d5b00a6';
const EDAMAM_FOOD_API_KEY = '61450c212346b2374bfe506de3e5814f';
const GOOGLE_VISION_API_KEY = 'AIzaSyCHa6Q6S-IMxlXeF07Mqi8h6huPw-r_fQ8';

const FOOD_DATABASE = [
  { name: 'jambon du chef', footprint: 1.5 },
  { name: 'ZhajiangMian', footprint: 2.0 },
  { name: 'Spaghetti', footprint: 1.8 },
  { name: 'Chicken Salad', footprint: 2.5 },
  { name: 'Beef Burger', footprint: 3.2 },
  { name: 'Veggie Pizza', footprint: 1.7 },
  { name: 'Sushi', footprint: 2.1 },
  { name: 'Pad Thai', footprint: 2.3 },
  { name: 'Ramen', footprint: 2.4 },
  { name: 'Tofu Stir Fry', footprint: 1.3 },
];

const DEBUG_MODE = true; // Set to true to enable console warnings

export default function FoodScreen({ navigation }) {
  const { updateCarbonFootprint } = useCarbonFootprint();
  const [image, setImage] = useState(null);
  const [foodData, setFoodData] = useState(null);
  const [prediction, setPrediction] = useState('');
  const [useOCR, setUseOCR] = useState(false);
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
      if (useOCR) {
        await fetchTextData(result.assets[0].uri);
      } else {
        await fetchFoodData(result.assets[0].uri);
      }
      setLoading(false);
    }
  };

  const fetchFoodData = async (uri) => {
    try {
      const base64Image = await convertToBase64(uri);
      const foodLabels = await recognizeFoodLabels(base64Image);
      if (foodLabels && foodLabels.length > 0) {
        const foodLabel = foodLabels[0];
        setPrediction(foodLabel);
        const response = await fetchFoodInfo(foodLabel);
        if (response) {
          const footprint = await calculateCarbonFootprint(response.food.label);
          setFoodData({ foodItem: [response.food.label], footprint });
        } else {
          Alert.alert('Error', 'No food items recognized. Please try again.');
        }
      } else {
        throw new Error('No labels detected');
      }
    } catch (error) {
      console.error('Error fetching food data:', error);
      Alert.alert('Error', 'Failed to recognize food. Please try again.');
    }
  };

  const fetchTextData = async (uri) => {
    try {
      const base64Image = await convertToBase64(uri);
      const detectedText = await recognizeText(base64Image);
      if (DEBUG_MODE) console.log('Detected Text:', detectedText);
      if (detectedText && detectedText.length > 0) {
        const foodItems = extractFoodItems(detectedText);
        let totalFootprint = 0;
        let foundItems = [];
        for (let foodItem of foodItems) {
          if (DEBUG_MODE) console.log('Processing Food Item:', foodItem);
          const matchedItem = FOOD_DATABASE.find(item => item.name.toLowerCase() === foodItem.toLowerCase());
          if (matchedItem) {
            totalFootprint += matchedItem.footprint;
            foundItems.push(matchedItem.name);
          } else if (DEBUG_MODE) {
            console.warn(`Food item not found in database: ${foodItem}`);
          }
        }
        if (foundItems.length > 0) {
          setFoodData({ foodItem: foundItems, footprint: totalFootprint });
        } else {
          Alert.alert('Error', 'No valid food items detected. Please try again.');
        }
      } else {
        Alert.alert('Error', 'No food items detected in the receipt. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching text data:', error);
      Alert.alert('Error', 'Failed to recognize text. Please try again.');
    }
  };

  const extractFoodItems = (text) => {
    const foodItems = [];
    const lines = text.split('\n');

    const foodPatterns = [
      /^[A-Za-z\s]+$/,
      /^[A-Za-z\s]+\d$/,
    ];

    for (const line of lines) {
      const cleanedLine = line.trim().toLowerCase();
      if (foodPatterns.some(pattern => pattern.test(cleanedLine)) && !cleanedLine.match(/total|subtotal|tax|escompte|coupon|client|table|addition|heure|rt|tq|\d{2}:\d{2}|\d+$/i)) {
        const cleanedItem = cleanedLine.replace(/\d+(\.\d+)?/g, '').trim();
        if (cleanedItem && !cleanedItem.match(/^\s*$/)) {
          foodItems.push(cleanedItem);
        }
      }
    }

    return foodItems;
  };

  const recognizeFoodLabels = async (base64Image) => {
    try {
      const response = await fetch('https://api.clarifai.com/v2/models/food-item-recognition/outputs', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${CLARIFAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: [
            {
              data: {
                image: {
                  base64: base64Image,
                },
              },
            },
          ],
        }),
      });

      const result = await response.json();
      if (result.outputs && result.outputs.length > 0) {
        if (result.outputs[0].data.concepts && result.outputs[0].data.concepts.length > 0) {
          return result.outputs[0].data.concepts.map(concept => concept.name);
        } else {
          throw new Error('No labels detected in response');
        }
      } else {
        throw new Error('No outputs in response');
      }
    } catch (error) {
      console.error('Error in recognizeFoodLabels:', error);
      throw error;
    }
  };

  const recognizeText = async (base64Image) => {
    try {
      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                },
              ],
            },
          ],
        }),
      });

      const result = await response.json();
      if (result.responses && result.responses.length > 0) {
        return result.responses[0].fullTextAnnotation.text;
      } else {
        throw new Error('No text detected');
      }
    } catch (error) {
      console.error('Error in recognizeText:', error);
      throw error;
    }
  };

  const fetchFoodInfo = async (foodLabel) => {
    try {
      const response = await fetch(
        `https://api.edamam.com/api/food-database/v2/parser?app_id=${EDAMAM_FOOD_API_ID}&app_key=${EDAMAM_FOOD_API_KEY}&ingr=${encodeURIComponent(foodLabel)}`
      );
      const result = await response.json();
      if (result.hints && result.hints.length > 0) {
        return result.hints[0];
      } else {
        throw new Error('Food data not found');
      }
    } catch (error) {
      console.error('Error in fetchFoodInfo:', error);
      throw error;
    }
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

  const calculateCarbonFootprint = async (foodItem) => {
    const foodCarbonFootprintDatabase = {
      Apple: 0.3,
      Banana: 0.4,
      Beef: 27,
    };
    return foodCarbonFootprintDatabase[foodItem] || parseFloat(Math.random().toFixed(2));
  };

  const confirmActivity = () => {
    if (foodData) {
      const foodItemList = foodData.foodItem.join(', ');
      updateCarbonFootprint('Food', foodData.footprint, { foodItem: foodItemList });
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please select an image first.');
    }
  };

  return (
    <ImageBackground source={require('../assets/food_background.png')} style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Food Carbon Footprint</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollViewContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={pickImage}>
              <Ionicons name="image" size={24} color="white" />
              <Text style={styles.buttonText}>Pick Image</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modeText}>Current Mode: {useOCR ? 'OCR' : 'Image Recognition'}</Text>
          <View style={styles.switchButtonContainer}>
            <TouchableOpacity style={styles.switchButton} onPress={() => setUseOCR(!useOCR)}>
              <Ionicons name="swap-horizontal" size={24} color="white" />
              <Text style={styles.buttonText}>Switch to {useOCR ? 'Image Recognition' : 'OCR'}</Text>
            </TouchableOpacity>
          </View>
          {loading && <ActivityIndicator size="large" color="#0000ff" />}
          {image && <Image source={{ uri: image }} style={styles.image} />}
          {prediction && !useOCR && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Best Prediction:</Text>
              <Text style={styles.cardContent}>{prediction}</Text>
            </View>
          )}
          {foodData && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Food Items:</Text>
              <Text style={styles.cardContent}>{foodData.foodItem.join(', ')}</Text>
              <Text style={styles.cardTitle}>Estimated Carbon Footprint:</Text>
              <Text style={styles.cardContent}>{foodData.footprint.toFixed(2)} kg CO₂</Text>
            </View>
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
    backgroundColor: 'rgba(245, 245, 245, 0.8)', // 半透明背景
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
  switchButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 5,
  },
  switchButton: {
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
  modeText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
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
    width: '90%', // 调整卡片宽度
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
  predictionsContainer: {
    margin: 10,
  },
  predictionsTitle: {
    fontWeight: 'bold',
  },
  prediction: {
    fontSize: 16,
  },
});
