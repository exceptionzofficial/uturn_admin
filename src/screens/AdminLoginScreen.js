import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import adminApi from '../api/adminApi';

const AdminLoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const res = await adminApi.login(username, password);
      if (res.success) {
        navigation.replace('Dashboard');
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid credentials');
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        Alert.alert('Login Failed', 'Invalid credentials');
      } else {
        Alert.alert('Error', 'Could not connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1, justifyContent: 'center' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.formContainer}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Icon name="shield" size={40} color="#FFF" />
            </View>
            <Text style={styles.title}>Admin Portal</Text>
            <Text style={styles.subtitle}>Sign in to manage the platform</Text>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputGroup}>
              <Icon name="user" size={20} color="#777" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.inputGroup}>
              <Icon name="lock" size={20} color="#777" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.loginBtn, loading && { opacity: 0.8 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
               <ActivityIndicator color="#FFF" />
            ) : (
               <Text style={styles.loginTxt}>Verify Access</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2FF' },
  formContainer: { padding: 30, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A237E', justifyContent: 'center', alignItems: 'center', marginBottom: 20, elevation: 5 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A237E' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 5, fontWeight: '600' },
  inputCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 20, elevation: 3, marginBottom: 30 },
  inputGroup: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 60 },
  icon: { marginRight: 15 },
  input: { flex: 1, height: '100%', fontSize: 16, color: '#333' },
  divider: { height: 1, backgroundColor: '#EEE', marginHorizontal: 20 },
  loginBtn: { width: '100%', height: 55, backgroundColor: '#1E88E5', borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  loginTxt: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});

export default AdminLoginScreen;
