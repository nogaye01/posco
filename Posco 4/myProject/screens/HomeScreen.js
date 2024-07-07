import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Text, FlatList, Modal } from 'react-native';
import { Card, Title, Paragraph, Button, Provider } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import CustomHeader from './CustomHeader';
import { MaterialIcons } from '@expo/vector-icons';
import theme from '../theme';
import AccountModal from './AccountScreen';
import AlertModal from './AlertsScreen';
import { useCarbonFootprint } from '../CarbonFootprintContext';
import { ImageBackground } from 'react-native';


const screenWidth = Dimensions.get('window').width;

const getWeeksInMonth = (month, year) => {
  const weeks = [];
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);
  let currentDate = firstDate;

  while (currentDate <= lastDate) {
    const startOfWeek = new Date(currentDate);
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    weeks.push({
      label: `Week ${weeks.length + 1}: ${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`,
      value: weeks.length + 1,
      startOfWeek,
      endOfWeek,
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
};

const HomeScreen = ({ navigation }) => {
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [view, setView] = useState('dashboard');
  const [mode, setMode] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isWeekPickerVisible, setWeekPickerVisibility] = useState(false);
  const [isMonthPickerVisible, setMonthPickerVisibility] = useState(false);
  const { carbonFootprintData, history, alerts, setAlerts } = useCarbonFootprint();

  const navigateToScreen = (screen) => {
    navigation.navigate(screen);
  };



  const renderHistoryItem = ({ item }) => (
    <Card style={styles.historyCard}>
      <Card.Content>
        <View style={styles.historyItemHeader}>
          <Text style={styles.historyItemType}>{item.type}</Text>
          <Text style={styles.historyItemDate}>{new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.historyItemFootprint}>{item.footprint.toFixed(2)} kg CO₂</Text>
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

  const filterDataByDate = () => {
    switch (mode) {
      case 'daily':
        return history.filter((item) => new Date(item.date).toDateString() === selectedDate.toDateString());
      case 'weekly': {
        const weeks = getWeeksInMonth(selectedMonth, new Date().getFullYear());
        const selectedWeekData = weeks[selectedWeek - 1];
        return history.filter(
          (item) =>
            new Date(item.date) >= selectedWeekData.startOfWeek &&
            new Date(item.date) <= selectedWeekData.endOfWeek
        );
      }
      case 'monthly':
        return history.filter(
          (item) =>
            new Date(item.date).getMonth() === selectedMonth &&
            new Date(item.date).getFullYear() === new Date().getFullYear()
        );
      default:
        return [];
    }
  };

  const calculateFootprint = (filteredData) => {
    return filteredData.reduce((total, item) => total + item.footprint, 0);
  };

  const calculateCategoryFootprint = (filteredData) => {
    const categoryFootprints = {
      Transport: 0,
      Food: 0,
      Energy: 0,
    };

    filteredData.forEach((item) => {
      if (categoryFootprints[item.type] !== undefined) {
        categoryFootprints[item.type] += item.footprint;
      }
    });

    return [
      { name: 'Trans', value: parseFloat(categoryFootprints.Transport.toFixed(2)), color: '#f44336' },
      { name: 'Food', value: parseFloat(categoryFootprints.Food.toFixed(2)), color: '#2196F3' },
      { name: 'Energy', value: parseFloat(categoryFootprints.Energy.toFixed(2)), color: '#FFEB3B' },
    ];
  };

  const renderDashboard = () => {
    const filteredData = filterDataByDate();
    const currentData = calculateFootprint(filteredData);
    const categoryData = calculateCategoryFootprint(filteredData);
    let dateString = '';
  
    switch (mode) {
      case 'daily':
        dateString = selectedDate.toDateString();
        break;
      case 'weekly': {
        const weeks = getWeeksInMonth(selectedMonth, new Date().getFullYear());
        dateString = weeks[selectedWeek - 1]?.label || '';
        break;
      }
      case 'monthly':
        dateString = new Date(new Date().getFullYear(), selectedMonth).toLocaleString('default', { month: 'long' });
        break;
      default:
        dateString = '';
    }
  
    // 图片路径数组
    const categoryImages = [
      require('../assets/transport.png'),
      require('../assets/food.png'),
      require('../assets/energy.png'),
    ];
  
    return (
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.cardContainer}>
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialIcons name="today" size={28} color={theme.colors.primary} />
                <Title style={styles.cardTitle}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</Title>
              </View>
              <Paragraph style={styles.cardContent}>
                {dateString ? `${dateString}: ` : ''}{currentData.toFixed(2)} kg CO₂
              </Paragraph>
            </Card.Content>
          </Card>
        </View>
        {mode === 'daily' && (
          <Button mode="contained" onPress={() => setDatePickerVisibility(true)} style={styles.datePickerButton}>
            Select Date
          </Button>
        )}
        {mode === 'weekly' && (
          <Button mode="contained" onPress={() => setWeekPickerVisibility(true)} style={styles.datePickerButton}>
            Select Week
          </Button>
        )}
        {mode === 'monthly' && (
          <Button mode="contained" onPress={() => setMonthPickerVisibility(true)} style={styles.datePickerButton}>
            Select Month
          </Button>
        )}
        <Title style={styles.subTitle}>By Category</Title>
        <View style={styles.cardContainer}>
          {categoryData.map((category, index) => (
            <Card key={index} style={styles.categoryCard}>
              <ImageBackground 
                source={categoryImages[index]} 
                style={styles.backgroundImage}
                imageStyle={{ opacity: 0.16 }} // 设置图片透明度
              >
                <Card.Content>
                  <Title style={styles.cardTitle}>{category.name}</Title>
                  <Paragraph style={styles.cardContent}>{category.value.toFixed(2)} kg CO₂</Paragraph>
                </Card.Content>
              </ImageBackground>
            </Card>
          ))}
        </View>
        <View style={styles.chartContainer}>
          <PieChart
            data={categoryData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.primary,
              backgroundGradientFrom: theme.colors.background,
              backgroundGradientTo: theme.colors.background,
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={{
              marginVertical: theme.spacing.medium,
              borderRadius: 16,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        <Button
          mode="contained"
          onPress={() => setView('history')}
          style={styles.historyButton}
        >
          View History
        </Button>
        {/* <Button
        mode="contained"
        onPress={() => navigation.navigate('CarbonFootprint')}
        style={styles.button}
      >
        Initialize Carbon Footprint
      </Button> */}
      </ScrollView>
    );
  };
  
  const renderHistory = () => (
    <View style={styles.historyContainer}>
      <Title style={styles.title}>Activity History</Title>
      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => index.toString()}
        style={styles.historyList}
      />
      <Button
        mode="contained"
        onPress={() => setView('dashboard')}
        style={styles.historyButton}
      >
        View Dashboard
      </Button>
    </View>
  );

  const handleDateConfirm = (date) => {
    setSelectedDate(date);
    setDatePickerVisibility(false);
  };

  const handleWeekConfirm = (week) => {
    setSelectedWeek(week);
    setWeekPickerVisibility(false);
  };

  const handleMonthConfirm = (month) => {
    setSelectedMonth(month);
    setMonthPickerVisibility(false);
  };

  const renderDatePicker = () => {
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Date</Text>
          {Array.from({ length: 31 }, (_, i) => (
            <Button key={i} mode="text" onPress={() => handleDateConfirm(new Date(new Date().getFullYear(), selectedMonth, i + 1))}>
              {i + 1}
            </Button>
          ))}
          <Button mode="text" onPress={() => setDatePickerVisibility(false)}>Close</Button>
        </View>
      </View>
    );
  };

  const renderWeekPicker = () => {
    const weeks = getWeeksInMonth(selectedMonth, new Date().getFullYear());
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Week</Text>
          {weeks.map((week) => (
            <Button key={week.value} mode="text" onPress={() => handleWeekConfirm(week.value)}>{week.label}</Button>
          ))}
          <Button mode="text" onPress={() => setWeekPickerVisibility(false)}>Close</Button>
        </View>
      </View>
    );
  };

  const renderMonthPicker = () => {
    const months = [
      { label: 'January', value: 0 },
      { label: 'February', value: 1 },
      { label: 'March', value: 2 },
      { label: 'April', value: 3 },
      { label: 'May', value: 4 },
      { label: 'June', value: 5 },
      { label: 'July', value: 6 },
      { label: 'August', value: 7 },
      { label: 'September', value: 8 },
      { label: 'October', value: 9 },
      { label: 'November', value: 10 },
      { label: 'December', value: 11 },
    ];
    return (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Month</Text>
          {months.map((month) => (
            <Button key={month.value} mode="text" onPress={() => handleMonthConfirm(month.value)}>{month.label}</Button>
          ))}
          <Button mode="text" onPress={() => setMonthPickerVisibility(false)}>Close</Button>
        </View>
      </View>
    );
  };

  return (
    <Provider>
      <View style={styles.container}>
        <CustomHeader 
          title="POSCO"
          onAccountPress={() => setAccountModalVisible(true)} // Open the account modal
          onAlertPress={() => setAlertModalVisible(true)} // Open the alert modal
          hasNewAlert={alerts.length > 0} // Show exclamation mark if there are new alerts
        />
        <View style={styles.modeSelector}>
          <Button mode={mode === 'daily' ? 'contained' : 'outlined'} onPress={() => setMode('daily')}>
            Daily
          </Button>
          <Button mode={mode === 'weekly' ? 'contained' : 'outlined'} onPress={() => setMode('weekly')}>
            Weekly
          </Button>
          <Button mode={mode === 'monthly' ? 'contained' : 'outlined'} onPress={() => setMode('monthly')}>
            Monthly
          </Button>
        </View>
        {view === 'dashboard' ? renderDashboard() : renderHistory()}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigateToScreen('Transport')}>
            <MaterialIcons name="directions-car" size={24} color="#fff" />
            <Text style={styles.buttonText}>Transport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigateToScreen('Food')}>
            <MaterialIcons name="restaurant" size={24} color="#fff" />
            <Text style={styles.buttonText}>Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigateToScreen('Energy')}>
            <MaterialIcons name="flash-on" size={24} color="#fff" />
            <Text style={styles.buttonText}>Energy</Text>
          </TouchableOpacity>
        </View>
        <AccountModal
          visible={accountModalVisible}
          onClose={() => setAccountModalVisible(false)}
        />
        <AlertModal
          visible={alertModalVisible}
          onClose={() => setAlertModalVisible(false)}
        />
        <Modal
          transparent={true}
          visible={isDatePickerVisible}
          onRequestClose={() => setDatePickerVisibility(false)}
        >
          {renderDatePicker()}
        </Modal>
        <Modal
          transparent={true}
          visible={isWeekPickerVisible}
          onRequestClose={() => setWeekPickerVisibility(false)}
        >
          {renderWeekPicker()}
        </Modal>
        <Modal
          transparent={true}
          visible={isMonthPickerVisible}
          onRequestClose={() => setMonthPickerVisibility(false)}
        >
          {renderMonthPicker()}
        </Modal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.medium,
  },
  scrollViewContent: {
    padding: theme.spacing.medium,
  },
  historyContainer: {
    flex: 1,
    padding: theme.spacing.medium,
  },
  title: {
    ...theme.typography.title,
    marginBottom: theme.spacing.medium,
    textAlign: 'center',
  },
  subTitle: {
    ...theme.typography.subTitle,
    marginVertical: theme.spacing.medium,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.medium,
  },
    backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    width: '100%', // 确保背景图像覆盖整个卡片宽度
  },
  card: {
    flex: 1,
    marginHorizontal: theme.spacing.small / 2,
    backgroundColor: theme.colors.card,
  },
  categoryCard: {
    flex: 1,
    marginHorizontal: theme.spacing.small / 2,
    backgroundColor: '#ffffff',  // 修改背景颜色
    borderRadius: 30,  // 添加圆角
    borderWidth: 3,  // 添加边框
    borderColor: '#ddd',  // 边框颜色
    shadowColor: '#000',  // 阴影颜色
    shadowOffset: { width: 0, height: 2 },  // 阴影偏移
    shadowOpacity: 0.2,  // 阴影透明度
    shadowRadius: 4,  // 阴影半径
    overflow: 'hidden',
    width: '30%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    marginLeft: theme.spacing.small,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000', 
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  cardContent: {
    marginTop: theme.spacing.small,
    fontSize: 14,
    color: '#000'
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.medium,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.small,
    marginHorizontal: theme.spacing.small / 2,
    backgroundColor: '#674FA3', 
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    marginLeft: theme.spacing.small / 8, // 减小图标和文字之间的间距
    fontSize: 14,
    fontWeight: 'bold',
  },
  historyList: {
    marginTop: theme.spacing.medium,
  },
  historyCard: {
    marginBottom: theme.spacing.small,
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
    marginTop: theme.spacing.small,
    fontSize: 16,
  },
  historyDetails: {
    marginTop: theme.spacing.small,
  },
  historyDetail: {
    fontSize: 14,
    color: 'gray',
  },
  historyButton: {
    marginVertical: theme.spacing.medium,
  },
  datePickerButton: {
    marginTop: theme.spacing.medium,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  });
  
  export default HomeScreen;