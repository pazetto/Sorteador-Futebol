import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { useFirebaseAuth } from '@/lib/firebase-auth-context';

// Logo oficial do Google (SVG)
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

// Logo oficial da Apple (SVG)
function AppleLogo({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 814 1000">
      <Path
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 134.4-317.3 265.7-317.3 70.2 0 128.8 46.1 172.5 46.1 43.7 0 112.3-49 192.2-49 30.4 0 108.2 2.6 164 96.9zm-234.5-172.6c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
        fill={color}
      />
    </Svg>
  );
}

export default function PerfilScreen() {
  const colors = useColors();
  const { user, loading, loginWithGoogle, loginWithApple, logout, error } = useFirebaseAuth();
  const [autenticando, setAutenticando] = useState(false);

  async function handleGoogleLogin() {
    try {
      setAutenticando(true);
      await loginWithGoogle();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Erro', 'Falha ao autenticar com Google. Verifique sua conexão.');
      }
    } finally {
      setAutenticando(false);
    }
  }

  async function handleAppleLogin() {
    try {
      setAutenticando(true);
      await loginWithApple();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Erro', 'Falha ao autenticar com Apple. Verifique sua conexão.');
      }
    } finally {
      setAutenticando(false);
    }
  }

  async function handleLogout() {
    // No web, Alert.alert com múltiplos botões não funciona — usa confirm() nativo
    if (Platform.OS === 'web') {
      const confirmou = window.confirm('Deseja sair da sua conta?');
      if (!confirmou) return;
      try {
        await logout();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        window.alert('Falha ao fazer logout');
      }
      return;
    }

    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {
            Alert.alert('Erro', 'Falha ao fazer logout');
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Perfil</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>Gerencie sua conta</Text>
        </View>

        {user ? (
          <>
            {/* Card do usuário */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                {user.photoURL ? (
                  <Image
                    source={{ uri: user.photoURL }}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                  />
                ) : (
                  <Text style={{ fontSize: 40 }}>👤</Text>
                )}
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
                {user.displayName || 'Usuário'}
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' }}>
                {user.email}
              </Text>
              <View
                style={{
                  marginTop: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: user.providerData[0]?.providerId === 'google.com' ? '#4285F4' + '20' : '#000000' + '20',
                  borderRadius: 20,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {user.providerData[0]?.providerId === 'google.com'
                    ? <GoogleLogo size={14} />
                    : <AppleLogo size={14} color={colors.foreground} />
                  }
                  <Text style={{
                    fontSize: 12, fontWeight: '600',
                    color: user.providerData[0]?.providerId === 'google.com' ? '#4285F4' : colors.foreground,
                  }}>
                    {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Apple'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Botão logout */}
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => ({
                backgroundColor: '#EF4444',
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconSymbol name="arrow.right.square" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Sair</Text>
              </View>
            </Pressable>
          </>
        ) : (
          <>
            {/* Mensagem de boas-vindas */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 48, marginBottom: 12 }}>👋</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
                Bem-vindo!
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 }}>
                Faça login para sincronizar seus dados na nuvem com Firebase
              </Text>
            </View>

            {/* Botão Google */}
            <Pressable
              onPress={handleGoogleLogin}
              disabled={autenticando}
              style={({ pressed }) => ({
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                alignItems: 'center',
                opacity: pressed ? 0.8 : autenticando ? 0.6 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                flexDirection: 'row',
                gap: 12,
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#DADCE0',
              })}
            >
              {autenticando ? (
                <ActivityIndicator color="#1F2937" />
              ) : (
                <>
                  <GoogleLogo size={20} />
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937' }}>
                    Conectar com Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Botão Apple (apenas iOS) */}
            {Platform.OS === 'ios' && (
              <Pressable
                onPress={handleAppleLogin}
                disabled={autenticando}
                style={({ pressed }) => ({
                  backgroundColor: '#000000',
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  alignItems: 'center',
                  opacity: pressed ? 0.8 : autenticando ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                  flexDirection: 'row',
                  gap: 12,
                  justifyContent: 'center',
                })}
              >
                {autenticando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <AppleLogo size={20} color="#FFFFFF" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                      Conectar com Apple
                    </Text>
                  </>
                )}
              </Pressable>
            )}

            {/* Mensagem de erro */}
            {error && (
              <View
                style={{
                  backgroundColor: '#FEE2E2',
                  borderRadius: 12,
                  padding: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: '#EF4444',
                }}
              >
                <Text style={{ fontSize: 12, color: '#991B1B' }}>
                  ⚠️ {error}
                </Text>
              </View>
            )}

            {/* Nota sobre privacidade */}
            <View
              style={{
                backgroundColor: colors.border + '40',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                🔒 Seus dados são protegidos e sincronizados com segurança no Firebase
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}