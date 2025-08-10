import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ThrowballScreen() {
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('throwball_history');
      if (data) setHistory(JSON.parse(data));
    } catch (e) {
      console.error(e);
    }
  };

  const getWinner = () => {
    return scoreA > scoreB ? teamA : scoreB > scoreA ? teamB : 'Tie';
  };

  const saveMatch = async () => {
    const newMatch = {
      teamA,
      teamB,
      scoreA,
      scoreB,
      winner: getWinner(),
      date: new Date().toLocaleString(),
    };
    const updated = [newMatch, ...history];
    setHistory(updated);
    await AsyncStorage.setItem('throwball_history', JSON.stringify(updated));
    setTeamA('');
    setTeamB('');
    setScoreA(0);
    setScoreB(0);
  };

  const resetHistory = async () => {
    Alert.alert('Reset History', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Yes',
        onPress: async () => {
          await AsyncStorage.removeItem('throwball_history');
          setHistory([]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏐 Throwball</Text>
      <TextInput placeholder="Team A" style={styles.input} value={teamA} onChangeText={setTeamA} />
      <TextInput placeholder="Team B" style={styles.input} value={teamB} onChangeText={setTeamB} />
      <View style={styles.scoreRow}>
        <Button title="+1 A" onPress={() => setScoreA(scoreA + 1)} />
        <Text>{teamA || 'Team A'}: {scoreA}</Text>
        <Button title="+1 B" onPress={() => setScoreB(scoreB + 1)} />
        <Text>{teamB || 'Team B'}: {scoreB}</Text>
      </View>
      <Text>Winner: {getWinner()}</Text>
      <Button title="End Match and Save" onPress={saveMatch} color="green" />
      <Text style={styles.title}>📜 Match History</Text>
      <FlatList
        data={history}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Text>{item.date} | {item.teamA} ({item.scoreA}) vs {item.teamB} ({item.scoreB}) → Winner: {item.winner}</Text>
          </View>
        )}
      />
      <Button title="Reset History" color="red" onPress={resetHistory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginVertical: 5, borderRadius: 5 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 10 },
});
