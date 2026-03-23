import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, Alert, Modal, StyleSheet, KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { TimePartida, JogadorGol } from '@/lib/types';
import { formatarDuracao } from '@/lib/sorteio';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import { useKeepAwake } from 'expo-keep-awake';

// ─── Modal de configuração de duração ────────────────────────────────────────
interface ModalDuracaoProps {
  visivel: boolean;
  duracao: number;
  onConfirmar: (duracao: number) => void;
  onCancelar: () => void;
}

function ModalDuracao({ visivel, duracao, onConfirmar, onCancelar }: ModalDuracaoProps) {
  const colors = useColors();
  const [minutos, setMinutos] = useState(String(Math.floor(duracao / 60)));

  React.useEffect(() => {
    setMinutos(String(Math.floor(duracao / 60)));
  }, [visivel, duracao]);

  function salvar() {
    const m = Math.max(1, Math.min(120, parseInt(minutos) || 45));
    onConfirmar(m * 60);
  }

  return (
    <Modal visible={visivel} animationType="fade" transparent onRequestClose={onCancelar}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground, marginBottom: 16 }}>
            Duração da Partida
          </Text>
          <View style={{ gap: 12, marginBottom: 20 }}>
            <Text style={{ fontSize: 13, color: colors.muted }}>Quantos minutos durará a partida?</Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 12
            }}>
              <TextInput
                value={minutos}
                onChangeText={setMinutos}
                keyboardType="number-pad"
                placeholder="45"
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1, paddingVertical: 12, fontSize: 18, fontWeight: '700',
                  color: colors.foreground
                }}
                returnKeyType="done"
              />
              <Text style={{ fontSize: 16, color: colors.muted }}>min</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={onCancelar}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 12, borderRadius: 10,
                backgroundColor: colors.border, opacity: pressed ? 0.7 : 1,
                alignItems: 'center'
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.muted }}>Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={salvar}
              style={({ pressed }) => ({
                flex: 1, paddingVertical: 12, borderRadius: 10,
                backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1,
                alignItems: 'center'
              })}
            >
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFFFFF' }}>Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Modal de resumo antes de encerrar ───────────────────────────────────────
interface ModalResumoProps {
  visivel: boolean;
  times: TimePartida[];
  duracao: number;
  onConfirmar: () => void;
  onCancelar: () => void;
}

