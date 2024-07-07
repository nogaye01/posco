import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Checkbox, Button } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';

const CarbonFootprintForm = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [userId, setUserId] = useState(null);
//   const [schoolYear, setSchoolYear] = useState(null);
  const { user_id, schoolYear } = route.params;

  // State variables for form inputs
  const [foodHabit, setFoodHabit] = useState({
    vegetarian: false,
    vegan: false,
    organic: false,
  });

  const [transportHabit, setTransportHabit] = useState({
    car: false,
    bike: false,
    publicTransport: false,
    walking: false,
  });

  const [energyConsumption, setEnergyConsumption] = useState({
    solar: false,
    wind: false,
    gas: false,
    electric: false,
  });

  useEffect(() => {
    if (route.params?.email) {
       
      const fetchData = async () => {
        try {
          const response = await axios.get(`http://192.168.1.144:3000/users?email=${route.params.email}`);
          const user = response.data;
          setUserId(user._id);
          setSchoolYear(user.schoolYear);
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      if (route.params?.email) {
        fetchData(); // Fetch data only if email parameter is present
      }
    }
  }, [route.params?.email]);

  const handleFormSubmit = async () => {
    const carbonFootprintData = calculateCarbonFootprint(); // Implement your calculation logic

    const formData = {
      user_id,
      foodFootprint: carbonFootprintData.foodFootprint,
      transportFootprint: carbonFootprintData.transportFootprint,
      energyFootprint: carbonFootprintData.energyFootprint,
      totalFootprint: carbonFootprintData.totalFootprint,
    };

    try {
        const carbonFootprintData = calculateCarbonFootprint();
        //     console.log(user_id);
        //     console.log(carbonFootprintData.transportFootprint);
        //     console.log(carbonFootprintData.energyFootprint);
        //     console.log(carbonFootprintData.totalFootprint);
        
      const response = await axios.post('http://192.168.1.144:3000/carbon-footprint', formData);

      if (response.status === 201) {
        Alert.alert('Success', 'Your carbon footprint has been initialized.');
        navigation.navigate('Home');
      } else {
        console.error('Unexpected status code:', response.status);
        Alert.alert('Error', 'Failed to initialize carbon footprint. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'There was an error submitting your form. Please try again.');
    }
  };
 

// const handleFormSubmit = async () => {
//   try {
//     if (!user_id) {
//         console.error('User ID is null. Cannot submit form.');
//         return;
//       }
//     const carbonFootprintData = calculateCarbonFootprint();
//     console.log(user_id);
//     console.log(carbonFootprintData.transportFootprint);
//     console.log(carbonFootprintData.energyFootprint);
//     console.log(carbonFootprintData.totalFootprint);


//     await axios.post('http://192.168.1.144:3000/carbon-footprint', {
        
//       user_id,
//       foodFootprint: carbonFootprintData.foodFootprint,
//       transportFootprint: carbonFootprintData.transportFootprint,
//       energyFootprint: carbonFootprintData.energyFootprint,
//       totalFootprint: carbonFootprintData.totalFootprint,
//     });

//     Alert.alert('Success', 'Your carbon footprint has been initialized.');
//     navigation.navigate('Home'); // Navigate to the home screen or another screen
//   } catch (error) {
//     console.error('Error submitting form:', error);
//     Alert.alert('Error', 'There was an error submitting your form. Please try again.');
//   }
// };


  const calculateCarbonFootprint = () => {
    let foodFootprint = 0;
    let transportFootprint = 0;
    let energyFootprint = 0;

    if (foodHabit.vegetarian) foodFootprint += 100;
    if (foodHabit.vegan) foodFootprint += 50;
    if (foodHabit.organic) foodFootprint += 70;

    if (transportHabit.car) transportFootprint += 200;
    if (transportHabit.bike) transportFootprint += 20;
    if (transportHabit.publicTransport) transportFootprint += 80;
    if (transportHabit.walking) transportFootprint += 10;

    if (energyConsumption.solar) energyFootprint += 30;
    if (energyConsumption.wind) energyFootprint += 40;
    if (energyConsumption.gas) energyFootprint += 150;
    if (energyConsumption.electric) energyFootprint += 120;

    const totalFootprint = foodFootprint + transportFootprint + energyFootprint;
    return { foodFootprint, transportFootprint, energyFootprint, totalFootprint };
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Initialize Carbon Footprint</Text>

      <Text style={styles.sectionTitle}>Food Habits</Text>
      <Checkbox.Item
        label="Vegetarian"
        status={foodHabit.vegetarian ? 'checked' : 'unchecked'}
        onPress={() => setFoodHabit({ ...foodHabit, vegetarian: !foodHabit.vegetarian })}
      />
      <Checkbox.Item
        label="Vegan"
        status={foodHabit.vegan ? 'checked' : 'unchecked'}
        onPress={() => setFoodHabit({ ...foodHabit, vegan: !foodHabit.vegan })}
      />
      <Checkbox.Item
        label="Organic"
        status={foodHabit.organic ? 'checked' : 'unchecked'}
        onPress={() => setFoodHabit({ ...foodHabit, organic: !foodHabit.organic })}
      />

      <Text style={styles.sectionTitle}>Transport Habits</Text>
      <Checkbox.Item
        label="Car"
        status={transportHabit.car ? 'checked' : 'unchecked'}
        onPress={() => setTransportHabit({ ...transportHabit, car: !transportHabit.car })}
      />
      <Checkbox.Item
        label="Bike"
        status={transportHabit.bike ? 'checked' : 'unchecked'}
        onPress={() => setTransportHabit({ ...transportHabit, bike: !transportHabit.bike })}
      />
      <Checkbox.Item
        label="Public Transport"
        status={transportHabit.publicTransport ? 'checked' : 'unchecked'}
        onPress={() => setTransportHabit({ ...transportHabit, publicTransport: !transportHabit.publicTransport })}
      />
      <Checkbox.Item
        label="Walking"
        status={transportHabit.walking ? 'checked' : 'unchecked'}
        onPress={() => setTransportHabit({ ...transportHabit, walking: !transportHabit.walking })}
      />

      <Text style={styles.sectionTitle}>Energy Consumption</Text>
      <Checkbox.Item
        label="Solar"
        status={energyConsumption.solar ? 'checked' : 'unchecked'}
        onPress={() => setEnergyConsumption({ ...energyConsumption, solar: !energyConsumption.solar })}
      />
      <Checkbox.Item
        label="Wind"
        status={energyConsumption.wind ? 'checked' : 'unchecked'}
        onPress={() => setEnergyConsumption({ ...energyConsumption, wind: !energyConsumption.wind })}
      />
      <Checkbox.Item
        label="Gas"
        status={energyConsumption.gas ? 'checked' : 'unchecked'}
        onPress={() => setEnergyConsumption({ ...energyConsumption, gas: !energyConsumption.gas })}
      />
      <Checkbox.Item
        label="Electric"
        status={energyConsumption.electric ? 'checked' : 'unchecked'}
        onPress={() => setEnergyConsumption({ ...energyConsumption, electric: !energyConsumption.electric })}
      />

      <Button mode="contained" onPress={handleFormSubmit} style={styles.submitButton}>
        Submit
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    marginVertical: 10,
  },
  submitButton: {
    marginTop: 20,
  },
});

export default CarbonFootprintForm;
