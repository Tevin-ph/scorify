import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { AntDesign, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();

  return (
    <LinearGradient colors={['#6d1cc4ff', '#0a2d6bff']} style={styles.gradient}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}> Tournament Score Tracker</Text>

        <Image source={require('../assets/trophy.png')} style={styles.logo} />

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Cricket')}>
            <AntDesign name="Trophy" size={30} color="#fff" />
            <Text style={styles.cardText}>Cricket</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Badminton')}>
            <MaterialCommunityIcons name="badminton" size={30} color="#fff" />
            <Text style={styles.cardText}>Badminton</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Throwball')}>
            <FontAwesome5 name="volleyball-ball" size={30} color="#fff" />
            <Text style={styles.cardText}>Throwball</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subText}>
          View match stats, history, and live score updates seamlessly.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Made by Tevin Philip</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  cardContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  card: {
    width: '80%',
    backgroundColor: '#ffffff30',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
  subText: {
    fontSize: 16,
    color: '#f1f1f1',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    color: '#eee',
    fontSize: 14,
    textAlign: 'center',
  },
});
