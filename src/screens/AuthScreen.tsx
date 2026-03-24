import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'At least 8 characters required.';
  if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Must contain at least one number.';
  if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter.';
  return null;
}

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = (val: string) => {
  setPassword(val);
  setPasswordError('');
};

  const handleSignUp = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Fill in all fields to continue.');
      return;
    }
    if (username.length < 3) {
      Alert.alert('Username too short', 'Must be at least 3 characters.');
      return;
    }
function validatePassword(password: string): string | null {
  if (password.length < 8) return 'At least 8 characters required.';
  if (!/[0-9]/.test(password)) return 'Must contain at least one number.';
  return null;
}
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (existing) {
        Alert.alert('Username taken', 'Try a different one.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, username: username.trim().toLowerCase() });
        if (profileError) throw profileError;
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <View style={styles.top}>
            <Text style={styles.wordmark}>RunClaim</Text>
            <Text style={styles.tagline}>Earn your city.</Text>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
              onPress={() => { setMode('signup'); setPasswordError(''); }}>
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'signin' && styles.tabActive]}
              onPress={() => { setMode('signin'); setPasswordError(''); }}>
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <View style={styles.inputWrap}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="yourname"
                  placeholderTextColor="rgba(255,255,255,0.15)"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@email.com"
                placeholderTextColor="rgba(255,255,255,0.15)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="min 8 chars, 1 uppercase, 1 number"
                placeholderTextColor="rgba(255,255,255,0.15)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {passwordError.length > 0 && (
                <Text style={styles.passwordError}>{passwordError}</Text>
              )}
              {mode === 'signup' && password.length === 0 && (
                <Text style={styles.passwordHint}>
                  8+ chars · 1 uppercase · 1 number · 1 lowercase
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={mode === 'signup' ? handleSignUp : handleSignIn}
            disabled={loading}
            activeOpacity={0.82}>
            {loading ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {mode === 'signup' ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {mode === 'signin' && (
            <TouchableOpacity
              style={styles.forgotWrap}
              onPress={async () => {
                if (!email.trim()) {
                  Alert.alert('Enter your email first');
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
                if (error) Alert.alert('Error', error.message);
                else Alert.alert('Check your email', 'Password reset link sent.');
              }}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 56,
    paddingBottom: 22,
  },
  top: {
    marginBottom: 58,
  },
  wordmark: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    letterSpacing: 5,
    color: '#ffffff',
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  tagline: {
    fontFamily: 'Teko-Bold',
    fontSize: 44,
    color: '#3ecfb2',
    lineHeight: 52,
    paddingTop: 6,
    paddingLeft: 2,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 46,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    paddingBottom: 12,
    marginRight: 28,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#3ecfb2',
  },
  tabText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#3ecfb2',
  },
  form: {
    gap: 32,
    marginBottom: 40,
  },
  inputWrap: {
    gap: 8,
  },
  label: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 9,
    letterSpacing: 3,
    color: '#ffffff',
    textTransform: 'uppercase',
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
  passwordHint: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 8,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1,
    marginTop: 5,
  },
  passwordError: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 9,
    color: 'rgba(255,80,80,0.9)',
    letterSpacing: 1,
    marginTop: 5,
  },
  btnPrimary: {
    backgroundColor: '#3ecfb2',
    borderRadius: 3,
    paddingVertical: 26,
    alignItems: 'center',
    shadowColor: '#3ecfb2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    marginBottom: 22,
  },
  btnPrimaryText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 13,
    letterSpacing: 5,
    color: '#050505',
    textTransform: 'uppercase',
  },
  forgotWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  forgotText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 11,
    color: '#ffffff',
    letterSpacing: 2,
  },
});