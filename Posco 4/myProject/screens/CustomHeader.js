import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const CustomHeader = ({ title, onAccountPress, onAlertPress, hasNewAlert }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onAccountPress}>
        <MaterialIcons name="account-circle" size={28} color="black" />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onAlertPress}>
        <MaterialIcons name="notifications" size={28} color="black" />
        {hasNewAlert && (
          <View style={styles.alertIcon}>
            <Text style={styles.alertText}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  alertIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomHeader;