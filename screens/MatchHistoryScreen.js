import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

export default function MatchHistory({ navigation, route }) {
  const [matches, setMatches] = useState([]);
  const { hasActiveMatch, activeMatchData } = route.params || {};

  useEffect(() => {
    const load = async () => {
      const data = await AsyncStorage.getItem('cricket_history');
      if (data) setMatches(JSON.parse(data));
    };
    load();
  }, []);

  const exportMatch = async (match) => {
    const formatInnings = (data, label) => {
      let html = `<h2>${label} - ${data.team}</h2><h3>Batsmen</h3><ul>`;
      for (let name in data.batsmenStats) {
        const s = data.batsmenStats[name];
        html += `<li>${name}: ${s.runs} runs (${s.balls} balls) - ${s.status}</li>`;
      }
      html += `</ul><h3>Bowlers</h3><ul>`;
      for (let name in data.bowlerStats) {
        const s = data.bowlerStats[name];
        const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
        html += `<li>${name}: ${overs} overs, ${s.runs} runs, ${s.wickets} wickets</li>`;
      }
      html += `</ul><h3>Overs</h3>`;
      data.oversHistory.forEach((over, i) => {
        html += `<p><strong>Over ${i + 1} - ${over.bowler}</strong><br/>`;
        over.balls.forEach(ball => {
          html += `${ball.striker}: ${ball.type} ${ball.value !== undefined ? `(${ball.value})` : ''}<br/>`;
        });
        html += `</p>`;
      });
      return html;
    };

    const html = `
      <h1>${match.team1} vs ${match.team2}</h1>
      <p>Date: ${match.firstInnings.date}</p>
      ${formatInnings(match.firstInnings, '1st Innings')}
      ${formatInnings(match.secondInnings, '2nd Innings')}
      <h3>Result: ${match.winner} won by ${match.winMargin}</h3>
      ${match.umpireNotes && match.umpireNotes.length > 0 ? `
        <h3>📝 Umpire Notes</h3>
        ${match.umpireNotes.map(note => `
          <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px;">
            <p><strong>Time:</strong> ${note.timestamp}</p>
            <p><strong>Context:</strong> Innings ${note.innings} • Over ${note.over} • Score: ${note.score}</p>
            <p><strong>Note:</strong> ${note.text}</p>
          </div>
        `).join('')}
      ` : ''}
    `;

    try {
      // Generate PDF using Expo Print
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Create a descriptive filename
      const team1Name = match.team1.replace(/[^a-zA-Z0-9]/g, '_');
      const team2Name = match.team2.replace(/[^a-zA-Z0-9]/g, '_');
      const winnerName = match.winner.replace(/[^a-zA-Z0-9]/g, '_');
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const fileName = `Cricket_${team1Name}_vs_${team2Name}_Winner_${winnerName}_${date}.pdf`;
      
      // Copy to a permanent location with descriptive name
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.copyAsync({
        from: uri,
        to: fileUri
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Cricket Match Result'
        });
        Alert.alert('Success', 'Match scorecard exported successfully!');
      } else {
        Alert.alert('Export Complete', `Match scorecard saved to: ${fileUri}`);
      }
    } catch (e) {
      console.error('Export failed', e);
      Alert.alert('Error', `Failed to export PDF: ${e.message || 'Unknown error'}`);
    }
  };

  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#1e3c72']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.title}>📜 Match History</Text>
          
          {/* Back to Current Match Button */}
          {hasActiveMatch && activeMatchData && (
            <View style={styles.currentMatchSection}>
              <View style={styles.currentMatchCard}>
                <Text style={styles.currentMatchTitle}>🏏 Current Match in Progress</Text>
                <Text style={styles.currentMatchInfo}>
                  {activeMatchData.battingTeam} vs {activeMatchData.bowlingTeam}
                </Text>
                <Text style={styles.currentMatchScore}>
                  Innings {activeMatchData.innings}: {activeMatchData.runs}/{activeMatchData.wickets} 
                  ({activeMatchData.overs}/{activeMatchData.maxOvers} overs)
                </Text>
                {activeMatchData.umpireNotes && activeMatchData.umpireNotes.length > 0 && (
                  <Text style={styles.currentMatchNotes}>
                    📝 {activeMatchData.umpireNotes.length} umpire note{activeMatchData.umpireNotes.length > 1 ? 's' : ''}
                  </Text>
                )}
                <TouchableOpacity 
                  style={styles.backToMatchButton} 
                  onPress={() => navigation.goBack()}
                >
                  <MaterialIcons name="sports-cricket" size={20} color="#fff" />
                  <Text style={styles.backToMatchText}>Back to Current Match</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {matches.length === 0 ? (
            <Text style={styles.noMatch}>No matches played yet.</Text>
          ) : (
            matches.map((match, index) => (
              <View key={index} style={styles.card}>
                <Text style={styles.teams}>{match.team1} vs {match.team2}</Text>
                <Text style={styles.score}>{match.team1}: {match.firstInnings.total}/{match.firstInnings.wickets}</Text>
                <Text style={styles.score}>{match.team2}: {match.secondInnings.total}/{match.secondInnings.wickets}</Text>
                <Text style={styles.date}>Date: {match.firstInnings.date}</Text>
                <Text style={styles.result}>Winner: {match.winner} ({match.winMargin})</Text>
                {match.umpireNotes && match.umpireNotes.length > 0 && (
                  <Text style={styles.matchNotes}>
                    📝 {match.umpireNotes.length} umpire note{match.umpireNotes.length > 1 ? 's' : ''}
                  </Text>
                )}

                <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={() => navigation.navigate('Scorecard', { match })}
              >
                <Text style={styles.buttonText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.exportButton]} 
                onPress={() => exportMatch(match)}
              >
                <Text style={styles.buttonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 25,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  noMatch: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    color: '#666'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4
  },
  teams: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333'
  },
  score: {
    fontSize: 16,
    marginVertical: 2,
    color: '#444'
  },
  date: {
    fontSize: 14,
    marginTop: 4,
    color: '#666'
  },
  result: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#007700',
    marginTop: 6
  },
  matchNotes: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12
  },
  button: { 
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
  exportButton: {
    backgroundColor: '#28a745'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  currentMatchSection: {
    marginBottom: 20,
  },
  currentMatchCard: {
    backgroundColor: 'rgba(40, 167, 69, 0.95)',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  currentMatchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentMatchInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 5,
  },
  currentMatchScore: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 15,
  },
  currentMatchNotes: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  backToMatchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  backToMatchText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});
