// src/screens/ChatScreen.js

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import Voice from '@react-native-voice/voice';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  PermissionsAndroid
} from 'react-native';
import { supabase } from '../supabaseClient'; // Importamos el cliente de Supabase

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userConfig, setUserConfig] = useState({});
  const [voiceError, setVoiceError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const configStr = await AsyncStorage.getItem('userConfig');
      if (configStr) {
        setUserConfig(JSON.parse(configStr));
      }
      initializeChat();
    };
    loadData();
    // La configuración de Voice API se mantiene como la tenías, no necesita cambios.
    // ...
    return () => {
      Voice.destroy().then(() => Voice.removeAllListeners());
    };
  }, []);

  const initializeChat = () => {
    setMessages([{
      id: 1,
      text: "¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy?",
      isBot: true,
      timestamp: new Date()
    }]);
  };

  const callGeminiFunction = async (message, imageBase64 = null) => {
    try {
      const { data, error } = await supabase.functions.invoke('get-gemini-response', {
        body: { message, imageBase64 },
      });
      if (error) throw error;
      if (!data || !data.reply) throw new Error("Respuesta inválida de la función.");
      return data.reply;
    } catch (error) {
      console.error('Error calling Gemini Edge Function:', error.message);
      return "Lo siento, no pude procesar tu solicitud. Por favor, intenta de nuevo más tarde.";
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = { id: Date.now(), text: inputText, isBot: false, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    const botResponseText = await callGeminiFunction(currentInput);
    const botResponse = { id: Date.now() + 1, text: botResponseText, isBot: true, timestamp: new Date() };
    setMessages(prev => [...prev, botResponse]);

    if (userConfig.preferences?.voiceAlerts) {
      Speech.speak(botResponseText, { language: 'es' });
    }
    setIsLoading(false);
  };

  const handleImagePicker = async (pickerFunction) => {
    try {
      const { status } = await (pickerFunction === ImagePicker.launchCameraAsync 
        ? ImagePicker.requestCameraPermissionsAsync() 
        : ImagePicker.requestMediaLibraryPermissionsAsync());
  
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso para acceder a tus imágenes.');
        return;
      }
  
      const result = await pickerFunction({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
    
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const imageMessage = { id: Date.now(), text: `Analizando imagen...`, image: asset.uri, isBot: false, timestamp: new Date() };
        setMessages(prev => [...prev, imageMessage]);
        setIsLoading(true);
    
        const botResponseText = await callGeminiFunction("Analiza esta imagen y describe cualquier elemento relevante para accesibilidad en transporte público.", asset.base64);
        const botResponse = { id: Date.now() + 1, text: botResponseText, isBot: true, timestamp: new Date() };
        setMessages(prev => [...prev, botResponse]);
    
        if (userConfig.preferences?.voiceAlerts) {
          Speech.speak(botResponseText, { language: 'es' });
        }
        setIsLoading(false);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la imagen.');
      console.error('Image Picker Error:', error);
      setIsLoading(false);
    }
  };
  
  // Tu lógica de Voice API y estilos puede permanecer aquí.
  // ... (onSpeechStart, onSpeechEnd, etc.)

  // --- CÓDIGO JSX ---
  // He dejado tu JSX tal cual, solo he cambiado las llamadas onPress
  // de los botones de imagen.
  return (
    <KeyboardAvoidingView 
      style={[styles.container, userConfig.type === 'visual' && styles.darkTheme]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
    >
      <View style={[styles.header, userConfig.type === 'visual' && styles.darkHeader]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons 
            name="arrow-back" 
            size={userConfig.type === 'elderly' ? 28 : 24} 
            color={userConfig.type === 'visual' ? '#fff' : '#333'} 
          />
        </TouchableOpacity>
        <Text style={[
          styles.title, 
          userConfig.type === 'visual' && styles.whiteText,
          userConfig.type === 'elderly' && styles.largeTitle
        ]}>
          Asistente IA 🤖
        </Text>
        <View style={styles.geminiIndicator}>
          <Text style={styles.geminiText}>Gemini AI</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble,
              message.isBot ? styles.botMessage : styles.userMessage,
              userConfig.type === 'elderly' && styles.largeBubble,
              userConfig.type === 'visual' && message.isBot && styles.darkBotMessage,
            ]}
          >
            <Text style={[
              userConfig.type === 'elderly' ? styles.largeText : styles.normalText,
              userConfig.type === 'visual' && styles.whiteText,
              message.isBot && styles.botText,
            ]}>
              {message.text}
            </Text>
            {message.image && (
              <Image source={{ uri: message.image }} style={styles.messageImage} />
            )}
            <Text style={[
              styles.timestamp,
              userConfig.type === 'visual' && styles.whiteTimestamp,
              userConfig.type === 'elderly' && styles.largeTimestamp
            ]}>
              {message.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.botMessage, styles.loadingBubble]}>
            <ActivityIndicator size="small" color="#4caf50" />
            <Text style={[styles.normalText, { marginLeft: 10 }]}>
              Pensando...
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[
        styles.inputContainer,
        userConfig.type === 'visual' && styles.darkInputContainer
      ]}>
        <TextInput
          style={[
            styles.textInput,
            userConfig.type === 'elderly' && styles.largeInput,
            userConfig.type === 'visual' && styles.darkInput
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={userConfig.type === 'visual' ? '#ccc' : '#999'}
          multiline
          editable={!isLoading}
        />
        
        <TouchableOpacity 
          style={[styles.galleryButton, userConfig.type === 'elderly' && styles.largeButton]}
          onPress={() => handleImagePicker(ImagePicker.launchImageLibraryAsync)}
          disabled={isLoading}
        >
          <Ionicons name="image" size={userConfig.type === 'elderly' ? 28 : 24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.cameraButton, userConfig.type === 'elderly' && styles.largeButton]}
          onPress={() => handleImagePicker(ImagePicker.launchCameraAsync)}
          disabled={isLoading}
        >
          <Ionicons name="camera" size={userConfig.type === 'elderly' ? 28 : 24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sendButton, userConfig.type === 'elderly' && styles.largeButton, (!inputText.trim() || isLoading) && styles.disabledButton]} 
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons name="send" size={userConfig.type === 'elderly' ? 28 : 24} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// --- ESTILOS COMPLETOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  darkTheme: { backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  darkHeader: { borderBottomColor: '#444' },
  title: { fontSize: 20, fontWeight: 'bold', marginLeft: 15, color: '#333', flex: 1 },
  largeTitle: { fontSize: 24 },
  whiteText: { color: '#fff' },
  geminiIndicator: { backgroundColor: '#4285f4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  geminiText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  messagesContainer: { flex: 1, padding: 20 },
  messagesContent: { paddingBottom: 20 },
  messageBubble: { padding: 15, borderRadius: 15, marginBottom: 10, maxWidth: '80%' },
  largeBubble: { padding: 20, borderRadius: 20, marginBottom: 15 },
  userMessage: { backgroundColor: '#2196f3', alignSelf: 'flex-end' },
  botMessage: { backgroundColor: '#e8f5e8', alignSelf: 'flex-start' },
  loadingBubble: { flexDirection: 'row', alignItems: 'center' },
  darkBotMessage: { backgroundColor: '#2d2d2d' },
  normalText: { fontSize: 16, color: '#333' },
  largeText: { fontSize: 20, color: '#333', lineHeight: 26 },
  botText: { color: '#2e7d32' },
  messageImage: { width: '100%', height: 200, borderRadius: 10, marginTop: 10 },
  timestamp: { fontSize: 12, color: '#666', marginTop: 5, alignSelf: 'flex-end' },
  largeTimestamp: { fontSize: 14 },
  whiteTimestamp: { color: '#bbb' },
  inputContainer: { flexDirection: 'row', padding: 15, backgroundColor: 'white', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  darkInputContainer: { backgroundColor: '#1e1e1e', borderTopColor: '#444' },
  textInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, fontSize: 16, backgroundColor: '#fff' },
  largeInput: { fontSize: 20, paddingVertical: 15, paddingHorizontal: 20, borderRadius: 25 },
  darkInput: { backgroundColor: '#333', borderColor: '#555', color: '#fff' },
  galleryButton: { backgroundColor: '#8e24aa', borderRadius: 25, padding: 12, marginRight: 5, justifyContent: 'center', alignItems: 'center' },
  cameraButton: { backgroundColor: '#9c27b0', borderRadius: 25, padding: 12, marginRight: 5, justifyContent: 'center', alignItems: 'center' },
  sendButton: { backgroundColor: '#2196f3', borderRadius: 25, padding: 12, justifyContent: 'center', alignItems: 'center' },
  disabledButton: { opacity: 0.5 },
  largeButton: { padding: 16, borderRadius: 30 },
});

export default ChatScreen;