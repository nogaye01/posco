import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { useCarbonFootprint } from '../CarbonFootprintContext';

const AlertModal = ({ visible, onClose }) => {
  const { alerts, rewards } = useCarbonFootprint();

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Notifications</Text>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <FlatList
            data={alerts}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Card.Content>
                  <Text>{item.message}</Text>
                </Card.Content>
              </Card>
            )}
          />
          <Text style={styles.sectionTitle}>Rewards</Text>
          <FlatList
            data={rewards}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Card style={styles.card}>
                <Card.Content>
                  <Text>{item.message}</Text>
                </Card.Content>
              </Card>
            )}
          />
          <Button mode="contained" onPress={onClose} style={styles.closeButton}>
            Close
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
  },
  card: {
    width: '100%',
    marginVertical: 10,
  },
  closeButton: {
    marginTop: 20,
  },
});

export default AlertModal;