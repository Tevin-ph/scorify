// VictoryScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function VictoryScreen({ route }) {
  const { match } = route.params;

  if (!match) return <Text style={styles.empty}>No match data available.</Text>;

  const { team1, team2, firstInnings, secondInnings, winner, winMargin } = match;

  const renderInnings = (innings, title) => (
    <View style={styles.inningsBox}>
      <Text style={styles.inningsTitle}>{title} - {innings.team}</Text>

      <Text style={styles.sectionTitle}>Batsmen</Text>
      {Object.entries(innings.batsmenStats).map(([name, stats], index) => (
        <Text key={index} style={styles.item}>
          {name}: {stats.runs} runs ({stats.balls} balls) - {stats.status}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>Bowlers</Text>
      {Object.entries(innings.bowlerStats).map(([name, stats], index) => {
        const overs = `${Math.floor(stats.balls / 6)}.${stats.balls % 6}`;
        return (
          <Text key={index} style={styles.item}>
            {name}: {overs} overs, {stats.runs} runs, {stats.wickets} wickets
          </Text>
        );
      })}

      <Text style={styles.sectionTitle}>Over Summary</Text>
      {innings.oversHistory.map((over, index) => (
        <View key={index} style={styles.overBox}>
          <Text style={styles.overHeader}>Over {index + 1} - {over.bowler}</Text>
          {over.balls.map((ball, i) => (
            <Text key={i} style={styles.ballDetail}>
              {ball.striker}: {ball.type} {ball.value !== undefined ? `(${ball.value})` : ''}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );

  const generatePDF = async () => {
    const html = `
      <html><body>
        <h1>Match Scorecard</h1>
        <h2>${team1} vs ${team2}</h2>
        <h3>Result: ${winner} won by ${winMargin}</h3>
        <h2>1st Innings - ${firstInnings.team}</h2>
        <ul>
          ${Object.entries(firstInnings.batsmenStats).map(([n, s]) => `<li>${n}: ${s.runs} (${s.balls}) - ${s.status}</li>`).join('')}
        </ul>
        <h2>2nd Innings - ${secondInnings.team}</h2>
        <ul>
          ${Object.entries(secondInnings.batsmenStats).map(([n, s]) => `<li>${n}: ${s.runs} (${s.balls}) - ${s.status}</li>`).join('')}
        </ul>
      </body></html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not generate PDF');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.heading}>🏆 Match Result</Text>
      <Text style={styles.result}>{winner} beat {winner === team1 ? team2 : team1} by {winMargin}</Text>

      {renderInnings(firstInnings, '1st Innings')}
      {renderInnings(secondInnings, '2nd Innings')}

      <View style={styles.exportBtn}>
        <Button title="Export as PDF" onPress={generatePDF} color="#2e86de" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  result: { fontSize: 18, fontWeight: '500', textAlign: 'center', marginBottom: 15, color: '#27ae60' },
  inningsBox: { marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 8 },
  inningsTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  item: { fontSize: 15, marginBottom: 4 },
  overBox: { marginTop: 10, backgroundColor: '#eee', padding: 8, borderRadius: 6 },
  overHeader: { fontWeight: '600', marginBottom: 6 },
  ballDetail: { fontSize: 14 },
  exportBtn: { marginTop: 20, paddingHorizontal: 50 },
  empty: { padding: 20, textAlign: 'center' }
});
