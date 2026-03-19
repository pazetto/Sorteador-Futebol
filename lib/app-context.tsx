import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Jogador, Partida, ConfigSorteio, Time, Rodada, ConfrontoJogado } from './types';

// ─── Chaves de armazenamento ────────────────────────────────────────────────
const STORAGE_KEYS = {
  JOGADORES: '@futsorteio:jogadores',
  PARTIDAS: '@futsorteio:partidas',
  PARTIDA_ATUAL: '@futsorteio:partida_atual',
  RODADA_ATUAL: '@futsorteio:rodada_atual',
};

// ─── Estado global ──────────────────────────────────────────────────────────
interface AppState {
  jogadores: Jogador[];
  partidas: Partida[];
  partidaAtual: Partida | null;
  rodadaAtual: Rodada | null;
  carregando: boolean;
}

const estadoInicial: AppState = {
  jogadores: [],
  partidas: [],
  partidaAtual: null,
  rodadaAtual: null,
  carregando: true,
};

// ─── Ações ──────────────────────────────────────────────────────────────────
type Acao =
  | { tipo: 'CARREGAR_DADOS'; jogadores: Jogador[]; partidas: Partida[]; partidaAtual: Partida | null; rodadaAtual: Rodada | null }
  | { tipo: 'ADICIONAR_JOGADOR'; jogador: Jogador }
  | { tipo: 'EDITAR_JOGADOR'; jogador: Jogador }
  | { tipo: 'REMOVER_JOGADOR'; id: string }
  | { tipo: 'INICIAR_PARTIDA'; partida: Partida }
  | { tipo: 'REGISTRAR_GOL'; timeId: string; jogadorId: string; isGoleiro: boolean; segundos: number }
  | { tipo: 'DESFAZER_GOL'; timeId: string; jogadorId: string; isGoleiro: boolean }
  | { tipo: 'ENCERRAR_PARTIDA' }
  | { tipo: 'ATUALIZAR_DURACAO'; segundos: number }
  | { tipo: 'SALVAR_RODADA'; rodada: Rodada }
  | { tipo: 'LIMPAR_RODADA' }
  | { tipo: 'REGISTRAR_CONFRONTO'; timeId1: string; timeId2: string; partidaId: string };

