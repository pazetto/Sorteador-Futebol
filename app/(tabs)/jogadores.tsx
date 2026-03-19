import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput, Modal,
  Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useApp } from '@/lib/app-context';
import { Jogador, Posicao } from '@/lib/types';
import { gerarId } from '@/lib/sorteio';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// ─── Parser de CSV ─────────────────────────────────────────────────────────────
const COLUNAS_OBRIGATORIAS = ['nome', 'posicao', 'nivel', 'idade', 'peso'] as const;

interface ResultadoImportacao {
  importados: Jogador[];
  erros: string[];
}

function parsearCSV(conteudo: string): ResultadoImportacao {
  const linhas = conteudo
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  if (linhas.length < 2) {
    return { importados: [], erros: ['Arquivo CSV vazio ou sem dados.'] };
  }

  // Detecta separador (vírgula ou ponto-e-vírgula)
  const separador = linhas[0].includes(';') ? ';' : ',';
  const cabecalho = linhas[0].split(separador).map((c) => c.trim().toLowerCase().replace(/['"]/g, ''));

  // Valida se todas as colunas obrigatórias existem
  const faltando = COLUNAS_OBRIGATORIAS.filter((col) => !cabecalho.includes(col));
  if (faltando.length > 0) {
    return {
      importados: [],
      erros: [`Colunas obrigatórias ausentes: ${faltando.join(', ')}.\n\nO CSV deve conter: nome, posicao, nivel, idade, peso`],
    };
  }

  const idx = {
    nome: cabecalho.indexOf('nome'),
    posicao: cabecalho.indexOf('posicao'),
    nivel: cabecalho.indexOf('nivel'),
    idade: cabecalho.indexOf('idade'),
    peso: cabecalho.indexOf('peso'),
  };

  const importados: Jogador[] = [];
  const erros: string[] = [];

  linhas.slice(1).forEach((linha, i) => {
    const num = i + 2; // número da linha no arquivo
    const cols = linha.split(separador).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    const nome = cols[idx.nome] ?? '';
    const posicaoRaw = (cols[idx.posicao] ?? '').toLowerCase();
    const nivelRaw = parseInt(cols[idx.nivel] ?? '');
    const idadeRaw = parseInt(cols[idx.idade] ?? '');
    const pesoRaw = parseInt(cols[idx.peso] ?? '');

    if (!nome) { erros.push(`Linha ${num}: nome vazio.`); return; }

    const posicao = posicaoRaw === 'goleiro' ? 'goleiro' : posicaoRaw === 'jogador' ? 'jogador' : null;
    if (!posicao) { erros.push(`Linha ${num} (${nome}): posição inválida "${posicaoRaw}". Use "jogador" ou "goleiro".`); return; }

    if (isNaN(nivelRaw) || nivelRaw < 1 || nivelRaw > 10) { erros.push(`Linha ${num} (${nome}): nível inválido. Use 1 a 10.`); return; }
    if (isNaN(idadeRaw) || idadeRaw < 10 || idadeRaw > 80) { erros.push(`Linha ${num} (${nome}): idade inválida. Use 10 a 80.`); return; }
    if (isNaN(pesoRaw) || pesoRaw < 30 || pesoRaw > 200) { erros.push(`Linha ${num} (${nome}): peso inválido. Use 30 a 200 kg.`); return; }

    importados.push({
      id: gerarId(),
      nome,
      posicao: posicao as Posicao,
      nivel: nivelRaw,
      idade: idadeRaw,
      peso: pesoRaw,
      criadoEm: new Date().toISOString(),
    });
  });

  return { importados, erros };
}

// ─── Modal de Adicionar/Editar Jogador ────────────────────────────────────────
interface ModalJogadorProps {
  visivel: boolean;
  jogador?: Jogador;
  onFechar: () => void;
  onSalvar: (jogador: Jogador) => void;
}

function ModalJogador({ visivel, jogador, onFechar, onSalvar }: ModalJogadorProps) {
  const colors = useColors();
  const [nome, setNome] = useState(jogador?.nome ?? '');
  const [posicao, setPosicao] = useState<Posicao>(jogador?.posicao ?? 'jogador');
  const [nivel, setNivel] = useState(String(jogador?.nivel ?? 5));
  const [idade, setIdade] = useState(String(jogador?.idade ?? 25));
  const [peso, setPeso] = useState(String(jogador?.peso ?? 75));

  React.useEffect(() => {
    if (visivel) {
      setNome(jogador?.nome ?? '');
      setPosicao(jogador?.posicao ?? 'jogador');
      setNivel(String(jogador?.nivel ?? 5));
      setIdade(String(jogador?.idade ?? 25));
      setPeso(String(jogador?.peso ?? 75));
    }
  }, [visivel, jogador]);

  function salvar() {
    if (!nome.trim()) {
      Alert.alert('Atenção', 'Digite o nome do jogador.');
      return;
    }
    const nivelNum = Math.min(10, Math.max(1, parseInt(nivel) || 5));
    const idadeNum = Math.min(80, Math.max(10, parseInt(idade) || 25));
    const pesoNum = Math.min(200, Math.max(30, parseInt(peso) || 75));

    onSalvar({
      id: jogador?.id ?? gerarId(),
      nome: nome.trim(),
      posicao,
      nivel: nivelNum,
      idade: idadeNum,
      peso: pesoNum,
      criadoEm: jogador?.criadoEm ?? new Date().toISOString(),
    });
  }

  return (
    <Modal visible={visivel} animationType="slide" presentationStyle="pageSheet" onRequestClose={onFechar}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: colors.border
        }}>
          <Pressable onPress={onFechar} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 16, color: colors.muted }}>Cancelar</Text>
          </Pressable>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.foreground }}>
            {jogador ? 'Editar Jogador' : 'Novo Jogador'}
          </Text>
          <Pressable onPress={salvar} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Text style={{ fontSize: 16, color: colors.primary, fontWeight: '600' }}>Salvar</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          {/* Nome */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
              NOME *
            </Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome do jogador"
              placeholderTextColor={colors.muted}
              style={{
                backgroundColor: colors.surface, borderRadius: 10, padding: 14,
                fontSize: 16, color: colors.foreground, borderWidth: 1, borderColor: colors.border
              }}
              returnKeyType="done"
              autoFocus
            />
          </View>

          {/* Posição */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
              POSIÇÃO
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['jogador', 'goleiro'] as Posicao[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPosicao(p)}
                  style={{
                    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
                    backgroundColor: posicao === p ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: posicao === p ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{
                    fontSize: 15, fontWeight: '600',
                    color: posicao === p ? '#FFFFFF' : colors.foreground
                  }}>
                    {p === 'jogador' ? '⚽ Jogador' : '🧤 Goleiro'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Nível */}
          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
              NÍVEL (1-10)
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => setNivel(String(Math.max(1, parseInt(nivel || '5') - 1)))}
                style={{
                  width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
                }}
              >
                <IconSymbol name="minus" size={20} color={colors.foreground} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {Array.from({ length: 10 }, (_, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setNivel(String(i + 1))}
                      style={{
                        flex: 1, height: 8, borderRadius: 4,
                        backgroundColor: i < parseInt(nivel || '0') ? colors.primary : colors.border,
                      }}
                    />
                  ))}
                </View>
                <Text style={{ textAlign: 'center', marginTop: 6, fontSize: 16, fontWeight: '700', color: colors.foreground }}>
                  {nivel}
                </Text>
              </View>
              <Pressable
                onPress={() => setNivel(String(Math.min(10, parseInt(nivel || '5') + 1)))}
                style={{
                  width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border
                }}
              >
                <IconSymbol name="plus" size={20} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Idade e Peso */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
                IDADE (anos)
              </Text>
              <TextInput
                value={idade}
                onChangeText={setIdade}
                keyboardType="number-pad"
                placeholder="25"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface, borderRadius: 10, padding: 14,
                  fontSize: 16, color: colors.foreground, borderWidth: 1, borderColor: colors.border,
                  textAlign: 'center'
                }}
                returnKeyType="done"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 8 }}>
                PESO (kg)
              </Text>
              <TextInput
                value={peso}
                onChangeText={setPeso}
                keyboardType="number-pad"
                placeholder="75"
                placeholderTextColor={colors.muted}
                style={{
                  backgroundColor: colors.surface, borderRadius: 10, padding: 14,
                  fontSize: 16, color: colors.foreground, borderWidth: 1, borderColor: colors.border,
                  textAlign: 'center'
                }}
                returnKeyType="done"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Item de jogador na lista ─────────────────────────────────────────────────
