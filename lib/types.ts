// ─── Tipos principais do Fut Sorteio ───────────────────────────────────────

export type Posicao = 'jogador' | 'goleiro';

export interface Jogador {
  id: string;
  nome: string;
  posicao: Posicao;
  nivel: number;       // 1-10
  idade: number;
  peso: number;        // em kg
  criadoEm: string;   // ISO date string
}

export interface JogadorNoTime extends Jogador {
  gols: number;
}

export interface Time {
  id: string;
  nome: string;
  cor: string;         // hex color
  corNome: string;     // nome legível da cor
  jogadores: JogadorNoTime[];
  goleiro?: JogadorNoTime;
}

export interface Partida {
  id: string;
  data: string;        // ISO date string
  times: TimePartida[];
  duracaoSegundos: number;
  encerrada: boolean;
}

export interface TimePartida {
  id: string;
  nome: string;
  cor: string;
  corNome: string;
  jogadores: JogadorGol[];
  goleiro?: JogadorGol;
  totalGols: number;
}

export interface JogadorGol {
  jogadorId: string;
  nome: string;
  posicao: Posicao;
  gols: number;
}

export interface ConfigSorteio {
  numTimes: number;
  jogadoresPorTime: number;
  incluirGoleiro: boolean;
  equilibrarPorNivel: boolean;
  jogadoresSelecionados: string[]; // IDs
}

export interface ArtilheiroMes {
  jogadorId: string;
  nome: string;
  gols: number;
  partidas: number;
  posicao: Posicao;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  foto?: string;
  provedor: 'google' | 'apple';
  criadoEm: string;
}

export interface ConfiguracaoApp {
  nomeGrupo: string;
  tempoPartidaPadrao: number; // em segundos
  corPrincipal: string; // hex color
  coresTimes: string[]; // array de hex colors
}

// ─── Cores disponíveis para os times (30 cores) ────────────────────────────

export const CORES_TIMES: { nome: string; hex: string; textColor: string }[] = [
  { nome: 'Vermelho',     hex: '#E53935', textColor: '#FFFFFF' },
  { nome: 'Azul',         hex: '#1E88E5', textColor: '#FFFFFF' },
  { nome: 'Verde',        hex: '#43A047', textColor: '#FFFFFF' },
  { nome: 'Amarelo',      hex: '#FDD835', textColor: '#1A1A1A' },
  { nome: 'Laranja',      hex: '#FB8C00', textColor: '#FFFFFF' },
  { nome: 'Roxo',         hex: '#8E24AA', textColor: '#FFFFFF' },
  { nome: 'Rosa',         hex: '#E91E8C', textColor: '#FFFFFF' },
  { nome: 'Ciano',        hex: '#00ACC1', textColor: '#FFFFFF' },
  { nome: 'Branco',       hex: '#F5F5F5', textColor: '#1A1A1A' },
  { nome: 'Preto',        hex: '#212121', textColor: '#FFFFFF' },
  { nome: 'Cinza',        hex: '#757575', textColor: '#FFFFFF' },
  { nome: 'Marrom',       hex: '#6D4C41', textColor: '#FFFFFF' },
  { nome: 'Dourado',      hex: '#FFB300', textColor: '#1A1A1A' },
  { nome: 'Prata',        hex: '#9E9E9E', textColor: '#FFFFFF' },
  { nome: 'Turquesa',     hex: '#00897B', textColor: '#FFFFFF' },
  { nome: 'Índigo',       hex: '#3949AB', textColor: '#FFFFFF' },
  { nome: 'Lima',         hex: '#C0CA33', textColor: '#1A1A1A' },
  { nome: 'Coral',        hex: '#FF5252', textColor: '#FFFFFF' },
  { nome: 'Salmão',       hex: '#FF8A65', textColor: '#FFFFFF' },
  { nome: 'Violeta',      hex: '#7B1FA2', textColor: '#FFFFFF' },
  { nome: 'Azul-marinho', hex: '#1A237E', textColor: '#FFFFFF' },
  { nome: 'Verde-escuro', hex: '#1B5E20', textColor: '#FFFFFF' },
  { nome: 'Borgonha',     hex: '#880E4F', textColor: '#FFFFFF' },
  { nome: 'Terracota',    hex: '#BF360C', textColor: '#FFFFFF' },
  { nome: 'Azul-celeste', hex: '#29B6F6', textColor: '#1A1A1A' },
  { nome: 'Magenta',      hex: '#D81B60', textColor: '#FFFFFF' },
  { nome: 'Oliva',        hex: '#827717', textColor: '#FFFFFF' },
  { nome: 'Pêssego',      hex: '#FFCCBC', textColor: '#1A1A1A' },
  { nome: 'Lavanda',      hex: '#CE93D8', textColor: '#1A1A1A' },
  { nome: 'Cobre',        hex: '#A1887F', textColor: '#FFFFFF' },
];
