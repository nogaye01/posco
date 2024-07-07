import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Button, Card } from 'react-native-paper';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import polyline from '@mapbox/polyline';
import { useCarbonFootprint } from '../CarbonFootprintContext'; // Import the context

const defaultTransportOptions = [
  { label: 'Car', value: 'driving' },
  { label: 'Bike', value: 'bicycling' },
  { label: 'Walking', value: 'walking' },
  { label: 'RER', value: 'rer' },
  { label: 'Metro', value: 'metro' },
  { label: 'Tramway', value: 'tramway' },
  { label: 'TGV', value: 'tgv' },
  { label: 'Scooter', value: 'scooter' },
  { label: 'Bus', value: 'bus' },
  { label: 'Airplane', value: 'airplane' }
];

// Replace with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyADQ8c0biSds8uJdkxyai32i5GHI79mh-A';

const TransportScreen = ({ navigation }) => {
  const { updateCarbonFootprint } = useCarbonFootprint(); // Use the context
  const [location, setLocation] = useState(null);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [carbonFootprint, setCarbonFootprint] = useState(null);
  const [transportOptions, setTransportOptions] = useState(defaultTransportOptions);
  const [startPointText, setStartPointText] = useState('');
  const [endPointText, setEndPointText] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setStartPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setStartPointText('Your Position');
    })();
  }, []);

  const handleMapPress = async (event) => {
    const { coordinate } = event.nativeEvent;
    if (!startPoint) {
      setStartPoint(coordinate);
      setStartPointText('Selected Position');
    } else {
      setEndPoint(coordinate);
      setEndPointText('Selected Position');
      setRoutes([]); // Reset routes when a new destination is selected
      setSelectedRoute(null); // Reset selected route
      setCarbonFootprint(null); // Reset carbon footprint
    }
  };

  const handlePlaceSelected = async (data, details, type) => {
    const { lat, lng } = details.geometry.location;
    const coordinate = { latitude: lat, longitude: lng };

    if (type === 'start') {
      setStartPoint(coordinate);
      setStartPointText(data.description);
    } else {
      setEndPoint(coordinate);
      setEndPointText(data.description);
      setRoutes([]); // Reset routes when a new destination is selected
      setSelectedRoute(null); // Reset selected route
      setCarbonFootprint(null); // Reset carbon footprint
    }
  };

  const useCurrentLocation = async () => {
    let location = await Location.getCurrentPositionAsync({});
    const coordinate = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    setStartPoint(coordinate);
    setStartPointText('Your Position');
    
    // Fetch address details for the current location
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();
    if (data.results.length) {
      const address = data.results[0].formatted_address;
      setStartPointText(address);
      setCurrentAddress(address); // Update the currentAddress state
    }
  };

  const confirmPoints = () => {
    if (!startPoint || !endPoint) {
      Alert.alert('Please select both start and end points.');
      return;
    }

    fetchRoutesAndFitMap(startPoint, endPoint);
  };

  const fetchRoutesAndFitMap = async (originCoordinate, destinationCoordinate) => {
    const origin = `${originCoordinate.latitude},${originCoordinate.longitude}`;
    const destination = `${destinationCoordinate.latitude},${destinationCoordinate.longitude}`;
    const isSameCity = await checkSameCity(originCoordinate, destinationCoordinate);

    if (isSameCity) {
      setTransportOptions(defaultTransportOptions.filter(option => option.value !== 'airplane'));
    } else {
      setTransportOptions(defaultTransportOptions);
    }

    fetchRoutes(origin, destination);
    fitToMarkers(originCoordinate, destinationCoordinate);
  };

  const fetchRoutes = async (origin, destination) => {
    const fetchedRoutes = [];

    for (let option of transportOptions) {
      if (option.value === 'airplane') {
        const distance = haversineDistance(startPoint, endPoint);
        if (distance < 100) continue; // Skip airplane option for short distances
        const duration = distance / 900 * 60; // Assuming average airplane speed of 900 km/h
        const footprint = calculateCarbonFootprint(distance, option.value);
        fetchedRoutes.push({
          mode: option.label,
          coords: [startPoint, endPoint],
          distance,
          duration,
          footprint,
          details: {
            origin: startPointText,
            destination: endPointText,
            mode: option.label,
            distance: `${distance.toFixed(2)} km`,
            duration: `${formatDuration(duration)}`,
          }
        });
      } else if (option.value === 'walking') {
        const distance = haversineDistance(startPoint, endPoint);
        if (distance > 10) continue; // Skip walking option for long distances
        const duration = distance / 5 * 60; // Assuming average walking speed of 5 km/h
        const footprint = calculateCarbonFootprint(distance, option.value);
        fetchedRoutes.push({
          mode: option.label,
          coords: [startPoint, endPoint],
          distance,
          duration,
          footprint,
          details: {
            origin: startPointText,
            destination: endPointText,
            mode: option.label,
            distance: `${distance.toFixed(2)} km`,
            duration: `${formatDuration(duration)}`,
          }
        });
      } else {
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${option.value}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();
          if (data.routes.length) {
            const points = polyline.decode(data.routes[0].overview_polyline.points);
            const coords = points.map(point => ({
              latitude: point[0],
              longitude: point[1]
            }));
            const distance = data.routes[0].legs[0].distance.value / 1000; // distance in kilometers
            const duration = data.routes[0].legs[0].duration.value / 60; // duration in minutes
            const footprint = calculateCarbonFootprint(distance, option.value);
            fetchedRoutes.push({
              mode: option.label,
              coords,
              distance,
              duration,
              footprint,
              details: {
                origin: startPointText,
                destination: endPointText,
                mode: option.label,
                distance: `${distance.toFixed(2)} km`,
                duration: `${formatDuration(duration)}`,
              }
            });
          }
        } catch (error) {
          console.error('Error fetching directions:', error);
        }
      }
    }

    setRoutes(fetchedRoutes);
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours > 0 ? hours + 'h ' : ''}${remainingMinutes.toFixed(0)} min`;
  };

  const fitToMarkers = (start, end) => {
    if (mapRef.current && start && end) {
      mapRef.current.fitToCoordinates([start, end], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const checkSameCity = async (start, end) => {
    try {
      const responseStart = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${start.latitude},${start.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const dataStart = await responseStart.json();
      const cityStart = getCity(dataStart);

      const responseEnd = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${end.latitude},${end.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const dataEnd = await responseEnd.json();
      const cityEnd = getCity(dataEnd);

      return cityStart === cityEnd;
    } catch (error) {
      console.error('Error checking city:', error);
      return false;
    }
  };

  const getCity = (data) => {
    for (let result of data.results) {
      for (let component of result.address_components) {
        if (component.types.includes('locality')) {
          return component.long_name;
        }
      }
    }
    return null;
  };

  const haversineDistance = (point1, point2) => {
    const toRad = (angle) => (angle * Math.PI) / 180;
    const R = 6371; // Radius of Earth in kilometers
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    const lat1 = toRad(point1.latitude);
    const lat2 = toRad(point2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
  };

  const calculateCarbonFootprint = (distance, mode) => {
    let factor;
    switch (mode) {
      case 'driving':
        factor = 218; // g CO2e per km for a car
        break;
      case 'bicycling':
      case 'walking':
        factor = 0; // g CO2e per km for bike or walking
        break;
      case 'rer':
        factor = 9.78; // g CO2e per km for RER
        break;
      case 'metro':
        factor = 4.44; // g CO2e per km for Metro
        break;
      case 'tramway':
        factor = 4.28; // g CO2e per km for Tramway
        break;
      case 'tgv':
        factor = 2.93; // g CO2e per km for TGV
        break;
      case 'scooter':
        factor = 76.3; // g CO2e per km for a scooter
        break;
      case 'bus':
        factor = 113; // g CO2e per km for a bus
        break;
      case 'airplane':
        factor = 259; // g CO2e per km for a commercial flight
        break;
      default:
        factor = 0;
    }
    return (distance * factor) / 1000; // Convert to kg CO2e
  };

  const selectRoute = (route) => {
    setSelectedRoute(route);
    setCarbonFootprint(route.footprint);

    // Adjust map to show the route
    if (route.coords.length > 1) {
      mapRef.current.fitToCoordinates(route.coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const confirmActivity = () => {
    if (selectedRoute) {
      updateCarbonFootprint('Transport', carbonFootprint, selectedRoute.details);
      navigation.goBack();
    } else {
      Alert.alert('Please select a route first.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        onPress={handleMapPress}
      >
        {startPoint && <Marker coordinate={startPoint} title="Start Point" />}
        {endPoint && <Marker coordinate={endPoint} title="End Point" />}
        {selectedRoute && selectedRoute.coords.length > 2 && <Polyline coordinates={selectedRoute.coords} />}
      </MapView>
      <View style={styles.controls}>
        <GooglePlacesAutocomplete
          placeholder='Search for start point'
          fetchDetails={true}
          onPress={(data, details) => handlePlaceSelected(data, details, 'start')}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
          }}
          textInputProps={{
            value: startPointText,
            onChangeText: setStartPointText
          }}
          styles={{
            container: { flex: 0 },
            textInputContainer: {
              width: '100%',
            },
            textInput: {
              height: 38,
              color: '#5d5d5d',
              fontSize: 16,
            },
            predefinedPlacesDescription: {
              color: '#1faadb',
            },
            listView: { backgroundColor: 'white' },
          }}
        />
        <Button 
          mode="contained" 
          onPress={useCurrentLocation} 
          style={styles.currentLocationButton} 
          labelStyle={styles.buttonLabel}
        >
          Your position
        </Button>
        {currentAddress ? (
          <Text style={styles.currentAddressText}>Current Location: {currentAddress}</Text>
        ) : null}
        <GooglePlacesAutocomplete
          placeholder='Search for destination'
          fetchDetails={true}
          onPress={(data, details) => handlePlaceSelected(data, details, 'end')}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: 'en',
          }}
          textInputProps={{
            value: endPointText,
            onChangeText: setEndPointText
          }}
          styles={{
            container: { flex: 0 },
            textInputContainer: {
              width: '100%',
            },
            textInput: {
              height: 38,
              color: '#5d5d5d',
              fontSize: 16,
            },
            predefinedPlacesDescription: {
              color: '#1faadb',
            },
            listView: { backgroundColor: 'white' },
          }}
        />
        <Button
          mode="contained"
          onPress={confirmPoints}
          style={styles.confirmButton}
          disabled={!startPoint || !endPoint}
          labelStyle={styles.buttonLabel}
        >
          Confirm
        </Button>
        <ScrollView horizontal contentContainerStyle={styles.routeOptions}>
          {routes.map((route, index) => (
            <TouchableOpacity key={index} onPress={() => selectRoute(route)}>
              <Card style={styles.routeCard}>
                <Card.Title title={route.mode} titleStyle={styles.routeCardTitle} />
                <Card.Content style={styles.routeCardContent}>
                  <Text>Distance: {route.distance.toFixed(2)} km</Text>
                  <Text>Duration: {route.mode === 'airplane' ? `${formatDuration(route.duration)}` : `${formatDuration(route.duration)}`}</Text>
                  <Text>Carbon Footprint: {route.footprint.toFixed(3)} kg CO₂</Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {carbonFootprint !== null && (
          <Text style={styles.footprintText}>Estimated Carbon Footprint: {carbonFootprint.toFixed(3)} kg CO₂</Text>
        )}
        <Button 
          mode="contained" 
          onPress={confirmActivity} 
          style={styles.confirmButton}
          labelStyle={styles.buttonLabel}
        >
          Confirm Activity
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  controls: {
    padding: 10,
    backgroundColor: 'white',
  },
  currentLocationButton: {
    marginVertical: 10,
  },
  buttonLabel: {
    color: 'white',
  },
  currentAddressText: {
    marginVertical: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  routeOptions: {
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  routeCard: {
    marginHorizontal: 10,
    width: 220,
    borderRadius: 10,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeCardContent: {
    padding: 10,
  },
  footprintText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  confirmButton: {
    marginTop: 10,
  },
});

export default TransportScreen;
