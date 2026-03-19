import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { calcularArtilharia, MESES } from '@/lib/sorteio';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';

// ─── Pódio ────────────────────────────────────────────────────────────────────
interface PodioProps {
  artilheiros: ReturnType<typeof calcularArtilharia>;
}

function Podio({ artilheiros }: PodioProps) {
  const colors = useColors();
  const top3 = artilheiros.slice(0, 3);

  if (top3.length === 0) return null;

  const posicoes = [
    { idx: 1, emoji: '🥈', cor: '#9E9E9E', altura: 80, label: '2º' },
    { idx: 0, emoji: '🥇', cor: '#FFB300', altura: 110, label: '1º' },
    { idx: 2, emoji: '🥉', cor: '#A1887F', altura: 60, label: '3º' },
  ];

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: 20, padding: 20,
      marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border
    }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.muted, textAlign: 'center', marginBottom: 16 }}>
        🏆 PÓDIO DO MÊS
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
        {posicoes.map(({ idx, emoji, cor, altura, label }) => {
          const art = top3[idx];
          if (!art) return <View key={label} style={{ width: 90 }} />;

          return (
            <View key={label} style={{ alignItems: 'center', width: 90 }}>
              <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.foreground, textAlign: 'center' }} numberOfLines={2}>
                {art.nome.split(' ')[0]}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: cor, marginTop: 2 }}>
                {art.gols}
              </Text>
              <Text style={{ fontSize: 11, color: colors.muted }}>gols</Text>
              <View style={{
                width: '100%', height: altura, borderRadius: 10,
                backgroundColor: cor + '30', marginTop: 8,
                borderWidth: 2, borderColor: cor,
                alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 8
              }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: cor }}>{label}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Item da tabela ───────────────────────────────────────────────────────────
interface ItemArtilheiroProps {
  posicao: number;
  nome: string;
  gols: number;
  partidas: number;
  posicaoJogador: string;
  maxGols: number;
}

function ItemArtilheiro({ posicao, nome, gols, partidas, posicaoJogador, maxGols }: ItemArtilheiroProps) {
  const colors = useColors();
  const progresso = maxGols > 0 ? gols / maxGols : 0;

  const medalha = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : null;

  return (
    <View style={{
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      marginBottom: 8, borderWidth: 1, borderColor: colors.border
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Posição */}
        <View style={{ width: 32, alignItems: 'center' }}>
          {medalha ? (
            <Text style={{ fontSize: 22 }}>{medalha}</Text>
          ) : (
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.muted }}>{posicao}º</Text>
          )}
        </View>

        {/* Avatar */}
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: posicaoJogador === 'goleiro' ? '#FF8F00' : colors.primary,
          alignItems: 'center', justifyContent: 'center'
        }}>
          <Text style={{ fontSize: 18 }}>{posicaoJogador === 'goleiro' ? '🧤' : '⚽'}</Text>
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>{nome}</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {posicaoJogador === 'goleiro' ? 'Goleiro' : 'Jogador'} · {partidas} partida{partidas !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Gols */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{gols}</Text>
          <Text style={{ fontSize: 11, color: colors.muted }}>gols</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={{ marginTop: 10, height: 4, backgroundColor: colors.border, borderRadius: 2 }}>
        <View style={{
          height: 4, borderRadius: 2,
          backgroundColor: colors.primary,
          width: `${progresso * 100}%`
        }} />
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function ArtilhariaScreen() {
  const { estado } = useApp();
  const colors = useColors();
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());
  const [mostrarSeletorMes, setMostrarSeletorMes] = useState(false);

  const artilharia = calcularArtilharia(estado.partidas, mes, ano);
  const maxGols = artilharia[0]?.gols ?? 0;

  const anos = [...new Set([
    ano,
    ...estado.partidas.map((p) => new Date(p.data).getFullYear())
  ])].sort((a, b) => b - a);

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Artilharia</Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          Ranking de gols por período
        </Text>
      </View>

      {/* Seletor de período */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: colors.surface, borderRadius: 12, padding: 12,
          borderWidth: 1, borderColor: colors.border
        }}>
          <IconSymbol name="calendar" size={18} color={colors.primary} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.foreground }}>
            {MESES[mes - 1]} de {ano}
          </Text>
          <Pressable
            onPress={() => setMostrarSeletorMes(!mostrarSeletorMes)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, flexDirection: 'row', alignItems: 'center', gap: 4 })}
          >
            <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>Alterar</Text>
            <IconSymbol name={mostrarSeletorMes ? 'chevron.up' : 'chevron.down'} size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Seletor expandido */}
        {mostrarSeletorMes && (
          <View style={{
            backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginTop: 8,
            borderWidth: 1, borderColor: colors.border
          }}>
            {/* Ano */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>ANO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 12 }}>
              {anos.map((a) => (
                <Pressable
                  key={a}
                  onPress={() => setAno(a)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: ano === a ? colors.primary : colors.background,
                    borderWidth: 1, borderColor: ano === a ? colors.primary : colors.border
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: ano === a ? '#FFFFFF' : colors.foreground }}>
                    {a}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Mês */}
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>MÊS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MESES.map((m, i) => (
                <Pressable
                  key={i}
                  onPress={() => { setMes(i + 1); setMostrarSeletorMes(false); }}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: mes === i + 1 ? colors.primary : colors.background,
                    borderWidth: 1, borderColor: mes === i + 1 ? colors.primary : colors.border
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: mes === i + 1 ? '#FFFFFF' : colors.foreground }}>
                    {m.slice(0, 3)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {artilharia.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏆</Text>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>
            Nenhum gol registrado
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
            Realize partidas em {MESES[mes - 1]} de {ano} para ver a artilharia.
          </Text>
        </View>
      ) : (
        <FlatList
          data={artilharia}
          keyExtractor={(a) => a.jogadorId}
          ListHeaderComponent={<Podio artilheiros={artilharia} />}
          renderItem={({ item, index }) => (
            <View style={{ paddingHorizontal: 16 }}>
              {index === 3 && artilharia.length > 3 && (
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 8, marginTop: 4 }}>
                  RANKING COMPLETO
                </Text>
              )}
              <ItemArtilheiro
                posicao={index + 1}
                nome={item.nome}
                gols={item.gols}
                partidas={item.partidas}
                posicaoJogador={item.posicao}
                maxGols={maxGols}
              />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}
