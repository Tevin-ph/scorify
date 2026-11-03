import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BadmintonScreen({ navigation }) {
  const [totalMatches, setTotalMatches] = useState(0);

  useEffect(() => {
    loadRecentMatches();
    const unsubscribe = navigation.addListener('focus', () => {
      loadRecentMatches();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRecentMatches = async () => {
    try {
      const stored = await AsyncStorage.getItem('badmintonHistory');
      if (stored) {
        const history = JSON.parse(stored);
        setTotalMatches(history.length);
      }
    } catch (error) {
      console.error('Failed to load recent matches:', error);
    }
  };

  const startNewGame = () => {
    navigation.navigate('BadmintonSetup');
  };

  const viewHistory = () => {
    navigation.navigate('BadmintonHistory');
  };

  return (
    <LinearGradient
      colors={['#8b5cf6', '#a855f7', '#7c3aed']}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🏸 Badminton</Text>
            <Text style={styles.headerSubtitle}>Professional Scoring System</Text>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.newGameButton} onPress={startNewGame}>
              <MaterialIcons name="add-circle" size={32} color="#fff" />
              <Text style={styles.newGameText}>Start New Game</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.historyButton} onPress={viewHistory}>
              <MaterialIcons name="history" size={24} color="#fff" />
              <Text style={styles.historyText}>Match History ({totalMatches})</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.historyButton, {backgroundColor: 'rgba(231, 76, 60, 0.9)', marginTop: 15}]} 
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.historyText}>← Back to Home</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rulesSection}>
            <Text style={styles.rulesTitle}>Quick Rules</Text>
            <Text style={styles.ruleText}>• Games to 21 points (win by 2)</Text>
            <Text style={styles.ruleText}>• Best of 1, 3, or 5 sets</Text>
            <Text style={styles.ruleText}>• Singles, Doubles, Mixed supported</Text>
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 35,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  actionsContainer: {
    padding: 20,
  },
  newGameButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 25,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  newGameText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 12,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  historyButton: {
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  historyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  rulesSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 20,
    padding: 25,
    borderRadius: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  rulesTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
    color: '#8b5cf6',
    textAlign: 'center',
  },
  ruleText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
});
