import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const CricketScreen = () => {
  // Match state
  const navigation = useNavigation();
  const [innings, setInnings] = useState(1);
  const [battingTeamName, setBattingTeamName] = useState('');
  const [bowlingTeamName, setBowlingTeamName] = useState('');
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [overs, setOvers] = useState('');
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [balls, setBalls] = useState([]);
  const [oversHistory, setOversHistory] = useState([]);
  const [batsmenStats, setBatsmenStats] = useState({});
  const [bowlerStats, setBowlerStats] = useState({});
  const [matchHistory, setMatchHistory] = useState([]);
  const [firstInningsScore, setFirstInningsScore] = useState(null);
  const [target, setTarget] = useState(0);
  const [extraInputModal, setExtraInputModal] = useState(false);
  const [currentExtraType, setCurrentExtraType] = useState(null);
  const [extraRuns, setExtraRuns] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Setup state
  const [setupPhase, setSetupPhase] = useState('batting');
  const [battingPlayers, setBattingPlayers] = useState([]);
  const [bowlingPlayers, setBowlingPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(true);

  // Calculated values
  const maxBalls = (overs && parseInt(overs) > 0) ? parseInt(overs) * 6 : 0;
  const maxOvers = overs && parseInt(overs) > 0 ? parseInt(overs) : 0;
  
  // Calculate total legal balls from completed overs
  const completedOversLegalBalls = oversHistory.reduce((acc, over) => (
    acc + over.balls.filter(b => b.type === 'run' || b.type === 'wicket').length
  ), 0);
  
  // Calculate legal balls in current over
  const currentOverLegalBalls = balls.filter(b => b.type === 'run' || b.type === 'wicket').length;
  
  // Total legal balls across all overs including current
  const totalLegalBalls = completedOversLegalBalls + currentOverLegalBalls;
  
  // Current over number (1-based)
  const currentOverNumber = Math.floor(completedOversLegalBalls / 6) + 1;

  // Calculate display format
  const completedOvers = Math.floor(completedOversLegalBalls / 6);
  const ballsInCurrentOver = currentOverLegalBalls;
  const oversDisplay = `${completedOvers}.${ballsInCurrentOver}`;
  const ballsLeft = maxBalls - totalLegalBalls;
  const targetRemaining = innings === 2 && firstInningsScore ? Math.max(0, target - runs) : 0;


  // Helper function to get ball description
  const getBallDescription = (type, value) => {
    switch(type) {
      case 'run': 
        if (value === 0) return `${bowler} to ${striker}: Dot ball`;
        if (value === 4) return `${bowler} to ${striker}: FOUR! Hit to the boundary`;
        if (value === 6) return `${bowler} to ${striker}: SIX! Over the boundary`;
        return `${bowler} to ${striker}: ${value} run${value > 1 ? 's' : ''} taken`;
      case 'wide': 
        return `${bowler} to ${striker}: Wide ball, ${value} run${value > 1 ? 's' : ''} added`;
      case 'noball': 
        return `${bowler} to ${striker}: NO BALL! ${value} run${value > 1 ? 's' : ''} added`;
      case 'wicket': 
        return `${bowler} to ${striker}: OUT! ${striker} is dismissed`;
      default: return '';
    }
  };

  // Setup functions
  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      if (setupPhase === 'batting') {
        setBattingPlayers([...battingPlayers, newPlayerName.trim()]);
      } else {
        setBowlingPlayers([...bowlingPlayers, newPlayerName.trim()]);
      }
      setNewPlayerName('');
    }
  };

  const handleNextSetupPhase = () => {
    if (setupPhase === 'batting') {
      if (!battingTeamName) {
        Alert.alert('Missing Team Name', 'Please enter batting team name');
        return;
      }
      if (battingPlayers.length < 2) {
        Alert.alert('Not Enough Players', 'Batting team needs at least 2 players');
        return;
      }
      setSetupPhase('bowling');
    } else if (setupPhase === 'bowling') {
      if (!bowlingTeamName) {
        Alert.alert('Missing Team Name', 'Please enter bowling team name');
        return;
      }
      if (bowlingPlayers.length < 1) {
        Alert.alert('Not Enough Players', 'Bowling team needs at least 1 player');
        return;
      }
      setSetupPhase('confirmation');
    } else {
      handleStartMatch();
    }
  };

  const handleStartMatch = () => {
    setShowSetupModal(false);
    setStriker(battingPlayers[0]);
    setNonStriker(battingPlayers[1]);
    setBowler(bowlingPlayers[0]);
  };

  const updateBatsmanStats = (name, type, value = 0) => {
    const stats = { ...batsmenStats };
    if (!stats[name]) stats[name] = { runs: 0, balls: 0, status: 'Batting' };
    
    switch(type) {
      case 'run': 
        stats[name].runs += value;
        stats[name].balls += 1;
        break;
      case 'wicket':
        stats[name].status = 'Out';
        stats[name].balls += 1;
        break;
      case 'retired':
        stats[name].status = 'Retired';
        break;
      case 'wide':
      case 'noball':
        break;
      default:
        stats[name].balls += 1;
    }
    setBatsmenStats(stats);
  };

  const updateBowlerStats = (type, runsToAdd = 0) => {
    const stats = { ...bowlerStats };
    if (!stats[bowler]) stats[bowler] = { runs: 0, wickets: 0, balls: 0 };
    
    if (type === 'run') stats[bowler].runs += runsToAdd;
    if (type === 'wide' || type === 'noball') stats[bowler].runs += runsToAdd;
    if (type === 'wicket') stats[bowler].wickets += 1;
    if (type !== 'wide' && type !== 'noball') stats[bowler].balls += 1;
    
    setBowlerStats(stats);
  };

  const addBall = (type, value = 0) => {
    // Validate striker and non-striker
    if (!striker || !nonStriker) {
      Alert.alert('Missing Selection', 'Please select both Striker and Non-Striker');
      return;
    }

    // Validate bowler and ensure they're from the correct team
    if (!bowler) {
      Alert.alert('Missing Selection', 'Please select a bowler');
      return;
    }
    
    const currentBowlingPlayers = innings === 1 ? bowlingPlayers : battingPlayers;
    if (!currentBowlingPlayers.includes(bowler)) {
      Alert.alert('Invalid Bowler', 'The selected bowler is not from the bowling team');
      setBowler(''); // Reset invalid bowler
      return;
    }

    if (type === 'run' && totalLegalBalls >= maxBalls) {
      Alert.alert('Innings Complete', 'All allotted overs bowled');
      return;
    }
    if (type === 'wicket' && wickets >= 10) {
      Alert.alert('All Out', 'No more wickets remaining');
      return;
    }

    const newBall = { type, value, bowler, striker };
    setBalls(prevBalls => [...prevBalls, newBall]);

    let runsToAdd = 0;

    switch(type) {
      case 'run':
        runsToAdd = value;
        updateBatsmanStats(striker, type, value);
        if (value % 2 === 1) {
          const temp = striker;
          setStriker(nonStriker);
          setNonStriker(temp);
        }
        break;
      case 'wide':
      case 'noball':
        runsToAdd = value;
        break;
      case 'wicket':
        setWickets(prevWickets => prevWickets + 1);
        updateBatsmanStats(striker, type);
        setStriker(''); // Clear the striker after wicket
        
        // Show alert to select new batsman
        Alert.alert('Wicket!', 'Please select the new batsman', [
          { text: 'OK' }
        ]);
        break;
      default:
        console.warn(`Unknown ball type: ${type}`);
        return; // Exit if the type is unknown
    }

    // Update runs
    setRuns(prevRuns => prevRuns + runsToAdd);

    // Update bowler stats
    updateBowlerStats(type, runsToAdd);

    // Add commentary alert and show immediate alert
    const description = getBallDescription(type, value);
    setAlerts(prevAlerts => [...prevAlerts, description]);

    // Count legal balls in this over including the new ball
    const legalBallsInThisOver = [...balls, newBall].filter(b => 
      (b.type === 'run' || b.type === 'wicket')
    ).length;

    if (legalBallsInThisOver === 6) {
      if (completedOversLegalBalls + 6 >= maxBalls) {
        // This is the last over
        Alert.alert('Ball Update', description, [
          { text: 'OK', onPress: () => {
            Alert.alert('Innings Complete', 'All allotted overs have been bowled');
          }}
        ]);
      } else {
        // Regular over completion
        setOversHistory(prev => [...prev, { bowler, balls: [...balls, newBall] }]);
        setBalls([]); // Reset balls for the new over
        setBowler(''); // Reset bowler selection

        // Show ball update first, then over complete alert
        Alert.alert('Ball Update', description, [
          { text: 'OK', onPress: () => {
            Alert.alert('Over Complete', 'Please select the next bowler');
          }}
        ]);
      }
    } else if (totalLegalBalls >= maxBalls) {
      Alert.alert('Ball Update', description, [
        { text: 'OK', onPress: () => {
          Alert.alert('Innings Complete', 'All allotted overs have been bowled');
        }}
      ]);
    } else {
      // Just show the ball update for non-over-completing deliveries
      Alert.alert('Ball Update', description);
    }
    
    // Remove redundant over check as it's handled in the alert callback
  };

  const retireBatsman = () => {
    if (!striker) return;
    
    updateBatsmanStats(striker, 'retired');
    const alertMessage = `${striker} has retired hurt!`;
    setAlerts([...alerts, alertMessage]);
    Alert.alert('Player Retired', alertMessage);
    
    // Get next batsman
    const availableBatsmen = battingPlayers.filter(player => 
      !batsmenStats[player] || 
      (batsmenStats[player].status !== 'Out' && batsmenStats[player].status !== 'Retired')
    ).filter(p => p !== striker && p !== nonStriker);
    
    if (availableBatsmen.length > 0) {
      setStriker(availableBatsmen[0]);
      Alert.alert('New Batsman', `${availableBatsmen[0]} comes in to bat.`);
    } else if (nonStriker) {
      setStriker(nonStriker);
      setNonStriker('');
      Alert.alert('Batsman Change', `${nonStriker} will now face the bowling.`);
    } else {
      setStriker('');
    }
  };

  const undoBall = () => {
    if (balls.length === 0) return;

    const lastBall = balls[balls.length - 1];
    const newBalls = balls.slice(0, -1);
    setBalls(newBalls);

    let runsToSubtract = 0;

    const batsmanName = lastBall.striker;
    const bowlerName = lastBall.bowler;

    // Update batsman stats
    const newBatsmenStats = { ...batsmenStats };
    if (newBatsmenStats[batsmanName]) {
      if (lastBall.type === 'run') {
        newBatsmenStats[batsmanName].runs -= lastBall.value;
        newBatsmenStats[batsmanName].balls -= 1;
      } else if (lastBall.type === 'wicket') {
        newBatsmenStats[batsmanName].balls -= 1;
        newBatsmenStats[batsmanName].status = 'Batting';
      } else if (lastBall.type !== 'wide' && lastBall.type !== 'noball') {
        newBatsmenStats[batsmanName].balls -= 1;
      }
    }

    // Update bowler stats
    const newBowlerStats = { ...bowlerStats };
    if (newBowlerStats[bowlerName]) {
      if (lastBall.type === 'run' || lastBall.type === 'wide' || lastBall.type === 'noball') {
        newBowlerStats[bowlerName].runs -= lastBall.value;
      }
      if (lastBall.type === 'wicket') {
        newBowlerStats[bowlerName].wickets -= 1;
      }
      if (lastBall.type !== 'wide' && lastBall.type !== 'noball') {
        newBowlerStats[bowlerName].balls -= 1;
      }
    }

    if (lastBall.type === 'run' || lastBall.type === 'wide' || lastBall.type === 'noball') {
      runsToSubtract = lastBall.value;
    }

    setRuns(runs - runsToSubtract);
    if (lastBall.type === 'wicket') {
      setWickets(wickets - 1);
    }

    setBatsmenStats(newBatsmenStats);
    setBowlerStats(newBowlerStats);
    
    // Add undo alert instead of removing
    const undoAlert = `UNDO: Last ball by ${bowlerName} to ${batsmanName} was removed`;
    setAlerts([...alerts, undoAlert]);
    Alert.alert('Ball Undone', undoAlert);
  };

  const handleExtraBall = (type) => {
    setCurrentExtraType(type);
    setExtraRuns(1);
    setExtraInputModal(true);
  };

  const submitExtraRuns = () => {
    if (extraRuns < 1) {
      Alert.alert('Invalid Runs', 'Enter at least 1 run');
      return;
    }
    addBall(currentExtraType, extraRuns);
    setExtraInputModal(false);
  };

  const endInnings = async () => {
    if (balls.length > 0) {
      setOversHistory([...oversHistory, { bowler, balls }]);
    }

    // Create summary of top performers
    const battingDetails = Object.entries(batsmenStats)
      .map(([name, stats]) => `${name}: ${stats.runs}(${stats.balls})`)
      .join(', ');
    
    const bowlingDetails = Object.entries(bowlerStats)
      .map(([name, stats]) => `${name}: ${stats.wickets}/${stats.runs}`)
      .join(', ');

    let finalOversHistory = oversHistory;
    if (balls.length > 0) {
      finalOversHistory = [...oversHistory, { bowler, balls }];
    }

    const matchData = {
      innings,
      team: innings === 2 ? bowlingTeamName : battingTeamName, // Fixed team assignment for second innings
      batsmenStats,
      bowlerStats,
      overs,
      total: runs,
      wickets,
      oversHistory: finalOversHistory,
      date: new Date().toLocaleString(),
      alerts: [
        ...alerts, 
        `${innings === 2 ? bowlingTeamName : battingTeamName} innings ended with ${runs}/${wickets}`,
        `Batting: ${battingDetails}`,
        `Bowling: ${bowlingDetails}`
      ]
    };

    if (innings === 1) {
      const newTarget = runs + 1;
      setFirstInningsScore(matchData);
      setTarget(newTarget);
      setInnings(2);
      resetInningsState(); // Reset for second innings
      Alert.alert('First Innings Complete', 
        `${battingTeamName} (Batting) scored ${runs}/${wickets}\n` +
        `${bowlingTeamName} needs ${newTarget} runs to win.\n\n` +
        `Batting will now begin for: ${bowlingTeamName}\n` +
        `Bowling will now begin for: ${battingTeamName}`
      );
    } else {
      await handleVictory();
    }
  };

  const handleVictory = async () => {
    const winner = innings === 2 ? (runs >= target ? bowlingTeamName : battingTeamName) : battingTeamName;
    const winMargin = runs >= target ? `${10 - wickets} wickets` : `${target - runs - 1} runs`;
    
    let finalOversHistory = oversHistory;
    if (balls.length > 0) {
      finalOversHistory = [...oversHistory, { bowler, balls }];
    }

    const matchData = {
      innings,
      team: innings === 2 ? bowlingTeamName : battingTeamName, // Fixed team assignment for second innings
      batsmenStats,
      bowlerStats,
      overs,
      total: runs,
      wickets,
      oversHistory: finalOversHistory,
      date: new Date().toLocaleString(),
      alerts: [...alerts, `Match over! ${winner} won by ${winMargin}`]
    };

    const fullMatch = {
      team1: battingTeamName,
      team2: bowlingTeamName,
      firstInnings: firstInningsScore,
      secondInnings: matchData,
      winner,
      winMargin
    };

    const newHistory = [fullMatch, ...matchHistory];
    await AsyncStorage.setItem('cricket_history', JSON.stringify(newHistory));
    
    setVictoryData(fullMatch);
    setShowVictory(true);
  };

  const loadHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('cricket_history');
      if (history) setMatchHistory(JSON.parse(history));
    } catch (e) {
      console.error('Failed to load history', e);
    }
  };

  const resetHistory = async () => {
    Alert.alert(
      'Reset History',
      'Delete all match records?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('cricket_history');
            setMatchHistory([]);
          }
        }
      ]
    );
  };

  const openAlertsModal = () => {
    setShowAlertsModal(true);
  };

  // Reset innings state for the second innings
  const resetInningsState = () => {
    setBalls([]);
    setOversHistory([]);
    setRuns(0);
    setWickets(0);
    setStriker('');
    setNonStriker('');
    setBowler('');
    setBatsmenStats({});
    setBowlerStats({});
  };

  // Render functions
  const renderSetupContent = () => {
    switch (setupPhase) {
      case 'batting':
        return (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Setup Batting Team</Text>
            <TextInput
              style={styles.teamInput}
              placeholder="Batting Team Name"
              value={battingTeamName}
              onChangeText={setBattingTeamName}
            />
            
            <Text style={styles.sectionTitle}>Add Batting Players</Text>
            <Button 
              title="Load Test Data" 
              onPress={() => {
                setBattingTeamName('India');
                setBattingPlayers([
                  'Rohit',
                  'Gill',
                  'Kohli',
                  'Iyer',
                  'KL Rahul',
                  'Hardik',
                  'Jadeja',
                  'Ashwin',
                  'Shami',
                  'Bumrah',
                  'Siraj'
                ]);
              }}
              color="#9b59b6"
            />
            <View style={styles.playerInputContainer}>
              <TextInput
                style={styles.playerInput}
                placeholder="Player name"
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                onSubmitEditing={handleAddPlayer}
              />
              <Button title="Add" onPress={handleAddPlayer} />
            </View>
            
            <FlatList
              data={battingPlayers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.playerItem}>
                  <Text>{item}</Text>
                  <TouchableOpacity 
                    onPress={() => setBattingPlayers(battingPlayers.filter(player => player !== item))}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={styles.playersList}
            />
          </View>
        );

      case 'bowling':
        return (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Setup Bowling Team</Text>
            <TextInput
              style={styles.teamInput}
              placeholder="Bowling Team Name"
              value={bowlingTeamName}
              onChangeText={setBowlingTeamName}
            />
            
            <Text style={styles.sectionTitle}>Add Bowling Players</Text>
            <Button 
              title="Load Test Data" 
              onPress={() => {
                setBowlingTeamName('Australia');
                setBowlingPlayers([
                  'Warner',
                  'Head',
                  'Smith',
                  'Labuschagne',
                  'Maxwell',
                  'Carey',
                  'Starc',
                  'Cummins',
                  'Hazlewood',
                  'Zampa',
                  'Green'
                ]);
              }}
              color="#9b59b6"
            />
            <View style={styles.playerInputContainer}>
              <TextInput
                style={styles.playerInput}
                placeholder="Player name"
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                onSubmitEditing={handleAddPlayer}
              />
              <Button title="Add" onPress={handleAddPlayer} />
            </View>
            
            <FlatList
              data={bowlingPlayers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.playerItem}>
                  <Text>{item}</Text>
                  <TouchableOpacity 
                    onPress={() => setBowlingPlayers(bowlingPlayers.filter(player => player !== item))}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              )}
              style={styles.playersList}
            />
          </View>
        );

      case 'confirmation':
        return (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Teams Confirmation</Text>
            
            <Text style={styles.teamConfirmation}>
              Batting Team: {battingTeamName}
            </Text>
            <FlatList
              data={battingPlayers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => <Text style={styles.playerConfirm}>→ {item}</Text>}
            />

            <Text style={styles.teamConfirmation}>
              Bowling Team: {bowlingTeamName}
            </Text>
            <FlatList
              data={bowlingPlayers}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => <Text style={styles.playerConfirm}>→ {item}</Text>}
            />

            <TextInput
              style={styles.teamInput}
              placeholder="Total Overs"
              value={overs}
              onChangeText={setOvers}
              keyboardType="numeric"
            />
          </View>
        );
    }
  };

  const renderBatsmanStatus = () => {
    const currentBattingPlayers = innings === 1 ? battingPlayers : bowlingPlayers;
    
    return (
      <FlatList
        data={currentBattingPlayers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>
              {item} - {batsmenStats[item]?.status || 'Batting'} 
              (Runs: {batsmenStats[item]?.runs || 0}, 
              Balls: {batsmenStats[item]?.balls || 0})
            </Text>
          </View>
        )}
      />
    );
  };

  const renderBowlerStatus = () => {
    const currentBowlingPlayers = innings === 1 ? bowlingPlayers : battingPlayers;
    
    return (
      <FlatList
        data={currentBowlingPlayers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text>
              {item} - Overs: {bowlerStats[item]?.balls ? Math.floor(bowlerStats[item].balls/6) : 0}.{bowlerStats[item]?.balls ? bowlerStats[item].balls%6 : 0}, 
              Runs: {bowlerStats[item]?.runs || 0}, 
              Wickets: {bowlerStats[item]?.wickets || 0}
            </Text>
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <>
        {/* Setup Modal */}
        <Modal visible={showSetupModal} animationType="slide" transparent={false}>
          <ScrollView contentContainerStyle={styles.setupScrollContent}>
            {renderSetupContent()}
            <View style={styles.setupButtons}>
              {setupPhase !== 'batting' && (
                <Button
                  title="Back"
                  onPress={() => setSetupPhase(setupPhase === 'bowling' ? 'batting' : 'bowling')}
                  color="#777"
                />
              )}
              <Button
                title={setupPhase === 'confirmation' ? 'Start Match' : 'Continue'}
                onPress={handleNextSetupPhase}
                color="#2ecc71"
              />
            </View>
          </ScrollView>
        </Modal>

        {/* Main Match Screen */}
        {!showSetupModal && (
          <FlatList 
            data={[
              { key: 'header', content: (
                <View style={styles.headerContainer}>
                  <Text style={styles.title}>Cricket - Innings {innings}</Text>
                  <Text style={styles.matchInfo}>
                    {innings === 1 ? (
                      `${battingTeamName} vs ${bowlingTeamName}`
                    ) : (
                      `${bowlingTeamName} chasing ${target} | ${runs}/${wickets} (${oversDisplay}) | Need ${targetRemaining} runs`
                    )}
                  </Text>
                </View>
              )},
              { key: 'batting', content: (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Batting: {innings === 1 ? battingTeamName : bowlingTeamName}</Text>
                  <View style={styles.pickerRow}>
                    <View style={styles.pickerContainer}>
                      <Text>Striker:</Text>
                      <Picker
                        selectedValue={striker}
                        onValueChange={setStriker}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Striker" value="" />
                        {(innings === 1 ? battingPlayers : bowlingPlayers).map((player, index) => (
                          (!batsmenStats[player] || 
                            (batsmenStats[player].status !== 'Out' && 
                             batsmenStats[player].status !== 'Retired')) &&
                              player !== nonStriker && (
                            <Picker.Item key={index} label={player} value={player} />
                          )
                        ))}
                      </Picker>
                    </View>

                    <View style={styles.pickerContainer}>
                      <Text>Non-Striker:</Text>
                      <Picker
                        selectedValue={nonStriker}
                        onValueChange={setNonStriker}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Non-Striker" value="" />
                        {(innings === 1 ? battingPlayers : bowlingPlayers).map((player, index) => (
                          (!batsmenStats[player] || 
                            (batsmenStats[player].status !== 'Out' && 
                             batsmenStats[player].status !== 'Retired')) &&
                              player !== striker && (
                            <Picker.Item key={index} label={player} value={player} />
                          )
                        ))}
                      </Picker>
                    </View>
                  </View>
                  
                  {renderBatsmanStatus()}
                </View>
              )},
              { key: 'bowling', content: (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bowling: {innings === 1 ? bowlingTeamName : battingTeamName}</Text>
                  <View style={styles.pickerContainer}>
                    <Text>Current Bowler:</Text>
                    <Picker
                      selectedValue={bowler}
                      onValueChange={setBowler}
                      style={styles.picker}
                    >
                      <Picker.Item label="Select Bowler" value="" />
                      {(innings === 1 ? bowlingPlayers : battingPlayers).map((player, index) => (
                        <Picker.Item key={index} label={player} value={player} />
                      ))}
                    </Picker>
                  </View>
                  
                  {renderBowlerStatus()}
                </View>
              )},
              { key: 'scoring', content: (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Scoring Controls</Text>
                  <View style={styles.buttonRow}>
                    {[0, 1, 2, 3, 4, 6].map(n => (
                      <TouchableOpacity 
                        key={n}
                        style={[styles.scoreButton, n === 4 || n === 6 ? styles.boundaryButton : null]}
                        onPress={() => addBall('run', n)}
                        disabled={wickets >= 10 || totalLegalBalls >= maxBalls}
                      >
                        <Text style={styles.buttonText}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.scoreButton, styles.specialButton]}
                      onPress={() => handleExtraBall('wide')}
                      disabled={wickets >= 10}
                    >
                      <Text style={styles.buttonText}>Wd</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.scoreButton, styles.specialButton]}
                      onPress={() => handleExtraBall('noball')}
                      disabled={wickets >= 10}
                    >
                      <Text style={styles.buttonText}>Nb</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.scoreButton, styles.wicketButton]}
                      onPress={() => addBall('wicket')}
                      disabled={wickets >= 10}
                    >
                      <Text style={styles.buttonText}>Wkt</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )},
              { key: 'matchStatus', content: (
                <View style={styles.section}>
                  <Text style={styles.score}>
                    Score: {runs}/{wickets} | Overs: {oversDisplay} 
                    {ballsLeft > 0 ? ` (${ballsLeft} balls left)` : ''}
                  </Text>
                  
                  {innings === 2 && firstInningsScore && (
                    <Text style={styles.target}>
                      Target: {target} | Need {targetRemaining} more runs to win
                    </Text>
                  )}

                  <View style={styles.actionRow}>
                    <Button
                      title="Undo Last Ball"
                      onPress={undoBall}
                      disabled={balls.length === 0}
                      color="#777"
                    />
                    <Button
                      title="Retire Batsman"
                      onPress={retireBatsman}
                      disabled={!striker}
                      color="#9932cc"
                    />
                  </View>

                  <Button
                    title="End Innings"
                    onPress={endInnings}
                    disabled={innings === 2 && !firstInningsScore}
                    color="#2ecc71"
                  />
                </View>
              )},
              { key: 'matchHistory', content: (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Match Actions</Text>
                  <View style={{ marginVertical: 10 }}>
                    <Button
                      title="View Ball-by-Ball Commentary"
                      onPress={openAlertsModal}
                    />
                  </View>
                  <View style={{ marginVertical: 10 }}>
                    <Button
                      title="View Full History"
                      onPress={() => navigation.navigate('MatchHistory')}
                    />
                  </View>
                  <View style={{ marginVertical: 10 }}>
                    <Button
                      title="Reset History"
                      onPress={resetHistory}
                      color="#e74c3c"
                    />
                  </View>
                </View>
              )}
            ]}
            renderItem={({ item }) => item.content}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.contentContainer}
          />
        )}

        {/* Extra Runs Modal */}
        <Modal visible={extraInputModal} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {currentExtraType === 'wide' ? 'Wide Ball' : 'No Ball'} Runs
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter runs"
                value={String(extraRuns)}
                onChangeText={(text) => setExtraRuns(Number(text) || 0)}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => setExtraInputModal(false)}
                />
                <Button
                  title="Confirm"
                  onPress={submitExtraRuns}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Victory Modal */}
        {showVictory && victoryData && (
          <Modal visible={showVictory} transparent={true} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={[styles.modalContent, styles.victoryModal]}>
                <Text style={styles.victoryTitle}>Match Result</Text>
                <Text style={styles.victoryText}>
                  {innings === 2 ? (runs >= target ? bowlingTeamName : battingTeamName) : battingTeamName} won by {victoryData.winMargin}
                </Text>
                <Text style={styles.scoreSummary}>
                  First Innings - {victoryData.firstInnings.team}: {victoryData.firstInnings.total}/{victoryData.firstInnings.wickets}
                </Text>
                <Text style={styles.scoreSummary}>
                  Second Innings - {victoryData.team2}: {victoryData.secondInnings.total}/{victoryData.secondInnings.wickets}
                </Text>
                <View style={styles.modalButtons}>
                  <Button
                    title="View Scorecard"
                    onPress={() => {
                      setShowVictory(false);
                      navigation.navigate('Scorecard', {
                        match: victoryData
                      });
                    }}
                  />
                  <Button
                    title="New Match"
                    onPress={() => {
                      setShowVictory(false);
                      setShowSetupModal(true);
                      setSetupPhase('batting');
                      setBattingPlayers([]);
                      setBowlingPlayers([]);
                      setBattingTeamName('');
                      setBowlingTeamName('');
                      setOvers('');
                      setAlerts([]);
                    }}
                    color="#2ecc71"
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Alerts Modal */}
        <Modal visible={showAlertsModal} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Ball-by-Ball Commentary</Text>
              <FlatList
                data={[...alerts].reverse()}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.alertItem}>
                    <Text style={{color: item.startsWith('UNDO:') ? '#e74c3c' : '#000'}}>{item}</Text>
                  </View>
                )}
              />
              <Button
                title="Close"
                onPress={() => setShowAlertsModal(false)}
              />
            </View>
          </SafeAreaView>
        </Modal>
      </>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2c3e50',
  },
  matchInfo: {
    fontSize: 16,
    color: '#34495e',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#3498db',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flex: 1,
    marginBottom: 10,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  scoreButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  boundaryButton: {
    backgroundColor: '#2980b9',
  },
  specialButton: {
    backgroundColor: '#e67e22',
  },
  wicketButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  target: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  setupScrollContent: {
    padding: 20,
    paddingBottom: 80,
  },
  setupContainer: {
    flex: 1,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  teamInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginRight: 10,
    borderRadius: 5,
  },
  playersList: {
    flex: 1,
    marginBottom: 20,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 8,
  },
  teamConfirmation: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#2c3e50',
  },
  playerConfirm: {
    fontSize: 16,
    marginLeft: 15,
    marginBottom: 5,
  },
  setupButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
    modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  victoryModal: {
    width: '90%',
    paddingVertical: 20,
  },
  victoryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#27ae60',
  },
  victoryText: {
    fontSize: 18,
    marginBottom: 10, 
    textAlign: 'center',
  },
  scoreSummary: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CricketScreen;
