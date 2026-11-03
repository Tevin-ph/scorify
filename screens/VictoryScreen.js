// VictoryScreen.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, Button, Alert, SafeAreaView } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

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

      <Text style={styles.sectionTitle}>Ball-by-Ball Commentary</Text>
      <ScrollView style={styles.commentaryBox} nestedScrollEnabled={true}>
        {innings.alerts && innings.alerts.length > 0 ? (
          innings.alerts.map((alert, index) => (
            <Text key={index} style={styles.commentaryItem}>
              • {alert}
            </Text>
          ))
        ) : (
          <Text style={styles.commentaryItem}>No commentary available</Text>
        )}
      </ScrollView>
    </View>
  );

  const generatePDF = async () => {
    // Generate ball-by-ball commentary sections
    const generateCommentarySection = (innings, title) => {
      if (!innings.alerts || innings.alerts.length === 0) {
        return `<h3>${title} - Ball-by-Ball Commentary</h3><p>No commentary available</p>`;
      }
      
      return `
        <h3>${title} - Ball-by-Ball Commentary</h3>
        <div style="background-color: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 5px;">
          ${innings.alerts.map(alert => `<p style="margin: 5px 0; font-size: 14px;">• ${alert}</p>`).join('')}
        </div>
      `;
    };

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2e86de; text-align: center; }
            h2 { color: #333; border-bottom: 2px solid #2e86de; padding-bottom: 5px; }
            h3 { color: #555; margin-top: 20px; }
            .result { text-align: center; font-size: 18px; font-weight: bold; color: #27ae60; margin: 20px 0; }
            .innings { margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 8px; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 5px 0; padding: 5px; background-color: white; border-radius: 3px; }
            .over-summary { margin: 10px 0; }
            .over-header { font-weight: bold; color: #2e86de; }
            .ball-details { margin-left: 15px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>🏏 Cricket Match Scorecard</h1>
          <h2>${team1} vs ${team2}</h2>
          <div class="result">${winner} won by ${winMargin}</div>
          
          <div class="innings">
            <h2>1st Innings - ${firstInnings.team}</h2>
            
            <h3>Batsmen Performance</h3>
            <ul>
              ${Object.entries(firstInnings.batsmenStats).map(([name, stats]) => 
                `<li><strong>${name}:</strong> ${stats.runs} runs (${stats.balls} balls) - ${stats.status}</li>`
              ).join('')}
            </ul>
            
            <h3>Bowlers Performance</h3>
            <ul>
              ${Object.entries(firstInnings.bowlerStats).map(([name, stats]) => {
                const overs = `${Math.floor(stats.balls / 6)}.${stats.balls % 6}`;
                return `<li><strong>${name}:</strong> ${overs} overs, ${stats.runs} runs, ${stats.wickets} wickets</li>`;
              }).join('')}
            </ul>
            
            <div class="over-summary">
              <h3>Over-by-Over Summary</h3>
              ${firstInnings.oversHistory.map((over, index) => `
                <div style="margin: 10px 0;">
                  <div class="over-header">Over ${index + 1} - ${over.bowler}</div>
                  <div class="ball-details">
                    ${over.balls.map(ball => 
                      `${ball.striker}: ${ball.type}${ball.value !== undefined ? ` (${ball.value} runs)` : ''}`
                    ).join(' | ')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          ${generateCommentarySection(firstInnings, '1st Innings')}
          
          <div class="innings">
            <h2>2nd Innings - ${secondInnings.team}</h2>
            
            <h3>Batsmen Performance</h3>
            <ul>
              ${Object.entries(secondInnings.batsmenStats).map(([name, stats]) => 
                `<li><strong>${name}:</strong> ${stats.runs} runs (${stats.balls} balls) - ${stats.status}</li>`
              ).join('')}
            </ul>
            
            <h3>Bowlers Performance</h3>
            <ul>
              ${Object.entries(secondInnings.bowlerStats).map(([name, stats]) => {
                const overs = `${Math.floor(stats.balls / 6)}.${stats.balls % 6}`;
                return `<li><strong>${name}:</strong> ${overs} overs, ${stats.runs} runs, ${stats.wickets} wickets</li>`;
              }).join('')}
            </ul>
            
            <div class="over-summary">
              <h3>Over-by-Over Summary</h3>
              ${secondInnings.oversHistory.map((over, index) => `
                <div style="margin: 10px 0;">
                  <div class="over-header">Over ${index + 1} - ${over.bowler}</div>
                  <div class="ball-details">
                    ${over.balls.map(ball => 
                      `${ball.striker}: ${ball.type}${ball.value !== undefined ? ` (${ball.value} runs)` : ''}`
                    ).join(' | ')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          
          ${generateCommentarySection(secondInnings, '2nd Innings')}
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            Generated on ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Export Failed', 'Could not generate PDF: ' + error.message);
    }
  };

  return (
    <LinearGradient
      colors={['#f39c12', '#e67e22', '#d35400']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <MaterialIcons name="emoji-events" size={48} color="#fff" />
            <Text style={styles.heading}>🏆 Match Result</Text>
          </View>
          <View style={styles.resultCard}>
            <Text style={styles.result}>{winner} beat {winner === team1 ? team2 : team1} by {winMargin}</Text>
          </View>

          {renderInnings(firstInnings, '1st Innings')}
          {renderInnings(secondInnings, '2nd Innings')}

          <View style={styles.exportBtn}>
            <Button title="Export as PDF" onPress={generatePDF} color="#2e86de" />
          </View>
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
  scrollContainer: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    margin: 20,
    borderRadius: 20,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 25,
    margin: 20,
    borderRadius: 18,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  result: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#27ae60',
  },
  inningsBox: {
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  inningsTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 15,
    color: '#f39c12',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#2c3e50',
  },
  item: {
    fontSize: 15,
    marginBottom: 6,
    color: '#34495e',
    fontWeight: '500',
  },
  exportBtn: {
    marginTop: 30,
    marginBottom: 40,
    paddingHorizontal: 50,
  },
  empty: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#ffffff',
    fontWeight: '600',
  }
});