interface ItemJogadorProps {
  jogador: Jogador;
  onEditar: () => void;
  onExcluir: () => void;
}

function ItemJogador({ jogador, onEditar, onExcluir }: ItemJogadorProps) {
  const colors = useColors();

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 12,
      padding: 14, marginBottom: 8, gap: 12,
      borderWidth: 1, borderColor: colors.border
    }}>
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: jogador.posicao === 'goleiro' ? '#FF8F00' : colors.primary,
        alignItems: 'center', justifyContent: 'center'
      }}>
        <Text style={{ fontSize: 20 }}>{jogador.posicao === 'goleiro' ? '🧤' : '⚽'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: colors.foreground }}>{jogador.nome}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 3 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            {jogador.posicao === 'goleiro' ? 'Goleiro' : 'Jogador'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>·</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{jogador.idade} anos</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>·</Text>
          <Text style={{ fontSize: 12, color: colors.muted }}>{jogador.peso} kg</Text>
        </View>
      </View>
      {/* Nível visual */}
      <View style={{ alignItems: 'center', marginRight: 4 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.primary }}>{jogador.nivel}</Text>
        <Text style={{ fontSize: 10, color: colors.muted }}>nível</Text>
      </View>
      <Pressable
        onPress={onEditar}
        style={({ pressed }) => ({
          padding: 8, borderRadius: 8, opacity: pressed ? 0.6 : 1,
          backgroundColor: colors.background
        })}
      >
        <IconSymbol name="pencil" size={18} color={colors.muted} />
      </Pressable>
      <Pressable
        onPress={onExcluir}
        style={({ pressed }) => ({
          padding: 8, borderRadius: 8, opacity: pressed ? 0.6 : 1,
          backgroundColor: colors.background
        })}
      >
        <IconSymbol name="trash" size={18} color="#EF4444" />
      </Pressable>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export default function JogadoresScreen() {
  const { estado, adicionarJogador, editarJogador, removerJogador } = useApp();
  const colors = useColors();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'jogador' | 'goleiro'>('todos');
  const [modalVisivel, setModalVisivel] = useState(false);
  const [jogadorEditando, setJogadorEditando] = useState<Jogador | undefined>();
  const [importando, setImportando] = useState(false);

  const importarCSV = useCallback(async () => {
    try {
      setImportando(true);
      const resultado = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (resultado.canceled) return;

      const arquivo = resultado.assets[0];
      if (!arquivo?.uri) return;

      // FileSystem.readAsStringAsync funciona corretamente com URIs locais
      // tanto no iOS (file://) quanto no Android (content://)
      const conteudo = await FileSystem.readAsStringAsync(arquivo.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const { importados, erros } = parsearCSV(conteudo);

      if (importados.length === 0) {
        Alert.alert(
          '❌ Importação falhou',
          erros.length > 0 ? erros.join('\n') : 'Nenhum jogador válido encontrado.',
        );
        return;
      }

      const mensagemErros = erros.length > 0
        ? `\n\n⚠️ ${erros.length} linha(s) ignorada(s):\n${erros.slice(0, 3).join('\n')}${erros.length > 3 ? `\n... e mais ${erros.length - 3}` : ''}`
        : '';

      Alert.alert(
        '✅ Importar Jogadores',
        `${importados.length} jogador(es) encontrado(s).${mensagemErros}\n\nDeseja importar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar',
            onPress: () => {
              importados.forEach((j) => adicionarJogador(j));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('✅ Sucesso', `${importados.length} jogador(es) importado(s)!`);
            },
          },
        ]
      );
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível ler o arquivo. Verifique se é um CSV válido.');
    } finally {
      setImportando(false);
    }
  }, [adicionarJogador]);

  const jogadoresFiltrados = estado.jogadores.filter((j) => {
    const matchBusca = j.nome.toLowerCase().includes(busca.toLowerCase());
    const matchFiltro = filtro === 'todos' || j.posicao === filtro;
    return matchBusca && matchFiltro;
  });

  const abrirAdicionar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJogadorEditando(undefined);
    setModalVisivel(true);
  }, []);

  const abrirEditar = useCallback((jogador: Jogador) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJogadorEditando(jogador);
    setModalVisivel(true);
  }, []);

  const confirmarExcluir = useCallback((jogador: Jogador) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Excluir Jogador',
      `Deseja excluir "${jogador.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: () => {
            removerJogador(jogador.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        },
      ]
    );
  }, [removerJogador]);

  const salvarJogador = useCallback((jogador: Jogador) => {
    if (jogadorEditando) {
      editarJogador(jogador);
    } else {
      adicionarJogador(jogador);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisivel(false);
  }, [jogadorEditando, editarJogador, adicionarJogador]);

  const goleiros = estado.jogadores.filter((j) => j.posicao === 'goleiro').length;
  const jogadoresLinha = estado.jogadores.filter((j) => j.posicao === 'jogador').length;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12
      }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>Jogadores</Text>
          <Text style={{ fontSize: 13, color: colors.muted }}>
            {jogadoresLinha} jogadores · {goleiros} goleiros
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Botão Importar CSV */}
          <Pressable
            onPress={importarCSV}
            disabled={importando}
            style={({ pressed }) => ({
              backgroundColor: colors.surface, borderRadius: 12,
              paddingHorizontal: 12, paddingVertical: 10,
              flexDirection: 'row', alignItems: 'center', gap: 6,
              opacity: pressed || importando ? 0.6 : 1,
              borderWidth: 1, borderColor: colors.border,
            })}
          >
            <Text style={{ fontSize: 15 }}>📥</Text>
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 13 }}>CSV</Text>
          </Pressable>
          {/* Botão Adicionar */}
          <Pressable
            onPress={abrirAdicionar}
            style={({ pressed }) => ({
              backgroundColor: colors.primary, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 10,
              flexDirection: 'row', alignItems: 'center', gap: 6,
              opacity: pressed ? 0.8 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }]
            })}
          >
            <IconSymbol name="plus" size={18} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Adicionar</Text>
          </Pressable>
        </View>
      </View>

      {/* Busca */}
      <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 12,
          borderWidth: 1, borderColor: colors.border
        }}>
          <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar jogador..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, paddingVertical: 11, fontSize: 15, color: colors.foreground }}
            returnKeyType="search"
          />
          {busca.length > 0 && (
            <Pressable onPress={() => setBusca('')}>
              <IconSymbol name="xmark" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'jogador', label: '⚽ Jogadores' },
          { key: 'goleiro', label: '🧤 Goleiros' },
        ].map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setFiltro(f.key as any)}
            style={{
              paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
              backgroundColor: filtro === f.key ? colors.primary : colors.surface,
              borderWidth: 1, borderColor: filtro === f.key ? colors.primary : colors.border
            }}
          >
            <Text style={{
              fontSize: 13, fontWeight: '600',
              color: filtro === f.key ? '#FFFFFF' : colors.foreground
            }}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Lista */}
      <FlatList
        data={jogadoresFiltrados}
        keyExtractor={(j) => j.id}
        renderItem={({ item }) => (
          <ItemJogador
            jogador={item}
            onEditar={() => abrirEditar(item)}
            onExcluir={() => confirmarExcluir(item)}
          />
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>
              {busca ? '🔍' : '👥'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>
              {busca ? 'Nenhum jogador encontrado' : 'Nenhum jogador cadastrado'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 6 }}>
              {busca ? 'Tente outro nome' : 'Toque em "Adicionar" para cadastrar jogadores'}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <ModalJogador
        visivel={modalVisivel}
        jogador={jogadorEditando}
        onFechar={() => setModalVisivel(false)}
        onSalvar={salvarJogador}
      />
    </ScreenContainer>
  );
}
