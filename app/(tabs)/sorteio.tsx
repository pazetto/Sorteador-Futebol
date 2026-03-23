import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { Jogador, Time, ConfigSorteio, CORES_TIMES } from '@/lib/types';
import { sortearTimes, criarPartida } from '@/lib/sorteio';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_CONFIG = '@futsorteio:configuracoes';

// ─── Componente de seleção de número ─────────────────────────────────────────
function Contador({
  valor, min, max, onChange, label
}: { valor: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 15, color: colors.foreground }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable
          onPress={() => { if (valor > min) { onChange(valor - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: valor > min ? colors.primary : colors.border,
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <IconSymbol name="minus" size={18} color={valor > min ? '#FFFFFF' : colors.muted} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, minWidth: 32, textAlign: 'center' }}>
          {valor}
        </Text>
        <Pressable
          onPress={() => { if (valor < max) { onChange(valor + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: valor < max ? colors.primary : colors.border,
            alignItems: 'center', justifyContent: 'center'
          }}
        >
          <IconSymbol name="plus" size={18} color={valor < max ? '#FFFFFF' : colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Modal de resultado do sorteio ────────────────────────────────────────────
interface ModalResultadoProps {
  visivel: boolean;
  times: Time[];
  onFechar: () => void;
  onIniciarPartida: () => void;
  onResortear: () => void;
}

function ModalResultado({ visivel, times, onFechar, onIniciarPartida, onResortear }: ModalResultadoProps) {
  const colors = useColors();

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: colors.border
        }}>
          <Pressable onPress={onFechar} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="xmark" size={22} color={colors.muted} />
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>Times Sorteados</Text>
          <Pressable onPress={onResortear} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="shuffle" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {times.map((time) => (
            <View
              key={time.id}
              style={{
                borderRadius: 16, overflow: 'hidden',
                borderWidth: 2, borderColor: time.cor,
              }}
            >
              {/* Cabeçalho do time */}
              <View style={{ backgroundColor: time.cor, paddingHorizontal: 16, paddingVertical: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                  {time.nome}
                </Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {(time.jogadores as any[]).length} jogadores{time.goleiro ? ' + 1 goleiro' : ''}
                </Text>
              </View>

              {/* Goleiro */}
              {time.goleiro && (
                <View style={{
                  backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 10,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  borderBottomWidth: 1, borderBottomColor: colors.border
                }}>
                  <Text style={{ fontSize: 16 }}>🧤</Text>
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>
                      {(time.goleiro as any).nome}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.muted }}>Goleiro</Text>
                  </View>
                </View>
              )}

              {/* Jogadores */}
              {(time.jogadores as any[]).map((j, jIdx) => (
                <View
                  key={j.jogadorId ?? jIdx}
                  style={{
                    backgroundColor: jIdx % 2 === 0 ? colors.surface : colors.background,
                    paddingHorizontal: 16, paddingVertical: 10,
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                  }}
                >
                  <View style={{
                    width: 26, height: 26, borderRadius: 13,
                    backgroundColor: time.cor + '30', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: time.cor }}>{jIdx + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }}>{j.nome}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>⚽</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Botão iniciar */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Pressable
            onPress={onIniciarPartida}
            style={({ pressed }) => ({
              backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              ▶ Iniciar Partida
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function SorteioScreen() {
  const { estado, iniciarPartida } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [numTimes, setNumTimes] = useState(2);
  const [jogadoresPorTime, setJogadoresPorTime] = useState(5);
  const [incluirGoleiro, setIncluirGoleiro] = useState(true);
  const [equilibrar, setEquilibrar] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    new Set(estado.jogadores.map((j) => j.id))
  );
  const [timesSorteados, setTimesSorteados] = useState<Time[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);

  // Cores configuradas pelo usuário (carregadas do AsyncStorage)
  const [coresConfiguradas, setCoresConfiguradas] = useState<string[]>([]);

  // Carregar configurações (incluindo cores) ao montar a tela
  useEffect(() => {
    async function carregarConfig() {
      try {
        const configStr = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
        if (configStr) {
          const config = JSON.parse(configStr);
          if (Array.isArray(config.coresTimes) && config.coresTimes.length > 0) {
            setCoresConfiguradas(config.coresTimes);
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar configurações de cores:', e);
      }
    }
    carregarConfig();
  }, []);

  // Recarregar cores ao focar na tela (caso usuário tenha mudado nas configurações)
  // Usando useFocusEffect seria ideal, mas como estamos sem react-navigation/native direto aqui,
  // vamos usar o evento de visibilidade via estado
  useEffect(() => {
    if (modalVisivel) return; // Não recarrega enquanto modal está aberto
    async function recarregarCores() {
      try {
        const configStr = await AsyncStorage.getItem(STORAGE_KEY_CONFIG);
        if (configStr) {
          const config = JSON.parse(configStr);
          if (Array.isArray(config.coresTimes) && config.coresTimes.length > 0) {
            setCoresConfiguradas(config.coresTimes);
          }
        }
      } catch (e) {
        // ignora
      }
    }
    recarregarCores();
  }, [modalVisivel]);

  // Atualizar selecionados quando jogadores mudam
  React.useEffect(() => {
    setSelecionados(new Set(estado.jogadores.map((j) => j.id)));
  }, [estado.jogadores]);

  const toggleJogador = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selecionarTodos = useCallback(() => {
    setSelecionados(new Set(estado.jogadores.map((j) => j.id)));
  }, [estado.jogadores]);

  const limparSelecao = useCallback(() => {
    setSelecionados(new Set());
  }, []);

  const totalNecessario = numTimes * jogadoresPorTime + (incluirGoleiro ? numTimes : 0);
  const totalSelecionados = selecionados.size;
  const podeSort = totalSelecionados >= totalNecessario;

  function realizarSorteio() {
    if (!podeSort) {
      Alert.alert(
        'Jogadores insuficientes',
        `Você precisa de pelo menos ${totalNecessario} jogadores selecionados (${numTimes} times × ${jogadoresPorTime} jogadores${incluirGoleiro ? ` + ${numTimes} goleiros` : ''}).`
      );
      return;
    }

    const config: ConfigSorteio = {
      numTimes,
      jogadoresPorTime,
      incluirGoleiro,
      equilibrarPorNivel: equilibrar,
      jogadoresSelecionados: Array.from(selecionados),
    };

    try {
      // Passa as cores configuradas pelo usuário
      const times = sortearTimes(estado.jogadores, config, coresConfiguradas);
      setTimesSorteados(times);
      setModalVisivel(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível sortear os times. Verifique as configurações.');
    }
  }

  function handleIniciarPartida() {
    const partida = criarPartida(timesSorteados);
    iniciarPartida(partida);
    setModalVisivel(false);
    router.push('/partida' as any);
  }

  const jogadoresLinha = estado.jogadores.filter((j) => j.posicao === 'jogador');
  const goleiros = estado.jogadores.filter((j) => j.posicao === 'goleiro');

  // Preview das cores que serão usadas
  const coresParaExibir = coresConfiguradas.length > 0
    ? CORES_TIMES.filter((c) => coresConfiguradas.includes(c.hex))
    : CORES_TIMES;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Sorteio</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>Configure e sorteie os times</Text>
        </View>

        {/* Configurações */}
        <View style={{
          marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16,
          padding: 16, borderWidth: 1, borderColor: colors.border, gap: 16
        }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted }}>CONFIGURAÇÕES</Text>

          <Contador label="Número de times" valor={numTimes} min={2} max={10} onChange={setNumTimes} />
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <Contador label="Jogadores por time" valor={jogadoresPorTime} min={1} max={15} onChange={setJogadoresPorTime} />
          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 15, color: colors.foreground }}>Goleiro por time</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Incluir 1 goleiro em cada time</Text>
            </View>
            <Switch
              value={incluirGoleiro}
              onValueChange={(v) => { setIncluirGoleiro(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 15, color: colors.foreground }}>Equilibrar times</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Balancear por nível, idade e peso</Text>
            </View>
            <Switch
              value={equilibrar}
              onValueChange={(v) => { setEquilibrar(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Preview das cores que serão usadas */}
        <View style={{
          marginHorizontal: 16, marginTop: 12,
          backgroundColor: colors.surface, borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: colors.border,
          flexDirection: 'row', alignItems: 'center', gap: 10
        }}>
          <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>🎨 Cores:</Text>
          <View style={{ flexDirection: 'row', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {coresParaExibir.slice(0, 10).map((c) => (
              <View
                key={c.hex}
                style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.hex, borderWidth: 1, borderColor: colors.border }}
              />
            ))}
            {coresParaExibir.length > 10 && (
              <Text style={{ fontSize: 12, color: colors.muted }}>+{coresParaExibir.length - 10}</Text>
            )}
          </View>
        </View>

        {/* Resumo */}
        <View style={{
          marginHorizontal: 16, marginTop: 10,
          backgroundColor: podeSort ? colors.primary + '15' : '#EF444415',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: podeSort ? colors.primary + '40' : '#EF444440',
          flexDirection: 'row', alignItems: 'center', gap: 10
        }}>
          <Text style={{ fontSize: 20 }}>{podeSort ? '✅' : '⚠️'}</Text>
          <Text style={{ flex: 1, fontSize: 13, color: podeSort ? colors.primary : '#EF4444', fontWeight: '500' }}>
            {podeSort
              ? `Pronto! ${totalSelecionados} jogadores selecionados para ${numTimes} times.`
              : `Necessário: ${totalNecessario} jogadores (${totalSelecionados} selecionados)`
            }
          </Text>
        </View>

        {/* Seleção de jogadores */}
        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted }}>
              JOGADORES ({totalSelecionados}/{estado.jogadores.length})
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={selecionarTodos} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Todos</Text>
              </Pressable>
              <Text style={{ color: colors.border }}>|</Text>
              <Pressable onPress={limparSelecao} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>Nenhum</Text>
              </Pressable>
            </View>
          </View>

          {estado.jogadores.length === 0 ? (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 12, padding: 20,
              alignItems: 'center', borderWidth: 1, borderColor: colors.border
            }}>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                Nenhum jogador cadastrado.{'\n'}Vá para a aba Jogadores para adicionar.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {/* Jogadores de linha */}
              {jogadoresLinha.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 4, marginBottom: 2 }}>
                    ⚽ JOGADORES DE LINHA
                  </Text>
                  {jogadoresLinha.map((j) => (
                    <Pressable
                      key={j.id}
                      onPress={() => toggleJogador(j.id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        backgroundColor: selecionados.has(j.id) ? colors.primary + '15' : colors.surface,
                        borderRadius: 10, padding: 12,
                        borderWidth: 1.5,
                        borderColor: selecionados.has(j.id) ? colors.primary : colors.border,
                      }}
                    >
                      <View style={{
                        width: 24, height: 24, borderRadius: 12,
                        backgroundColor: selecionados.has(j.id) ? colors.primary : colors.border,
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        {selecionados.has(j.id) && (
                          <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                        {j.nome}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>Nível {j.nivel}</Text>
                    </Pressable>
                  ))}
                </>
              )}

              {/* Goleiros */}
              {goleiros.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 8, marginBottom: 2 }}>
                    🧤 GOLEIROS
                  </Text>
                  {goleiros.map((j) => (
                    <Pressable
                      key={j.id}
                      onPress={() => toggleJogador(j.id)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 12,
                        backgroundColor: selecionados.has(j.id) ? '#FF8F0015' : colors.surface,
                        borderRadius: 10, padding: 12,
                        borderWidth: 1.5,
                        borderColor: selecionados.has(j.id) ? '#FF8F00' : colors.border,
                      }}
                    >
                      <View style={{
                        width: 24, height: 24, borderRadius: 12,
                        backgroundColor: selecionados.has(j.id) ? '#FF8F00' : colors.border,
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        {selecionados.has(j.id) && (
                          <IconSymbol name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.foreground }}>
                        {j.nome}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>Nível {j.nivel}</Text>
                    </Pressable>
                  ))}
                </>
              )}
            </View>
          )}
        </View>

        {/* Botão sortear */}
        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <Pressable
            onPress={realizarSorteio}
            style={({ pressed }) => ({
              backgroundColor: podeSort ? colors.primary : colors.border,
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconSymbol name="shuffle" size={22} color={podeSort ? '#FFFFFF' : colors.muted} />
              <Text style={{
                color: podeSort ? '#FFFFFF' : colors.muted,
                fontSize: 17, fontWeight: '700'
              }}>
                Sortear Times
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ModalResultado
        visivel={modalVisivel}
        times={timesSorteados}
        onFechar={() => setModalVisivel(false)}
        onIniciarPartida={handleIniciarPartida}
        onResortear={() => {
          setModalVisivel(false);
          setTimeout(realizarSorteio, 300);
        }}
      />
    </ScreenContainer>
  );
}
