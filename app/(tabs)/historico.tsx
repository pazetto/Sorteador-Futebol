import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { Partida, TimePartida } from '@/lib/types';
import { formatarDataHora, formatarDuracao, MESES } from '@/lib/sorteio';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

// ─── Modal de detalhes da partida ─────────────────────────────────────────────
interface ModalDetalhesProps {
  partida: Partida | null;
  onFechar: () => void;
}

function ModalDetalhes({ partida, onFechar }: ModalDetalhesProps) {
  const colors = useColors();
  if (!partida) return null;

  const vencedor = [...partida.times].sort((a, b) => b.totalGols - a.totalGols)[0];
  const empate = partida.times.every((t) => t.totalGols === vencedor.totalGols);

  return (
    <Modal visible={!!partida} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
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
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>Detalhes da Partida</Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>{formatarDataHora(partida.data)}</Text>
          </View>
          <View style={{ width: 22 }} />
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
              {partida.times.map((t, i) => (
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
            <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>
              ⏱ Duração: {formatarDuracao(partida.duracaoSegundos)}
            </Text>
          </View>

          {/* Gols por time */}
          {partida.times.map((time) => (
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
                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 14 }}>⚽</Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: time.cor }}>{time.goleiro.gols}</Text>
                      </View>
                      {(time.goleiro.minutosGols ?? []).length > 0 && (
                        <Text style={{ fontSize: 11, color: colors.muted }}>
                          {(time.goleiro.minutosGols ?? []).map(m => `${m}'`).join('  ')}
                        </Text>
                      )}
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
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 14 }}>⚽</Text>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: time.cor }}>{j.gols}</Text>
                        </View>
                        {(j.minutosGols ?? []).length > 0 && (
                          <Text style={{ fontSize: 11, color: colors.muted }}>
                            {(j.minutosGols ?? []).map(m => `${m}'`).join('  ')}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={{ fontSize: 13, color: colors.muted }}>—</Text>
                    )}
                  </View>
                ))}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Card de partida na lista ─────────────────────────────────────────────────
interface CardPartidaProps {
  partida: Partida;
  onPress: () => void;
}

function CardPartida({ partida, onPress }: CardPartidaProps) {
  const colors = useColors();
  const vencedor = [...partida.times].sort((a, b) => b.totalGols - a.totalGols)[0];
  const empate = partida.times.every((t) => t.totalGols === vencedor.totalGols);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface, borderRadius: 14, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }]
      })}
    >
      {/* Data e duração */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 13, color: colors.muted }}>{formatarDataHora(partida.data)}</Text>
        <Text style={{ fontSize: 12, color: colors.muted }}>⏱ {formatarDuracao(partida.duracaoSegundos)}</Text>
      </View>

      {/* Placar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {partida.times.map((t, i) => (
          <React.Fragment key={t.id}>
            {i > 0 && (
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.muted }}>×</Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.cor }} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>{t.nome}</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.cor }}>{t.totalGols}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Resultado */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        <Text style={{ fontSize: 12, color: empate ? colors.muted : vencedor.cor, fontWeight: '600' }}>
          {empate ? '🤝 Empate' : `🏆 ${vencedor.nome}`}
        </Text>
        <IconSymbol name="chevron.right" size={16} color={colors.muted} />
      </View>
    </Pressable>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function HistoricoScreen() {
  const { estado } = useApp();
  const colors = useColors();
  const [partidaSelecionada, setPartidaSelecionada] = useState<Partida | null>(null);
  const [mesFiltro, setMesFiltro] = useState<number | null>(null);
  const [anoFiltro, setAnoFiltro] = useState<number>(new Date().getFullYear());

  const partidasFiltradas = estado.partidas.filter((p) => {
    const d = new Date(p.data);
    const matchMes = mesFiltro === null || d.getMonth() + 1 === mesFiltro;
    const matchAno = d.getFullYear() === anoFiltro;
    return matchMes && matchAno;
  });

  const anos = [...new Set(estado.partidas.map((p) => new Date(p.data).getFullYear()))].sort((a, b) => b - a);
  if (!anos.includes(anoFiltro)) anos.unshift(anoFiltro);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Histórico</Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          {estado.partidas.length} partidas registradas
        </Text>
      </View>

      {/* Filtro de ano */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
      >
        {anos.map((ano) => (
          <Pressable
            key={ano}
            onPress={() => setAnoFiltro(ano)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: anoFiltro === ano ? colors.primary : colors.surface,
              borderWidth: 1, borderColor: anoFiltro === ano ? colors.primary : colors.border
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: anoFiltro === ano ? '#FFFFFF' : colors.foreground
            }}>
              {ano}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filtro de mês */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
      >
        <Pressable
          onPress={() => setMesFiltro(null)}
          style={{
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
            backgroundColor: mesFiltro === null ? colors.primary : colors.surface,
            borderWidth: 1, borderColor: mesFiltro === null ? colors.primary : colors.border
          }}
        >
          <Text style={{
            fontSize: 13, fontWeight: '600',
            color: mesFiltro === null ? '#FFFFFF' : colors.foreground
          }}>
            Todos
          </Text>
        </Pressable>
        {MESES.map((m, i) => (
          <Pressable
            key={i}
            onPress={() => setMesFiltro(i + 1)}
            style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
              backgroundColor: mesFiltro === i + 1 ? colors.primary : colors.surface,
              borderWidth: 1, borderColor: mesFiltro === i + 1 ? colors.primary : colors.border
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: mesFiltro === i + 1 ? '#FFFFFF' : colors.foreground
            }}>
              {m.slice(0, 3)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Lista */}
      <FlatList
        data={partidasFiltradas}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <CardPartida partida={item} onPress={() => setPartidaSelecionada(item)} />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>
              Nenhuma partida encontrada
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
              {estado.partidas.length === 0
                ? 'Realize um sorteio e inicie uma partida para ver o histórico.'
                : 'Tente outro filtro de mês ou ano.'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <ModalDetalhes
        partida={partidaSelecionada}
        onFechar={() => setPartidaSelecionada(null)}
      />
    </ScreenContainer>
  );
}
