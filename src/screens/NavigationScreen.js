// src/screens/NavigationScreen.js

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { 
  Alert, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../supabaseClient';

const NavigationScreen = ({ navigation }) => {
  const [userType, setUserType] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState([]);
  const [totalDuration, setTotalDuration] = useState('');
  const [destinationName, setDestinationName] = useState('Estación Central');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const configStr = await AsyncStorage.getItem('userConfig');
      const type = configStr ? JSON.parse(configStr).type : null;
      setUserType(type);
      await fetchRoute(); // Llamar a la función principal
    };
    initialize();
  }, []);

  const fetchRoute = async () => {
    setIsLoading(true);
    setNavigationSteps([]); // Limpiar ruta anterior
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Se requiere permiso de ubicación para la navegación.');
      }
      
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const origin = `${location.coords.latitude},${location.coords.longitude}`;
      const destination = "Estación Central, Lima, Perú";

      const { data, error } = await supabase.functions.invoke('get-directions', {
        body: { origin, destination },
      });

      if (error) throw new Error(error.message);
      if (!data || !data.steps || data.steps.length === 0) {
        throw new Error("No se pudo encontrar una ruta de transporte público.");
      }

      setNavigationSteps(data.steps);
      setTotalDuration(data.totalDuration);
    } catch (error) {
      console.error("Failed to fetch route:", error.message);
      Alert.alert('Error de Ruta', error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNextStep = () => {
    if (currentStep < navigationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      Alert.alert('¡Viaje Completado!', 'Has llegado a tu destino.');
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Calculando la mejor ruta...</Text>
      </View>
    );
  }

  if (navigationSteps.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se pudo cargar la ruta.</Text>
        <TouchableOpacity onPress={fetchRoute} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStepData = navigationSteps[currentStep];

  return (
    <ScrollView 
      style={[styles.container, userType === 'visual' && styles.darkTheme]}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={userType === 'visual' ? '#fff' : '#333'} />
        </TouchableOpacity>
        <Text style={[styles.title, userType === 'visual' && styles.whiteText]}>Mi Viaje</Text>
      </View>
      
      <View style={styles.routeInfo}>
        <Text style={styles.routeTitle}>Ruta hacia {destinationName}</Text>
        <Text style={styles.routeTime}>Tiempo estimado: {totalDuration}</Text>
      </View>

      <View style={styles.currentStepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepNumber}>Paso {currentStep + 1} de {navigationSteps.length}</Text>
          <Text style={styles.timeRemaining}>{currentStepData.timeRemaining}</Text>
        </View>
        <Text style={styles.stepInstruction}>{currentStepData.instruction}</Text>
        <Text style={styles.stepDetail}>{currentStepData.detail}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.repeatButton]} onPress={() => Alert.alert('Repetir', currentStepData.instruction)}>
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.buttonText}>Repetir</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.nextButton]} onPress={handleNextStep}>
          <Ionicons name="arrow-forward" size={24} color="white" />
          <Text style={styles.buttonText}>{currentStep < navigationSteps.length - 1 ? 'Siguiente' : 'Finalizar'}</Text>
        </TouchableOpacity>
      </View>

      {/* Aquí podrías cargar reportes de ReportService si lo deseas */}
    </ScrollView>
  );
};

// --- ESTILOS COMPLETOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 15, fontSize: 16, color: '#666', textAlign: 'center' },
  errorText: { fontSize: 18, color: '#d32f2f', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#4caf50', paddingHorizontal: 30, paddingVertical: 10, borderRadius: 25 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  darkTheme: { backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#333' },
  whiteText: { color: '#fff' },
  routeInfo: { backgroundColor: '#e3f2fd', padding: 20, marginHorizontal: 20, marginTop: 20, borderRadius: 10 },
  routeTitle: { fontSize: 18, fontWeight: 'bold', color: '#1976d2' },
  routeTime: { fontSize: 16, color: '#1976d2', marginTop: 5 },
  currentStepContainer: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 15, elevation: 3 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  stepNumber: { fontSize: 14, color: '#666', fontWeight: '600' },
  timeRemaining: { fontSize: 16, color: '#4caf50', fontWeight: 'bold' },
  stepInstruction: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  stepDetail: { fontSize: 16, color: '#666' },
  actionButtons: { flexDirection: 'row', marginHorizontal: 20, gap: 10 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, elevation: 2 },
  repeatButton: { backgroundColor: '#ff9800' },
  nextButton: { backgroundColor: '#4caf50' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default NavigationScreen;