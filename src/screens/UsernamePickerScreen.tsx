import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const USERNAME_MAX_LEN = 20;
const USERNAME_MIN_LEN = 3;

interface Props {
  userId: string;
  onDone: () => void;
}

export default function UsernamePickerScreen({ userId, onDone }: Props) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < USERNAME_MIN_LEN) {
      Alert.alert('Username too short', `At least ${USERNAME_MIN_LEN} characters required.`);
      return;
    }
    if (trimmed.length > USERNAME_MAX_LEN) {
      Alert.alert('Username too long', `Max ${USERNAME_MAX_LEN} characters.`);
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      Alert.alert('Invalid username', 'Only letters, numbers, and underscores allowed.');
      return;
    }

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', trimmed)
        .single();

      if (existing) {
        Alert.alert('Username taken', 'Try a different one.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, username: trimmed });

      if (error) throw error;
      onDone();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}>

        <Text style={styles.wordmark}>RunClaim</Text>
        <Text style={styles.heading}>Pick a username</Text>
        <Text style={styles.sub}>Max {USERNAME_MAX_LEN} characters · letters, numbers, underscores</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="yourname"
            placeholderTextColor="rgba(255,255,255,0.15)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX_LEN}
            autoFocus
          />
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.82}>
          {loading ? (
            <ActivityIndicator color="#050505" />
          ) : (
            <Text style={styles.btnText}>Continue</Text>
          )}
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    justifyContent: 'flex-start',
  },
  wordmark: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    letterSpacing: 5,
    color: '#ffffff',
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  heading: {
    fontFamily: 'Teko-Bold',
    fontSize: 38,
    color: '#3ecfb2',
    marginBottom: 10,
  },
  sub: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1,
    marginBottom: 40,
  },
  inputWrap: {
    marginBottom: 40,
  },
  input: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 15,
    color: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 10,
    letterSpacing: 1,
  },
  btn: {
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  btnText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 13,
    letterSpacing: 5,
    color: '#050505',
    textTransform: 'uppercase',
  },
});
