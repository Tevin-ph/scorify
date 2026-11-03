import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function BadmintonMatchScreen({ route, navigation }) {
  const { matchConfig } = route.params;

  // Match state
  // NOTE: If you add any <TextInput ... /> in the future, use placeholderTextColor="#222" for visibility on Android.
  const [currentSet, setCurrentSet] = useState(1);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [serving, setServing] = useState('A');
  
  // Sets tracking
  const [setsA, setSetsA] = useState(0);
  const [setsB, setSetsB] = useState(0);
  const [completedSets, setCompletedSets] = useState([]);
  
  // Match status
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Rally history for commentary
  const [rallyHistory, setRallyHistory] = useState([]);

  // Undo last rally
  const undoLastRally = useCallback(() => {
    if (rallyHistory.length === 0) return;
    const last = rallyHistory[rallyHistory.length - 1];
    setRallyHistory(prev => prev.slice(0, -1));
    setCurrentSet(last.set);
    setScoreA(last.scoreA);
    setScoreB(last.scoreB);
    setServing(last.server);
  }, [rallyHistory]);
  
  // Modals
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  const maxScore = 21; // Standard badminton scoring
  const setsToWin = Math.ceil(matchConfig.numberOfSets / 2);

  const getTeamName = (team) => {
    if (matchConfig.gameType === 'singles') {
      return team === 'A' ? matchConfig.teamA.player1 : matchConfig.teamB.player1;
    }
    return team === 'A' 
      ? `${matchConfig.teamA.player1} / ${matchConfig.teamA.player2}`
      : `${matchConfig.teamB.player1} / ${matchConfig.teamB.player2}`;
  };

  const addRally = useCallback((team, newScoreA, newScoreB) => {
    const rally = {
      set: currentSet,
      scoreA: newScoreA,
      scoreB: newScoreB,
      point: team,
      server: serving,
      timestamp: new Date().toISOString()
    };
    setRallyHistory(prev => [...prev, rally]);
  }, [currentSet, serving]);

  const scorePoint = useCallback((team) => {
    if (isMatchComplete) return;

    const newScoreA = team === 'A' ? scoreA + 1 : scoreA;
    const newScoreB = team === 'B' ? scoreB + 1 : scoreB;

    setScoreA(newScoreA);
    setScoreB(newScoreB);
    
    // Add to rally history
    addRally(team, newScoreA, newScoreB);

    // Change server (in badminton, server changes after each point lost)
    if (team !== serving) {
      setServing(team);
    }

    // Check if set is won
    const isSetWon = (newScoreA >= maxScore && newScoreA - newScoreB >= 2) || 
                     (newScoreB >= maxScore && newScoreB - newScoreA >= 2) ||
                     newScoreA === 30 || newScoreB === 30; // Deuce rule (max 30)

    if (isSetWon) {
      const setWinnerTeam = newScoreA > newScoreB ? 'A' : 'B';
      
      // Add completed set
      const completedSet = {
        set: currentSet,
        scoreA: newScoreA,
        scoreB: newScoreB,
        winner: setWinnerTeam
      };
      
      setCompletedSets(prev => [...prev, completedSet]);
      
      // Update sets won
      const newSetsA = setWinnerTeam === 'A' ? setsA + 1 : setsA;
      const newSetsB = setWinnerTeam === 'B' ? setsB + 1 : setsB;
      
      setSetsA(newSetsA);
      setSetsB(newSetsB);

      // Check if match is won
      if (newSetsA === setsToWin || newSetsB === setsToWin) {
        const matchWinner = newSetsA > newSetsB ? 'A' : 'B';
        setWinner(matchWinner);
        setIsMatchComplete(true);
        saveMatchResult(matchWinner, [...completedSets, completedSet], newSetsA, newSetsB);
        
        // Force the victory modal to show after a short delay to ensure state is updated
        setTimeout(() => {
          setShowVictoryModal(true);
        }, 100);
      } else {
        // Start next set
        Alert.alert(
          'Set Complete!',
          `${getTeamName(setWinnerTeam)} won set ${currentSet}: ${newScoreA}-${newScoreB}`,
          [
            {
              text: 'Next Set',
              onPress: () => {
                setCurrentSet(currentSet + 1);
                setScoreA(0);
                setScoreB(0);
                setServing('A'); // A serves first in new set
              }
            }
          ]
        );
      }
    }
  }, [scoreA, scoreB, serving, isMatchComplete, currentSet, setsA, setsB, setsToWin, maxScore, addRally]);

  const saveMatchResult = async (matchWinner, finalSets, finalSetsA, finalSetsB) => {
    try {
      const matchResult = {
        id: Date.now().toString(),
        matchConfig,
        sets: finalSets,
        winner: matchWinner,
        winnerName: getTeamName(matchWinner),
        loserName: getTeamName(matchWinner === 'A' ? 'B' : 'A'),
        setsA: finalSetsA,
        setsB: finalSetsB,
        rallyHistory,
        endTime: new Date().toISOString(),
        duration: new Date() - new Date(matchConfig.startTime)
      };

      const existingHistory = await AsyncStorage.getItem('badmintonHistory');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const updatedHistory = [matchResult, ...history];
      
      await AsyncStorage.setItem('badmintonHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save match result:', error);
    }
  };

  const exportMatch = async () => {
    try {
      const sets = [...completedSets];
      if (!isMatchComplete && (scoreA > 0 || scoreB > 0)) {
        sets.push({
          set: currentSet,
          scoreA,
          scoreB,
          winner: scoreA > scoreB ? 'A' : 'B'
        });
      }

      const html = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #2196F3; text-align: center; }
              h2 { color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 5px; }
              .match-info { background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 10px 0; }
              .score-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .score-table th, .score-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
              .score-table th { background-color: #2196F3; color: white; }
              .winner { background-color: #4CAF50; color: white; font-weight: bold; }
              .rally-history { font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>🏸 Badminton Match Result</h1>
            
            <div class="match-info">
              <h2>Match Details</h2>
              <p><strong>Game Type:</strong> ${matchConfig.gameType.charAt(0).toUpperCase() + matchConfig.gameType.slice(1)}</p>
              <p><strong>Format:</strong> Best of ${matchConfig.numberOfSets}</p>
              <p><strong>Umpire:</strong> ${matchConfig.umpireName}</p>
              <p><strong>Date:</strong> ${new Date(matchConfig.startTime).toLocaleString()}</p>
              ${isMatchComplete ? `<p><strong>Winner:</strong> ${getTeamName(winner)}</p>` : '<p><strong>Status:</strong> In Progress</p>'}
            </div>

            <h2>Players</h2>
            <div class="match-info">
              <p><strong>Team A:</strong> ${getTeamName('A')}</p>
              <p><strong>Team B:</strong> ${getTeamName('B')}</p>
            </div>

            <h2>Set Scores</h2>
            <table class="score-table">
              <thead>
                <tr>
                  <th>Set</th>
                  <th>Team A</th>
                  <th>Team B</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                ${sets.map(set => `
                  <tr>
                    <td>Set ${set.set}</td>
                    <td class="${set.winner === 'A' ? 'winner' : ''}">${set.scoreA}</td>
                    <td class="${set.winner === 'B' ? 'winner' : ''}">${set.scoreB}</td>
                    <td>${getTeamName(set.winner)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <h2>Rally-by-Rally Commentary</h2>
            <div class="rally-history">
              ${rallyHistory.map((rally, index) => `
                <p><strong>Set ${rally.set}, Rally ${index + 1}:</strong> 
                Point to ${getTeamName(rally.point)} | 
                Score: ${rally.scoreA}-${rally.scoreB} | 
                Server: ${getTeamName(rally.server)}</p>
              `).join('')}
            </div>

            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
              Generated on ${new Date().toLocaleString()}
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      
      // Create a descriptive filename
      const teamAName = getTeamName('A').replace(/[^a-zA-Z0-9]/g, '_');
      const teamBName = getTeamName('B').replace(/[^a-zA-Z0-9]/g, '_');
      const winnerName = isMatchComplete ? getTeamName(winner).replace(/[^a-zA-Z0-9]/g, '_') : 'InProgress';
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const fileName = isMatchComplete 
        ? `Badminton_${teamAName}_vs_${teamBName}_Winner_${winnerName}_${date}.pdf`
        : `Badminton_${teamAName}_vs_${teamBName}_InProgress_${date}.pdf`;
      
      // Copy to a permanent location with descriptive name
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Badminton Match Result'
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Could not generate match report: ' + error.message);
    }
  };

  const resetMatch = () => {
    Alert.alert(
      'Reset Match',
      'Are you sure you want to reset the current match? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setCurrentSet(1);
            setScoreA(0);
            setScoreB(0);
            setServing('A');
            setSetsA(0);
            setSetsB(0);
            setCompletedSets([]);
            setIsMatchComplete(false);
            setWinner(null);
            setRallyHistory([]);
            setShowVictoryModal(false);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏸 {matchConfig.gameType.charAt(0).toUpperCase() + matchConfig.gameType.slice(1)}</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportMatch}>
          <MaterialIcons name="share" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={styles.umpireText}>Umpire: {matchConfig.umpireName}</Text>
          <Text style={styles.formatText}>Best of {matchConfig.numberOfSets} Sets</Text>
          <Text style={styles.setInfo}>Set {currentSet} {isMatchComplete ? '(Complete)' : '(In Progress)'}</Text>
        </View>

        {/* Sets Score */}
        <View style={styles.setsScore}>
          <View style={styles.setsDisplay}>
            <Text style={styles.setsLabel}>Sets Won</Text>
            <View style={styles.setsRow}>
              <Text style={styles.setsText}>{getTeamName('A').split(' / ')[0]}: {setsA}</Text>
              <Text style={styles.setsText}>{getTeamName('B').split(' / ')[0]}: {setsB}</Text>
            </View>
          </View>
        </View>

        {/* Current Set Score */}
        <View style={styles.scoreContainer}>
          <View style={[styles.teamSection, serving === 'A' && styles.servingTeam]}>
            <Text style={styles.teamName}>{getTeamName('A')}</Text>
            <Text style={styles.score}>{scoreA}</Text>
            <TouchableOpacity 
              style={[styles.scoreButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => scorePoint('A')}
              disabled={isMatchComplete}
            >
              <Text style={styles.scoreButtonText}>+1</Text>
            </TouchableOpacity>
            {serving === 'A' && <Text style={styles.servingIndicator}>🏸 Serving</Text>}
          </View>

          <View style={styles.vs}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={[styles.teamSection, serving === 'B' && styles.servingTeam]}>
            <Text style={styles.teamName}>{getTeamName('B')}</Text>
            <Text style={styles.score}>{scoreB}</Text>
            <TouchableOpacity 
              style={[styles.scoreButton, { backgroundColor: '#FF5722' }]}
              onPress={() => scorePoint('B')}
              disabled={isMatchComplete}
            >
              <Text style={styles.scoreButtonText}>+1</Text>
            </TouchableOpacity>
            {serving === 'B' && <Text style={styles.servingIndicator}>🏸 Serving</Text>}
          </View>
        </View>

        {/* Completed Sets */}
        {completedSets.length > 0 && (
          <View style={styles.setsHistory}>
            <Text style={styles.setsHistoryTitle}>Completed Sets</Text>
            {completedSets.map((set, index) => (
              <View key={index} style={styles.setResult}>
                <Text style={styles.setResultText}>
                  Set {set.set}: {set.scoreA} - {set.scoreB} 
                  ({getTeamName(set.winner)} won)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isMatchComplete && (scoreA > 0 || scoreB > 0) && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]} 
              onPress={() => {
                Alert.alert(
                  'End Match',
                  'Are you sure you want to end the match now? The team with more sets will be declared the winner.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'End Match',
                      style: 'destructive',
                      onPress: () => {
                        const matchWinner = setsA > setsB ? 'A' : (setsB > setsA ? 'B' : 'A'); // Default to A if tied
                        setWinner(matchWinner);
                        setIsMatchComplete(true);
                        saveMatchResult(matchWinner, completedSets);
                        setTimeout(() => setShowVictoryModal(true), 100);
                      }
                    }
                  ]
                );
              }}
            >
              <MaterialIcons name="stop" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>End Match</Text>
            </TouchableOpacity>
          )}

          {/* Undo Button */}
          {!isMatchComplete && rallyHistory.length > 0 && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#607D8B' }]} onPress={undoLastRally}>
              <MaterialIcons name="undo" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Undo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.resetButton} onPress={resetMatch}>
            <MaterialIcons name="refresh" size={20} color="#fff" />
            <Text style={styles.resetButtonText}>Reset Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Victory Modal */}
      <Modal visible={showVictoryModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Match Complete!</Text>
            <Text style={styles.winnerText}>{getTeamName(winner)} Wins!</Text>
            <Text style={styles.finalScore}>
              Final Score: {setsA} - {setsB}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => {
                  setShowVictoryModal(false);
                  navigation.navigate('BadmintonHistory');
                }}
              >
                <Text style={styles.modalButtonText}>View History</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => {
                  setShowVictoryModal(false);
                  exportMatch();
                }}
              >
                <Text style={styles.modalButtonText}>Export Result</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  exportButton: {
    padding: 5,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  matchInfo: {
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
  umpireText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  formatText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  setInfo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  setsScore: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  setsDisplay: {
    alignItems: 'center',
  },
  setsLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  setsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  setsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  scoreContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSection: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  servingTeam: {
    backgroundColor: '#e3f2fd',
  },
  teamName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 15,
  },
  scoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  scoreButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  servingIndicator: {
    marginTop: 10,
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  vs: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  setsHistory: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  setsHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  setResult: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginBottom: 5,
  },
  setResultText: {
    fontSize: 14,
    color: '#333',
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resetButton: {
    backgroundColor: '#FF5722',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  winnerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
