import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Modal,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function BadmintonHistoryScreen({ navigation }) {
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('badmintonHistory');
      if (stored) {
        setMatchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      Alert.alert('Error', 'Failed to load match history');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all match history? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('badmintonHistory');
              setMatchHistory([]);
              Alert.alert('Success', 'Match history cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  };

  const deleteMatch = (matchId) => {
    Alert.alert(
      'Delete Match',
      'Are you sure you want to delete this match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedHistory = matchHistory.filter(match => match.id !== matchId);
              await AsyncStorage.setItem('badmintonHistory', JSON.stringify(updatedHistory));
              setMatchHistory(updatedHistory);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete match');
            }
          }
        }
      ]
    );
  };

  const exportMatch = async (match) => {
    try {
      const getTeamName = (team) => {
        if (match.matchConfig?.gameType === 'singles') {
          return team === 'A' 
            ? match.matchConfig?.teamA?.player1 || 'Player A'
            : match.matchConfig?.teamB?.player1 || 'Player B';
        }
        return team === 'A' 
          ? `${match.matchConfig?.teamA?.player1 || 'Player A1'} / ${match.matchConfig?.teamA?.player2 || 'Player A2'}`
          : `${match.matchConfig?.teamB?.player1 || 'Player B1'} / ${match.matchConfig?.teamB?.player2 || 'Player B2'}`;
      };

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
              .result-box { background-color: #e8f5e8; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>🏸 Badminton Match Result</h1>
            
            <div class="result-box">
              <h2>🏆 ${match.winnerName} Won!</h2>
              <p><strong>Final Score:</strong> ${match.setsA} - ${match.setsB}</p>
            </div>

            <div class="match-info">
              <h2>Match Details</h2>
              <p><strong>Game Type:</strong> ${match.matchConfig?.gameType ? match.matchConfig.gameType.charAt(0).toUpperCase() + match.matchConfig.gameType.slice(1) : 'Unknown'}</p>
              <p><strong>Format:</strong> Best of ${match.matchConfig?.numberOfSets || 'Unknown'}</p>
              <p><strong>Umpire:</strong> ${match.matchConfig?.umpireName || 'Not specified'}</p>
              <p><strong>Date:</strong> ${new Date(match.matchConfig?.startTime || match.date || new Date()).toLocaleString()}</p>
              <p><strong>Duration:</strong> ${match.duration ? Math.round(match.duration / 60000) : 0} minutes</p>
            </div>

            <h2>Players</h2>
            <div class="match-info">
              <p><strong>Team A:</strong> ${getTeamName('A')}</p>
              <p><strong>Team B:</strong> ${getTeamName('B')}</p>
            </div>

            <h2>Set-by-Set Results</h2>
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
                ${match.sets.map(set => `
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
              ${match.rallyHistory.map((rally, index) => `
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
      const teamAName = match.teamA.replace(/[^a-zA-Z0-9]/g, '_');
      const teamBName = match.teamB.replace(/[^a-zA-Z0-9]/g, '_');
      const winnerName = match.winner.replace(/[^a-zA-Z0-9]/g, '_');
      const date = new Date(match.date).toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const fileName = `Badminton_${teamAName}_vs_${teamBName}_Winner_${winnerName}_${date}.pdf`;
      
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

  const showMatchDetails = (match) => {
    setSelectedMatch(match);
    setShowDetailsModal(true);
  };

  const renderMatchItem = ({ item }) => {
    // Safe access to startTime with fallback
    const startTime = item.matchConfig?.startTime || item.date || new Date().toISOString();
    const matchDate = new Date(startTime).toLocaleDateString();
    const matchTime = new Date(startTime).toLocaleTimeString();
    const duration = item.duration ? Math.round(item.duration / 60000) : 0;

    return (
      <View style={styles.matchItem}>
        <TouchableOpacity 
          style={styles.matchContent}
          onPress={() => showMatchDetails(item)}
        >
          <View style={styles.matchHeader}>
            <Text style={styles.gameType}>
              {item.matchConfig?.gameType ? item.matchConfig.gameType.charAt(0).toUpperCase() + item.matchConfig.gameType.slice(1) : 'Unknown'}
            </Text>
            <Text style={styles.matchDate}>{matchDate}</Text>
          </View>
          
          <View style={styles.playersContainer}>
            <Text style={styles.playerName}>
              {item.matchConfig?.gameType === 'singles' 
                ? item.matchConfig?.teamA?.player1 || 'Player A'
                : `${item.matchConfig?.teamA?.player1 || 'Player A1'} / ${item.matchConfig?.teamA?.player2 || 'Player A2'}`}
            </Text>
            <Text style={styles.vs}>VS</Text>
            <Text style={styles.playerName}>
              {item.matchConfig?.gameType === 'singles' 
                ? item.matchConfig?.teamB?.player1 || 'Player B'
                : `${item.matchConfig?.teamB?.player1 || 'Player B1'} / ${item.matchConfig?.teamB?.player2 || 'Player B2'}`}
            </Text>
          </View>

          <View style={styles.resultContainer}>
            <Text style={styles.winner}>🏆 {item.winnerName}</Text>
            <Text style={styles.score}>Sets: {item.setsA} - {item.setsB}</Text>
          </View>

          <Text style={styles.matchTime}>{matchTime} • {duration} min • {item.matchConfig?.umpireName || 'Unknown Umpire'}</Text>
        </TouchableOpacity>

        <View style={styles.matchActions}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => exportMatch(item)}
          >
            <MaterialIcons name="share" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#FF5722' }]}
            onPress={() => deleteMatch(item.id)}
          >
            <MaterialIcons name="delete" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMatchDetails = () => {
    if (!selectedMatch) return null;

    const getTeamName = (team) => {
      if (selectedMatch.matchConfig.gameType === 'singles') {
        return team === 'A' ? selectedMatch.matchConfig.teamA.player1 : selectedMatch.matchConfig.teamB.player1;
      }
      return team === 'A' 
        ? `${selectedMatch.matchConfig.teamA.player1} / ${selectedMatch.matchConfig.teamA.player2}`
        : `${selectedMatch.matchConfig.teamB.player1} / ${selectedMatch.matchConfig.teamB.player2}`;
    };

    return (
      <Modal visible={showDetailsModal} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Match Details</Text>
              <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                <MaterialIcons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>🏆 Winner: {selectedMatch.winnerName}</Text>
                <Text style={styles.detailText}>Final Score: {selectedMatch.setsA} - {selectedMatch.setsB}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Match Information</Text>
                <Text style={styles.detailText}>Game Type: {selectedMatch.matchConfig?.gameType ? selectedMatch.matchConfig.gameType.charAt(0).toUpperCase() + selectedMatch.matchConfig.gameType.slice(1) : 'Unknown'}</Text>
                <Text style={styles.detailText}>Format: Best of {selectedMatch.matchConfig?.numberOfSets || 'Unknown'}</Text>
                <Text style={styles.detailText}>Umpire: {selectedMatch.matchConfig?.umpireName || 'Not specified'}</Text>
                <Text style={styles.detailText}>Date: {new Date(selectedMatch.matchConfig?.startTime || selectedMatch.date || new Date()).toLocaleString()}</Text>
                <Text style={styles.detailText}>Duration: {selectedMatch.duration ? Math.round(selectedMatch.duration / 60000) : 0} minutes</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Set Results</Text>
                {selectedMatch.sets.map((set, index) => (
                  <Text key={index} style={styles.detailText}>
                    Set {set.set}: {set.scoreA} - {set.scoreB} ({getTeamName(set.winner)} won)
                  </Text>
                ))}
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailTitle}>Rally Summary</Text>
                <Text style={styles.detailText}>Total Rallies: {selectedMatch.rallyHistory.length}</Text>
                {selectedMatch.rallyHistory.slice(0, 10).map((rally, index) => (
                  <Text key={index} style={styles.rallyText}>
                    Set {rally.set}: Point to {getTeamName(rally.point)} ({rally.scoreA}-{rally.scoreB})
                  </Text>
                ))}
                {selectedMatch.rallyHistory.length > 10 && (
                  <Text style={styles.detailText}>... and {selectedMatch.rallyHistory.length - 10} more</Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => {
                setShowDetailsModal(false);
                exportMatch(selectedMatch);
              }}
            >
              <MaterialIcons name="share" size={20} color="#fff" />
              <Text style={styles.exportButtonText}>Export Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading match history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏸 Match History</Text>
        {matchHistory.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <MaterialIcons name="delete-sweep" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {matchHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="history" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No matches played yet</Text>
          <Text style={styles.emptySubText}>Start playing some badminton matches!</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Total Matches: {matchHistory.length}</Text>
          </View>
          <FlatList
            data={matchHistory}
            renderItem={renderMatchItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshing={loading}
            onRefresh={loadHistory}
          />
        </>
      )}

      {renderMatchDetails()}
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
  clearButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  statsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 15,
  },
  matchItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
  },
  matchContent: {
    flex: 1,
    padding: 15,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  matchDate: {
    fontSize: 14,
    color: '#666',
  },
  playersContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    marginVertical: 2,
  },
  vs: {
    fontSize: 12,
    color: '#999',
    fontWeight: 'bold',
    marginVertical: 5,
  },
  resultContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  winner: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  matchTime: {
    fontSize: 12,
    color: '#999',
  },
  matchActions: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    marginVertical: 2,
    elevation: 1,
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
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  rallyText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 3,
    paddingLeft: 10,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    margin: 20,
    borderRadius: 10,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
