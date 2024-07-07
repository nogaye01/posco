import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Modal, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolYear, setSchoolYear] = useState('');
  const [isModalVisible, setModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleSignUp = async () => {
    const userData = {
      username: name,
      email,
      password,
      schoolYear,
    };

    try {
      const response = await fetch('http://192.168.1.144:3000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        Alert.alert('Success', 'User registered successfully', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while signing up');
    }
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const selectYear = (year) => {
    setSchoolYear(year);
    toggleModal();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
      />

      <Text style={styles.label}>School Year</Text>
      <TouchableOpacity style={styles.dropdown} onPress={toggleModal}>
        <Text style={styles.dropdownText}>{schoolYear ? schoolYear : "Select year"}</Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select School Year</Text>
            {["1", "2", "3", "4", "5"].map((year) => (
              <TouchableOpacity key={year} style={styles.modalItem} onPress={() => selectYear(year)}>
                <Text style={styles.modalItemText}>{year}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Close" onPress={toggleModal} />
          </View>
        </View>
      </Modal>

      <Button title="Sign Up" onPress={handleSignUp} style={styles.signUpButton} />

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account? Log in</Text>
      </TouchableOpacity>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    marginLeft: 5,
  },
  dropdown: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  dropdownText: {
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
  },
  signUpButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
  },
  loginText: {
    color: '#007bff',
    fontSize: 16,
  },
});
export default SignUp;