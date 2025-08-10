import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import * as Sharing from 'expo-sharing';

export default function MatchHistory({ navigation }) {
  const [matches, setMatches] = useState([]);

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
    `;

    try {
      const file = await RNHTMLtoPDF.convert({
        html,
        fileName: `scorecard_${Date.now()}`,
        directory: 'Documents'
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.filePath);
      } else {
        Alert.alert('Sharing not supported on this device');
      }
    } catch (e) {
      console.error('Export failed', e);
      Alert.alert('Error', 'Failed to export PDF.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>📜 Match History</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f8ff'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20
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
  }
});
