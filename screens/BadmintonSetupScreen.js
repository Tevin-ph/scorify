import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function BadmintonSetupScreen({ navigation }) {
  const [gameType, setGameType] = useState('singles');
  const [numberOfSets, setNumberOfSets] = useState(3);
  const [umpireName, setUmpireName] = useState('');
  
  // Player names
  const [player1A, setPlayer1A] = useState('');
  const [player2A, setPlayer2A] = useState(''); // Only for doubles/mixed
  const [player1B, setPlayer1B] = useState('');
  const [player2B, setPlayer2B] = useState(''); // Only for doubles/mixed

  const gameTypes = [
    { key: 'singles', label: 'Singles', icon: '👤' },
    { key: 'doubles', label: 'Doubles', icon: '👥' },
    { key: 'mixed', label: 'Mixed Doubles', icon: '👫' }
  ];

  const setOptions = [1, 3, 5];

  const validateSetup = () => {
    if (!umpireName.trim()) {
      Alert.alert('Missing Information', 'Please enter umpire name');
      return false;
    }

    if (!player1A.trim() || !player1B.trim()) {
      Alert.alert('Missing Information', 'Please enter player names for both sides');
      return false;
    }

    if ((gameType === 'doubles' || gameType === 'mixed') && (!player2A.trim() || !player2B.trim())) {
      Alert.alert('Missing Information', 'Please enter all player names for doubles match');
      return false;
    }

    return true;
  };

  const startMatch = () => {
    if (!validateSetup()) return;

    const matchConfig = {
      gameType,
      numberOfSets,
      umpireName,
      teamA: {
        player1: player1A,
        player2: gameType !== 'singles' ? player2A : null
      },
      teamB: {
        player1: player1B,
        player2: gameType !== 'singles' ? player2B : null
      },
      startTime: new Date().toISOString()
    };

    navigation.navigate('BadmintonMatch', { matchConfig });
  };

  const renderPlayerInputs = () => {
    if (gameType === 'singles') {
      return (
        <>
          <View style={styles.teamSection}>
            <Text style={styles.teamTitle}>🏸 Player A</Text>
            <TextInput
              placeholderTextColor="#222"
              style={styles.playerInput}
              placeholder="Player A Name"
              value={player1A}
              onChangeText={setPlayer1A}
            />
          </View>

          <View style={styles.teamSection}>
            <Text style={styles.teamTitle}>🏸 Player B</Text>
            <TextInput
              style={styles.playerInput}
              placeholder="Player B Name"
              value={player1B}
              onChangeText={setPlayer1B}
            />
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.teamSection}>
          <Text style={styles.teamTitle}>🏸 Team A</Text>
          <TextInput
            style={styles.playerInput}
            placeholder="Player 1 Name"
            value={player1A}
            onChangeText={setPlayer1A}
          />
          <TextInput
            style={styles.playerInput}
            placeholder="Player 2 Name"
            value={player2A}
            onChangeText={setPlayer2A}
          />
        </View>

        <View style={styles.teamSection}>
          <Text style={styles.teamTitle}>🏸 Team B</Text>
          <TextInput
            style={styles.playerInput}
            placeholder="Player 1 Name"
            value={player1B}
            onChangeText={setPlayer1B}
          />
          <TextInput
            style={styles.playerInput}
            placeholder="Player 2 Name"
            value={player2B}
            onChangeText={setPlayer2B}
          />
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏸 Badminton Setup</Text>
        </View>

        <View style={styles.content}>
          {/* Game Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Game Type</Text>
            <View style={styles.gameTypeContainer}>
              {gameTypes.map((type) => (
                <TouchableOpacity
                  key={type.key}
                  style={[
                    styles.gameTypeButton,
                    gameType === type.key && styles.selectedGameType
                  ]}
                  onPress={() => setGameType(type.key)}
                >
                  <Text style={styles.gameTypeEmoji}>{type.icon}</Text>
                  <Text style={[
                    styles.gameTypeText,
                    gameType === type.key && styles.selectedGameTypeText
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Number of Sets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Number of Sets</Text>
            <View style={styles.setsContainer}>
              {setOptions.map((sets) => (
                <TouchableOpacity
                  key={sets}
                  style={[
                    styles.setButton,
                    numberOfSets === sets && styles.selectedSet
                  ]}
                  onPress={() => setNumberOfSets(sets)}
                >
                  <Text style={[
                    styles.setButtonText,
                    numberOfSets === sets && styles.selectedSetText
                  ]}>
                    Best of {sets}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Umpire Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Umpire Details</Text>
            <TextInput
              style={styles.umpireInput}
              placeholder="Enter Umpire Name"
              value={umpireName}
              onChangeText={setUmpireName}
            />
          </View>

          {/* Player Inputs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Players</Text>
            {renderPlayerInputs()}
          </View>

          {/* Back to Home Button */}
          <TouchableOpacity 
            style={[styles.startButton, {backgroundColor: '#e74c3c', marginBottom: 15}]} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.startButtonText}>← Back to Home</Text>
          </TouchableOpacity>

          {/* Start Match Button */}
          <TouchableOpacity style={styles.startButton} onPress={startMatch}>
            <MaterialIcons name="sports" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  gameTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gameTypeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedGameType: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd',
  },
  gameTypeEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  gameTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedGameTypeText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  setsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  setButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedSet: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e8',
  },
  setButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  selectedSetText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  umpireInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  teamSection: {
    marginBottom: 15,
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  playerInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
