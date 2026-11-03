import React, { useState, useEffect, useCallback } from 'react';
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
  SafeAreaView,
  BackHandler
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

// Cricket Teams Data
const CRICKET_TEAMS = {
  yellow: {
    name: "Ruben's Team",
    captain: "Ruben",
    color: "#FFD700",
    players: [
  "Ruben", "Tevin", "Beryl Bijoy", "Rony Tharakan", "Shinu George", 
      "Jobin George", "Benoy Chacko", "Romi T Samuel", "Jaison", 
      "Jacob George", "Darshana", "Renu Mathew"
    ]
  },
  blue: {
    name: "George's Team", 
  captain: "George Pothen",
    color: "#4169E1",
    players: [
  "George Pothen", "Binu Koshy", "Aaron Jome", "James Mathew", "Shaji Jose",
      "Deepu", "Sijin", "Suby John", "Reuben Roji", "Julie",
      "Joshy", "Premin Abraham"
    ]
  },
  green: {
    name: "Jeby's Team",
    captain: "Jeby", 
    color: "#32CD32",
    players: [
      "Jeby", "Benson", "Noel John Philp", "Jobi", "Johan Abhraham",
      "Johann", "Renita Simon", "Anita Varghese", "Georgy Mathew",
      "Aby K Thomas", "Rohan", "Jome Jacob"
    ]
  },
  red: {
    name: "Renny's Team",
    captain: "Renny",
    color: "#DC143C", 
    players: [
      "Renny", "Sachin", "Joel George", "Ginu Pappachen", "Tino Jose",
      "Abraham Koshy", "Nithin C John", "Sunu Eapen Alex", "Jerri Mathew",
      "Reyhaan Alex", "Sara", "Priya Siju"
    ]
  }
};

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
  const [showVictory, setShowVictory] = useState(false);
  const [victoryData, setVictoryData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [showScoreboardModal, setShowScoreboardModal] = useState(false);
  const [selectedExtraType, setSelectedExtraType] = useState('wide');
  const [extraRunsInput, setExtraRunsInput] = useState('1');
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [selectedWicketType, setSelectedWicketType] = useState('bowled');
  const [selectedBatsman, setSelectedBatsman] = useState('striker');
  const [runsOnWicket, setRunsOnWicket] = useState('0');
  const [isMankad, setIsMankad] = useState(false);
  const [showRetireModal, setShowRetireModal] = useState(false);
  const [selectedRetirePlayer, setSelectedRetirePlayer] = useState('');
  const [retireReason, setRetireReason] = useState('injury');
  const [retiredHurtPlayers, setRetiredHurtPlayers] = useState([]);
  const [showUmpireNotesModal, setShowUmpireNotesModal] = useState(false);
  const [umpireNotes, setUmpireNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState('');

  // Menu states
  const [showMainMenu, setShowMainMenu] = useState(false);

  // Setup state
  const [setupPhase, setSetupPhase] = useState('batting');
  const [battingPlayers, setBattingPlayers] = useState([]);
  const [bowlingPlayers, setBowlingPlayers] = useState([]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(true);

  // Team selection state
  const [selectedBattingTeam, setSelectedBattingTeam] = useState('');
  const [selectedBowlingTeam, setSelectedBowlingTeam] = useState('');
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [dropdownType, setDropdownType] = useState(''); // 'batting' or 'bowling'

  // Edit final score state
  const [showEditScoreModal, setShowEditScoreModal] = useState(false);
  const [editedRuns, setEditedRuns] = useState('');
  const [editedWickets, setEditedWickets] = useState('');
  const [editedTarget, setEditedTarget] = useState('');

  // Handle hardware back button with double confirmation
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => backHandler.remove();
  }, [showSetupModal]);

  // Reset confirmation count when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset any state if needed
    });

    return unsubscribe;
  }, [navigation]);

  // Load umpire notes when match starts
  useEffect(() => {
    if (!showSetupModal && battingTeamName && bowlingTeamName) {
      loadUmpireNotes();
    }
  }, [showSetupModal, battingTeamName, bowlingTeamName]);

  // Save umpire notes whenever they change
  useEffect(() => {
    if (umpireNotes.length > 0 && battingTeamName && bowlingTeamName) {
      saveUmpireNotes();
    }
  }, [umpireNotes]);

  // Save current match state whenever important changes happen
  useEffect(() => {
    if (!showSetupModal && battingTeamName && bowlingTeamName) {
      saveCurrentMatchState();
    }
  }, [runs, wickets, balls, umpireNotes, striker, nonStriker, bowler]);

  const handleBackPress = () => {
    // Allow normal back navigation during setup
    if (showSetupModal) {
      return false; // Let setup modal handle its own navigation
    }

    // During match, require double confirmation
    Alert.alert(
      'Exit Match?',
      'Are you sure you want to exit the current match? All progress will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Exit',
          style: 'destructive',
          onPress: () => {
            // Show second confirmation
            Alert.alert(
              'Final Confirmation',
              'This is your final warning! The match will be permanently lost. Are you absolutely sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes, I\'m Sure',
                  style: 'destructive',
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]
            );
          },
        },
      ]
    );
    
    return true; // Prevent default back action
  };

  // Calculated values
  const maxBalls = (overs && parseInt(overs) > 0) ? parseInt(overs) * 6 : 0;
  const maxOvers = overs && parseInt(overs) > 0 ? parseInt(overs) : 0;
  
  // Calculate total legal balls from completed overs
  const completedOversLegalBalls = oversHistory.reduce((acc, over) => (
    acc + over.balls.filter(b => b.type === 'run' || b.type === 'wicket' || b.type === 'runout').length
  ), 0);
  
  // Calculate legal balls in current over
  const currentOverLegalBalls = balls.filter(b => b.type === 'run' || b.type === 'wicket' || b.type === 'runout').length;
  
  // Total legal balls across all overs including current
  const totalLegalBalls = completedOversLegalBalls + currentOverLegalBalls;
  
  // Calculate display format
  // Calculate runs off the over for display  
  const oversDisplay = `${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6}`;
  const ballsLeft = maxBalls - totalLegalBalls;

  // Handle retired player returns
  React.useEffect(() => {
    if (striker && batsmenStats[striker]?.status === 'Retired') {
      updateBatsmanStats(striker, 'resumed');
      const retireData = retiredHurtPlayers.find(retired => 
        typeof retired === 'string' ? retired === striker : retired.name === striker
      );
      const reason = typeof retireData === 'object' ? retireData.reason : 'injury';
      setAlerts(prev => [...prev, `${striker} has returned to bat after retirement due to ${reason}`]);
    }
  }, [striker, batsmenStats, retiredHurtPlayers]);

  React.useEffect(() => {
    if (nonStriker && batsmenStats[nonStriker]?.status === 'Retired') {
      updateBatsmanStats(nonStriker, 'resumed');
      const retireData = retiredHurtPlayers.find(retired => 
        typeof retired === 'string' ? retired === nonStriker : retired.name === nonStriker
      );
      const reason = typeof retireData === 'object' ? retireData.reason : 'injury';
      setAlerts(prev => [...prev, `${nonStriker} has returned to bat after retirement due to ${reason}`]);
    }
  }, [nonStriker, batsmenStats, retiredHurtPlayers]);

  const targetRemaining = innings === 2 && firstInningsScore ? Math.max(0, target - runs) : 0;

  // Helper function to get ball description
  const getBallDescription = (type, value, additionalInfo = {}) => {
    const { wicketType, batsmanOut, runsCompleted, extraType, isMankad } = additionalInfo;
    
    switch(type) {
      case 'run': 
        if (value === 0) return `${bowler} to ${striker}: Dot ball`;
        if (value === 4) return `${bowler} to ${striker}: FOUR! Hit to the boundary`;
        if (value === 6) return `${bowler} to ${striker}: SIX! Over the boundary`;
        return `${bowler} to ${striker}: ${value} run${value > 1 ? 's' : ''} taken`;
        
      case 'wide': 
        return `${bowler}: Wide ball, ${value} extra run${value > 1 ? 's' : ''} added to total`;
        
      case 'noball': 
        return `${bowler}: NO BALL! ${value} extra run${value > 1 ? 's' : ''} added + free hit`;
        
      case 'bye':
        return `${bowler} to ${striker}: ${value} bye${value > 1 ? 's' : ''} - runs taken without hitting the ball`;
        
      case 'legbye':
        return `${bowler} to ${striker}: ${value} leg bye${value > 1 ? 's' : ''} - runs off the body`;
        
      case 'penalty':
        return `Penalty: ${value} run${value > 1 ? 's' : ''} awarded by umpire`;
        
      case 'wicket': 
        if (wicketType && batsmanOut) {
          switch(wicketType) {
            case 'bowled':
              return `${bowler} to ${batsmanOut}: OUT! Bowled! The stumps are shattered`;
            case 'lbw':
              return `${bowler} to ${batsmanOut}: OUT! LBW! Plumb in front of the stumps`;
            case 'caught':
              return `${bowler} to ${batsmanOut}: OUT! Caught! Taken cleanly by the fielder`;
            case 'stumped':
              return `${bowler} to ${batsmanOut}: OUT! Stumped! Lightning quick work behind the stumps`;
            case 'runout':
              if (isMankad) {
                return `${batsmanOut}: OUT! Mankad! Run out at the non-striker's end before delivery`;
              }
              return `${batsmanOut}: OUT! Run out! ${runsCompleted || 0} run${runsCompleted === 1 ? '' : 's'} completed before dismissal`;
            case 'hitwicket':
              return `${bowler} to ${batsmanOut}: OUT! Hit wicket! Batsman accidentally disturbed the stumps`;
            case 'obstructing':
              return `${batsmanOut}: OUT! Obstructing the field! Unfair play by the batsman`;
            default:
              return `${bowler} to ${batsmanOut}: OUT! ${batsmanOut} is dismissed`;
          }
        }
        return `${bowler} to ${striker}: OUT! ${striker} is dismissed`;
        
      case 'extras':
        if (extraType === 'wide') {
          return `${bowler}: Wide ball, ${value} extra run${value > 1 ? 's' : ''} added`;
        } else if (extraType === 'noball') {
          return `${bowler}: NO BALL! ${value} extra run${value > 1 ? 's' : ''} added`;
        } else if (extraType === 'bye') {
          return `${bowler} to ${striker}: ${value} bye${value > 1 ? 's' : ''} taken`;
        } else if (extraType === 'legbye') {
          return `${bowler} to ${striker}: ${value} leg bye${value > 1 ? 's' : ''} taken`;
        } else if (extraType === 'penalty') {
          return `Penalty: ${value} run${value > 1 ? 's' : ''} awarded`;
        }
        return `${bowler}: Extra runs - ${value} added to total`;
        
      default: return '';
    }
  };

  // Team selection functions
  const getAvailableTeams = (isForBowling = false) => {
    const teams = Object.keys(CRICKET_TEAMS).map(key => ({
      id: key,
      ...CRICKET_TEAMS[key]
    }));
    
    // Add test data option
    teams.push({
      id: 'test',
      name: 'Test Data',
      captain: 'Test',
      color: '#666666',
      players: []
    });

    // If selecting bowling team, exclude already selected batting team
    if (isForBowling && selectedBattingTeam) {
      return teams.filter(team => team.id !== selectedBattingTeam);
    }
    
    return teams;
  };

  const handleTeamSelection = (teamId) => {
    const selectedTeam = CRICKET_TEAMS[teamId];
    
    if (dropdownType === 'batting') {
      setSelectedBattingTeam(teamId);
      if (teamId === 'test') {
        setBattingTeamName('India');
        setBattingPlayers([
          'Rohit', 'Gill', 'Kohli', 'Iyer', 'KL Rahul', 'Hardik',
          'Jadeja', 'Ashwin', 'Shami', 'Bumrah', 'Siraj'
        ]);
      } else {
        setBattingTeamName(selectedTeam.name);
        setBattingPlayers([...selectedTeam.players]);
      }
    } else if (dropdownType === 'bowling') {
      setSelectedBowlingTeam(teamId);
      if (teamId === 'test') {
        setBowlingTeamName('Australia');
        setBowlingPlayers([
          'Warner', 'Head', 'Smith', 'Labuschagne', 'Maxwell', 'Carey',
          'Starc', 'Cummins', 'Hazlewood', 'Zampa', 'Green'
        ]);
      } else {
        setBowlingTeamName(selectedTeam.name);
        setBowlingPlayers([...selectedTeam.players]);
      }
    }
    
    setShowTeamDropdown(false);
  };

  const openTeamDropdown = (type) => {
    setDropdownType(type);
    setShowTeamDropdown(true);
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
    // Add overs validation
    if (!overs || parseInt(overs) <= 0) {
      Alert.alert('Missing Overs', 'Please enter the number of overs for the match');
      return;
    }
    
  setShowSetupModal(false);
  setStriker(''); // Do not auto-select striker
  setNonStriker(''); // Do not auto-select non-striker
  setBowler(''); // Do not auto-select bowler
  };

  const updateBatsmanStats = useCallback((name, type, value = 0, additionalData = {}) => {
    setBatsmenStats(prevStats => {
      const stats = { ...prevStats };
      if (!stats[name]) stats[name] = { runs: 0, balls: 0, status: 'Batting', fours: 0, sixes: 0 };
      
      switch(type) {
        case 'run': 
          stats[name].runs += value;
          stats[name].balls += 1;
          if (value === 4) stats[name].fours += 1;
          if (value === 6) stats[name].sixes += 1;
          break;
        case 'noball_run': // Special case for runs scored off no-ball
          stats[name].runs += value;
          // Don't add to balls faced since it's a no-ball
          if (value === 4) stats[name].fours += 1;
          if (value === 6) stats[name].sixes += 1;
          break;
        case 'wicket':
          stats[name].status = 'Out';
          stats[name].balls += 1;
          break;
        case 'retired':
          stats[name].status = 'Retired';
          if (additionalData.reason) {
            stats[name].retireReason = additionalData.reason;
          }
          break;
        case 'resumed':
          stats[name].status = 'Batting';
          break;
        case 'wide':
        case 'noball':
          break;
        default:
          stats[name].balls += 1;
      }
      return stats;
    });
  }, []);

  // Add batsman change handlers
  const handleStrikerChange = useCallback((newStriker) => {
    // Allow changing striker at any time
    setStriker(newStriker);
  }, [striker, nonStriker, batsmenStats]);

  const handleNonStrikerChange = useCallback((newNonStriker) => {
    // Allow changing non-striker at any time
    setNonStriker(newNonStriker);
  }, [striker, nonStriker, batsmenStats]);

  const handleSwitchStrikers = useCallback(() => {
    if (striker && nonStriker) {
      Alert.alert(
        'Switch Batsmen',
        'Do you want to switch the striker and non-striker?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Switch',
            onPress: () => {
              const tempStriker = striker;
              setStriker(nonStriker);
              setNonStriker(tempStriker);
              
              // Add commentary for batsmen switching
              const commentaryText = `🔄 Batsmen switched - ${nonStriker} and ${striker} have switched ends`;
              const ballInfo = {
                ball: `${Math.floor(balls.length / 6)}.${(balls.length % 6) + 1}`,
                runs: 0,
                commentary: commentaryText,
                type: 'switch',
                batsman: '',
                bowler: bowler || ''
              };
              setBalls(prevBalls => [...prevBalls, ballInfo]);
            },
          },
        ],
      );
    } else {
      Alert.alert('Error', 'Both batsmen must be selected to switch positions.');
    }
  }, [striker, nonStriker]);

  const updateBowlerStats = useCallback((type, runsToAdd = 0) => {
    setBowlerStats(prevStats => {
      const stats = { ...prevStats };
      if (!stats[bowler]) stats[bowler] = { runs: 0, wickets: 0, balls: 0, dots: 0 };
      
      if (type === 'run') {
        stats[bowler].runs += runsToAdd;
        if (runsToAdd === 0) stats[bowler].dots += 1;
      }
      if (type === 'wide' || type === 'noball') stats[bowler].runs += runsToAdd;
      if (type === 'wicket') stats[bowler].wickets += 1;
      if (type !== 'wide' && type !== 'noball') stats[bowler].balls += 1;
      
      return stats;
    });
  }, [bowler]);

  const addBall = useCallback((type, value = 0) => {
    // Validate striker and non-striker
    if (!striker || !nonStriker) {
      if (type === 'run') {
        Alert.alert('Select a batsman', 'Please select a batsman before scoring runs.');
      } else {
        Alert.alert('Missing Selection', 'Please select both Striker and Non-Striker');
      }
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
        runsToAdd = value;
        break;
      case 'noball': {
        const batsmanRuns = Math.max(0, value - 1);
        runsToAdd = value > 0 ? value : 1;
        if (batsmanRuns > 0) {
          updateBatsmanStats(striker, 'noball_run', batsmanRuns);
          if (batsmanRuns % 2 === 1) {
            const temp = striker;
            setStriker(nonStriker);
            setNonStriker(temp);
          }
        }
        break;
      }
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
    setRuns(prevRuns => {
      const newRuns = prevRuns + runsToAdd;
      
      // Check for match completion in second innings
      if (innings === 2 && target > 0 && newRuns >= target) {
        setTimeout(() => {
          Alert.alert('Match Won!', 
            `${bowlingTeamName} wins by ${10 - wickets} wickets!\n` +
            `Target reached: ${newRuns}/${wickets} in ${Math.floor(totalLegalBalls / 6)}.${totalLegalBalls % 6} overs`, 
            [{ text: 'OK', onPress: () => handleVictory() }]
          );
        }, 100);
      }
      
      return newRuns;
    });

    // Update bowler stats
    updateBowlerStats(type, runsToAdd);

    // Add commentary alert and show immediate alert
    const description = getBallDescription(type, value);
    setAlerts(prevAlerts => [...prevAlerts, description]);

    // Count legal balls in this over including the new ball (runout counts, penalty does not)
    const legalBallsInThisOver = [...balls, newBall].filter(b => 
      (b.type === 'run' || b.type === 'wicket' || b.type === 'runout')
    ).length;

    if (legalBallsInThisOver === 6) {
      // Calculate what the striker/nonStriker will be after this ball
      let nextStriker = striker;
      let nextNonStriker = nonStriker;
      if (type === 'run' && value % 2 === 1) {
        // Odd runs, swap
        nextStriker = nonStriker;
        nextNonStriker = striker;
      }
      if (type === 'noball') {
        const batsmanRuns = Math.max(0, value - 1);
        if (batsmanRuns % 2 === 1) {
          nextStriker = nonStriker;
          nextNonStriker = striker;
        }
      }

      // Now swap for over
      const strikerAtOverEnd = nextStriker;
      const nonStrikerAtOverEnd = nextNonStriker;

      if (completedOversLegalBalls + 6 >= maxBalls) {
        // This is the last over
        Alert.alert('Ball Update', description, [
          { text: 'OK', onPress: () => {
            Alert.alert('Innings Complete', 'All allotted overs have been bowled');
          }}
        ]);
      } else {
        // Regular over completion - batsmen switch ends
        setOversHistory(prev => [...prev, { bowler, balls: [...balls, newBall] }]);
        setBalls([]); // Reset balls for the new over
        setBowler(''); // Reset bowler selection

        // Switch batsmen at the end of the over
        setStriker(nonStrikerAtOverEnd);
        setNonStriker(strikerAtOverEnd);

        // Show ball update first, then over complete alert
        Alert.alert('Ball Update', description, [
          { text: 'OK', onPress: () => {
            Alert.alert('Over Complete', `Over completed! Batsmen have switched ends.\n${nonStrikerAtOverEnd} is now on strike.\n\nPlease select the next bowler.`);
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
  }, [striker, nonStriker, bowler, bowlingPlayers, battingPlayers, innings, totalLegalBalls, maxBalls, wickets, balls, completedOversLegalBalls, updateBatsmanStats, updateBowlerStats, getBallDescription]);

  const handleRetirePlayer = () => {
    setShowRetireModal(true);
  };

  const processRetirement = () => {
    if (!selectedRetirePlayer) {
      Alert.alert('Error', 'Please select a player to retire');
      return;
    }

    const retiredPlayer = {
      name: selectedRetirePlayer,
      reason: retireReason,
      timestamp: new Date().toISOString()
    };

    // Update batsman stats
    updateBatsmanStats(selectedRetirePlayer, 'retired', 0, { 
      reason: retireReason 
    });

    // Add to retired players list
    setRetiredHurtPlayers(current => [...current, retiredPlayer]);

    const reasonText = retireReason === 'injury' ? 'due to injury' :
                      retireReason === 'retired_out' ? 'retired out' :
                      'for other reasons';

    const alertMessage = `${selectedRetirePlayer} has retired ${reasonText}`;
    setAlerts([...alerts, alertMessage]);

    // Handle batting positions
    if (selectedRetirePlayer === striker) {
      // Get next batsman for striker position
      const availableBatsmen = battingPlayers.filter(player => 
        player !== striker && 
        player !== nonStriker &&
        !batsmenStats[player]?.status?.includes('Out') &&
        !retiredHurtPlayers.some(retired => 
          typeof retired === 'string' ? retired === player : retired.name === player
        )
      );

      if (availableBatsmen.length > 0) {
        setStriker(availableBatsmen[0]);
        Alert.alert('Retirement', `${alertMessage}. ${availableBatsmen[0]} comes in to bat.`);
      } else if (nonStriker) {
        setStriker(nonStriker);
        setNonStriker('');
        Alert.alert('Retirement', `${alertMessage}. ${nonStriker} will continue batting.`);
      } else {
        setStriker('');
        Alert.alert('Retirement', alertMessage);
      }
    } else if (selectedRetirePlayer === nonStriker) {
      // Get next batsman for non-striker position
      const availableBatsmen = battingPlayers.filter(player => 
        player !== striker && 
        player !== nonStriker &&
        !batsmenStats[player]?.status?.includes('Out') &&
        !retiredHurtPlayers.some(retired => 
          typeof retired === 'string' ? retired === player : retired.name === player
        )
      );

      if (availableBatsmen.length > 0) {
        setNonStriker(availableBatsmen[0]);
        Alert.alert('Retirement', `${alertMessage}. ${availableBatsmen[0]} comes in as non-striker.`);
      } else {
        setNonStriker('');
        Alert.alert('Retirement', alertMessage);
      }
    } else {
      // Player retiring from pavilion (not currently batting)
      Alert.alert('Retirement', alertMessage);
    }

    // Reset modal state
    setShowRetireModal(false);
    setSelectedRetirePlayer('');
    setRetireReason('injury');
  };

  const undoBall = () => {
    if (balls.length === 0) return;

    const lastBall = balls[balls.length - 1];
    const newBalls = balls.slice(0, -1);
    setBalls(newBalls);

    const batsmanName = lastBall.striker;
    const bowlerName = lastBall.bowler;

    // Update batsman stats
    const newBatsmenStats = { ...batsmenStats };
    
    // For run outs and regular wickets, restore the dismissed batsman
    if (lastBall.type === 'wicket' || lastBall.type === 'runout') {
      if (newBatsmenStats[batsmanName]) {
        newBatsmenStats[batsmanName].status = 'Batting';
        
        // For regular wickets, also subtract a ball and handle runs if any
        if (lastBall.type === 'wicket') {
          newBatsmenStats[batsmanName].balls -= 1;
          
          // For wicket balls with runs, subtract them and handle boundaries
          if (lastBall.value > 0) {
            newBatsmenStats[batsmanName].runs -= lastBall.value;
            if (lastBall.value === 4 && newBatsmenStats[batsmanName].fours > 0) {
              newBatsmenStats[batsmanName].fours -= 1;
            }
            if (lastBall.value === 6 && newBatsmenStats[batsmanName].sixes > 0) {
              newBatsmenStats[batsmanName].sixes -= 1;
            }
          }
        }
      }
      
      // For run outs, we need to subtract runs from whoever was credited (the striker)
      if (lastBall.type === 'runout' && lastBall.value > 0) {
        // Find the current striker and subtract runs from them
        const currentStriker = striker;
        if (currentStriker && newBatsmenStats[currentStriker] && currentStriker !== batsmanName) {
          newBatsmenStats[currentStriker].runs -= lastBall.value;
          // Also handle fours and sixes for run outs
          if (lastBall.value === 4 && newBatsmenStats[currentStriker].fours > 0) {
            newBatsmenStats[currentStriker].fours -= 1;
          }
          if (lastBall.value === 6 && newBatsmenStats[currentStriker].sixes > 0) {
            newBatsmenStats[currentStriker].sixes -= 1;
          }
        }
      }
      
      // Restore dismissed batsman to field
      if (!striker) {
        setStriker(batsmanName);
      } else if (!nonStriker) {
        setNonStriker(batsmanName);
      } else {
        // Replace one of them - choose striker position
        setStriker(batsmanName);
      }
      
      // Reduce wicket count
      setWickets(wickets - 1);
    }
    
    // For run balls, subtract stats from batsman
    if (lastBall.type === 'run' && newBatsmenStats[batsmanName]) {
      newBatsmenStats[batsmanName].runs -= lastBall.value;
      newBatsmenStats[batsmanName].balls -= 1;
      // Handle fours and sixes
      if (lastBall.value === 4 && newBatsmenStats[batsmanName].fours > 0) {
        newBatsmenStats[batsmanName].fours -= 1;
      }
      if (lastBall.value === 6 && newBatsmenStats[batsmanName].sixes > 0) {
        newBatsmenStats[batsmanName].sixes -= 1;
      }
    }
    
    // For no-ball runs, subtract stats from batsman but don't subtract balls faced
    if (lastBall.type === 'noball_run' && newBatsmenStats[batsmanName]) {
      newBatsmenStats[batsmanName].runs -= lastBall.value;
      // Don't subtract balls faced since it was a no-ball
      // Handle fours and sixes
      if (lastBall.value === 4 && newBatsmenStats[batsmanName].fours > 0) {
        newBatsmenStats[batsmanName].fours -= 1;
      }
      if (lastBall.value === 6 && newBatsmenStats[batsmanName].sixes > 0) {
        newBatsmenStats[batsmanName].sixes -= 1;
      }
    }
    
    // For other ball types that don't score runs but count balls (e.g., dot balls)
    if (lastBall.type !== 'run' && lastBall.type !== 'noball_run' && lastBall.type !== 'wicket' && lastBall.type !== 'runout' && 
        lastBall.type !== 'wide' && lastBall.type !== 'noball' && newBatsmenStats[batsmanName]) {
      newBatsmenStats[batsmanName].balls -= 1;
    }

    // Update bowler stats
    const newBowlerStats = { ...bowlerStats };
    if (newBowlerStats[bowlerName]) {
      // Subtract runs for all ball types that add runs
      if (lastBall.type === 'run' || lastBall.type === 'wide' || lastBall.type === 'noball' || lastBall.type === 'runout') {
        newBowlerStats[bowlerName].runs -= lastBall.value;
      }
      
      // Handle dot ball tracking - subtract dot if this was a 0-run legal ball
      if ((lastBall.type === 'run' || lastBall.type === 'runout') && lastBall.value === 0 && newBowlerStats[bowlerName].dots > 0) {
        newBowlerStats[bowlerName].dots -= 1;
      }
      
      // Subtract wickets
      if (lastBall.type === 'wicket') {
        newBowlerStats[bowlerName].wickets -= 1;
      }
      
      // Subtract balls (but not for run outs, wides, or no balls)
      if (lastBall.type !== 'wide' && lastBall.type !== 'noball' && lastBall.type !== 'runout') {
        newBowlerStats[bowlerName].balls -= 1;
      }
    }

    // Subtract runs from total
    let runsToSubtract = 0;
    if (lastBall.type === 'run' || lastBall.type === 'wide' || lastBall.type === 'noball' || lastBall.type === 'runout' || lastBall.type === 'wicket') {
      runsToSubtract = lastBall.value;
    }
    setRuns(runs - runsToSubtract);

    // Update stats
    setBatsmenStats(newBatsmenStats);
    setBowlerStats(newBowlerStats);
    
    // Add undo alert
    const ballType = lastBall.type === 'runout' ? 'run out' : lastBall.type;
    const undoAlert = `UNDO: Last ball (${ballType}) involving ${batsmanName} was removed`;
    setAlerts([...alerts, undoAlert]);
    Alert.alert('Ball Undone', undoAlert);
  };

  const handleExtras = useCallback(() => {
    const runs = parseInt(extraRunsInput) || 1;
    let commentary = '';
    switch(selectedExtraType) {
      case 'wide':
        addBall('wide', runs);
        commentary = getBallDescription('extras', runs, { extraType: 'wide' });
        break;
      case 'noball': {
        // 1 run to extras, rest (if any) to batsman
        addBall('noball', runs); // pass the total runs for the ball (1 = just extra, >1 = extra + batsman)
        commentary = `${bowler}: NO BALL! 1 run to extras${runs > 1 ? ", " + (runs - 1) + " run" + (runs - 1 > 1 ? "s" : "") + " to " + striker : ''}`;
        break;
      }
      case 'bye':
        addBall('run', runs);
        commentary = getBallDescription('extras', runs, { extraType: 'bye' });
        break;
      case 'legbye':
        addBall('run', runs);
        commentary = getBallDescription('extras', runs, { extraType: 'legbye' });
        break;
      case 'penalty':
        setRuns(prevRuns => {
          const newRuns = prevRuns + runs;
          if (innings === 2 && target > 0 && newRuns >= target) {
            setTimeout(() => {
              Alert.alert('Match Won!', 
                `${bowlingTeamName} wins by ${10 - wickets} wickets!\n` +
                `Target reached: ${newRuns}/${wickets} with penalty runs`, 
                [{ text: 'OK', onPress: () => handleVictory() }]
              );
            }, 100);
          }
          return newRuns;
        });
        commentary = getBallDescription('extras', runs, { extraType: 'penalty' });
        setAlerts(prevAlerts => [...prevAlerts, commentary]);
        Alert.alert('Penalty Runs', commentary);
        break;
    }
    setShowExtrasModal(false);
    setExtraRunsInput('1');
  }, [extraRunsInput, selectedExtraType, addBall, getBallDescription, striker, nonStriker, bowler, updateBatsmanStats, setStriker, setNonStriker, setBalls, setRuns]);

  const handleWicket = useCallback(() => {
    const runs = parseInt(runsOnWicket) || 0;
    const batsmanOut = selectedBatsman === 'striker' ? striker : nonStriker;
    
    // Don't add runs here for run outs - they will be handled in the switch statement
    if (selectedWicketType !== 'runout' && runs > 0) {
      setRuns(prevRuns => {
        const newRuns = prevRuns + runs;
        
        // Check for match completion in second innings
        if (innings === 2 && target > 0 && newRuns >= target) {
          setTimeout(() => {
            Alert.alert('Match Won!', 
              `${bowlingTeamName} wins by ${10 - wickets} wickets!\n` +
              `Target reached: ${newRuns}/${wickets + 1} on a wicket ball`, 
              [{ text: 'OK', onPress: () => handleVictory() }]
            );
          }, 100);
        }
        
        return newRuns;
      });
      updateBatsmanStats(striker, 'run', runs); // Always credit runs to striker
    }
    
    // Generate detailed commentary
    const commentary = getBallDescription('wicket', runs, {
      wicketType: selectedWicketType,
      batsmanOut: batsmanOut,
      runsCompleted: runs,
      isMankad: selectedWicketType === 'mankad'
    });
    
    // Add commentary to alerts
    setAlerts(prevAlerts => [...prevAlerts, commentary]);
    
    // Handle different wicket types
    let actualDismissedBatsman = batsmanOut;
    let strikerAfterWicket = striker;
    let nonStrikerAfterWicket = nonStriker;
    
    switch(selectedWicketType) {
      case 'runout': {
        // Run out - doesn't count as a ball to the bowler
        // First, add runs to total and striker's stats if any completed
        if (runs > 0) {
          setRuns(prevRuns => prevRuns + runs);
          updateBatsmanStats(striker, 'run', runs);
          updateBowlerStats('run', runs);
        }

        // Simple logic: The selected batsman gets out, period.
        actualDismissedBatsman = selectedBatsman === 'striker' ? striker : nonStriker;

        // Handle strike change based on runs completed BEFORE dismissal
        if (runs % 2 === 1) {
          // Odd runs completed, batsmen have switched positions
          strikerAfterWicket = nonStriker;
          nonStrikerAfterWicket = striker;
        }

        updateBatsmanStats(actualDismissedBatsman, 'wicket');
        setWickets(prevWickets => prevWickets + 1);

        // Add run out to ball history for record keeping
        const runOutBall = { 
          type: 'runout', 
          value: runs, 
          bowler, 
          striker: actualDismissedBatsman,
          runsCompleted: runs 
        };
        setBalls(prevBalls => {
          const updatedBalls = [...prevBalls, runOutBall];
          // Check if this runout completes the over (6th legal ball)
          const legalBallsInThisOver = updatedBalls.filter(b => b.type === 'run' || b.type === 'wicket' || b.type === 'runout').length;
          if (legalBallsInThisOver === 6) {
            // Complete the over: move to oversHistory, reset balls, reset bowler, switch batsmen
            setOversHistory(prev => [...prev, { bowler, balls: updatedBalls }]);
            setTimeout(() => {
              setBalls([]);
              setBowler('');
              // After run out, only the dismissed batsman slot should be empty
              // If the striker was out, set striker to '' and non-striker to the correct player
              // If the non-striker was out, set non-striker to '' and striker to the correct player
              if (selectedBatsman === 'striker') {
                setStriker('');
                setNonStriker(nonStrikerAfterWicket);
              } else {
                setStriker(strikerAfterWicket);
                setNonStriker('');
              }
              Alert.alert('Over Complete', `Over completed! Batsmen have switched ends.\n${nonStrikerAfterWicket} is now on strike.\n\nPlease select the next bowler.`);
            }, 0);
            return [];
          }
          return updatedBalls;
        });
        break;
      }
        
      case 'mankad':
        // Mankad run out - always the non-striker
        actualDismissedBatsman = nonStriker;
        updateBatsmanStats(actualDismissedBatsman, 'wicket');
        setWickets(prevWickets => prevWickets + 1);
        break;
        
      default: {
        // Regular wickets (bowled, lbw, caught, etc.) - these count as legal balls
        actualDismissedBatsman = selectedBatsman === 'striker' ? striker : nonStriker;
        updateBatsmanStats(actualDismissedBatsman, 'wicket');
        setWickets(prevWickets => prevWickets + 1);
        updateBowlerStats('wicket', runs);

        const newBall = { type: 'wicket', value: runs, bowler, striker: actualDismissedBatsman };
        setBalls(prevBalls => {
          const updatedBalls = [...prevBalls, newBall];
          // Check if this wicket completes the over (6th legal ball)
          const legalBallsInThisOver = updatedBalls.filter(b => b.type === 'run' || b.type === 'wicket' || b.type === 'runout').length;
          if (legalBallsInThisOver === 6) {
            setOversHistory(prev => [...prev, { bowler, balls: updatedBalls }]);
            setTimeout(() => {
              setBalls([]);
              setBowler('');
              setStriker(nonStrikerAfterWicket);
              setNonStriker(strikerAfterWicket);
              Alert.alert('Over Complete', `Over completed! Batsmen have switched ends.\n${nonStrikerAfterWicket} is now on strike.\n\nPlease select the next bowler.`);
            }, 0);
            return [];
          }
          return updatedBalls;
        });

        // Handle runs scored before dismissal (if any)
        if (runs > 0) {
          setRuns(prevRuns => prevRuns + runs);
          updateBatsmanStats(striker, 'run', runs);
          // For regular wickets, if odd runs, switch remaining batsman
          if (runs % 2 === 1) {
            strikerAfterWicket = nonStriker;
            nonStrikerAfterWicket = striker;
          }
        }
        break;
      }
    }
    
    // Update batsmen positions after wicket - only clear the dismissed batsman
    if (actualDismissedBatsman === strikerAfterWicket) {
      setStriker('');
      // Keep non-striker in position (may have changed due to runs)
      if (nonStrikerAfterWicket !== actualDismissedBatsman) {
        setNonStriker(nonStrikerAfterWicket);
      }
    } else if (actualDismissedBatsman === nonStrikerAfterWicket) {
      setNonStriker('');
      // Keep striker in position (may have changed due to runs)  
      if (strikerAfterWicket !== actualDismissedBatsman) {
        setStriker(strikerAfterWicket);
      }
    }
    
    // Show alert for new batsman selection with commentary
    const wicketCommentary = getBallDescription('wicket', runs, { 
      wicketType: selectedWicketType, 
      batsmanOut: actualDismissedBatsman, 
      runsCompleted: runs,
      extraType: null, 
      isMankad 
    });
    
    Alert.alert('Wicket!', `${wicketCommentary}\n\nPlease select the new batsman`, [
      { text: 'OK' }
    ]);
    
    // Reset modal state
    setShowWicketModal(false);
    setSelectedWicketType('bowled');
    setSelectedBatsman('striker');
    setRunsOnWicket('0');
    setIsMankad(false);
  }, [runsOnWicket, selectedBatsman, striker, nonStriker, selectedWicketType, updateBatsmanStats, getBallDescription, updateBowlerStats, bowler]);

  const endInnings = async () => {
    // Properly record the final over with current balls
    let finalOversHistory = [...oversHistory];
    if (balls.length > 0) {
      finalOversHistory = [...oversHistory, { bowler, balls }];
    }

    // Create summary of top performers
    const battingDetails = Object.entries(batsmenStats)
      .map(([name, stats]) => `${name}: ${stats.runs}(${stats.balls})`)
      .join(', ');
    const bowlingDetails = Object.entries(bowlerStats)
      .map(([name, stats]) => `${name}: ${stats.wickets}/${stats.runs}`)
      .join(', ');
    // Calculate final over count for display
    const finalOvers = Math.floor(totalLegalBalls / 6);
    const finalBalls = totalLegalBalls % 6;
    const oversString = finalOvers + (finalBalls > 0 ? `.${finalBalls}` : '');

    // Save for use after edit
    const matchData = {
      innings,
      team: innings === 2 ? bowlingTeamName : battingTeamName, // Fixed team assignment for second innings
      batsmenStats,
      bowlerStats,
      overs: oversString, // Use the calculated overs string
      total: runs,
      wickets,
      oversHistory: finalOversHistory,
      date: new Date().toLocaleString(),
      alerts: [
        ...alerts, 
        `${innings === 2 ? bowlingTeamName : battingTeamName} innings ended with ${runs}/${wickets} in ${oversString} overs`,
        `Batting: ${battingDetails}`,
        `Bowling: ${bowlingDetails}`
      ]
    };

    if (innings === 1) {
      // Open edit modal for first innings review before proceeding
      setEditedRuns(runs.toString());
      setEditedWickets(wickets.toString());
      setEditedTarget((runs + 1).toString());
      setShowEditScoreModal(true);
      // Save a callback to continue after edit
      setTimeout(() => {
        setOnEditScoreComplete(() => (edited, newRuns, newWickets, newTarget) => {
          // After edit/cancel, update first innings and proceed
          const finalRuns = edited ? newRuns : runs;
          const finalWickets = edited ? newWickets : wickets;
          const finalTarget = edited ? newTarget : runs + 1;
          setFirstInningsScore({ ...matchData, total: finalRuns, wickets: finalWickets });
          setTarget(finalTarget);
          setInnings(2);
          resetInningsState();
          // Show summary alert
          Alert.alert('First Innings Complete', 
            `${battingTeamName} (Batting) scored ${finalRuns}/${finalWickets} in ${oversString} overs\n` +
            `${bowlingTeamName} needs ${finalTarget} runs to win.\n\n` +
            `Batting will now begin for: ${bowlingTeamName}\n` +
            `Bowling will now begin for: ${battingTeamName}`
          );
        });
      }, 0);
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
  winMargin,
  umpireNotes,
  target: target // ensure target is always present for ScorecardScreen
    };

    const newHistory = [fullMatch, ...matchHistory];
    await AsyncStorage.setItem('cricket_history', JSON.stringify(newHistory));
    
    setVictoryData(fullMatch);
    setShowVictory(true);
  };

  // Save umpire notes for current match
  const saveUmpireNotes = async () => {
    try {
      const notesKey = `umpire_notes_${battingTeamName}_${bowlingTeamName}_${new Date().toDateString()}`;
      await AsyncStorage.setItem(notesKey, JSON.stringify(umpireNotes));
    } catch (e) {
      console.error('Failed to save umpire notes', e);
    }
  };

  // Load umpire notes for current match
  const loadUmpireNotes = async () => {
    try {
      const notesKey = `umpire_notes_${battingTeamName}_${bowlingTeamName}_${new Date().toDateString()}`;
      const savedNotes = await AsyncStorage.getItem(notesKey);
      if (savedNotes) setUmpireNotes(JSON.parse(savedNotes));
    } catch (e) {
      console.error('Failed to load umpire notes', e);
    }
  };

  // Save current match state including umpire notes
  const saveCurrentMatchState = async () => {
    try {
      const currentMatchData = {
        battingTeam: battingTeamName,
        bowlingTeam: bowlingTeamName,
        innings: innings,
        runs: runs,
        wickets: wickets,
        overs: Math.floor(balls.length / 6),
        maxOvers: maxOvers,
        balls: balls,
        striker: striker,
        nonStriker: nonStriker,
        bowler: bowler,
        batsmenStats: batsmenStats,
        bowlerStats: bowlerStats,
        oversHistory: oversHistory,
        umpireNotes: umpireNotes,
        date: new Date().toISOString().split('T')[0]
      };
      
      await AsyncStorage.setItem('current_cricket_match', JSON.stringify(currentMatchData));
    } catch (e) {
      console.error('Failed to save current match state', e);
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

  const openScoreboardModal = () => {
    setShowScoreboardModal(true);
  };

  const openUmpireNotesModal = () => {
    setShowUmpireNotesModal(true);
  };

  const addUmpireNote = () => {
    if (currentNote.trim()) {
      const note = {
        id: Date.now(),
        text: currentNote.trim(),
        timestamp: new Date().toLocaleString(),
        innings: innings,
        over: `${Math.floor(balls.length / 6)}.${balls.length % 6}`,
        score: `${runs}/${wickets}`
      };
      setUmpireNotes(prevNotes => [...prevNotes, note]);
      setCurrentNote('');
      Alert.alert('Note Added', 'Umpire note has been recorded');
    } else {
      Alert.alert('Empty Note', 'Please enter a note before saving');
    }
  };

  const deleteUmpireNote = (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUmpireNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
          }
        }
      ]
    );
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

  // Edit final score/target after first innings
  // (removed duplicate state declarations)


  // Save edited values
  const saveEditedScore = (fromEndInningsFlow = false) => {
    let newRuns = parseInt(editedRuns);
    let newWickets = parseInt(editedWickets);
    let newTarget = parseInt(editedTarget);
    if (isNaN(newRuns) || isNaN(newWickets) || isNaN(newTarget) || newRuns < 0 || newWickets < 0 || newTarget < 1) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for runs, wickets, and target.');
      return;
    }
    // Update first innings score and target
    setFirstInningsScore(prev => prev ? { ...prev, total: newRuns, wickets: newWickets } : prev);
    setTarget(newTarget);
    // Log edit in balls array for commentary/PDF
    setBalls(prevBalls => [
      ...prevBalls,
      {
        type: 'edit',
        description: `Score edited by umpire: Runs=${newRuns}, Wickets=${newWickets}, Target=${newTarget} at ${new Date().toLocaleTimeString()}`,
        timestamp: new Date().toISOString(),
      },
    ]);
    setShowEditScoreModal(false);
    if (fromEndInningsFlow && onEditScoreComplete) {
      onEditScoreComplete(true, newRuns, newWickets, newTarget);
      setOnEditScoreComplete(null);
    } else {
      Alert.alert('Score Updated', `First innings score and target have been updated. New target: ${newTarget}`);
    }
  };

  // For endInnings flow, allow cancel to skip edit
  const cancelEditScore = () => {
    setShowEditScoreModal(false);
    if (onEditScoreComplete) {
      onEditScoreComplete(false);
      setOnEditScoreComplete(null);
    }
  };

  // Edit Score Modal UI
  const renderEditScoreModal = () => (
    <Modal
      visible={showEditScoreModal}
      transparent
      animationType="slide"
      onRequestClose={cancelEditScore}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, width: 320 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Edit First Innings Score / Target</Text>
          <Text>Runs:</Text>
          <TextInput
            value={editedRuns}
            onChangeText={setEditedRuns}
            keyboardType="numeric"
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 8, padding: 6 }}
          />
          <Text>Wickets:</Text>
          <TextInput
            value={editedWickets}
            onChangeText={setEditedWickets}
            keyboardType="numeric"
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 8, padding: 6 }}
          />
          <Text>Target (runs to win):</Text>
          <TextInput
            value={editedTarget}
            onChangeText={setEditedTarget}
            keyboardType="numeric"
            style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, marginBottom: 16, padding: 6 }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title="Cancel" onPress={cancelEditScore} />
            <Button title="Save" onPress={() => saveEditedScore(true)} />
          </View>
        </View>
      </View>
    </Modal>
  );
  // State to handle callback after edit modal for endInnings
  const [onEditScoreComplete, setOnEditScoreComplete] = useState(null);

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
            
            <Text style={styles.sectionTitle}>Select Team</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => openTeamDropdown('batting')}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedBattingTeam ? 
                  (selectedBattingTeam === 'test' ? 'Test Data' : CRICKET_TEAMS[selectedBattingTeam]?.name) 
                  : 'Select Team ↓'
                }
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Add Additional Players</Text>
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
            
            <View style={styles.playersList}>
              {battingPlayers.map((item, index) => (
                <View key={index} style={styles.playerItem}>
                  <Text>{item}</Text>
                  <TouchableOpacity 
                    onPress={() => setBattingPlayers(battingPlayers.filter(player => player !== item))}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
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
            
            <Text style={styles.sectionTitle}>Select Team</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => openTeamDropdown('bowling')}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedBowlingTeam ? 
                  (selectedBowlingTeam === 'test' ? 'Test Data' : CRICKET_TEAMS[selectedBowlingTeam]?.name) 
                  : 'Select Team ↓'
                }
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.sectionTitle}>Add Additional Players</Text>
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
            
            <View style={styles.playersList}>
              {bowlingPlayers.map((item, index) => (
                <View key={index} style={styles.playerItem}>
                  <Text>{item}</Text>
                  <TouchableOpacity 
                    onPress={() => setBowlingPlayers(bowlingPlayers.filter(player => player !== item))}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        );

      case 'confirmation':
        return (
          <View style={styles.setupContainer}>
            <Text style={styles.setupTitle}>Teams Confirmation</Text>
            
            <Text style={styles.teamConfirmation}>
              Batting Team: {battingTeamName}
            </Text>
            <View>
              {battingPlayers.map((item, index) => (
                <Text key={index} style={styles.playerConfirm}>→ {item}</Text>
              ))}
            </View>

            <Text style={styles.teamConfirmation}>
              Bowling Team: {bowlingTeamName}
            </Text>
            <View>
              {bowlingPlayers.map((item, index) => (
                <Text key={index} style={styles.playerConfirm}>→ {item}</Text>
              ))}
            </View>

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

  return (
    <LinearGradient
      colors={['#1e3c72', '#2a5298', '#1e3c72']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
      <>
        {/* Setup Modal */}
        <Modal visible={showSetupModal} animationType="slide" transparent={false}>
          <ScrollView contentContainerStyle={styles.setupScrollContent}>
            {renderSetupContent()}
            <View style={styles.setupButtons}>
              <Button
                title="← Back to Home"
                onPress={() => navigation.goBack()}
                color="#e74c3c"
              />
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
                  {/* Menu Button */}
                  <TouchableOpacity 
                    style={styles.menuButton} 
                    onPress={() => setShowMainMenu(true)}
                  >
                    <MaterialIcons name="menu" size={28} color="#fff" />
                  </TouchableOpacity>
                  
                  <View style={styles.titleContainer}>
                    <Text style={styles.title}>Cricket - Innings {innings}</Text>
                    <Text style={styles.matchInfo}>
                      {innings === 1 ? (
                        `${battingTeamName} vs ${bowlingTeamName}`
                      ) : (
                        `${bowlingTeamName} chasing ${target} | ${runs}/${wickets} (${oversDisplay}) | Need ${targetRemaining} runs`
                      )}
                    </Text>
                  </View>
                </View>
              )},
              { key: 'batting', content: (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Batting: {innings === 1 ? battingTeamName : bowlingTeamName}</Text>
                  <Text style={styles.infoText}>ℹ️ Batsmen can only be changed if they are out or retired</Text>
                  <View style={styles.pickerRow}>
                    <View style={styles.pickerContainer}>
                      <Text>Striker: {striker ? '🏏' : ''}</Text>
                      <Picker
                        selectedValue={striker}
                        onValueChange={handleStrikerChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Striker" value="" />
                        {(innings === 1 ? battingPlayers : bowlingPlayers).map((player, index) => (
                          (!batsmenStats[player] || 
                            batsmenStats[player].status !== 'Out') &&
                              player !== nonStriker && (
                            <Picker.Item 
                              key={index} 
                              label={
                                batsmenStats[player]?.status === 'Retired' 
                                  ? `${player} (Retired - Can Return)` 
                                  : player
                              } 
                              value={player} 
                            />
                          )
                        ))}
                      </Picker>
                    </View>

                    <View style={styles.pickerContainer}>
                      <Text>Non-Striker: {nonStriker ? '🏏' : ''}</Text>
                      <Picker
                        selectedValue={nonStriker}
                        onValueChange={handleNonStrikerChange}
                        style={styles.picker}
                      >
                        <Picker.Item label="Select Non-Striker" value="" />
                        {(innings === 1 ? battingPlayers : bowlingPlayers).map((player, index) => (
                          (!batsmenStats[player] || 
                            batsmenStats[player].status !== 'Out') &&
                              player !== striker && (
                            <Picker.Item 
                              key={index} 
                              label={
                                batsmenStats[player]?.status === 'Retired' 
                                  ? `${player} (Retired - Can Return)` 
                                  : player
                              } 
                              value={player} 
                            />
                          )
                        ))}
                      </Picker>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.switchButton} 
                    onPress={handleSwitchStrikers}
                    disabled={!striker || !nonStriker}
                  >
                    <MaterialIcons name="swap-horiz" size={20} color="#fff" />
                    <Text style={styles.switchButtonText}>Switch Batsmen</Text>
                  </TouchableOpacity>
                  
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
                  
                </View>
              )},
              { key: 'scoring', content: (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Scoring Controls</Text>
                  <View style={styles.buttonRow}>
                    {[0, 1, 2, 3, 4, 5, 6].map(n => (
                      <TouchableOpacity 
                        key={n}
                        style={[styles.scoreButton, n === 4 || n === 6 ? styles.boundaryButton : n === 5 ? styles.specialButton : null]}
                        onPress={() => addBall('run', n)}
                        disabled={wickets >= 10 || totalLegalBalls >= maxBalls || !striker || !nonStriker}
                      >
                        <Text style={styles.buttonText}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.scoreButton, styles.specialButton]}
                      onPress={() => setShowExtrasModal(true)}
                      disabled={wickets >= 10 || !striker || !nonStriker}
                    >
                      <Text style={styles.buttonText}>Extras</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.scoreButton, styles.wicketButton]}
                      onPress={() => setShowWicketModal(true)}
                      disabled={wickets >= 10 || !striker || !nonStriker}
                    >
                      <Text style={styles.buttonText}>Wicket</Text>
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
                      title="Retire Player"
                      onPress={handleRetirePlayer}
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
              { key: 'matchHistory', content: <View style={{ height: 20 }} /> },
            ]}
            renderItem={({ item }) => item.content}
            keyExtractor={item => item.key}
            contentContainerStyle={styles.contentContainer}
          />
        )}

        {/* Extras Modal */}
        <Modal visible={showExtrasModal} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Extra Type</Text>
              
              {/* Extra Type Selection */}
              <View style={styles.extraTypeContainer}>
                {['wide', 'noball', 'bye', 'legbye', 'penalty'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.extraTypeButton,
                      selectedExtraType === type && styles.selectedExtraType
                    ]}
                    onPress={() => setSelectedExtraType(type)}
                  >
                    <Text style={[
                      styles.extraTypeText,
                      selectedExtraType === type && styles.selectedExtraTypeText
                    ]}>
                      {type === 'wide' ? 'Wide Ball' :
                       type === 'noball' ? 'No Ball' :
                       type === 'bye' ? 'Bye' :
                       type === 'legbye' ? 'Leg Bye' :
                       'Penalty'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Runs Input */}
              <View style={styles.runsInputContainer}>
                <Text style={styles.runsLabel}>Extra Runs:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter runs"
                  value={extraRunsInput}
                  onChangeText={setExtraRunsInput}
                  keyboardType="numeric"
                />
              </View>

              {/* Info Text */}
              <Text style={styles.extraInfoText}>
                {selectedExtraType === 'wide' ? 'Wide ball + runs scored by batsman' :
                 selectedExtraType === 'noball' ? 'No ball + runs scored by batsman' :
                 selectedExtraType === 'bye' ? 'Runs scored without bat/body contact' :
                 selectedExtraType === 'legbye' ? 'Runs scored off body (not bat)' :
                 'Penalty runs awarded by umpire'}
              </Text>

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowExtrasModal(false);
                    setSelectedExtraType('wide');
                    setExtraRunsInput('1');
                  }}
                  color="#e74c3c"
                />
                <Button
                  title="Add Extras"
                  onPress={handleExtras}
                  color="#27ae60"
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Wicket Modal */}
        <Modal visible={showWicketModal} transparent={true} animationType="fade">
          <View style={[styles.modalContainer, { flex: 1, justifyContent: 'center' }]}> 
            <ScrollView 
              contentContainerStyle={[styles.scrollableModalContent, { flexGrow: 1, justifyContent: 'center' }]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Wicket Details</Text>
              
              {/* Batsman Selection */}
              <View style={styles.wicketSection}>
                <Text style={styles.wicketLabel}>Batsman Out:</Text>
                <View style={styles.batsmanSelection}>
                  <TouchableOpacity
                    style={[
                      styles.batsmanButton,
                      selectedBatsman === 'striker' && styles.selectedBatsman
                    ]}
                    onPress={() => setSelectedBatsman('striker')}
                  >
                    <Text style={[
                      styles.batsmanButtonText,
                      selectedBatsman === 'striker' && styles.selectedBatsmanText
                    ]}>
                      Striker: {striker || 'Not Selected'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.batsmanButton,
                      selectedBatsman === 'nonstriker' && styles.selectedBatsman
                    ]}
                    onPress={() => setSelectedBatsman('nonstriker')}
                  >
                    <Text style={[
                      styles.batsmanButtonText,
                      selectedBatsman === 'nonstriker' && styles.selectedBatsmanText
                    ]}>
                      Non-Striker: {nonStriker || 'Not Selected'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Wicket Type Selection */}
              <View style={styles.wicketSection}>
                <Text style={styles.wicketLabel}>Dismissal Type:</Text>
                <View style={styles.wicketTypeContainer}>
                  {[
                    { key: 'bowled', label: 'Bowled' },
                    { key: 'lbw', label: 'LBW' },
                    { key: 'caught', label: 'Caught' },
                    { key: 'stumped', label: 'Stumped' },
                    { key: 'runout', label: 'Run Out' },
                    { key: 'hitwicket', label: 'Hit Wicket' },
                    { key: 'mankad', label: 'Mankad' },
                    { key: 'obstructing', label: 'Obstructing Field' }
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.wicketTypeButton,
                        selectedWicketType === type.key && styles.selectedWicketType
                      ]}
                      onPress={() => setSelectedWicketType(type.key)}
                    >
                      <Text style={[
                        styles.wicketTypeText,
                        selectedWicketType === type.key && styles.selectedWicketTypeText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Runs on Wicket Ball */}
              <View style={styles.wicketSection}>
                <Text style={styles.wicketLabel}>Runs Scored on This Ball:</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  value={runsOnWicket}
                  onChangeText={setRunsOnWicket}
                  keyboardType="numeric"
                />
              </View>

              {/* Info Text */}
              <Text style={styles.wicketInfoText}>
                {selectedWicketType === 'runout' ? 'Batsman run out while attempting runs' :
                 selectedWicketType === 'mankad' ? 'Non-striker run out before ball delivery' :
                 selectedWicketType === 'bowled' ? 'Ball hits the stumps directly' :
                 selectedWicketType === 'lbw' ? 'Leg Before Wicket - ball would hit stumps' :
                 selectedWicketType === 'caught' ? 'Ball caught by fielder before hitting ground' :
                 selectedWicketType === 'stumped' ? 'Wicket-keeper breaks stumps while batsman is out of crease' :
                 selectedWicketType === 'hitwicket' ? 'Batsman accidentally hits own stumps' :
                 'Batsman obstructs field or handling ball'}
              </Text>

              <View style={styles.modalButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setShowWicketModal(false);
                    setSelectedWicketType('bowled');
                    setSelectedBatsman('striker');
                    setRunsOnWicket('0');
                  }}
                  color="#e74c3c"
                />
                <Button
                  title="Record Wicket"
                  onPress={handleWicket}
                  color="#e74c3c"
                />
              </View>
              </View>
            </ScrollView>
          </View>
        </Modal>

        {/* Retire Player Modal */}
        <Modal visible={showRetireModal} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                <Text style={styles.modalTitle}>Retire Player</Text>
                
                {/* Player Selection */}
                <View style={styles.retireSection}>
                  <Text style={styles.retireLabel}>Select Player to Retire:</Text>
                  <View style={styles.playerSelectionContainer}>
                    {(innings === 1 ? battingPlayers : bowlingPlayers)
                      .filter(player => 
                        !batsmenStats[player]?.status?.includes('Out') &&
                        !retiredHurtPlayers.some(retired => 
                          typeof retired === 'string' ? retired === player : retired.name === player
                        )
                      )
                      .map((player) => (
                      <TouchableOpacity
                        key={player}
                        style={[
                          styles.playerSelectionButton,
                          selectedRetirePlayer === player && styles.selectedRetirePlayer
                        ]}
                        onPress={() => setSelectedRetirePlayer(player)}
                      >
                        <Text style={[
                          styles.playerSelectionText,
                          selectedRetirePlayer === player && styles.selectedPlayerText
                        ]}>
                          {player}
                          {player === striker && ' (Striker)'}
                          {player === nonStriker && ' (Non-Striker)'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Retirement Reason Selection */}
                <View style={styles.retireSection}>
                  <Text style={styles.retireLabel}>Reason for Retirement:</Text>
                  <View style={styles.reasonContainer}>
                    {[
                      { key: 'injury', label: 'Injury', description: 'Physical injury preventing play' },
                      { key: 'retired_out', label: 'Retired Out', description: 'Tactical retirement or retired out' },
                      { key: 'other', label: 'Other', description: 'Other circumstances' }
                    ].map((reason) => (
                      <TouchableOpacity
                        key={reason.key}
                        style={[
                          styles.reasonButton,
                          retireReason === reason.key && styles.selectedReason
                        ]}
                        onPress={() => setRetireReason(reason.key)}
                      >
                        <Text style={[
                          styles.reasonText,
                          retireReason === reason.key && styles.selectedReasonText
                        ]}>
                          {reason.label}
                        </Text>
                        <Text style={[
                          styles.reasonDescription,
                          retireReason === reason.key && styles.selectedReasonDescription
                        ]}>
                          {reason.description}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Info Text */}
                <Text style={styles.retireInfoText}>
                  Note: Retired players can return to bat later in the innings if needed. 
                  They remain available for selection but will be marked as retired in statistics.
                </Text>

                <View style={styles.modalButtons}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setShowRetireModal(false);
                      setSelectedRetirePlayer('');
                      setRetireReason('injury');
                    }}
                    color="#95a5a6"
                  />
                  <Button
                    title="Retire Player"
                    onPress={processRetirement}
                    color="#9932cc"
                  />
                </View>
              </ScrollView>
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

        {/* Detailed Scoreboard Modal */}
        <Modal visible={showScoreboardModal} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Detailed Scoreboard</Text>
                
                {/* Batting Statistics */}
                <View style={styles.scoreboardSection}>
                  <Text style={styles.scoreboardSectionTitle}>🏏 Batting Statistics</Text>
                  <View style={styles.statsHeader}>
                    <Text style={[styles.statsHeaderText, {flex: 2}]}>Player</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Runs</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Balls</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>SR</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>4s</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>6s</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Status</Text>
                  </View>
                  {Object.entries(batsmenStats).map(([player, stats]) => (
                    <View key={player} style={styles.statsRow}>
                      <Text style={[styles.statsText, {flex: 2}]}>{player}</Text>
                      <Text style={[styles.statsText, {flex: 1}]}>{stats.runs}</Text>
                      <Text style={[styles.statsText, {flex: 1}]}>{stats.balls}</Text>
                      <Text style={[styles.statsText, {flex: 1}]}>
                        {stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(1) : '0.0'}
                      </Text>
                      <Text style={[styles.statsText, {flex: 1}]}>{stats.fours || 0}</Text>
                      <Text style={[styles.statsText, {flex: 1}]}>{stats.sixes || 0}</Text>
                      <Text style={[styles.statsText, {flex: 1, color: stats.status === 'Out' ? '#e74c3c' : '#27ae60'}]}>
                        {stats.status === 'Out' ? 'Out' : stats.status === 'Retired' ? 'Ret' : 'Not Out'}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Bowling Statistics */}
                <View style={styles.scoreboardSection}>
                  <Text style={styles.scoreboardSectionTitle}>⚾ Bowling Statistics</Text>
                  <View style={styles.statsHeader}>
                    <Text style={[styles.statsHeaderText, {flex: 2}]}>Bowler</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Overs</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Runs</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Wickets</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Econ</Text>
                    <Text style={[styles.statsHeaderText, {flex: 1}]}>Dots</Text>
                  </View>
                  {Object.entries(bowlerStats).map(([bowler, stats]) => {
                    const overs = Math.floor(stats.balls / 6);
                    const extraBalls = stats.balls % 6;
                    const overString = extraBalls > 0 ? `${overs}.${extraBalls}` : `${overs}`;
                    const economy = stats.balls > 0 ? ((stats.runs / stats.balls) * 6).toFixed(2) : '0.00';
                    
                    return (
                      <View key={bowler} style={styles.statsRow}>
                        <Text style={[styles.statsText, {flex: 2}]}>{bowler}</Text>
                        <Text style={[styles.statsText, {flex: 1}]}>{overString}</Text>
                        <Text style={[styles.statsText, {flex: 1}]}>{stats.runs}</Text>
                        <Text style={[styles.statsText, {flex: 1}]}>{stats.wickets}</Text>
                        <Text style={[styles.statsText, {flex: 1}]}>{economy}</Text>
                        <Text style={[styles.statsText, {flex: 1}]}>{stats.dots || 0}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Match Summary */}
                <View style={styles.scoreboardSection}>
                  <Text style={styles.scoreboardSectionTitle}>📊 Match Summary</Text>
                  <View style={styles.matchSummaryRow}>
                    <Text style={styles.matchSummaryLabel}>Current Score:</Text>
                    <Text style={styles.matchSummaryValue}>{runs}/{wickets}</Text>
                  </View>
                  <View style={styles.matchSummaryRow}>
                    <Text style={styles.matchSummaryLabel}>Overs:</Text>
                    <Text style={styles.matchSummaryValue}>{oversDisplay}</Text>
                  </View>
                  <View style={styles.matchSummaryRow}>
                    <Text style={styles.matchSummaryLabel}>Run Rate:</Text>
                    <Text style={styles.matchSummaryValue}>
                      {totalLegalBalls > 0 ? ((runs / totalLegalBalls) * 6).toFixed(2) : '0.00'}
                    </Text>
                  </View>
                  {innings === 2 && (
                    <>
                      <View style={styles.matchSummaryRow}>
                        <Text style={styles.matchSummaryLabel}>Target:</Text>
                        <Text style={styles.matchSummaryValue}>{target}</Text>
                      </View>
                      <View style={styles.matchSummaryRow}>
                        <Text style={styles.matchSummaryLabel}>Required Rate:</Text>
                        <Text style={styles.matchSummaryValue}>
                          {(parseInt(overs) * 6 - totalLegalBalls) > 0 ? 
                            (((target - runs) / ((parseInt(overs) * 6 - totalLegalBalls))) * 6).toFixed(2) : '0.00'}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <Button
                  title="Close"
                  onPress={() => setShowScoreboardModal(false)}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Umpire Notes Modal */}
        <Modal visible={showUmpireNotesModal} animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>📝 Umpire Notes</Text>
                
                {/* Add New Note Section */}
                <View style={styles.noteInputSection}>
                  <Text style={styles.noteInputLabel}>Add New Note:</Text>
                  <TextInput
                    style={styles.noteTextInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter umpire notes here..."
                    value={currentNote}
                    onChangeText={setCurrentNote}
                    textAlignVertical="top"
                  />
                  <TouchableOpacity style={styles.addNoteButton} onPress={addUmpireNote}>
                    <MaterialIcons name="add-circle" size={20} color="#fff" />
                    <Text style={styles.addNoteButtonText}>Add Note</Text>
                  </TouchableOpacity>
                </View>

                {/* Existing Notes List */}
                <View style={styles.notesListSection}>
                  <Text style={styles.notesListTitle}>Match Notes ({umpireNotes.length})</Text>
                  {umpireNotes.length === 0 ? (
                    <Text style={styles.noNotesText}>No notes added yet</Text>
                  ) : (
                    umpireNotes.map((note) => (
                      <View key={note.id} style={styles.noteCard}>
                        <View style={styles.noteHeader}>
                          <Text style={styles.noteTimestamp}>{note.timestamp}</Text>
                          <TouchableOpacity 
                            onPress={() => deleteUmpireNote(note.id)}
                            style={styles.deleteNoteButton}
                          >
                            <MaterialIcons name="delete" size={18} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.noteContext}>
                          Innings {note.innings} • Over {note.over} • Score: {note.score}
                        </Text>
                        <Text style={styles.noteText}>{note.text}</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <Button
                  title="Close"
                  onPress={() => setShowUmpireNotesModal(false)}
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Main Menu Modal */}
        <Modal visible={showMainMenu} animationType="slide" transparent={true}>
          <View style={styles.menuOverlay}>
            <View style={styles.menuContainer}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>📊 Match Menu</Text>
                  <TouchableOpacity 
                    style={styles.closeMenuButton} 
                    onPress={() => setShowMainMenu(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Statistics Section */}
                <View style={styles.menuSection}>
                  <Text style={styles.menuSectionTitle}>📈 Statistics</Text>
                  
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setShowMainMenu(false);
                      openScoreboardModal();
                    }}
                  >
                    <MaterialIcons name="assessment" size={24} color="#3498db" />
                    <Text style={styles.menuItemText}>Detailed Scoreboard</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#bdc3c7" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setShowMainMenu(false);
                      openAlertsModal();
                    }}
                  >
                    <MaterialIcons name="comment" size={24} color="#2ecc71" />
                    <Text style={styles.menuItemText}>Ball-by-Ball Commentary</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#bdc3c7" />
                  </TouchableOpacity>
                </View>

                {/* Match Management Section */}
                <View style={styles.menuSection}>
                  <Text style={styles.menuSectionTitle}>🏏 Match Management</Text>
                  
                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setShowMainMenu(false);
                      openUmpireNotesModal();
                    }}
                  >
                    <MaterialIcons name="edit-note" size={24} color="#f39c12" />
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemText}>Umpire Notes</Text>
                      {umpireNotes.length > 0 && (
                        <Text style={styles.menuItemBadge}>{umpireNotes.length}</Text>
                      )}
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#bdc3c7" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => {
                      setShowMainMenu(false);
                      navigation.navigate('MatchHistory', {
                        hasActiveMatch: true,
                        activeMatchData: {
                          battingTeam: battingTeamName,
                          bowlingTeam: bowlingTeamName,
                          innings,
                          runs,
                          wickets,
                          overs: `${Math.floor(balls.length / 6)}.${balls.length % 6}`,
                          maxOvers: overs,
                          umpireNotes
                        }
                      });
                    }}
                  >
                    <MaterialIcons name="history" size={24} color="#9b59b6" />
                    <Text style={styles.menuItemText}>Match History</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#bdc3c7" />
                  </TouchableOpacity>
                </View>

                {/* Dangerous Actions Section */}
                <View style={styles.menuSection}>
                  <Text style={styles.menuSectionTitle}>⚠️ Match Actions</Text>
                  
                  <TouchableOpacity 
                    style={[styles.menuItem, styles.warningItem]} 
                    onPress={() => {
                      setShowMainMenu(false);
                      resetHistory();
                    }}
                  >
                    <MaterialIcons name="delete-sweep" size={24} color="#e74c3c" />
                    <Text style={[styles.menuItemText, { color: '#e74c3c' }]}>Reset History</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#e74c3c" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.menuItem, styles.dangerItem]} 
                    onPress={() => {
                      setShowMainMenu(false);
                      Alert.alert(
                        'End Match & Reset',
                        'This will reset everything and go to setup. Continue?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Reset',
                            style: 'destructive',
                            onPress: () => {
                              setShowSetupModal(true);
                              // Reset all states to initial values
                              setRuns(0);
                              setWickets(0);
                              setBalls([]);
                              setInnings(1);
                              setStriker('');
                              setNonStriker('');
                              setBowler('');
                              setBatsmenStats({});
                              setBowlerStats({});
                              setOversHistory([]);
                              setFirstInningsScore(null);
                              setUmpireNotes([]);
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <MaterialIcons name="restart-alt" size={24} color="#dc3545" />
                    <Text style={[styles.menuItemText, { color: '#dc3545' }]}>End Match & Reset</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#dc3545" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.menuItem, styles.exitItem]} 
                    onPress={() => {
                      setShowMainMenu(false);
                      handleBackPress();
                    }}
                  >
                    <MaterialIcons name="exit-to-app" size={24} color="#8e44ad" />
                    <Text style={[styles.menuItemText, { color: '#8e44ad' }]}>Exit Match</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#8e44ad" />
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Team Selection Dropdown Modal */}
        <Modal 
          visible={showTeamDropdown} 
          animationType="slide" 
          transparent={true}
          onRequestClose={() => setShowTeamDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.dropdownModal}>
              <Text style={styles.dropdownTitle}>
                Select {dropdownType === 'batting' ? 'Batting' : 'Bowling'} Team
              </Text>
              
              <ScrollView style={styles.teamList}>
                {getAvailableTeams(dropdownType === 'bowling').map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamOption,
                      { borderLeftColor: team.color, borderLeftWidth: 4 }
                    ]}
                    onPress={() => handleTeamSelection(team.id)}
                  >
                    <Text style={styles.teamName}>{team.name}</Text>
                    {team.id !== 'test' && (
                      <Text style={styles.teamCaptain}>Captain: {team.captain}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <Button 
                title="Cancel" 
                onPress={() => setShowTeamDropdown(false)}
                color="#95a5a6"
              />
            </View>
          </View>
        </Modal>

        {renderEditScoreModal()}
      </>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 16,
    marginTop: 10,
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  matchInfo: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    marginHorizontal: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#1e3c72',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 15,
    color: '#555',
    marginBottom: 10,
    fontStyle: 'italic',
    textAlign: 'center',
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
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  scoreButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  boundaryButton: {
    backgroundColor: '#27ae60',
    borderColor: 'rgba(39, 174, 96, 0.3)',
  },
  specialButton: {
    backgroundColor: '#f39c12',
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  wicketButton: {
    backgroundColor: '#e74c3c',
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9b59b6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginVertical: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.3)',
  },
  switchButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 15,
    color: '#1e3c72',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  target: {
    fontSize: 18,
    color: '#e74c3c',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 10,
    borderRadius: 8,
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
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 25,
    color: '#1e3c72',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  teamInput: {
    borderWidth: 2,
    borderColor: '#3498db',
    padding: 16,
    marginBottom: 20,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  playerInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  playerInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#3498db',
    padding: 14,
    marginRight: 15,
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  playersList: {
    flex: 1,
    marginBottom: 25,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
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
    maxHeight: '85%',
  },
  scrollableModalContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  scrollContent: {
    paddingBottom: 20,
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
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    minHeight: 80,
    marginBottom: 15,
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
  extraTypeContainer: {
    marginBottom: 20,
  },
  extraTypeButton: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  selectedExtraType: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  extraTypeText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedExtraTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  runsInputContainer: {
    marginBottom: 15,
  },
  runsLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  extraInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  wicketSection: {
    marginBottom: 20,
  },
  wicketLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  batsmanSelection: {
    gap: 8,
  },
  batsmanButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  selectedBatsman: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  batsmanButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedBatsmanText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  wicketTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wicketTypeButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  selectedWicketType: {
    backgroundColor: '#e74c3c',
    borderColor: '#e74c3c',
  },
  wicketTypeText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  selectedWicketTypeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  wicketInfoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  retireSection: {
    marginBottom: 20,
  },
  retireLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  playerSelectionContainer: {
    gap: 8,
  },
  playerSelectionButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  selectedRetirePlayer: {
    backgroundColor: '#9932cc',
    borderColor: '#9932cc',
  },
  playerSelectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  selectedPlayerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  reasonContainer: {
    gap: 10,
  },
  reasonButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  selectedReason: {
    backgroundColor: '#9932cc',
    borderColor: '#9932cc',
  },
  reasonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedReasonText: {
    color: '#fff',
  },
  reasonDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  selectedReasonDescription: {
    color: '#e8d5f0',
  },
  retireInfoText: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
    lineHeight: 16,
    backgroundColor: '#ecf0f1',
    padding: 10,
    borderRadius: 6,
  },
  scoreboardSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  scoreboardSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3c72',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3c72',
    paddingBottom: 8,
    marginBottom: 10,
  },
  statsHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3c72',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  statsText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  matchSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  matchSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  matchSummaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3c72',
  },
  // Umpire Notes Modal Styles
  noteInputSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  noteInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
  },
  noteTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    minHeight: 80,
    marginBottom: 15,
  },
  addNoteButton: {
    flexDirection: 'row',
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNoteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  notesListSection: {
    flex: 1,
  },
  notesListTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 15,
  },
  noNotesText: {
    textAlign: 'center',
    color: '#6c757d',
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 20,
  },
  noteCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTimestamp: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  deleteNoteButton: {
    padding: 4,
  },
  noteContext: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  noteText: {
    fontSize: 15,
    color: '#2c3e50',
    lineHeight: 22,
  },
  // Menu Styles
  menuButton: {
    position: 'absolute',
    left: 15,
    top: 15,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#2c3e50',
    width: '85%',
    height: '100%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    padding: 0,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    backgroundColor: '#34495e',
    borderTopRightRadius: 20,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeMenuButton: {
    padding: 5,
  },
  menuSection: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#34495e',
  },
  menuSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ecf0f1',
    marginBottom: 15,
    paddingLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    marginVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
    fontWeight: '500',
  },
  menuItemBadge: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  warningItem: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#e74c3c',
  },
  dangerItem: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  exitItem: {
    backgroundColor: 'rgba(142, 68, 173, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#8e44ad',
  },
  // Team dropdown styles
  dropdownButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: 'center',
  },
  dropdownButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    maxHeight: '80%',
    minWidth: '80%',
  },
  dropdownTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  teamList: {
    maxHeight: 400,
  },
  teamOption: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  teamCaptain: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
});

export default CricketScreen;