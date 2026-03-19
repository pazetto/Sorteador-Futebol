import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, Switch, Alert, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { Jogador, Time, ConfigSorteio, Rodada } from '@/lib/types';
import { sortearTimes, criarPartida, gerarId } from '@/lib/sorteio';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';

// ─── Contador ────────────────────────────────────────────────────────────────
function Contador({ valor, min, max, onChange, label }: {
  valor: number; min: number; max: number;
  onChange: (v: number) => void; label: string;
}) {
  const colors = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ fontSize: 15, color: colors.foreground }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Pressable
          onPress={() => { if (valor > min) { onChange(valor - 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: valor > min ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <IconSymbol name="minus" size={18} color={valor > min ? '#FFFFFF' : colors.muted} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground, minWidth: 32, textAlign: 'center' }}>{valor}</Text>
        <Pressable
          onPress={() => { if (valor < max) { onChange(valor + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: valor < max ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <IconSymbol name="plus" size={18} color={valor < max ? '#FFFFFF' : colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Card de time (reutilizado nos dois modais) ───────────────────────────────
function CardTime({ time, selecionado, onPress, mostrarCheck = false }: {
  time: Time; selecionado?: boolean; onPress?: () => void; mostrarCheck?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderRadius: 16, overflow: 'hidden',
        borderWidth: 2, borderColor: selecionado ? time.cor : colors.border,
        opacity: pressed ? 0.85 : 1,
        marginBottom: 10,
      })}
    >
      <View style={{ backgroundColor: selecionado ? time.cor : time.cor + '40', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: selecionado ? '#FFFFFF' : time.cor }}>
            {time.nome}
          </Text>
          <Text style={{ fontSize: 12, color: selecionado ? 'rgba(255,255,255,0.8)' : colors.muted, marginTop: 2 }}>
            {time.jogadores.length} jogadores{time.goleiro ? ' + 1 goleiro' : ''}
          </Text>
        </View>
        {mostrarCheck && (
          <View style={{
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: selecionado ? 'rgba(255,255,255,0.3)' : colors.border,
            alignItems: 'center', justifyContent: 'center',
          }}>
            {selecionado && <IconSymbol name="checkmark" size={16} color="#FFFFFF" />}
          </View>
        )}
      </View>

      {time.goleiro && (
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 14 }}>🧤</Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground }}>{time.goleiro.nome}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>Goleiro</Text>
        </View>
      )}

      {time.jogadores.map((j, idx) => (
        <View key={(j as any).jogadorId ?? idx} style={{
          backgroundColor: idx % 2 === 0 ? colors.surface : colors.background,
          paddingHorizontal: 16, paddingVertical: 8,
          flexDirection: 'row', alignItems: 'center', gap: 10,
        }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: time.cor + '30', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: time.cor }}>{idx + 1}</Text>
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: colors.foreground }}>{(j as any).nome}</Text>
        </View>
      ))}
    </Pressable>
  );
}

