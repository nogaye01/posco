import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from 'react-native-paper';
import { useCarbonFootprint } from '../CarbonFootprintContext'; // Import the context

export default function HistoryScreen() {
  const { history } = useCarbonFootprint(); // Use the context

  const renderHistoryItem = ({ item }) => (
    <Card style={styles.historyCard}>
      <Card.Content>
        <View style={styles.historyItemHeader}>
          <Text style={styles.historyItemType}>{item.type}</Text>
          <Text style={styles.historyItemDate}>{item.date}</Text>
        </View>
        <Text style={styles.historyItemFootprint}>{item.footprint} kg CO₂</Text>
        <View style={styles.historyDetails}>
          {item.details && Object.entries(item.details).map(([key, value], index) => (
            <Text key={index} style={styles.historyDetail}>
              {key}: {value}
            </Text>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.historyList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  historyList: {
    marginTop: 16,
  },
  historyCard: {
    marginBottom: 16,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyItemType: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyItemDate: {
    fontSize: 14,
    color: 'gray',
  },
  historyItemFootprint: {
    marginTop: 8,
    fontSize: 16,
  },
  historyDetails: {
    marginTop: 8,
  },
  historyDetail: {
    fontSize: 14,
    color: 'gray',
  },
});
