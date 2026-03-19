import React, { createContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

// Necessário para que o retorno OAuth seja corretamente capturado pelo app
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const FirebaseAuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// TODO: Substitua pelos Client IDs reais do Google Cloud Console
//
// Para gerar os IDs:
//   1. Acesse https://console.cloud.google.com/apis/credentials
//   2. Crie um OAuth 2.0 Client ID para cada plataforma:
//      - Android: tipo "Android", com o SHA-1 do keystore do EAS
//      - iOS: tipo "iOS", com o Bundle ID do app (com.pazetto.futsorteio)
//      - Web: tipo "Web application" (usado no Expo Go para testes)
//   3. Em "Authorized redirect URIs" do cliente Web, adicione:
//      - https://auth.expo.io/@seu-usuario/futebol-sorteador
//      - futsorteio://oauth/callback
// ---------------------------------------------------------------------------
const GOOGLE_CLIENT_IDS = {
  android: '74437798052-7sa3avnpb32g26rtnuieaibge530u1ej.apps.googleusercontent.com',
  ios: '74437798052-m8gfe621osbpmvcbvq51jlpk16hik8f2.apps.googleusercontent.com',
  web: '74437798052-dqgl9chk7k3i9ahrm6f3di5k0ijo4qdm.apps.googleusercontent.com',
};

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitora o estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  async function loginWithGoogle() {
    try {
      setError(null);

      // O redirect URI para Android nativo usa o formato reverso do Client ID
      // Ex: com.googleusercontent.apps.74437798052-xxx:/oauth2redirect
      // Esse formato é aceito pelo Google sem precisar cadastrar no Console
      const webClientId = GOOGLE_CLIENT_IDS.web;
      const reversedClientId = webClientId.replace('.apps.googleusercontent.com', '').split('-').reverse().join('.');

      let redirectUri: string;
      let clientId: string;

      if (Platform.OS === 'web') {
        redirectUri = 'http://localhost:8081/oauth/callback';
        clientId = webClientId;
      } else if (Platform.OS === 'android') {
        // Android nativo: usa o reversed client ID como scheme
        redirectUri = `com.googleusercontent.apps.${webClientId.replace('.apps.googleusercontent.com', '')}:/oauth2redirect`;
        clientId = webClientId;
      } else {
        redirectUri = 'https://auth.expo.io/@pazetto/futebol-sorteador';
        clientId = webClientId;
      }

      // Fluxo implícito (response_type=token) — não depende de expo-crypto nem de
      // módulos nativos, funcionando tanto no Expo Go quanto em builds EAS.
      //
      // Para produção com EAS você pode migrar para o fluxo code + PKCE:
      //   response_type: 'code', usePKCE: true
      // (requer expo-auth-session/providers/google em um Custom Dev Build)
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'openid email profile',
        state: Math.random().toString(36).substring(2, 15),
        include_granted_scopes: 'true',
      });

      const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;

      // Abre o browser do sistema para o login
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success') {
        await handleGoogleCallback(result.url);
      }
      // result.type === 'cancel' → usuário fechou o browser, não é erro
    } catch (err: any) {
      const message = err?.message || 'Erro ao iniciar login com Google';
      setError(message);
      console.error('[FirebaseAuth] Google Login Error:', err);
      throw err;
    }
  }

  async function handleGoogleCallback(callbackUrl: string) {
    // No fluxo implícito o access_token fica no fragment (#) da URL
    let accessToken: string | null = null;

    const fragmentIndex = callbackUrl.indexOf('#');
    if (fragmentIndex !== -1) {
      const fragment = callbackUrl.substring(fragmentIndex + 1);
      accessToken = new URLSearchParams(fragment).get('access_token');
    }

    // Fallback: verifica query string (?)
    if (!accessToken) {
      try {
        accessToken = new URL(callbackUrl).searchParams.get('access_token');
      } catch {}
    }

    if (!accessToken) {
      throw new Error('Token de acesso não encontrado na resposta do Google');
    }

    // Autentica no Firebase com a credencial Google
    const credential = GoogleAuthProvider.credential(null, accessToken);
    await signInWithCredential(auth, credential);
  }

  async function loginWithApple() {
    try {
      setError(null);

      if (Platform.OS !== 'ios') {
        setError('Apple Sign-In está disponível apenas em iOS');
        return;
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const provider = new OAuthProvider('apple.com');
        const appleCredential = provider.credential({
          idToken: credential.identityToken,
        });
        await signInWithCredential(auth, appleCredential);
      }
    } catch (err: any) {
      if (err.code === 'ERR_SKIPPED') return; // Usuário cancelou
      const message = err?.message || 'Erro ao fazer login com Apple';
      setError(message);
      console.error('[FirebaseAuth] Apple Login Error:', err);
      throw err;
    }
  }

  async function logout() {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      const message = err?.message || 'Erro ao fazer logout';
      setError(message);
      throw err;
    }
  }

  return (
    <FirebaseAuthContext.Provider
      value={{ user, loading, loginWithGoogle, loginWithApple, logout, error }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = React.useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth deve ser usado dentro de FirebaseAuthProvider');
  }
  return context;
}
