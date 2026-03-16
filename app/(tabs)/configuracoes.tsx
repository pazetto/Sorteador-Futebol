import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, Modal, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { CORES_TIMES } from '@/lib/types';

interface Configuracoes {
  nomeGrupo: string;
  tempoPartidaPadrao: number; // em minutos
  corPrincipal: string;
  coresTimes: string[];
}

const STORAGE_KEY = '@futsorteio:configuracoes';
const CONFIG_PADRAO: Configuracoes = {
  nomeGrupo: 'Fut Sorteio',
  tempoPartidaPadrao: 45,
  corPrincipal: '#1E88E5',
  coresTimes: CORES_TIMES.slice(0, 10).map((c) => c.hex),
};

export default function ConfiguracoesScreen() {
  const colors = useColors();
  const [config, setConfig] = useState<Configuracoes>(CONFIG_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [modalNomeVisivel, setModalNomeVisivel] = useState(false);
  const [modalTempoVisivel, setModalTempoVisivel] = useState(false);
  const [modalCoresVisivel, setModalCoresVisivel] = useState(false);
  const [nomeTemp, setNomeTemp] = useState('');
  const [tempoTemp, setTempoTemp] = useState('');

  // Carregar configurações ao iniciar
  useEffect(() => {
    async function carregarConfig() {
      try {
        const configStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (configStr) {
          setConfig(JSON.parse(configStr));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      } finally {
        setCarregando(false);
      }
    }
    carregarConfig();
  }, []);

  async function salvarConfig(novaConfig: Configuracoes) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(novaConfig));
      setConfig(novaConfig);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao salvar configurações');
    }
  }

  function abrirModalNome() {
    setNomeTemp(config.nomeGrupo);
    setModalNomeVisivel(true);
  }

  function salvarNome() {
    if (nomeTemp.trim()) {
      salvarConfig({ ...config, nomeGrupo: nomeTemp });
      setModalNomeVisivel(false);
    }
  }

  function abrirModalTempo() {
    setTempoTemp(String(config.tempoPartidaPadrao));
    setModalTempoVisivel(true);
  }

  function salvarTempo() {
    const tempo = parseInt(tempoTemp) || 45;
    const tempoValido = Math.max(1, Math.min(120, tempo));
    salvarConfig({ ...config, tempoPartidaPadrao: tempoValido });
    setModalTempoVisivel(false);
  }

  function toggleCorTime(hex: string) {
    const novasCores = config.coresTimes.includes(hex)
      ? config.coresTimes.filter((c) => c !== hex)
      : [...config.coresTimes, hex];
    salvarConfig({ ...config, coresTimes: novasCores });
  }

  function resetarConfiguracoes() {
    Alert.alert('Resetar Configurações', 'Deseja restaurar as configurações padrão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Resetar',
        style: 'destructive',
        onPress: () => salvarConfig(CONFIG_PADRAO),
      },
    ]);
  }

  if (carregando) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Carregando...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingVertical: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Configurações</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>Personalize o seu app</Text>
        </View>

        {/* Nome do Grupo */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: colors.border
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
            NOME DO GRUPO
          </Text>
          <Pressable
            onPress={abrirModalNome}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10,
              opacity: pressed ? 0.7 : 1
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                {config.nomeGrupo}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Tempo Padrão da Partida */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: colors.border
        }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
            TEMPO PADRÃO DA PARTIDA
          </Text>
          <Pressable
            onPress={abrirModalTempo}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10,
              opacity: pressed ? 0.7 : 1
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
                {config.tempoPartidaPadrao} minutos
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Cores dos Times */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14, padding: 14,
          borderWidth: 1, borderColor: colors.border
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>
              CORES DOS TIMES
            </Text>
            <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>
              {config.coresTimes.length} selecionadas
            </Text>
          </View>
          <Pressable
            onPress={() => setModalCoresVisivel(true)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 8,
              opacity: pressed ? 0.7 : 1
            })}
          >
            <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
              {config.coresTimes.slice(0, 5).map((cor, i) => (
                <View
                  key={i}
                  style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: cor, borderWidth: 2, borderColor: colors.border
                  }}
                />
              ))}
              {config.coresTimes.length > 5 && (
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center'
                }}>
                  <Text style={{ fontSize: 11, color: colors.muted, fontWeight: '700' }}>
                    +{config.coresTimes.length - 5}
                  </Text>
                </View>
              )}
            </View>
            <IconSymbol name="chevron.right" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Botão Resetar */}
        <Pressable
          onPress={resetarConfiguracoes}
          style={({ pressed }) => ({
            backgroundColor: colors.border, borderRadius: 14, paddingVertical: 12,
            alignItems: 'center', opacity: pressed ? 0.7 : 1
          })}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.muted }}>
            ↻ Restaurar Padrões
          </Text>
        </Pressable>
      </ScrollView>

      {/* Modal Nome do Grupo */}
      <Modal visible={modalNomeVisivel} animationType="fade" transparent onRequestClose={() => setModalNomeVisivel(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
              Nome do Grupo
            </Text>
            <TextInput
              value={nomeTemp}
              onChangeText={setNomeTemp}
              placeholder="Ex: Fut Sorteio"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12,
                fontSize: 16, color: colors.foreground, marginBottom: 16
              }}
              returnKeyType="done"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setModalNomeVisivel(false)}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 12, borderRadius: 10,
                  backgroundColor: colors.border, opacity: pressed ? 0.7 : 1,
                  alignItems: 'center'
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.muted }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={salvarNome}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 12, borderRadius: 10,
                  backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1,
                  alignItems: 'center'
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tempo da Partida */}
      <Modal visible={modalTempoVisivel} animationType="fade" transparent onRequestClose={() => setModalTempoVisivel(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
              Tempo da Partida
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12, marginBottom: 16
            }}>
              <TextInput
                value={tempoTemp}
                onChangeText={setTempoTemp}
                keyboardType="number-pad"
                placeholder="45"
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1, paddingVertical: 12, fontSize: 16, color: colors.foreground
                }}
                returnKeyType="done"
              />
              <Text style={{ fontSize: 16, color: colors.muted }}>min</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setModalTempoVisivel(false)}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 12, borderRadius: 10,
                  backgroundColor: colors.border, opacity: pressed ? 0.7 : 1,
                  alignItems: 'center'
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.muted }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={salvarTempo}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 12, borderRadius: 10,
                  backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1,
                  alignItems: 'center'
                })}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Cores dos Times */}
      <Modal visible={modalCoresVisivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalCoresVisivel(false)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: colors.border
          }}>
            <Pressable onPress={() => setModalCoresVisivel(false)}>
              <Text style={{ fontSize: 16, color: colors.muted }}>Voltar</Text>
            </Pressable>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>Cores dos Times</Text>
            <View style={{ width: 50 }} />
          </View>

          <FlatList
            data={CORES_TIMES}
            keyExtractor={(item) => item.hex}
            numColumns={3}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            columnWrapperStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => toggleCorTime(item.hex)}
                style={({ pressed }) => ({
                  flex: 1, aspectRatio: 1, borderRadius: 14,
                  backgroundColor: item.hex, opacity: pressed ? 0.8 : 1,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: config.coresTimes.includes(item.hex) ? 3 : 0,
                  borderColor: '#FFFFFF'
                })}
              >
                {config.coresTimes.includes(item.hex) && (
                  <Text style={{ fontSize: 24 }}>✓</Text>
                )}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
}
