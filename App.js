import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import CricketScreen from './screens/cricketscreen';
import BadmintonScreen from './screens/badmintonscreen';
import ThrowballScreen from './screens/throwballscreen';
import MatchHistoryScreen from './screens/MatchHistoryScreen';
import ScorecardScreen from './screens/ScorecardScreen';
import VictoryScreen from './screens/VictoryScreen';
import BadmintonSetupScreen from './screens/BadmintonSetupScreen';
import BadmintonMatchScreen from './screens/BadmintonMatchScreen';
import BadmintonHistoryScreen from './screens/BadmintonHistoryScreen';

const Stack = createStackNavigator();

// Professional HomeScreen with modern design
function HomeScreen({ navigation }) {
  const sports = [
    {
      id: 'cricket',
      title: 'Cricket',
      subtitle: 'Professional Scoring',
      description: 'Ball-by-ball commentary, over tracking, and detailed match statistics',
      icon: 'sports-cricket',
      color: '#4CAF50',
      gradient: ['#4CAF50', '#66BB6A'],
      screen: 'Cricket'
    },
    {
      id: 'badminton',
      title: 'Badminton',
      subtitle: 'Tournament Management',
      description: 'Singles, doubles, mixed doubles with complete match management',
      icon: 'sports-tennis',
      color: '#2196F3',
      gradient: ['#2196F3', '#42A5F5'],
      screen: 'Badminton'
    },
    {
      id: 'throwball',
      title: 'Throwball',
      subtitle: 'Set-Based Scoring',
      description: 'Professional throwball scoring with detailed set tracking',
      icon: 'sports-volleyball',
      color: '#FF9800',
      gradient: ['#FF9800', '#FFB74D'],
      screen: 'Throwball'
    }
  ];

  return (
    <SafeAreaView style={homeStyles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={homeStyles.gradient}
      >
        <ScrollView 
          style={homeStyles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={homeStyles.scrollContent}
        >
          {/* Header Section */}
          <View style={homeStyles.header}>
            <View style={homeStyles.logoContainer}>
              <MaterialIcons name="emoji-events" size={60} color="#FFD700" />
            </View>
            <Text style={homeStyles.title}>SCORIFY</Text>
            <Text style={homeStyles.subtitle}>Professional Tournament Scoring</Text>
            <View style={homeStyles.versionBadge}>
              <Text style={homeStyles.versionText}>v2.0</Text>
            </View>
          </View>

          {/* Sports Cards */}
          <View style={homeStyles.cardsContainer}>
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.id}
                style={homeStyles.cardWrapper}
                onPress={() => navigation.navigate(sport.screen)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={sport.gradient}
                  style={homeStyles.card}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={homeStyles.cardHeader}>
                    <View style={homeStyles.iconContainer}>
                      <MaterialIcons name={sport.icon} size={32} color="#FFFFFF" />
                    </View>
                    <View style={homeStyles.cardTitleContainer}>
                      <Text style={homeStyles.cardTitle}>{sport.title}</Text>
                      <Text style={homeStyles.cardSubtitle}>{sport.subtitle}</Text>
                    </View>
                    <MaterialIcons name="arrow-forward-ios" size={20} color="rgba(255,255,255,0.8)" />
                  </View>
                  <Text style={homeStyles.cardDescription}>{sport.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={homeStyles.footer}>
            <Text style={homeStyles.copyrightText}>© 2025 Scorify. All rights reserved.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 15,
  },
  versionBadge: {
    backgroundColor: 'rgba(100, 181, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#64B5F6',
  },
  versionText: {
    color: '#64B5F6',
    fontSize: 12,
    fontWeight: '600',
  },
  cardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  cardWrapper: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    fontWeight: '400',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  copyrightText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Cricket" component={CricketScreen} />
        <Stack.Screen name="Badminton" component={BadmintonScreen} />
        <Stack.Screen name="Throwball" component={ThrowballScreen} />
        <Stack.Screen name="MatchHistory" component={MatchHistoryScreen} />
        <Stack.Screen name="Scorecard" component={ScorecardScreen} />
        <Stack.Screen name="Victory" component={VictoryScreen} />
        <Stack.Screen name="BadmintonSetup" component={BadmintonSetupScreen} />
        <Stack.Screen name="BadmintonMatch" component={BadmintonMatchScreen} />
        <Stack.Screen name="BadmintonHistory" component={BadmintonHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