// ─── Modal de resultado do sorteio ───────────────────────────────────────────
function ModalResultado({ visivel, times, onFechar, onIniciarPartida, onSalvarRodada, onResortear }: {
  visivel: boolean;
  times: Time[];
  onFechar: () => void;
  onIniciarPartida: (timesSelecionados: Time[]) => void;
  onSalvarRodada: () => void;
  onResortear: () => void;
}) {
  const colors = useColors();
  const [selecionados, setSelecionados] = useState<Set<string>>(
    new Set(times.slice(0, 2).map(t => t.id))
  );

  React.useEffect(() => {
    setSelecionados(new Set(times.slice(0, 2).map(t => t.id)));
  }, [times]);

  function toggleTime(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 2) {
          Alert.alert('Máximo 2 times', 'Desmarque um time antes de selecionar outro.');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  const timesSelecionados = times.filter(t => selecionados.has(t.id));
  const podeIniciar = selecionados.size === 2;

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={onFechar} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="xmark" size={22} color={colors.muted} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>Times Sorteados</Text>
            {times.length > 2 && (
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>Selecione 2 times para jogar</Text>
            )}
          </View>
          <Pressable onPress={onResortear} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="shuffle" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {times.map(time => (
            <CardTime
              key={time.id}
              time={time}
              selecionado={selecionados.has(time.id)}
              onPress={() => toggleTime(time.id)}
              mostrarCheck={true}
            />
          ))}
        </ScrollView>

        {/* Botões */}
        <View style={{ padding: 16, paddingBottom: 32, gap: 10 }}>
          <Pressable
            onPress={() => podeIniciar && onIniciarPartida(timesSelecionados)}
            style={({ pressed }) => ({
              backgroundColor: podeIniciar ? colors.primary : colors.border,
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: podeIniciar ? '#FFFFFF' : colors.muted, fontSize: 17, fontWeight: '700' }}>
              ▶ Iniciar Partida{selecionados.size === 2 ? '' : ' (selecione 2 times)'}
            </Text>
          </Pressable>

          {times.length > 2 && (
            <Pressable
              onPress={onSalvarRodada}
              style={({ pressed }) => ({
                backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 14,
                alignItems: 'center', borderWidth: 1.5, borderColor: colors.primary,
                opacity: pressed ? 0.85 : 1, flexDirection: 'row', justifyContent: 'center', gap: 8,
              })}
            >
              <IconSymbol name="calendar" size={18} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
                💾 Salvar Rodada ({times.length} times)
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal de gerenciamento da rodada ─────────────────────────────────────────
function ModalGerenciarRodada({ visivel, rodada, onFechar, onIniciarConfronoto, onLimpar }: {
  visivel: boolean;
  rodada: Rodada;
  onFechar: () => void;
  onIniciarConfronoto: (times: Time[]) => void;
  onLimpar: () => void;
}) {
  const colors = useColors();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  function toggleTime(id: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= 2) {
          Alert.alert('Máximo 2 times', 'Desmarque um time antes de selecionar outro.');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function isJogado(timeId: string) {
    return rodada.confrontosJogados.some(c => c.timeId1 === timeId || c.timeId2 === timeId);
  }

  function jaJogaramJuntos(id1: string, id2: string) {
    return rodada.confrontosJogados.some(
      c => (c.timeId1 === id1 && c.timeId2 === id2) || (c.timeId1 === id2 && c.timeId2 === id1)
    );
  }

  const podeIniciar = selecionados.size === 2;
  const timesSelecionados = rodada.times.filter(t => selecionados.has(t.id));
  const avisoJaJogaram = podeIniciar && jaJogaramJuntos(...Array.from(selecionados) as [string, string]);

  const partidasJogadas = rodada.confrontosJogados.length;
  const totalPossivel = Math.floor(rodada.times.length / 2);

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Pressable onPress={onFechar} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <IconSymbol name="xmark" size={22} color={colors.muted} />
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>Rodada Ativa</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{rodada.times.length} times · {partidasJogadas} partida(s) jogada(s)</Text>
          </View>
          <Pressable
            onPress={() => Alert.alert('Encerrar Rodada', 'Deseja encerrar e limpar a rodada atual?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Encerrar', style: 'destructive', onPress: onLimpar },
            ])}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <IconSymbol name="trash" size={20} color="#EF4444" />
          </Pressable>
        </View>

        {/* Instrução */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.primary + '15', borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600', textAlign: 'center' }}>
            Selecione 2 times para o próximo confronto
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
          {/* Histórico de confrontos */}
          {rodada.confrontosJogados.length > 0 && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 }}>CONFRONTOS JOGADOS</Text>
              {rodada.confrontosJogados.map((c, i) => {
                const t1 = rodada.times.find(t => t.id === c.timeId1);
                const t2 = rodada.times.find(t => t.id === c.timeId2);
                return (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t1?.cor ?? '#999' }} />
                    <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: '600' }}>{t1?.nome}</Text>
                    <Text style={{ fontSize: 13, color: colors.muted }}>×</Text>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t2?.cor ?? '#999' }} />
                    <Text style={{ fontSize: 13, color: colors.foreground, fontWeight: '600' }}>{t2?.nome}</Text>
                    <Text style={{ marginLeft: 'auto', fontSize: 12 }}>✅</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Times disponíveis */}
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: 8 }}>TIMES</Text>
          {rodada.times.map(time => (
            <CardTime
              key={time.id}
              time={time}
              selecionado={selecionados.has(time.id)}
              onPress={() => toggleTime(time.id)}
              mostrarCheck={true}
            />
          ))}

          {avisoJaJogaram && (
            <View style={{ backgroundColor: '#FFF9C4', borderRadius: 10, padding: 12, marginTop: 8, borderWidth: 1, borderColor: '#F9A825' }}>
              <Text style={{ fontSize: 13, color: '#F57F17', textAlign: 'center' }}>
                ⚠️ Esses times já jogaram juntos nessa rodada. Pode continuar assim mesmo.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Botão iniciar confronto */}
        <View style={{ padding: 16, paddingBottom: 32 }}>
          <Pressable
            onPress={() => podeIniciar && onIniciarConfronoto(timesSelecionados)}
            style={({ pressed }) => ({
              backgroundColor: podeIniciar ? colors.primary : colors.border,
              borderRadius: 14, paddingVertical: 16, alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: podeIniciar ? '#FFFFFF' : colors.muted, fontSize: 17, fontWeight: '700' }}>
              ▶ Iniciar Confronto{!podeIniciar ? ' (selecione 2 times)' : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function SorteioScreen() {
  const { estado, iniciarPartida, salvarRodada, limparRodada, registrarConfrontoNaRodada } = useApp();
  const colors = useColors();
  const router = useRouter();

  const [numTimes, setNumTimes] = useState(2);
  const [jogadoresPorTime, setJogadoresPorTime] = useState(5);
  const [incluirGoleiro, setIncluirGoleiro] = useState(true);
  const [equilibrar, setEquilibrar] = useState(true);
  const [selecionados, setSelecionados] = useState<Set<string>>(
    new Set(estado.jogadores.map(j => j.id))
  );
  const [timesSorteados, setTimesSorteados] = useState<Time[]>([]);
  const [modalSorteioVisivel, setModalSorteioVisivel] = useState(false);
  const [modalRodadaVisivel, setModalRodadaVisivel] = useState(false);

  React.useEffect(() => {
    setSelecionados(new Set(estado.jogadores.map(j => j.id)));
  }, [estado.jogadores]);

  const toggleJogador = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const totalNecessario = numTimes * jogadoresPorTime + (incluirGoleiro ? numTimes : 0);
  const podeSort = selecionados.size >= totalNecessario;

  function realizarSorteio() {
    if (!podeSort) {
      Alert.alert('Jogadores insuficientes', `Você precisa de pelo menos ${totalNecessario} jogadores selecionados.`);
      return;
    }
    const config: ConfigSorteio = {
      numTimes, jogadoresPorTime, incluirGoleiro,
      equilibrarPorNivel: equilibrar,
      jogadoresSelecionados: Array.from(selecionados),
    };
    try {
      const times = sortearTimes(estado.jogadores, config);
      setTimesSorteados(times);
      setModalSorteioVisivel(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Erro', 'Não foi possível sortear os times. Verifique as configurações.');
    }
  }

  function handleIniciarPartida(times: Time[]) {
    const partida = criarPartida(times);
    iniciarPartida(partida);
    setModalSorteioVisivel(false);
    router.push('/partida' as any);
  }

  function handleSalvarRodada() {
    const rodada: Rodada = {
      id: gerarId(),
      criadaEm: new Date().toISOString(),
      times: timesSorteados,
      confrontosJogados: [],
    };
    salvarRodada(rodada);
    setModalSorteioVisivel(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('✅ Rodada salva!', `${timesSorteados.length} times prontos. Acesse "Rodada Ativa" para iniciar os confrontos quando quiser.`);
  }

  function handleIniciarConfronto(times: Time[]) {
    const partida = criarPartida(times);
    iniciarPartida(partida);
    // Registra o confronto na rodada
    registrarConfrontoNaRodada(times[0].id, times[1].id, partida.id);
    setModalRodadaVisivel(false);
    router.push('/partida' as any);
  }

  const jogadoresLinha = estado.jogadores.filter(j => j.posicao === 'jogador');
  const goleiros = estado.jogadores.filter(j => j.posicao === 'goleiro');

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Sorteio</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>Configure e sorteie os times</Text>
        </View>

        {/* Card de Rodada Ativa */}
        {estado.rodadaAtual && (
          <Pressable
            onPress={() => setModalRodadaVisivel(true)}
            style={({ pressed }) => ({
              marginHorizontal: 16, marginBottom: 12,
              backgroundColor: colors.primary + '15',
              borderRadius: 14, padding: 14,
              borderWidth: 1.5, borderColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 22 }}>🏆</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.primary }}>Rodada Ativa</Text>
                <Text style={{ fontSize: 13, color: colors.foreground }}>
                  {estado.rodadaAtual.times.length} times · {estado.rodadaAtual.confrontosJogados.length} confronto(s) jogado(s)
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.primary} />
            </View>
          </Pressable>
        )}

        {/* Configurações */}
        <View style={{ marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 16 }}>
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
            <Switch value={incluirGoleiro} onValueChange={v => { setIncluirGoleiro(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
          </View>
          <View style={{ height: 1, backgroundColor: colors.border }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 15, color: colors.foreground }}>Equilibrar times</Text>
              <Text style={{ fontSize: 12, color: colors.muted }}>Balancear por nível, idade e peso</Text>
            </View>
            <Switch value={equilibrar} onValueChange={v => { setEquilibrar(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }} trackColor={{ false: colors.border, true: colors.primary }} thumbColor="#FFFFFF" />
          </View>
        </View>

        {/* Resumo */}
        <View style={{
          marginHorizontal: 16, marginTop: 12,
          backgroundColor: podeSort ? colors.primary + '15' : '#EF444415',
          borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: podeSort ? colors.primary + '40' : '#EF444440',
          flexDirection: 'row', alignItems: 'center', gap: 10
        }}>
          <Text style={{ fontSize: 20 }}>{podeSort ? '✅' : '⚠️'}</Text>
          <Text style={{ flex: 1, fontSize: 13, color: podeSort ? colors.primary : '#EF4444', fontWeight: '500' }}>
            {podeSort
              ? `Pronto! ${selecionados.size} jogadores selecionados para ${numTimes} times.`
              : `Necessário: ${totalNecessario} jogadores (${selecionados.size} selecionados)`}
          </Text>
        </View>

        {/* Seleção de jogadores */}
        <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted }}>
              JOGADORES ({selecionados.size}/{estado.jogadores.length})
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => setSelecionados(new Set(estado.jogadores.map(j => j.id)))}>
                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Todos</Text>
              </Pressable>
              <Text style={{ color: colors.border }}>|</Text>
              <Pressable onPress={() => setSelecionados(new Set())}>
                <Text style={{ fontSize: 13, color: colors.muted, fontWeight: '600' }}>Nenhum</Text>
              </Pressable>
            </View>
          </View>

          {estado.jogadores.length === 0 ? (
            <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
                Nenhum jogador cadastrado.{'\n'}Vá para a aba Jogadores para adicionar.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              {jogadoresLinha.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 4, marginBottom: 2 }}>⚽ JOGADORES DE LINHA</Text>
                  {jogadoresLinha.map(j => (
                    <Pressable key={j.id} onPress={() => toggleJogador(j.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selecionados.has(j.id) ? colors.primary + '15' : colors.surface, borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: selecionados.has(j.id) ? colors.primary : colors.border }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: selecionados.has(j.id) ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                        {selecionados.has(j.id) && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.foreground }}>{j.nome}</Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>Nível {j.nivel}</Text>
                    </Pressable>
                  ))}
                </>
              )}
              {goleiros.length > 0 && (
                <>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 8, marginBottom: 2 }}>🧤 GOLEIROS</Text>
                  {goleiros.map(j => (
                    <Pressable key={j.id} onPress={() => toggleJogador(j.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: selecionados.has(j.id) ? '#FF8F0015' : colors.surface, borderRadius: 10, padding: 12, borderWidth: 1.5, borderColor: selecionados.has(j.id) ? '#FF8F00' : colors.border }}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: selecionados.has(j.id) ? '#FF8F00' : colors.border, alignItems: 'center', justifyContent: 'center' }}>
                        {selecionados.has(j.id) && <IconSymbol name="checkmark" size={14} color="#FFFFFF" />}
                      </View>
                      <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: colors.foreground }}>{j.nome}</Text>
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
            style={({ pressed }) => ({ backgroundColor: podeSort ? colors.primary : colors.border, borderRadius: 14, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <IconSymbol name="shuffle" size={22} color={podeSort ? '#FFFFFF' : colors.muted} />
              <Text style={{ color: podeSort ? '#FFFFFF' : colors.muted, fontSize: 17, fontWeight: '700' }}>Sortear Times</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ModalResultado
        visivel={modalSorteioVisivel}
        times={timesSorteados}
        onFechar={() => setModalSorteioVisivel(false)}
        onIniciarPartida={handleIniciarPartida}
        onSalvarRodada={handleSalvarRodada}
        onResortear={() => { setModalSorteioVisivel(false); setTimeout(realizarSorteio, 300); }}
      />

      {estado.rodadaAtual && (
        <ModalGerenciarRodada
          visivel={modalRodadaVisivel}
          rodada={estado.rodadaAtual}
          onFechar={() => setModalRodadaVisivel(false)}
          onIniciarConfronoto={handleIniciarConfronto}
          onLimpar={() => { limparRodada(); setModalRodadaVisivel(false); }}
        />
      )}
    </ScreenContainer>
  );
}
