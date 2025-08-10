import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert, Modal, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';

export default function ScorecardScreen({ route }) {
  const { match } = route.params;
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

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

  const generateHTML = () => {
    const overSummary = (innings) =>
      innings.oversHistory
        .map((over, i) => `
          <h4>Over ${i + 1} - ${over.bowler}</h4>
          <ul>${over.balls.map(ball => `<li>${ball.striker}: ${ball.type} ${ball.value !== undefined ? `(${ball.value})` : ''}</li>`).join('')}</ul>
        `).join('');

    return `
      <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1 style="text-align:center;">Match Scorecard</h1>
        <h2>${team1} vs ${team2}</h2>
        <h3>Result: ${winner} won by ${winMargin}</h3>
        <hr/>

        <h2>1st Innings - ${firstInnings.team}</h2>
        <h3>Batsmen</h3>
        <ul>
          ${Object.entries(firstInnings.batsmenStats).map(([n, s]) => `<li>${n}: ${s.runs} (${s.balls}) - ${s.status}</li>`).join('')}
        </ul>
        <h3>Bowlers</h3>
        <ul>
          ${Object.entries(firstInnings.bowlerStats).map(([n, s]) => {
            const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
            return `<li>${n}: ${overs} overs, ${s.runs} runs, ${s.wickets} wickets</li>`;
          }).join('')}
        </ul>
        ${overSummary(firstInnings)}

        <hr/>
        <h2>2nd Innings - ${secondInnings.team}</h2>
        <h3>Batsmen</h3>
        <ul>
          ${Object.entries(secondInnings.batsmenStats).map(([n, s]) => `<li>${n}: ${s.runs} (${s.balls}) - ${s.status}</li>`).join('')}
        </ul>
        <h3>Bowlers</h3>
        <ul>
          ${Object.entries(secondInnings.bowlerStats).map(([n, s]) => {
            const overs = `${Math.floor(s.balls / 6)}.${s.balls % 6}`;
            return `<li>${n}: ${overs} overs, ${s.runs} runs, ${s.wickets} wickets</li>`;
          }).join('')}
        </ul>
        ${overSummary(secondInnings)}
      </body>
      </html>
    `;
  };

  const generatePDF = async () => {
    const html = generateHTML();
    setPreviewHtml(html); // store HTML to preview if needed

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('PDF Export failed', error);
      Alert.alert('Export Failed', 'Opening HTML Preview instead');
      setShowPreview(true);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>📋 Full Match Scorecard</Text>
        <Text style={styles.result}>{winner} won by {winMargin}</Text>
        <View style={styles.exportBtn}>
          <Button title="Export as PDF" onPress={generatePDF} color="#1e66adff" />
        </View>
        {renderInnings(firstInnings, '1st Innings')}
        {renderInnings(secondInnings, '2nd Innings')}
      </ScrollView>

      <Modal visible={showPreview} animationType="slide">
        <View style={{ flex: 1 }}>
          <Button title="Close Preview" onPress={() => setShowPreview(false)} />
          <WebView originWhitelist={['*']} source={{ html: previewHtml }} />
        </View>
      </Modal>
    </View>
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
  exportBtn: { marginTop: 20, paddingHorizontal: 50, marginBottom: 10 },
  empty: { padding: 20, textAlign: 'center' }
});
