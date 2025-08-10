import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native';

export default function BadmintonScreen({ navigation }) {
  // Match configuration
  const [matchType, setMatchType] = useState('singles');
  const [setsToWin, setSetsToWin] = useState(2);
  
  // Players
  const [player1A, setPlayer1A] = useState('');
  const [player2A, setPlayer2A] = useState('');
  const [player1B, setPlayer1B] = useState('');
  const [player2B, setPlayer2B] = useState('');
  
  // Match state
  const [currentSet, setCurrentSet] = useState(1);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [serving, setServing] = useState('A');
  
  // Completed sets
  const [sets, setSets] = useState([]);
  
  // Match history
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load history on component mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('badmintonHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        setHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch (e) {
      console.error('Error loading history:', e);
      Alert.alert('Error', 'Failed to load match history');
    }
  }, []);

  const validatePlayers = () => {
    if (matchType === 'singles') {
      return player1A.trim() && player1B.trim();
    }
    return player1A.trim() && player2A.trim() && player1B.trim() && player2B.trim();
  };

  const scorePoint = useCallback((team) => {
    if (!validatePlayers()) {
      Alert.alert('Error', 'Please enter all player names');
      return;
    }

    if (team === 'A') {
      const newScoreA = scoreA + 1;
      setScoreA(newScoreA);
      
      // Check if set is won
      if ((newScoreA >= 21 && newScoreA - scoreB >= 2) || newScoreA >= 30) {
        endSet('A');
        return;
      }
    } else {
      const newScoreB = scoreB + 1;
      setScoreB(newScoreB);
      
      // Check if set is won
      if ((newScoreB >= 21 && newScoreB - scoreA >= 2) || newScoreB >= 30) {
        endSet('B');
        return;
      }
    }

    // In badminton, the team that scores the point gets to serve
    setServing(team);
  }, [scoreA, scoreB, validatePlayers]);

  const endSet = useCallback((winner) => {
    const newSet = {
      number: currentSet,
      scoreA,
      scoreB,
      winner,
      timestamp: new Date().toISOString()
    };

    const updatedSets = [...sets, newSet];
    setSets(updatedSets);
    
    // Check if match is won
    const aWins = updatedSets.filter(s => s.winner === 'A').length;
    const bWins = updatedSets.filter(s => s.winner === 'B').length;
    
    if ((winner === 'A' && aWins >= setsToWin) ||
        (winner === 'B' && bWins >= setsToWin)) {
      endMatch(winner, updatedSets);
    } else {
      // Start next set
      setCurrentSet(prev => prev + 1);
      setScoreA(0);
      setScoreB(0);
      setServing('A');
    }
  }, [currentSet, scoreA, scoreB, sets, setsToWin]);

  const endMatch = async (winner, finalSets) => {
    if (!validatePlayers()) {
      Alert.alert('Error', 'Please enter all player names');
      return;
    }

    setIsLoading(true);
    
    const matchData = {
      id: Date.now(),
      date: new Date().toISOString(),
      type: matchType,
      setsToWin,
      sets: finalSets,
      winner,
      players: {
        teamA: matchType === 'singles' ? [player1A.trim()] : [player1A.trim(), player2A.trim()],
        teamB: matchType === 'singles' ? [player1B.trim()] : [player1B.trim(), player2B.trim()]
      }
    };

    try {
      // Save to history
      const updatedHistory = [matchData, ...history];
      setHistory(updatedHistory);
      await AsyncStorage.setItem('badmintonHistory', JSON.stringify(updatedHistory));
      
      // Reset match
      resetMatchState();
      
      Alert.alert(
        'Match Completed',
        `Team ${winner} wins the match!`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.error('Error saving match:', e);
      Alert.alert('Error', 'Failed to save match');
    } finally {
      setIsLoading(false);
    }
  };

  const resetMatchState = () => {
    setCurrentSet(1);
    setScoreA(0);
    setScoreB(0);
    setSets([]);
    setServing('A');
  };

  const resetMatch = () => {
    Alert.alert(
      'Reset Match',
      'Are you sure you want to reset the current match? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: resetMatchState
        }
      ]
    );
  };

  const renderPlayerInputs = () => (
    <View style={styles.playerInputs}>
      <Text style={styles.sectionTitle}>Match Setup</Text>
      
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, matchType === 'singles' && styles.activeType]}
          onPress={() => setMatchType('singles')}>
          <Text>Singles</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, matchType === 'doubles' && styles.activeType]}
          onPress={() => setMatchType('doubles')}>
          <Text>Doubles</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.teamLabel}>Team A</Text>
      <TextInput
        style={styles.input}
        placeholder={matchType === 'singles' ? "Player 1 Name" : "Player 1 (Team A)"}
        value={player1A}
        onChangeText={setPlayer1A}
        maxLength={20}
      />
      {matchType === 'doubles' && (
        <TextInput
          style={styles.input}
          placeholder="Player 2 (Team A)"
          value={player2A}
          onChangeText={setPlayer2A}
          maxLength={20}
        />
      )}

      <Text style={styles.teamLabel}>Team B</Text>
      <TextInput
        style={styles.input}
        placeholder={matchType === 'singles' ? "Player 2 Name" : "Player 1 (Team B)"}
        value={player1B}
        onChangeText={setPlayer1B}
        maxLength={20}
      />
      {matchType === 'doubles' && (
        <TextInput
          style={styles.input}
          placeholder="Player 2 (Team B)"
          value={player2B}
          onChangeText={setPlayer2B}
          maxLength={20}
        />
      )}

      <View style={styles.setsSelector}>
        <Text style={styles.teamLabel}>Sets to Win:</Text>
        <View style={styles.setsButtons}>
          {[1, 2, 3].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.setButton, setsToWin === num && styles.activeSet]}
              onPress={() => setSetsToWin(num)}>
              <Text>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderScoreboard = () => (
    <View style={styles.scoreboard}>
      <Text style={styles.setIndicator}>Set {currentSet}</Text>
      
      <View style={styles.scoreContainer}>
        <View style={[
          styles.teamScore, 
          serving === 'A' && styles.servingTeamContainer
        ]}>
          <Text style={[
            styles.teamName, 
            serving === 'A' && styles.servingTeamName
          ]}>Team A</Text>
          <Text style={[
            styles.score, 
            serving === 'A' && styles.servingTeamScore
          ]}>{scoreA}</Text>
          {serving === 'A' && (
            <View style={styles.serveIndicator}>
              <MaterialIcons name="sports-baseball" size={32} color="#4CAF50" />
              <Text style={styles.serveText}>SERVE</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.vsText}>VS</Text>
        
        <View style={[
          styles.teamScore, 
          serving === 'B' && styles.servingTeamContainer
        ]}>
          <Text style={[
            styles.teamName, 
            serving === 'B' && styles.servingTeamName
          ]}>Team B</Text>
          <Text style={[
            styles.score, 
            serving === 'B' && styles.servingTeamScore
          ]}>{scoreB}</Text>
          {serving === 'B' && (
            <View style={styles.serveIndicator}>
              <MaterialIcons name="sports-baseball" size={32} color="#f44336" />
              <Text style={styles.serveText}>SERVE</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.scoreButtons}>
        <TouchableOpacity 
          style={[styles.scoreButton, styles.scoreButtonA]}
          onPress={() => scorePoint('A')}
          disabled={isLoading}>
          <Text style={styles.buttonText}>Point Team A</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.scoreButton, styles.scoreButtonB]}
          onPress={() => scorePoint('B')}
          disabled={isLoading}>
          <Text style={styles.buttonText}>Point Team B</Text>
        </TouchableOpacity>
      </View>

      {sets.length > 0 && (
        <View style={styles.setsSummary}>
          <Text style={styles.setsTitle}>Completed Sets:</Text>
          {sets.map((set, index) => (
            <View key={index} style={styles.setItem}>
              <Text>Set {set.number}: {set.scoreA} - {set.scoreB}</Text>
              <Text style={set.winner === 'A' ? styles.teamAWinner : styles.teamBWinner}>
                Winner: Team {set.winner}
              </Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity 
        style={styles.resetButton}
        onPress={resetMatch}
        disabled={isLoading}>
        <Text style={styles.resetButtonText}>Reset Match</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderPlayerInputs()}
        {renderScoreboard()}

        <TouchableOpacity 
          style={styles.historyButton}
          onPress={() => setShowHistoryModal(true)}>
          <MaterialIcons name="history" size={24} color="white" />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showHistoryModal}
        animationType="slide"
        onRequestClose={() => setShowHistoryModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Match History</Text>
            <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
              <MaterialIcons name="close" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={history}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.historyList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.historyItem}
                onPress={() => navigation.navigate('MatchDetails', { match: item })}>
                <Text style={styles.historyDate}>{new Date(item.date).toLocaleString()}</Text>
                <Text style={styles.historyPlayers}>
                  {item.players.teamA.join(' & ')} vs {item.players.teamB.join(' & ')}
                </Text>
                <Text style={styles.matchResult}>
                  Winner: Team {item.winner} ({item.sets.length} sets)
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyHistory}>No matches recorded yet</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  playerInputs: {
    marginBottom: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  teamLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    marginTop: 15,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  activeType: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  setsSelector: {
    marginTop: 15,
  },
  setsButtons: {
    flexDirection: 'row',
    marginTop: 5,
  },
  setButton: {
    padding: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  activeSet: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  scoreboard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  setIndicator: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  teamScore: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
  },
  scoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  scoreButton: {
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  scoreButtonA: {
    backgroundColor: '#4CAF50',
  },
  scoreButtonB: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  setsSummary: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  setsTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 16,
  },
  setItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  teamAWinner: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  teamBWinner: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  historyButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 20,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    elevation: 3,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  historyList: {
    padding: 20,
  },
  historyItem: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  historyDate: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  historyPlayers: {
    marginBottom: 5,
  },
  matchResult: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  emptyHistory: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#666',
  },
});
