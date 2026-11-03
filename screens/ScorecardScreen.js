import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';

export default function ScorecardScreen({ route, navigation }) {
  const { match } = route.params || {};
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  // Removed unused edit modal state
  // Defensive: fallback to empty objects if missing
  const [firstInningsState, setFirstInningsState] = useState((match && match.firstInnings) ? match.firstInnings : { batsmenStats: {}, bowlerStats: {}, oversHistory: [], team: '', runs: 0, wickets: 0 });
  const [secondInningsState, setSecondInningsState] = useState((match && match.secondInnings) ? match.secondInnings : { batsmenStats: {}, bowlerStats: {}, oversHistory: [], team: '', runs: 0, wickets: 0 });

  // Always sync state with latest props when match changes (e.g., after edit)
  useEffect(() => {
    if (match && match.firstInnings) setFirstInningsState(match.firstInnings);
    if (match && match.secondInnings) setSecondInningsState(match.secondInnings);
  }, [match]);

  // Optionally, sync when screen is focused (if using navigation)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (match && match.firstInnings) setFirstInningsState(match.firstInnings);
      if (match && match.secondInnings) setSecondInningsState(match.secondInnings);
    });
    return unsubscribe;
  }, [navigation, match]);

  // Hooks must run on every render, so this guard comes after them
  if (!match) return <Text style={styles.empty}>No match data available.</Text>;

  const { team1 = '', team2 = '', winner = '', winMargin = '', umpireNotes = [], commentary = [] } = match;
  // Use local state for innings so edits are reflected
  const firstInnings = firstInningsState;
  const secondInnings = secondInningsState;

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

    // Ball-by-ball commentary (if available)
    const commentarySection = commentary && commentary.length > 0
      ? `<h2>Ball-by-Ball Commentary</h2><ul>${commentary.map((c, i) => `<li>${c}</li>`).join('')}</ul>`
      : '';

    // Umpire notes (if available)
    const umpireNotesSection = umpireNotes && umpireNotes.length > 0
      ? `<h2>Umpire Notes</h2><ul>${umpireNotes.map((n, i) => `<li>${n}</li>`).join('')}</ul>`
      : '';

    return `
      <html>
      <body style="font-family: sans-serif; padding: 20px;">
        <h1 style="text-align:center;">Match Scorecard</h1>
        <h2>${team1} vs ${team2}</h2>
        <h3>Result: ${winner} won by ${winMargin}</h3>
        <hr/>

        ${umpireNotesSection}
        ${commentarySection}

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

    // Custom file name: Team A vs Team B : winner : Team X
    const fileName = `${team1} vs ${team2} - winner - ${winner}`.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '') + '.pdf';

    try {
      const { uri } = await Print.printToFileAsync({ html, fileName });
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
    <View style={[styles.exportBtn, { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
      <Button title="Back" onPress={() => navigation.goBack()} color="#888" />
      <View style={{ width: 16 }} />
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
