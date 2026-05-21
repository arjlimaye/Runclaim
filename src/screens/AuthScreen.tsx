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
import { signInWithGoogle, signInWithApple } from '../lib/socialAuth';

type Mode = 'signin' | 'signup';

// Input length limits
const USERNAME_MAX_LEN = 20;
const EMAIL_MAX_LEN = 254;
const PASSWORD_MAX_LEN = 128;

// Rate limiting: max 5 attempts per 15 minutes, keyed by action
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const rateLimitStore: Record<string, { count: number; windowStart: number }> = {};

function checkRateLimit(action: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore[action];
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore[action] = { count: 1, windowStart: now };
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

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
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Google Sign-In Failed', e.message);
    }
    setSocialLoading(null);
  };

  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      await signInWithApple();
    } catch (e: any) {
      Alert.alert('Apple Sign-In Failed', e.message);
    }
    setSocialLoading(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setPasswordError('');
  };

  const handleSignUp = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUsername || !trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Fill in all fields to continue.');
      return;
    }
    if (trimmedUsername.length > USERNAME_MAX_LEN) {
      Alert.alert('Username too long', `Max ${USERNAME_MAX_LEN} characters.`);
      return;
    }
    if (trimmedEmail.length > EMAIL_MAX_LEN) {
      Alert.alert('Email too long', `Max ${EMAIL_MAX_LEN} characters.`);
      return;
    }
    if (password.length > PASSWORD_MAX_LEN) {
      Alert.alert('Password too long', `Max ${PASSWORD_MAX_LEN} characters.`);
      return;
    }
    if (trimmedUsername.length < 3) {
      Alert.alert('Username too short', 'Must be at least 3 characters.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }
    if (!checkRateLimit('signup')) {
      Alert.alert('Too many attempts', 'Too many sign-up attempts. Try again in 15 minutes.');
      return;
    }
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', trimmedUsername.toLowerCase())
        .single();

      if (existing) {
        Alert.alert('Username taken', 'Try a different one.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: data.user.id, username: trimmedUsername.toLowerCase() });
        if (profileError) throw profileError;
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    if (trimmedEmail.length > EMAIL_MAX_LEN) {
      Alert.alert('Email too long', `Max ${EMAIL_MAX_LEN} characters.`);
      return;
    }
    if (password.length > PASSWORD_MAX_LEN) {
      Alert.alert('Password too long', `Max ${PASSWORD_MAX_LEN} characters.`);
      return;
    }
    if (!checkRateLimit('signin')) {
      Alert.alert('Too many attempts', 'Too many sign-in attempts. Try again in 15 minutes.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
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
                  maxLength={USERNAME_MAX_LEN}
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
                maxLength={EMAIL_MAX_LEN}
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
                maxLength={PASSWORD_MAX_LEN}
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
                const trimmedEmail = email.trim();
                if (!trimmedEmail) {
                  Alert.alert('Enter your email first');
                  return;
                }
                if (trimmedEmail.length > EMAIL_MAX_LEN) {
                  Alert.alert('Email too long', `Max ${EMAIL_MAX_LEN} characters.`);
                  return;
                }
                if (!checkRateLimit('password_reset')) {
                  Alert.alert('Too many attempts', 'Too many password reset attempts. Try again in 15 minutes.');
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
                if (error) Alert.alert('Error', error.message);
                else Alert.alert('Check your email', 'Password reset link sent.');
              }}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.btnSocial}
            onPress={handleGoogleSignIn}
            disabled={socialLoading !== null}
            activeOpacity={0.82}>
            {socialLoading === 'google' ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.btnSocialText}>Continue with Google</Text>
            )}
          </TouchableOpacity>

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.btnSocial, styles.btnApple]}
              onPress={handleAppleSignIn}
              disabled={socialLoading !== null}
              activeOpacity={0.82}>
              {socialLoading === 'apple' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.btnSocialText, styles.btnAppleText]}>Continue with Apple</Text>
              )}
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    marginHorizontal: 12,
    textTransform: 'uppercase',
  },
  btnSocial: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3ecfb2',
    borderRadius: 3,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  btnSocialText: {
    fontFamily: 'SpaceGrotesk-SemiBold',
    fontSize: 12,
    letterSpacing: 3,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  btnApple: {},
  btnAppleText: {},
});