function ModalResumo({ visivel, times, duracao, onConfirmar, onCancelar }: ModalResumoProps) {
  const colors = useColors();

  const totalGols = times.reduce((acc, t) => acc + t.totalGols, 0);
  const vencedor = [...times].sort((a, b) => b.totalGols - a.totalGols)[0];
  const empate = times.every((t) => t.totalGols === vencedor.totalGols);

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancelar}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: colors.border
        }}>
          <Pressable onPress={onCancelar} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 16, color: colors.muted }}>Voltar</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>Resumo da Partida</Text>
          <View style={{ width: 50 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
          {/* Resultado */}
          <View style={{
            backgroundColor: colors.surface, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: colors.border, alignItems: 'center'
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 12 }}>
              RESULTADO FINAL
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {times.map((t, i) => (
                <React.Fragment key={t.id}>
                  {i > 0 && (
                    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.muted }}>×</Text>
                  )}
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: t.cor, marginBottom: 4 }} />
                    <Text style={{ fontSize: 32, fontWeight: '800', color: t.cor }}>{t.totalGols}</Text>
                    <Text style={{ fontSize: 12, color: colors.foreground, fontWeight: '600' }}>{t.nome}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
            {!empate && (
              <View style={{
                marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
                backgroundColor: vencedor.cor + '20', borderRadius: 20
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: vencedor.cor }}>
                  🏆 {vencedor.nome} venceu!
                </Text>
              </View>
            )}
            {empate && (
              <View style={{
                marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
                backgroundColor: colors.border, borderRadius: 20
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted }}>🤝 Empate!</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>⏱ {formatarDuracao(duracao)}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>Duração</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>{totalGols}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>Gols</Text>
              </View>
            </View>
          </View>

          {/* Detalhes por time */}
          {times.map((time) => (
            <View
              key={time.id}
              style={{
                borderRadius: 14, overflow: 'hidden',
                borderWidth: 2, borderColor: time.cor
              }}
            >
              <View style={{ backgroundColor: time.cor, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                  {time.nome} — {time.totalGols} gols
                </Text>
              </View>

              {/* Goleiro */}
              {time.goleiro && (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingHorizontal: 14, paddingVertical: 10,
                  backgroundColor: colors.surface, borderBottomWidth: 0.5, borderBottomColor: colors.border
                }}>
                  <Text style={{ fontSize: 16 }}>🧤</Text>
                  <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }}>{time.goleiro.nome}</Text>
                  {time.goleiro.gols > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 14 }}>⚽</Text>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: time.cor }}>{time.goleiro.gols}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Jogadores */}
              {time.jogadores
                .slice()
                .sort((a, b) => b.gols - a.gols)
                .map((j, idx) => (
                  <View
                    key={j.jogadorId}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingHorizontal: 14, paddingVertical: 10,
                      backgroundColor: idx % 2 === 0 ? colors.surface : colors.background,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: colors.foreground, flex: 1 }}>{j.nome}</Text>
                    {j.gols > 0 ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14 }}>⚽</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: time.cor }}>{j.gols}</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 13, color: colors.muted }}>—</Text>
                    )}
                  </View>
                ))}
            </View>
          ))}
        </ScrollView>

        {/* Botões */}
        <View style={{ padding: 16, paddingBottom: 32, gap: 10 }}>
          <Pressable
            onPress={onConfirmar}
            style={({ pressed }) => ({
              backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }]
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              ✓ Encerrar e Salvar
            </Text>
          </Pressable>
          <Pressable
            onPress={onCancelar}
            style={({ pressed }) => ({
              backgroundColor: colors.border, borderRadius: 14, paddingVertical: 16,
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: colors.muted, fontSize: 17, fontWeight: '700' }}>
              ← Voltar para Partida
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Componente de jogador com gols ──────────────────────────────────────────
interface ItemJogadorGolProps {
  jogador: JogadorGol;
  timeId: string;
  corTime: string;
  isGoleiro?: boolean;
  onGol: () => void;
  onDesfazer: () => void;
}

function ItemJogadorGol({ jogador, corTime, isGoleiro, onGol, onDesfazer }: ItemJogadorGolProps) {
  const colors = useColors();

  return (
    <View style={[
      styles.itemJogador,
      { backgroundColor: colors.surface, borderColor: colors.border }
    ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <View style={[
          styles.avatarJogador,
          { backgroundColor: isGoleiro ? '#FF8F00' : corTime + '25' }
        ]}>
          <Text style={{ fontSize: 16 }}>{isGoleiro ? '🧤' : '⚽'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
            {jogador.nome}
          </Text>
          {isGoleiro && (
            <Text style={{ fontSize: 11, color: '#FF8F00', fontWeight: '500' }}>Goleiro</Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {/* Gols marcados */}
        <View style={{ flexDirection: 'row', gap: 3, minWidth: 40, justifyContent: 'center' }}>
          {Array.from({ length: Math.min(jogador.gols, 5) }, (_, i) => (
            <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: corTime }} />
          ))}
          {jogador.gols > 5 && (
            <Text style={{ fontSize: 11, color: corTime, fontWeight: '700' }}>+{jogador.gols - 5}</Text>
          )}
        </View>

        <Text style={{ fontSize: 20, fontWeight: '700', color: corTime, minWidth: 24, textAlign: 'center' }}>
          {jogador.gols}
        </Text>

        {/* Botão desfazer */}
        {jogador.gols > 0 && (
          <Pressable
            onPress={onDesfazer}
            style={({ pressed }) => [styles.btnGol, { backgroundColor: '#EF444420', opacity: pressed ? 0.7 : 1 }]}
          >
            <IconSymbol name="arrow.counterclockwise" size={14} color="#EF4444" />
          </Pressable>
        )}

        {/* Botão gol */}
        <Pressable
          onPress={onGol}
          style={({ pressed }) => [
            styles.btnGol,
            { backgroundColor: corTime, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] }
          ]}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>+1</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Card de time ─────────────────────────────────────────────────────────────
interface CardTimeProps {
  time: TimePartida;
  onGol: (timeId: string, jogadorId: string, isGoleiro: boolean) => void;
  onDesfazer: (timeId: string, jogadorId: string, isGoleiro: boolean) => void;
}

function CardTime({ time, onGol, onDesfazer }: CardTimeProps) {
  const colors = useColors();

  return (
    <View style={[styles.cardTime, { borderColor: time.cor, backgroundColor: colors.surface }]}>
      {/* Header do time */}
      <View style={[styles.headerTime, { backgroundColor: time.cor }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', flex: 1 }}>{time.nome}</Text>
          <View style={[styles.placarBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF' }}>{time.totalGols}</Text>
          </View>
        </View>
      </View>

      {/* Goleiro */}
      {time.goleiro && (
        <ItemJogadorGol
          jogador={time.goleiro}
          timeId={time.id}
          corTime={time.cor}
          isGoleiro
          onGol={() => onGol(time.id, time.goleiro!.jogadorId, true)}
          onDesfazer={() => onDesfazer(time.id, time.goleiro!.jogadorId, true)}
        />
      )}

      {/* Jogadores */}
      {time.jogadores.map((j) => (
        <ItemJogadorGol
          key={j.jogadorId}
          jogador={j}
          timeId={time.id}
          corTime={time.cor}
          onGol={() => onGol(time.id, j.jogadorId, false)}
          onDesfazer={() => onDesfazer(time.id, j.jogadorId, false)}
        />
      ))}
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function PartidaScreen() {
  const { estado, registrarGol, desfazerGol, encerrarPartida, atualizarDuracao } = useApp();
  const colors = useColors();
  const router = useRouter();
  const [cronometroAtivo, setCronometroAtivo] = useState(true);
  const [segundos, setSegundos] = useState(0);
  const [duracaoTotal, setDuracaoTotal] = useState(45 * 60);
  const [modalDuracaoVisivel, setModalDuracaoVisivel] = useState(false);
  const [modalResumoVisivel, setModalResumoVisivel] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ✅ Ref para evitar stale closure no intervalo
  const segundosRef = useRef(0);

  useKeepAwake();

  const partida = estado.partidaAtual;

  // ✅ CORREÇÃO: cronômetro sem chamar dispatch dentro do setState updater
  useEffect(() => {
    if (cronometroAtivo && segundos < duracaoTotal) {
      intervalRef.current = setInterval(() => {
        // Incrementa ref e state separadamente — sem dispatch dentro do updater
        segundosRef.current += 1;
        setSegundos(segundosRef.current);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [cronometroAtivo, duracaoTotal]);
  // Nota: removemos `segundos` das deps para não recriar o intervalo a cada tick

  // ✅ CORREÇÃO: sincronizar duração com o contexto global em effect separado
  useEffect(() => {
    atualizarDuracao(segundos);
  }, [segundos]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirecionar se não há partida
  useEffect(() => {
    if (!partida && !estado.carregando) {
      router.replace('/sorteio' as any);
    }
  }, [partida, estado.carregando]);

  const handleGol = useCallback((timeId: string, jogadorId: string, isGoleiro: boolean) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    registrarGol(timeId, jogadorId, isGoleiro);
  }, [registrarGol]);

  const handleDesfazer = useCallback((timeId: string, jogadorId: string, isGoleiro: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    desfazerGol(timeId, jogadorId, isGoleiro);
  }, [desfazerGol]);

  function abrirResumo() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCronometroAtivo(false);
    setModalResumoVisivel(true);
  }

  function confirmarEncerrar() {
    encerrarPartida();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalResumoVisivel(false);
    router.replace('/historico' as any);
  }

  if (!partida) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.muted }}>Carregando partida...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const tempoRestante = Math.max(0, duracaoTotal - segundos);
  const percentualTempo = duracaoTotal > 0 ? Math.min(segundos / duracaoTotal, 1) : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header fixo - Placar e Cronômetro */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {partida.times.map((t, i) => (
              <React.Fragment key={t.id}>
                {i > 0 && <Text style={{ fontSize: 14, color: colors.muted, fontWeight: '700' }}>×</Text>}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.cor }} />
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.foreground }}>{t.totalGols}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>Placar</Text>
        </View>

        {/* Cronômetro */}
        <Pressable
          onPress={() => {
            setCronometroAtivo((v) => !v);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={[styles.cronometro, { backgroundColor: cronometroAtivo ? colors.primary + '20' : colors.border + '40' }]}
        >
          <IconSymbol name="timer" size={14} color={cronometroAtivo ? colors.primary : colors.muted} />
          <Text style={{ fontSize: 16, fontWeight: '700', color: cronometroAtivo ? colors.primary : colors.muted }}>
            {formatarDuracao(tempoRestante)}
          </Text>
        </Pressable>

        {/* Botão de configurar duração */}
        <Pressable
          onPress={() => setModalDuracaoVisivel(true)}
          style={({ pressed }) => ({
            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
            backgroundColor: colors.border, opacity: pressed ? 0.7 : 1
          })}
        >
          <IconSymbol name="ellipsis" size={18} color={colors.muted} />
        </Pressable>
      </View>

      {/* Barra de progresso do tempo */}
      <View style={{ height: 3, backgroundColor: colors.border }}>
        <View style={{
          height: 3,
          backgroundColor: percentualTempo > 0.8 ? '#EF4444' : colors.primary,
          width: `${percentualTempo * 100}%`
        }} />
      </View>

      {/* Lista de times */}
      <ScrollView
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {partida.times.map((time) => (
          <CardTime
            key={time.id}
            time={time}
            onGol={handleGol}
            onDesfazer={handleDesfazer}
          />
        ))}
      </ScrollView>

      {/* Botão flutuante de encerrar */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.border
      }}>
        <Pressable
          onPress={abrirResumo}
          style={({ pressed }) => ({
            backgroundColor: '#EF4444',
            borderRadius: 14,
            paddingVertical: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          })}
        >
          <IconSymbol name="flag.fill" size={18} color="#FFFFFF" />
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Encerrar Partida</Text>
        </Pressable>
      </View>

      {/* Modais */}
      <ModalDuracao
        visivel={modalDuracaoVisivel}
        duracao={duracaoTotal}
        onConfirmar={(d) => {
          setDuracaoTotal(d);
          setModalDuracaoVisivel(false);
        }}
        onCancelar={() => setModalDuracaoVisivel(false)}
      />

      <ModalResumo
        visivel={modalResumoVisivel}
        times={partida.times}
        duracao={segundos}
        onConfirmar={confirmarEncerrar}
        onCancelar={() => {
          setModalResumoVisivel(false);
          setCronometroAtivo(true);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cronometro: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
  },
  cardTime: {
    borderRadius: 16, overflow: 'hidden', borderWidth: 2,
  },
  headerTime: {
    paddingHorizontal: 14, paddingVertical: 12,
  },
  placarBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
  },
  itemJogador: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  avatarJogador: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  btnGol: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
});
