import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import TransportScreen from './screens/TransportScreen';
import EnergyScreen from './screens/EnergyScreen';
import FoodScreen from './screens/FoodScreen';
import AlertsScreen from './screens/AlertsScreen';
import AccountScreen from './screens/AccountScreen';
import SignUpScreen from './screens/SignUpScreen';
import CarbonFootprintForm from './screens/CarbonFootprintForm';
import theme from './theme';
import { CarbonFootprintProvider } from './CarbonFootprintContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <CarbonFootprintProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: true }} />
            <Stack.Screen name="Transport" component={TransportScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Food" component={FoodScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Energy" component={EnergyScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Alerts" component={AlertsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CarbonFootprint" component={CarbonFootprintForm} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </CarbonFootprintProvider>
  );
  }