function reducer(estado: AppState, acao: Acao): AppState {
  switch (acao.tipo) {
    case 'CARREGAR_DADOS':
      return {
        ...estado,
        jogadores: acao.jogadores,
        partidas: acao.partidas,
        partidaAtual: acao.partidaAtual,
        rodadaAtual: acao.rodadaAtual,
        carregando: false,
      };

    case 'ADICIONAR_JOGADOR':
      return { ...estado, jogadores: [...estado.jogadores, acao.jogador] };

    case 'EDITAR_JOGADOR':
      return {
        ...estado,
        jogadores: estado.jogadores.map((j) => (j.id === acao.jogador.id ? acao.jogador : j)),
      };

    case 'REMOVER_JOGADOR':
      return { ...estado, jogadores: estado.jogadores.filter((j) => j.id !== acao.id) };

    case 'INICIAR_PARTIDA':
      return { ...estado, partidaAtual: acao.partida };

    case 'REGISTRAR_GOL': {
      if (!estado.partidaAtual) return estado;
      const minuto = Math.floor(acao.segundos / 60);
      const times = estado.partidaAtual.times.map((t) => {
        if (t.id !== acao.timeId) return t;
        if (acao.isGoleiro && t.goleiro?.jogadorId === acao.jogadorId) {
          return {
            ...t,
            goleiro: {
              ...t.goleiro!,
              gols: t.goleiro!.gols + 1,
              minutosGols: [...(t.goleiro!.minutosGols ?? []), minuto],
            },
            totalGols: t.totalGols + 1,
          };
        }
        return {
          ...t,
          jogadores: t.jogadores.map((j) =>
            j.jogadorId === acao.jogadorId
              ? { ...j, gols: j.gols + 1, minutosGols: [...(j.minutosGols ?? []), minuto] }
              : j
          ),
          totalGols: t.totalGols + 1,
        };
      });
      return { ...estado, partidaAtual: { ...estado.partidaAtual, times } };
    }

    case 'DESFAZER_GOL': {
      if (!estado.partidaAtual) return estado;
      const times = estado.partidaAtual.times.map((t) => {
        if (t.id !== acao.timeId) return t;
        if (acao.isGoleiro && t.goleiro?.jogadorId === acao.jogadorId) {
          const novosGols = Math.max(0, t.goleiro!.gols - 1);
          const diff = t.goleiro!.gols - novosGols;
          return {
            ...t,
            goleiro: {
              ...t.goleiro!,
              gols: novosGols,
              minutosGols: (t.goleiro!.minutosGols ?? []).slice(0, -1),
            },
            totalGols: t.totalGols - diff,
          };
        }
        const jogadoresAtualizados = t.jogadores.map((j) =>
          j.jogadorId === acao.jogadorId
            ? { ...j, gols: Math.max(0, j.gols - 1), minutosGols: (j.minutosGols ?? []).slice(0, -1) }
            : j
        );
        const diff = t.jogadores.find((j) => j.jogadorId === acao.jogadorId)?.gols ?? 0;
        const novoDiff = jogadoresAtualizados.find((j) => j.jogadorId === acao.jogadorId)?.gols ?? 0;
        return {
          ...t,
          jogadores: jogadoresAtualizados,
          totalGols: t.totalGols - (diff - novoDiff),
        };
      });
      return { ...estado, partidaAtual: { ...estado.partidaAtual, times } };
    }

    case 'ATUALIZAR_DURACAO': {
      if (!estado.partidaAtual) return estado;
      return {
        ...estado,
        partidaAtual: { ...estado.partidaAtual, duracaoSegundos: acao.segundos },
      };
    }

    case 'ENCERRAR_PARTIDA': {
      if (!estado.partidaAtual) return estado;
      const partidaEncerrada = { ...estado.partidaAtual, encerrada: true };
      return {
        ...estado,
        partidas: [partidaEncerrada, ...estado.partidas],
        partidaAtual: null,
      };
    }

    case 'SALVAR_RODADA':
      return { ...estado, rodadaAtual: acao.rodada };

    case 'LIMPAR_RODADA':
      return { ...estado, rodadaAtual: null };

    case 'REGISTRAR_CONFRONTO': {
      if (!estado.rodadaAtual) return estado;
      const confronto: ConfrontoJogado = {
        timeId1: acao.timeId1,
        timeId2: acao.timeId2,
        partidaId: acao.partidaId,
      };
      return {
        ...estado,
        rodadaAtual: {
          ...estado.rodadaAtual,
          confrontosJogados: [...estado.rodadaAtual.confrontosJogados, confronto],
        },
      };
    }

    default:
      return estado;
  }
}

