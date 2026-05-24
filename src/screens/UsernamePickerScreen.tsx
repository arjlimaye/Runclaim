import React, { useState, useRef, useEffect } from 'react';
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
const RESERVED = ['admin', 'runclaim', 'support', 'moderator', 'official'];

type Status = 'idle' | 'checking' | 'taken' | 'invalid' | 'available';

interface Props {
  userId: string;
  onDone: () => void;
}

function validate(val: string): string | null {
  if (val.length < USERNAME_MIN_LEN) return `at least ${USERNAME_MIN_LEN} characters required`;
  if (val.length > USERNAME_MAX_LEN) return `max ${USERNAME_MAX_LEN} characters`;
  if (!/^[a-z0-9_]+$/.test(val)) return 'only lowercase letters, numbers, and underscores';
  if (val.startsWith('_') || val.endsWith('_')) return 'cannot start or end with underscore';
  if (val.includes('__')) return 'cannot have two consecutive underscores';
  if (/^\d+$/.test(val)) return 'cannot be all numbers';
  if (RESERVED.includes(val)) return 'username is reserved';
  return null;
}

export default function UsernamePickerScreen({ userId, onDone }: Props) {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [invalidMsg, setInvalidMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChangeText = (val: string) => {
    const lower = val.toLowerCase();
    setUsername(lower);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (lower.length === 0) {
      setStatus('idle');
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const error = validate(lower);
      if (error) {
        setInvalidMsg(error);
        setStatus('invalid');
        return;
      }

      setStatus('checking');
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', lower)
        .single();

      if (data) {
        setStatus('taken');
      } else {
        setStatus('available');
      }
    }, 500);
  };

  const handleSubmit = async () => {
    if (status !== 'available') return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, username });
      if (error) throw error;
      onDone();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const renderStatus = () => {
    if (status === 'checking') {
      return <Text style={[styles.statusText, styles.statusChecking]}>checking...</Text>;
    }
    if (status === 'taken') {
      return <Text style={[styles.statusText, styles.statusTaken]}>username taken</Text>;
    }
    if (status === 'invalid') {
      return <Text style={[styles.statusText, styles.statusTaken]}>{invalidMsg}</Text>;
    }
    if (status === 'available') {
      return <Text style={[styles.statusText, styles.statusAvailable]}>✓ available</Text>;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}>

        <Text style={styles.wordmark}>RunClaim</Text>
        <Text style={styles.heading}>Pick a username</Text>
        <Text style={styles.sub}>3–20 chars · lowercase · letters, numbers, underscores only</Text>

        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="yourname"
            placeholderTextColor="rgba(255,255,255,0.15)"
            value={username}
            onChangeText={handleChangeText}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={USERNAME_MAX_LEN}
            autoFocus
          />
          {renderStatus()}
        </View>

        <TouchableOpacity
          style={[styles.btn, status !== 'available' && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading || status !== 'available'}
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
  statusText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 8,
  },
  statusAvailable: {
    color: '#3ecfb2',
  },
  statusTaken: {
    color: 'rgba(255,80,80,0.9)',
  },
  statusChecking: {
    color: 'rgba(255,255,255,0.35)',
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
  btnDisabled: {
    opacity: 0.35,
  },
  btnText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 13,
    letterSpacing: 5,
    color: '#050505',
    textTransform: 'uppercase',
  },
});
