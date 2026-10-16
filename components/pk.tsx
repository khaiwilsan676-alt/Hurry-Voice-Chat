import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';

const PkScreen = () => {
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const modes = ['Votes', 'Coins', 'Earning'];
  const times = ['15s', '1min', '3mins', '5mins', '10mins', '15mins'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.battleIconContainer}>
              <Text style={styles.battleIconText}>🥊</Text>
            </View>
            <Text style={styles.headerTitle}>Battle</Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpButtonText}>?</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            <Image
              source={{ uri: 'https://via.placeholder.com/50' }} // Replace with actual avatar
              style={styles.avatar}
            />
            <View>
              <Text style={styles.userName}>A a r a v 💙</Text>
              <Text style={styles.earnings}>
                Today's earning <Text style={styles.coinIcon}>🪙</Text> 0
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsText}>Details &gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Select People */}
        <Text style={styles.sectionTitle}>Select People</Text>
        <View style={styles.selectPeopleContainer}>
          <TouchableOpacity style={[styles.selectBox, styles.blueBox]}>
            <View style={styles.plusCircle}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.selectBox, styles.pinkBox]}>
            <View style={styles.plusCirclePink}>
              <Text style={styles.plusText}>+</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mode */}
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.rowContainer}>
          {modes.map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.optionButton,
                selectedMode === mode && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedMode(mode)}>
              <Text style={styles.optionText}>{mode}</Text>
              {mode === 'Earning' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>🔥</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Time */}
        <Text style={styles.sectionTitle}>Time</Text>
        <View style={styles.gridContainer}>
          {times.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.gridButton,
                selectedTime === time && styles.selectedOptionButton,
              ]}
              onPress={() => setSelectedTime(time)}>
              <Text style={styles.optionText}>{time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0520', // Deep dark blue/purple background
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  battleIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  battleIconText: {
    fontSize: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  helpButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  profileCard: {
    backgroundColor: '#1b1240', // Darker purple card
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a1e5c',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  earnings: {
    color: '#A098C0',
    fontSize: 12,
  },
  coinIcon: {
    fontSize: 12,
  },
  detailsButton: {
    backgroundColor: '#35295e',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  detailsText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#A098C0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectPeopleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  selectBox: {
    width: '48%',
    aspectRatio: 1.2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueBox: {
    backgroundColor: '#1a3b9e',
  },
  pinkBox: {
    backgroundColor: '#a81666',
  },
  plusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusCirclePink: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 32,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#35295e',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    position: 'relative',
  },
  selectedOptionButton: {
    backgroundColor: '#4a3882', // Highlight selected option slightly
    borderColor: '#7c5ce6',
    borderWidth: 1,
  },
  optionText: {
    color: '#E0D8FF',
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -4,
    backgroundColor: '#FF8C00',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  gridButton: {
    width: '31%',
    backgroundColor: '#35295e',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#1b5a7a', // Teal/blue color matching image
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    opacity: 0.7, // Slightly faded to represent a disabled or default state as in image
  },
  confirmButtonText: {
    color: '#A0B0C0',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PkScreen;
