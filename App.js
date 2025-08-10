import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/homescreen';
import CricketScreen from './screens/cricketscreen';
import BadmintonScreen from './screens/badmintonscreen';
import ThrowballScreen from './screens/throwballscreen';
import MatchHistory from './screens/MatchHistoryScreen';
import Victory from './screens/VictoryScreen';
import ScorecardScreen from './screens/ScorecardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }} // 🔥 Hides the top bar and title
        />
        <Stack.Screen name="Cricket" component={CricketScreen} />
        <Stack.Screen name="Badminton" component={BadmintonScreen} />
        <Stack.Screen name="Throwball" component={ThrowballScreen} />
        <Stack.Screen name="MatchHistory" component={MatchHistory} />
        <Stack.Screen name="Victory" component={Victory} />
        <Stack.Screen name="Scorecard" component={ScorecardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
