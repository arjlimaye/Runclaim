import { GoogleSignin } from '@react-native-google-signin/google-signin';
import appleAuth from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './config';

GoogleSignin.configure({
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

export async function signInWithGoogle(): Promise<void> {
  await GoogleSignin.hasPlayServices();
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (!idToken) throw new Error('No ID token returned from Google sign-in.');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: undefined,
  });
  if (error) throw error;
}

export async function signInWithApple(): Promise<void> {
  if (Platform.OS !== 'ios') throw new Error('Apple sign-in is only available on iOS.');
  const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const credential = await appleAuth.performRequest({
    requestedOperation: appleAuth.Operation.LOGIN,
    requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    nonce,
  });
  const idToken = credential.identityToken;
  if (!idToken) throw new Error('No identity token returned from Apple sign-in.');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: idToken,
    nonce,
  });
  if (error) throw error;
}
