import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { useFirebaseAuth } from '@/lib/firebase-auth-context';

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
    Alert.alert('Sair', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err) {
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
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: user.providerData[0]?.providerId === 'google.com' ? '#4285F4' : colors.foreground,
                  }}
                >
                  {user.providerData[0]?.providerId === 'google.com' ? '🔵 Google' : '🍎 Apple'}
                </Text>
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
                  <Text style={{ fontSize: 20 }}>🔵</Text>
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
                    <Text style={{ fontSize: 20 }}>🍎</Text>
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
