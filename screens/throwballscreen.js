import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

const ThrowballScreen = () => {
  const navigation = useNavigation();
  // Match state
  const [matchConfig, setMatchConfig] = useState({
    teamA: '',
    teamB: '',
    setsToWin: 3,
    pointsToWinSet: 15,
    umpireName: '',
  });
  
  const [currentSet, setCurrentSet] = useState(1);
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  const [setScores, setSetScores] = useState({ A: 0, B: 0 });
  const [setHistory, setSetHistory] = useState([]);
  const [servingTeam, setServingTeam] = useState('A');
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  
  // Modals
  const [showSetupModal, setShowSetupModal] = useState(true);
  const [showMatchHistoryModal, setShowMatchHistoryModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  
  // History
  const [matchHistory, setMatchHistory] = useState([]);

  // Load match history on component mount
  useEffect(() => {
    loadMatchHistory();
  }, []);

  const loadMatchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('throwball_match_history');
      if (history) {
        setMatchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading match history:', error);
    }
  };

  const saveMatchToHistory = async (matchData) => {
    try {
      const newHistory = [matchData, ...matchHistory];
      setMatchHistory(newHistory);
      await AsyncStorage.setItem('throwball_match_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving match to history:', error);
    }
  };

  const startMatch = () => {
    if (!matchConfig.teamA || !matchConfig.teamB) {
      Alert.alert('Error', 'Please enter team names');
      return;
    }
    setMatchStarted(true);
    setShowSetupModal(false);
  };

  const addPoint = (team) => {
    if (matchEnded) return;

    const newScore = team === 'A' ? teamAScore + 1 : teamBScore + 1;
    const currentTeamAScore = team === 'A' ? newScore : teamAScore;
    const currentTeamBScore = team === 'B' ? newScore : teamBScore;
    
    if (team === 'A') {
      setTeamAScore(newScore);
    } else {
      setTeamBScore(newScore);
    }

    // Check if set is won
    if (newScore >= matchConfig.pointsToWinSet) {
      const otherScore = team === 'A' ? teamBScore : teamAScore;
      if (newScore - otherScore >= 2) {
        // Set won
        const newSetScores = { ...setScores };
        newSetScores[team]++;
        setSetScores(newSetScores);
        
        // Add set to history
        setSetHistory([...setHistory, {
          setNumber: currentSet,
          teamAScore: currentTeamAScore,
          teamBScore: currentTeamBScore,
          winner: team
        }]);

        // Check if match is won
        if (newSetScores[team] >= matchConfig.setsToWin) {
          endMatch(team);
        } else {
          // Start new set
          setCurrentSet(currentSet + 1);
          setTeamAScore(0);
          setTeamBScore(0);
          // Switch serving team
          setServingTeam(servingTeam === 'A' ? 'B' : 'A');
          Alert.alert('Set Won!', `${team === 'A' ? matchConfig.teamA : matchConfig.teamB} wins Set ${currentSet}!`);
        }
      }
    }

    // Switch serving team every point (common in throwball)
    setServingTeam(servingTeam === 'A' ? 'B' : 'A');
  };

  const subtractPoint = (team) => {
    if (matchEnded) return;
    
    if (team === 'A' && teamAScore > 0) {
      setTeamAScore(teamAScore - 1);
    } else if (team === 'B' && teamBScore > 0) {
      setTeamBScore(teamBScore - 1);
    }
  };

  // Leader on sets, falling back to the current set's points when sets are level
  const getLeadingTeam = () => {
    if (setScores.A !== setScores.B) return setScores.A > setScores.B ? 'A' : 'B';
    if (teamAScore !== teamBScore) return teamAScore > teamBScore ? 'A' : 'B';
    return null;
  };

  const confirmEndMatch = () => {
    const leader = getLeadingTeam();
    if (!leader) {
      Alert.alert('Cannot End Match', 'The match is tied, so there is no winner yet. Score another point first.');
      return;
    }
    const leaderName = leader === 'A' ? matchConfig.teamA : matchConfig.teamB;
    Alert.alert(
      'End Match',
      `End the match now? ${leaderName} is currently ahead and will be recorded as the winner.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Match', style: 'destructive', onPress: () => endMatch(leader) }
      ]
    );
  };

  const endMatch = (winningTeam = null) => {
    const finalWinner = winningTeam || getLeadingTeam();
    setWinner(finalWinner);
    setMatchEnded(true);
    
    const matchData = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      teamA: matchConfig.teamA,
      teamB: matchConfig.teamB,
      setScores,
      setHistory,
      winner: finalWinner,
      winnerName: finalWinner === 'A' ? matchConfig.teamA : matchConfig.teamB,
      umpire: matchConfig.umpireName,
      duration: Date.now() - matchStartTime,
      setsToWin: matchConfig.setsToWin,
      pointsToWinSet: matchConfig.pointsToWinSet,
    };

    saveMatchToHistory(matchData);
    setShowVictoryModal(true);
  };

  const resetMatch = () => {
    Alert.alert(
      'Reset Match',
      'Are you sure you want to reset the current match?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setCurrentSet(1);
            setTeamAScore(0);
            setTeamBScore(0);
            setSetScores({ A: 0, B: 0 });
            setSetHistory([]);
            setServingTeam('A');
            setMatchEnded(false);
            setWinner(null);
          }
        }
      ]
    );
  };

  const newMatch = () => {
    setMatchStarted(false);
    setMatchEnded(false);
    setShowSetupModal(true);
    setCurrentSet(1);
    setTeamAScore(0);
    setTeamBScore(0);
    setSetScores({ A: 0, B: 0 });
    setSetHistory([]);
    setServingTeam('A');
    setWinner(null);
    setShowVictoryModal(false);
  };

  // Export match results to PDF
  const exportMatchToPDF = async () => {
    try {
      const matchDate = new Date().toLocaleDateString();
      const matchTime = new Date().toLocaleTimeString();
      
      // Create match summary
      const winnerTeam = winner === 'A' ? matchConfig.teamA : matchConfig.teamB;
      const loserTeam = winner === 'A' ? matchConfig.teamB : matchConfig.teamA;
      const winnerSets = setScores[winner];
      const loserSets = setScores[winner === 'A' ? 'B' : 'A'];

      let html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { 
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
                margin: 0; 
                padding: 20px;
                line-height: 1.6;
                color: #333;
                background-color: #fff;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #e74c3c; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
              }
              .title { 
                font-size: 24px; 
                font-weight: bold; 
                color: #e74c3c; 
                margin-bottom: 8px;
              }
              .subtitle { 
                font-size: 14px; 
                color: #666; 
              }
              .match-info { 
                background-color: #f8f9fa; 
                padding: 15px; 
                border-radius: 8px; 
                margin-bottom: 20px;
                border-left: 4px solid #e74c3c;
              }
              .info-row {
                margin-bottom: 8px;
                font-size: 14px;
              }
              .info-label {
                font-weight: bold;
                color: #555;
              }
              .result-section { 
                background-color: #e8f5e8; 
                padding: 20px; 
                border-radius: 8px; 
                border-left: 5px solid #4CAF50;
                margin-bottom: 20px;
                text-align: center;
              }
              .winner { 
                font-size: 20px; 
                font-weight: bold; 
                color: #4CAF50; 
                margin-bottom: 10px;
              }
              .score { 
                font-size: 16px; 
                margin-bottom: 8px;
              }
              .sets-detail { 
                margin-top: 20px; 
              }
              .sets-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #333;
              }
              .set-row { 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                padding: 12px; 
                border-bottom: 1px solid #ddd;
                font-size: 14px;
              }
              .set-row:nth-child(even) { 
                background-color: #f9f9f9; 
              }
              .set-number {
                font-weight: bold;
                width: 80px;
              }
              .set-scores {
                display: flex;
                gap: 20px;
                flex: 1;
                justify-content: center;
              }
              .set-winner {
                font-style: italic;
                color: #4CAF50;
                font-weight: 500;
              }
              .match-stats { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 15px; 
                margin-top: 20px;
              }
              .stat-box { 
                padding: 15px; 
                border: 1px solid #ddd; 
                border-radius: 8px;
                text-align: center;
                background-color: #fafafa;
              }
              .stat-label { 
                font-weight: bold; 
                color: #666; 
                font-size: 12px;
                text-transform: uppercase;
                margin-bottom: 5px;
              }
              .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #333;
              }
              .footer { 
                text-align: center; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #ddd; 
                color: #666; 
                font-size: 12px;
              }
              @media print {
                body { margin: 0; }
                .header { break-inside: avoid; }
                .result-section { break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">🏐 THROWBALL MATCH RESULT</div>
              <div class="subtitle">Official Match Report</div>
            </div>

            <div class="match-info">
              <div class="info-row"><span class="info-label">Date:</span> ${matchDate}</div>
              <div class="info-row"><span class="info-label">Time:</span> ${matchTime}</div>
              ${matchConfig.umpireName ? `<div class="info-row"><span class="info-label">Umpire:</span> ${matchConfig.umpireName}</div>` : ''}
              <div class="info-row"><span class="info-label">Match Format:</span> Best of ${matchConfig.setsToWin} sets (${matchConfig.pointsToWinSet} points per set)</div>
            </div>

            <div class="result-section">
              <div class="winner">🏆 WINNER: ${winnerTeam}</div>
              <div class="score">Final Score: ${winnerSets} - ${loserSets}</div>
              <div class="score">${winnerTeam} defeated ${loserTeam}</div>
            </div>

            <div class="sets-detail">
              <div class="sets-title">Set-by-Set Results:</div>`;

      // Add set details
      setHistory.forEach((set, index) => {
        const setWinner = set.teamAScore > set.teamBScore ? matchConfig.teamA : matchConfig.teamB;
        html += `
              <div class="set-row">
                <div class="set-number">Set ${index + 1}:</div>
                <div class="set-scores">
                  <span>${matchConfig.teamA}: ${set.teamAScore}</span>
                  <span>${matchConfig.teamB}: ${set.teamBScore}</span>
                </div>
                <div class="set-winner">Winner: ${setWinner}</div>
              </div>`;
      });

      html += `
            </div>

            <div class="match-stats">
              <div class="stat-box">
                <div class="stat-label">Total Sets Played</div>
                <div class="stat-value">${setHistory.length}</div>
              </div>
              <div class="stat-box">
                <div class="stat-label">Match Status</div>
                <div class="stat-value">Complete</div>
              </div>
            </div>

            <div class="footer">
              <p>Generated by Tournament Score App</p>
              <p>Throwball Match Report - ${matchDate}</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Create a more descriptive filename
      const teamAName = matchConfig.teamA.replace(/[^a-zA-Z0-9]/g, '_');
      const teamBName = matchConfig.teamB.replace(/[^a-zA-Z0-9]/g, '_');
      const winnerName = winnerTeam.replace(/[^a-zA-Z0-9]/g, '_');
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const fileName = `Throwball_${teamAName}_vs_${teamBName}_Winner_${winnerName}_${date}.pdf`;
      
      // Copy to a permanent location
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Match Result'
        });
        Alert.alert('Success', 'Match result exported and ready to share!');
      } else {
        Alert.alert('Export Complete', `Match result saved successfully!\nLocation: ${fileUri}`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Export Failed', `Unable to export match result: ${error.message || 'Unknown error'}. Please try again.`);
    }
  };

  const matchStartTime = Date.now();

  const renderSetupModal = () => (
    <Modal visible={showSetupModal} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.setupContainer}>
          <View style={styles.setupHeader}>
            <Text style={styles.setupTitle}>🏐 Throwball Match Setup</Text>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>Team Information</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="group" size={20} color="#757575" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Team A Name"
                value={matchConfig.teamA}
                onChangeText={(text) => setMatchConfig({...matchConfig, teamA: text})}
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="group" size={20} color="#757575" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Team B Name"
                value={matchConfig.teamB}
                onChangeText={(text) => setMatchConfig({...matchConfig, teamB: text})}
              />
            </View>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>Match Configuration</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Sets to Win Match:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={matchConfig.setsToWin}
                  style={styles.picker}
                  onValueChange={(value) => setMatchConfig({...matchConfig, setsToWin: value})}
                >
                  <Picker.Item label="Best of 3 (2 sets to win)" value={2} />
                  <Picker.Item label="Best of 5 (3 sets to win)" value={3} />
                </Picker>
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Points to Win Set:</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={matchConfig.pointsToWinSet}
                  style={styles.picker}
                  onValueChange={(value) => setMatchConfig({...matchConfig, pointsToWinSet: value})}
                >
                  <Picker.Item label="15 Points" value={15} />
                  <Picker.Item label="21 Points" value={21} />
                  <Picker.Item label="25 Points" value={25} />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.setupSection}>
            <Text style={styles.sectionTitle}>Officials</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={20} color="#757575" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Umpire Name (Optional)"
                value={matchConfig.umpireName}
                onChangeText={(text) => setMatchConfig({...matchConfig, umpireName: text})}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.startButton, {backgroundColor: '#e74c3c', marginBottom: 15}]} 
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.startButtonText}>← Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.startButton} onPress={startMatch}>
            <MaterialIcons name="sports-volleyball" size={24} color="#fff" />
            <Text style={styles.startButtonText}>Start Match</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderMatchHistoryModal = () => (
    <Modal visible={showMatchHistoryModal} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Match History</Text>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setShowMatchHistoryModal(false)}
          >
            <MaterialIcons name="close" size={24} color="#212121" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={matchHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
                <Text style={[styles.historyWinner, { color: '#4CAF50' }]}>
                  Winner: {item.winnerName}
                </Text>
              </View>
              <Text style={styles.historyTeams}>
                {item.teamA} vs {item.teamB}
              </Text>
              <Text style={styles.historyScore}>
                Sets: {item.setScores.A} - {item.setScores.B}
              </Text>
              {item.umpire && (
                <Text style={styles.historyUmpire}>Umpire: {item.umpire}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyHistory}>
              <MaterialIcons name="history" size={64} color="#BDBDBD" />
              <Text style={styles.emptyHistoryText}>No matches played yet</Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );

  const renderVictoryModal = () => (
    <Modal visible={showVictoryModal} animationType="fade" transparent>
      <View style={styles.victoryOverlay}>
        <View style={styles.victoryContainer}>
          <MaterialIcons name="emoji-events" size={80} color="#FF9800" />
          <Text style={styles.victoryTitle}>🎉 Match Complete! 🎉</Text>
          <Text style={styles.victoryWinner}>
            {winner === 'A' ? matchConfig.teamA : matchConfig.teamB} Wins!
          </Text>
          <Text style={styles.victoryScore}>
            Final Score: {setScores.A} - {setScores.B}
          </Text>
          
          <View style={styles.victoryButtons}>
            <TouchableOpacity style={styles.victoryButton} onPress={exportMatchToPDF}>
              <MaterialIcons name="file-download" size={24} color="#fff" />
              <Text style={styles.victoryButtonText}>Export Result</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.victoryButton} onPress={newMatch}>
              <MaterialIcons name="add-circle" size={24} color="#fff" />
              <Text style={styles.victoryButtonText}>New Match</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (!matchStarted) {
    return renderSetupModal();
  }

  return (
    <LinearGradient
      colors={['#e74c3c', '#c0392b', '#a93226']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowMatchHistoryModal(true)}>
          <MaterialIcons name="history" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏐 Throwball</Text>
        <TouchableOpacity onPress={resetMatch}>
          <MaterialIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* Match Info */}
        <View style={styles.matchInfo}>
          <Text style={styles.matchInfoText}>
            Set {currentSet} • Best of {matchConfig.setsToWin * 2 - 1}
          </Text>
          {matchConfig.umpireName && (
            <Text style={styles.umpireText}>Umpire: {matchConfig.umpireName}</Text>
          )}
        </View>

        {/* Score Display */}
        <View style={styles.scoreContainer}>
          {/* Team A */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{matchConfig.teamA}</Text>
            <Text style={styles.teamScore}>{teamAScore}</Text>
            <Text style={styles.setsWon}>Sets: {setScores.A}</Text>
            {servingTeam === 'A' && (
              <View style={styles.servingIndicator}>
                <MaterialIcons name="sports-volleyball" size={16} color="#4CAF50" />
                <Text style={styles.servingText}>Serving</Text>
              </View>
            )}
          </View>

          <View style={styles.vsContainer}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Team B */}
          <View style={styles.teamContainer}>
            <Text style={styles.teamName}>{matchConfig.teamB}</Text>
            <Text style={styles.teamScore}>{teamBScore}</Text>
            <Text style={styles.setsWon}>Sets: {setScores.B}</Text>
            {servingTeam === 'B' && (
              <View style={styles.servingIndicator}>
                <MaterialIcons name="sports-volleyball" size={16} color="#4CAF50" />
                <Text style={styles.servingText}>Serving</Text>
              </View>
            )}
          </View>
        </View>

        {/* Scoring Buttons */}
        <View style={styles.scoringContainer}>
          <View style={styles.teamScoringContainer}>
            <TouchableOpacity 
              style={[styles.scoreButton, { backgroundColor: matchEnded ? '#BDBDBD' : '#4CAF50' }]}
              onPress={() => addPoint('A')}
              disabled={matchEnded}
            >
              <Text style={styles.scoreButtonText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.subtractButton, { backgroundColor: matchEnded ? '#BDBDBD' : '#F44336' }]}
              onPress={() => subtractPoint('A')}
              disabled={matchEnded}
            >
              <Text style={styles.subtractButtonText}>-1</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.teamScoringContainer}>
            <TouchableOpacity 
              style={[styles.scoreButton, { backgroundColor: matchEnded ? '#BDBDBD' : '#4CAF50' }]}
              onPress={() => addPoint('B')}
              disabled={matchEnded}
            >
              <Text style={styles.scoreButtonText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.subtractButton, { backgroundColor: matchEnded ? '#BDBDBD' : '#F44336' }]}
              onPress={() => subtractPoint('B')}
              disabled={matchEnded}
            >
              <Text style={styles.subtractButtonText}>-1</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Set History */}
        {setHistory.length > 0 && (
          <View style={styles.setHistoryContainer}>
            <Text style={styles.setHistoryTitle}>Set History</Text>
            {setHistory.map((set, index) => (
              <View key={index} style={styles.setHistoryItem}>
                <Text style={styles.setHistoryText}>
                  Set {set.setNumber}: {matchConfig.teamA} {set.teamASetScore} - {set.teamBScore} {matchConfig.teamB}
                  {set.winner && ` (${set.winner === 'A' ? matchConfig.teamA : matchConfig.teamB} won)`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!matchEnded && (
            <TouchableOpacity 
              style={styles.endMatchButton}
              onPress={confirmEndMatch}
            >
              <MaterialIcons name="stop" size={24} color="#fff" />
              <Text style={styles.endMatchButtonText}>End Match</Text>
            </TouchableOpacity>
          )}

          {/* Undo Button */}
          {!matchEnded && (
            <TouchableOpacity style={[styles.endMatchButton, { backgroundColor: '#607D8B' }]} onPress={undoLastPoint}>
              <MaterialIcons name="undo" size={24} color="#fff" />
              <Text style={styles.endMatchButtonText}>Undo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.newMatchButton} onPress={newMatch}>
            <MaterialIcons name="add-circle" size={24} color="#fff" />
            <Text style={styles.newMatchButtonText}>New Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {renderMatchHistoryModal()}
      {renderVictoryModal()}
    </SafeAreaView>
    </LinearGradient>
  );
};

// Professional styles with gradient support
const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  setupContainer: {
    padding: 20,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 25,
    borderRadius: 18,
  },
  setupTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  setupSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212121',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  picker: {
    color: '#222',
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    marginVertical: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#212121',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  picker: {
    height: 50,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  header: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginHorizontal: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  matchInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 0,
    margin: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  matchInfoText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e74c3c',
    textAlign: 'center',
  },
  umpireText: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 35,
    margin: 20,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  teamContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  teamScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  setsWon: {
    fontSize: 16,
    color: '#757575',
    marginTop: 4,
  },
  servingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#C8E6C9',
    padding: 4,
    borderRadius: 50,
  },
  servingText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  vsContainer: {
    paddingHorizontal: 20,
  },
  vsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#757575',
  },
  scoringContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  teamScoringContainer: {
    alignItems: 'center',
  },
  scoreButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 80,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtractButton: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  subtractButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  setHistoryContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  setHistoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212121',
  },
  setHistoryItem: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  setHistoryText: {
    fontSize: 14,
    color: '#212121',
  },
  buttonContainer: {
    padding: 20,
  },
  endMatchButton: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  endMatchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  newMatchButton: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newMatchButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeButton: {
    padding: 8,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyDate: {
    fontSize: 14,
    color: '#757575',
  },
  historyWinner: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyTeams: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  historyScore: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 4,
  },
  historyUmpire: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
  emptyHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 96,
  },
  emptyHistoryText: {
    fontSize: 18,
    color: '#BDBDBD',
    marginTop: 20,
  },
  victoryOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  victoryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  victoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginVertical: 20,
  },
  victoryWinner: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  victoryScore: {
    fontSize: 18,
    color: '#757575',
    marginBottom: 32,
  },
  victoryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  victoryButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flex: 1,
    justifyContent: 'center',
  },
  victoryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ThrowballScreen;