// ─── Contexto ────────────────────────────────────────────────────────────────
interface AppContextValue {
  estado: AppState;
  adicionarJogador: (jogador: Jogador) => void;
  editarJogador: (jogador: Jogador) => void;
  removerJogador: (id: string) => void;
  iniciarPartida: (partida: Partida) => void;
  registrarGol: (timeId: string, jogadorId: string, isGoleiro: boolean, segundos: number) => void;
  desfazerGol: (timeId: string, jogadorId: string, isGoleiro: boolean) => void;
  encerrarPartida: () => void;
  atualizarDuracao: (segundos: number) => void;
  salvarRodada: (rodada: Rodada) => void;
  limparRodada: () => void;
  registrarConfrontoNaRodada: (timeId1: string, timeId2: string, partidaId: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [estado, dispatch] = useReducer(reducer, estadoInicial);

  // Carregar dados ao iniciar
  useEffect(() => {
    async function carregarDados() {
      try {
        const [jogadoresStr, partidasStr, partidaAtualStr, rodadaAtualStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.JOGADORES),
          AsyncStorage.getItem(STORAGE_KEYS.PARTIDAS),
          AsyncStorage.getItem(STORAGE_KEYS.PARTIDA_ATUAL),
          AsyncStorage.getItem(STORAGE_KEYS.RODADA_ATUAL),
        ]);
        dispatch({
          tipo: 'CARREGAR_DADOS',
          jogadores: jogadoresStr ? JSON.parse(jogadoresStr) : [],
          partidas: partidasStr ? JSON.parse(partidasStr) : [],
          partidaAtual: partidaAtualStr ? JSON.parse(partidaAtualStr) : null,
          rodadaAtual: rodadaAtualStr ? JSON.parse(rodadaAtualStr) : null,
        });
      } catch {
        dispatch({ tipo: 'CARREGAR_DADOS', jogadores: [], partidas: [], partidaAtual: null });
      }
    }
    carregarDados();
  }, []);

  // Persistir jogadores
  useEffect(() => {
    if (!estado.carregando) {
      AsyncStorage.setItem(STORAGE_KEYS.JOGADORES, JSON.stringify(estado.jogadores));
    }
  }, [estado.jogadores, estado.carregando]);

  // Persistir partidas
  useEffect(() => {
    if (!estado.carregando) {
      AsyncStorage.setItem(STORAGE_KEYS.PARTIDAS, JSON.stringify(estado.partidas));
    }
  }, [estado.partidas, estado.carregando]);

  // Persistir partida atual
  useEffect(() => {
    if (!estado.carregando) {
      if (estado.partidaAtual) {
        AsyncStorage.setItem(STORAGE_KEYS.PARTIDA_ATUAL, JSON.stringify(estado.partidaAtual));
      } else {
        AsyncStorage.removeItem(STORAGE_KEYS.PARTIDA_ATUAL);
      }
    }
  }, [estado.partidaAtual, estado.carregando]);

  // Persistir rodada atual
  useEffect(() => {
    if (!estado.carregando) {
      if (estado.rodadaAtual) {
        AsyncStorage.setItem(STORAGE_KEYS.RODADA_ATUAL, JSON.stringify(estado.rodadaAtual));
      } else {
        AsyncStorage.removeItem(STORAGE_KEYS.RODADA_ATUAL);
      }
    }
  }, [estado.rodadaAtual, estado.carregando]);

  const adicionarJogador = useCallback((jogador: Jogador) => {
    dispatch({ tipo: 'ADICIONAR_JOGADOR', jogador });
  }, []);

  const editarJogador = useCallback((jogador: Jogador) => {
    dispatch({ tipo: 'EDITAR_JOGADOR', jogador });
  }, []);

  const removerJogador = useCallback((id: string) => {
    dispatch({ tipo: 'REMOVER_JOGADOR', id });
  }, []);

  const iniciarPartida = useCallback((partida: Partida) => {
    dispatch({ tipo: 'INICIAR_PARTIDA', partida });
  }, []);

  const registrarGol = useCallback((timeId: string, jogadorId: string, isGoleiro: boolean, segundos: number) => {
    dispatch({ tipo: 'REGISTRAR_GOL', timeId, jogadorId, isGoleiro, segundos });
  }, []);

  const desfazerGol = useCallback((timeId: string, jogadorId: string, isGoleiro: boolean) => {
    dispatch({ tipo: 'DESFAZER_GOL', timeId, jogadorId, isGoleiro });
  }, []);

  const encerrarPartida = useCallback(() => {
    dispatch({ tipo: 'ENCERRAR_PARTIDA' });
  }, []);

  const atualizarDuracao = useCallback((segundos: number) => {
    dispatch({ tipo: 'ATUALIZAR_DURACAO', segundos });
  }, []);

  const salvarRodada = useCallback((rodada: Rodada) => {
    dispatch({ tipo: 'SALVAR_RODADA', rodada });
  }, []);

  const limparRodada = useCallback(() => {
    dispatch({ tipo: 'LIMPAR_RODADA' });
  }, []);

  const registrarConfrontoNaRodada = useCallback((timeId1: string, timeId2: string, partidaId: string) => {
    dispatch({ tipo: 'REGISTRAR_CONFRONTO', timeId1, timeId2, partidaId });
  }, []);

  return (
    <AppContext.Provider
      value={{
        estado,
        adicionarJogador,
        editarJogador,
        removerJogador,
        iniciarPartida,
        registrarGol,
        desfazerGol,
        encerrarPartida,
        atualizarDuracao,
        salvarRodada,
        limparRodada,
        registrarConfrontoNaRodada,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
