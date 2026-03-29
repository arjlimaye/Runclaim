import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function SettingsScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? '');
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();
      if (data) setUsername(data.username);
    };
    loadProfile();
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your territory. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Email runclaim@gmail.com to delete your account.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.wordmark}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Username</Text>
            <Text style={styles.rowVal}>@{username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowVal}>{email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Legal</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://quiet-nurse-6b4.notion.site/RunClaim-Privacy-Policy-32ff134b79de801ca932cd78b2ae1f85')}
          >
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://quiet-nurse-6b4.notion.site/RunClaim-Terms-of-Service-32ff134b79de80ec99d4d595e226844e')}
          >
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.btnSignOut} onPress={handleSignOut}>
          <Text style={styles.btnSignOutText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDelete} onPress={handleDeleteAccount}>
          <Text style={styles.btnDeleteText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
    paddingHorizontal: 24,
    paddingBottom: 44,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginBottom: 36,
  },
  back: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: '#3ecfb2',
    letterSpacing: 1,
  },
  wordmark: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 12,
    letterSpacing: 5,
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  rowLabel: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  rowVal: {
    fontFamily: 'SpaceGrotesk-Medium',
    fontSize: 13,
    color: '#ffffff',
    letterSpacing: 1,
  },
  rowArrow: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
  },
  bottom: {
    marginTop: 'auto' as any,
    gap: 10,
  },
  btnSignOut: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnSignOutText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 12,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
  },
  btnDelete: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDeleteText: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(255,80,80,0.5)',
    textTransform: 'uppercase',
  },
});