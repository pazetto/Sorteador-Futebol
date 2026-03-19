import { ScrollView, Text, View, Pressable, Image } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useApp } from "@/lib/app-context";
import { calcularArtilharia, formatarData, MESES } from "@/lib/sorteio";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const { estado } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [nomeGrupo, setNomeGrupo] = useState('Fut Sorteio');

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('@futsorteio:configuracoes').then(str => {
      if (str) {
        const config = JSON.parse(str);
        if (config.nomeGrupo) setNomeGrupo(config.nomeGrupo);
      }
    }).catch(() => {});
  }, []));

  const agora = new Date();
  const mes = agora.getMonth() + 1;
  const ano = agora.getFullYear();

  const artilharia = calcularArtilharia(estado.partidas, mes, ano);
  const artilheiroDoMes = artilharia[0];
  const ultimaPartida = estado.partidas[0];
  const totalJogadores = estado.jogadores.length;
  const totalPartidas = estado.partidas.length;

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{ backgroundColor: colors.primary, paddingTop: 20, paddingBottom: 32, paddingHorizontal: 20 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <Text style={{ fontSize: 20 }}>⚽</Text>
            </View>
            <View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Bem-vindo ao</Text>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '700' }}>{nomeGrupo}</Text>
            </View>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
            {MESES[mes - 1]} de {ano}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: -16 }}>
          {/* Botão principal */}
          <Pressable
            onPress={() => router.push('/sorteio' as any)}
            style={({ pressed }) => ({
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 6,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center'
            }}>
              <IconSymbol name="shuffle" size={28} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}>Novo Sorteio</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                Sortear times para a pelada
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={22} color="#9CA3AF" />
          </Pressable>

          {/* Estatísticas rápidas */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: 12,
              padding: 16, alignItems: 'center',
              borderWidth: 1, borderColor: colors.border
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{totalJogadores}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Jogadores</Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: 12,
              padding: 16, alignItems: 'center',
              borderWidth: 1, borderColor: colors.border
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>{totalPartidas}</Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Partidas</Text>
            </View>
            <View style={{
              flex: 1, backgroundColor: colors.surface, borderRadius: 12,
              padding: 16, alignItems: 'center',
              borderWidth: 1, borderColor: colors.border
            }}>
              <Text style={{ fontSize: 28, fontWeight: '700', color: colors.primary }}>
                {artilharia.length}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Artilheiros</Text>
            </View>
          </View>

          {/* Artilheiro do mês */}
          {artilheiroDoMes && (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 16, padding: 16,
              marginTop: 16, borderWidth: 1, borderColor: colors.border
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconSymbol name="trophy.fill" size={18} color="#FFB300" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
                  Artilheiro do Mês
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 48, height: 48, borderRadius: 24,
                  backgroundColor: '#FFB300', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 22 }}>🥇</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                    {artilheiroDoMes.nome}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.muted }}>
                    {artilheiroDoMes.posicao === 'goleiro' ? 'Goleiro' : 'Jogador de linha'}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFB300' }}>
                    {artilheiroDoMes.gols}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>gols</Text>
                </View>
              </View>
            </View>
          )}

          {/* Última partida */}
          {ultimaPartida && (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 16, padding: 16,
              marginTop: 16, borderWidth: 1, borderColor: colors.border
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.foreground }}>
                  Última Partida
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted, marginLeft: 'auto' }}>
                  {formatarData(ultimaPartida.data)}
                </Text>
              </View>
              <View style={{ gap: 6 }}>
                {ultimaPartida.times.map((time) => (
                  <View key={time.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={{
                      width: 14, height: 14, borderRadius: 7,
                      backgroundColor: time.cor, borderWidth: 1, borderColor: colors.border
                    }} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }}>{time.nome}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                      {time.totalGols}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Estado vazio */}
          {totalJogadores === 0 && (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 16, padding: 24,
              marginTop: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.border
            }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>⚽</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, textAlign: 'center' }}>
                Comece adicionando jogadores!
              </Text>
              <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
                Vá para a aba Jogadores e cadastre os participantes da pelada.
              </Text>
              <Pressable
                onPress={() => router.push('/jogadores' as any)}
                style={({ pressed }) => ({
                  backgroundColor: colors.primary,
                  borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10,
                  marginTop: 16, opacity: pressed ? 0.8 : 1
                })}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>
                  Adicionar Jogadores
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
