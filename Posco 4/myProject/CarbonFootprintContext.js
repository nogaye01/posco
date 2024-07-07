import React, { createContext, useContext, useState } from 'react';
import * as Notifications from 'expo-notifications';

const CarbonFootprintContext = createContext();

export const useCarbonFootprint = () => useContext(CarbonFootprintContext);

export const CarbonFootprintProvider = ({ children }) => {
  const [carbonFootprintData, setCarbonFootprintData] = useState({
    categories: [
      { name: 'Transport', value: 0, color: '#f44336' },
      { name: 'Food', value: 0, color: '#2196F3' },
      { name: 'Energy', value: 0, color: '#FFEB3B' },
    ],
  });
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [rewards, setRewards] = useState([]);

  const thresholds = {
    Transport: 100,
    Food: 0.5,
    Energy: 70,
  };

  const suggestions = {
    Transport: 'Consider using green transport options like cycling, walking, or public transportation',
    Food: 'Try to consume low-carbon footprint foods such as fruits, vegetables, and plant-based proteins',
    Energy: 'Try to use energy-efficient appliances,renewable energy sources and unplugging devices,turn off lights when not in use',
  };

  const rewardPoints = {
    Transport: 5,
    Food: 1,
    Energy: 5,
  };

  const checkAndTriggerAlert = (type, value) => {
    if (value > thresholds[type]) {
      const message = `${type} footprint exceeded! ${suggestions[type]}.`;
      setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Carbon Footprint Alert',
          body: message,
        },
        trigger: null,
      });
      return false; // Indicates footprint exceeded the threshold
    }
    return true; // Indicates footprint is within the threshold
  };

  const addRewardNotification = (type) => {
    const points = rewardPoints[type];
    const message = `Congratulations! You've earned ${points} points.`;
    setRewards((prevRewards) => [...prevRewards, { type, message }]);
    Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rewards Notification',
        body: message,
      },
      trigger: null,
    });
  };

  const updateCarbonFootprint = (type, footprint, details = {}) => {
    footprint = parseFloat(footprint.toFixed(2));

    setCarbonFootprintData((prevData) => {
      const updatedCategories = prevData.categories.map((category) => {
        if (category.name === type) {
          const newValue = category.value + footprint;
          if (checkAndTriggerAlert(type, newValue)) {
            addRewardNotification(type);
          }
          return { ...category, value: newValue };
        }
        return category;
      });

      return {
        ...prevData,
        categories: updatedCategories,
      };
    });

    const newHistoryItem = {
      type,
      footprint,
      date: new Date().toISOString(),
      details
    };
    setHistory((prevHistory) => [...prevHistory, newHistoryItem]);
  };

  return (
    <CarbonFootprintContext.Provider value={{ carbonFootprintData, history, alerts, setAlerts, updateCarbonFootprint, rewards }}>
      {children}
    </CarbonFootprintContext.Provider>
  );
};