import { Jogador, Time, TimePartida, Partida, JogadorGol, CORES_TIMES, ConfigSorteio } from './types';

// ─── Gerar ID único ──────────────────────────────────────────────────────────
export function gerarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Embaralhar array (Fisher-Yates) ─────────────────────────────────────────
function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Calcular score de equilíbrio de um jogador ───────────────────────────────
function calcularScore(jogador: Jogador): number {
  // Normaliza nível (1-10), idade (15-50) e peso (50-120) para um score 0-100
  const scoreNivel = (jogador.nivel / 10) * 60;
  const scoreIdade = Math.max(0, (1 - Math.abs(jogador.idade - 25) / 25)) * 20;
  const scorePeso = Math.max(0, (1 - Math.abs(jogador.peso - 75) / 45)) * 20;
  return scoreNivel + scoreIdade + scorePeso;
}

// ─── Algoritmo de sorteio equilibrado ────────────────────────────────────────
// Distribui jogadores de forma que a soma dos scores seja similar entre os times
function sortearEquilibrado(jogadores: Jogador[], numTimes: number): Jogador[][] {
  const ordenados = [...jogadores].sort((a, b) => calcularScore(b) - calcularScore(a));
  const times: Jogador[][] = Array.from({ length: numTimes }, () => []);
  const scores: number[] = Array(numTimes).fill(0);

  // Distribui em "cobra" (snake draft): 0,1,2,...,n-1,n-1,...,1,0,0,1,...
  for (let i = 0; i < ordenados.length; i++) {
    const fase = Math.floor(i / numTimes);
    const posNaFase = i % numTimes;
    const timeIdx = fase % 2 === 0 ? posNaFase : numTimes - 1 - posNaFase;
    times[timeIdx].push(ordenados[i]);
    scores[timeIdx] += calcularScore(ordenados[i]);
  }

  return times;
}

// ─── Sortear aleatoriamente ───────────────────────────────────────────────────
function sortearAleatorio(jogadores: Jogador[], numTimes: number): Jogador[][] {
  const embaralhados = embaralhar(jogadores);
  const times: Jogador[][] = Array.from({ length: numTimes }, () => []);
  embaralhados.forEach((j, i) => {
    times[i % numTimes].push(j);
  });
  return times;
}

// ─── Função principal de sorteio ─────────────────────────────────────────────
export function sortearTimes(
  todosJogadores: Jogador[],
  config: ConfigSorteio
): Time[] {
  const { numTimes, jogadoresPorTime, incluirGoleiro, equilibrarPorNivel, jogadoresSelecionados } = config;

  // Filtrar jogadores selecionados
  const disponiveis = todosJogadores.filter((j) => jogadoresSelecionados.includes(j.id));

  // Separar goleiros e jogadores de linha
  const goleiros = disponiveis.filter((j) => j.posicao === 'goleiro');
  const jogadoresLinha = disponiveis.filter((j) => j.posicao === 'jogador');

  // Sortear goleiros (um por time se habilitado)
  let goleirosDistribuidos: (Jogador | undefined)[] = Array(numTimes).fill(undefined);
  if (incluirGoleiro && goleiros.length > 0) {
    const goleirosEmbaralhados = embaralhar(goleiros);
    for (let i = 0; i < numTimes; i++) {
      goleirosDistribuidos[i] = goleirosEmbaralhados[i % goleirosEmbaralhados.length];
    }
  }

  // Sortear jogadores de linha
  const totalLinha = numTimes * jogadoresPorTime;
  const linhaParaSortear = jogadoresLinha.slice(0, totalLinha);

  let timesLinha: Jogador[][];
  if (equilibrarPorNivel) {
    timesLinha = sortearEquilibrado(linhaParaSortear, numTimes);
  } else {
    timesLinha = sortearAleatorio(linhaParaSortear, numTimes);
  }

  // Montar times com cores
  const coresEmbaralhadas = embaralhar(CORES_TIMES).slice(0, numTimes);

  return timesLinha.map((jogadoresDoTime, i) => {
    const cor = coresEmbaralhadas[i];
    const goleiro = goleirosDistribuidos[i];

    const jogadoresGol: JogadorGol[] = jogadoresDoTime.map((j) => ({
      jogadorId: j.id,
      nome: j.nome,
      posicao: j.posicao,
      gols: 0,
    }));

    const goleiroGol: JogadorGol | undefined = goleiro
      ? { jogadorId: goleiro.id, nome: goleiro.nome, posicao: 'goleiro' as const, gols: 0 }
      : undefined;

    return {
      id: gerarId(),
      nome: `Time ${cor.nome}`,
      cor: cor.hex,
      corNome: cor.nome,
      jogadores: jogadoresGol,
      goleiro: goleiroGol,
    } as unknown as Time;
  });
}

// ─── Criar partida a partir dos times ────────────────────────────────────────
export function criarPartida(times: Time[]): Partida {
  const timesPartida: TimePartida[] = times.map((t) => ({
    id: t.id,
    nome: t.nome,
    cor: t.cor,
    corNome: t.corNome,
    jogadores: (t.jogadores as unknown) as JogadorGol[],
    goleiro: t.goleiro ? (t.goleiro as unknown as JogadorGol) : undefined,
    totalGols: 0,
  }));

  return {
    id: gerarId(),
    data: new Date().toISOString(),
    times: timesPartida,
    duracaoSegundos: 0,
    encerrada: false,
  };
}

// ─── Calcular artilharia mensal ───────────────────────────────────────────────
export function calcularArtilharia(
  partidas: Partida[],
  mes: number,
  ano: number
) {
  const partidasDoMes = partidas.filter((p) => {
    const d = new Date(p.data);
    return d.getMonth() + 1 === mes && d.getFullYear() === ano && p.encerrada;
  });

  const mapa: Record<string, { nome: string; gols: number; partidas: number; posicao: string }> = {};

  for (const partida of partidasDoMes) {
    for (const time of partida.times) {
      const todos = [...time.jogadores, ...(time.goleiro ? [time.goleiro] : [])];
      for (const j of todos) {
        if (!mapa[j.jogadorId]) {
          mapa[j.jogadorId] = { nome: j.nome, gols: 0, partidas: 0, posicao: j.posicao };
        }
        mapa[j.jogadorId].gols += j.gols;
        mapa[j.jogadorId].partidas += 1;
      }
    }
  }

  return Object.entries(mapa)
    .map(([id, v]) => ({ jogadorId: id, ...v }))
    .filter((a) => a.gols > 0)
    .sort((a, b) => b.gols - a.gols);
}

// ─── Formatar duração ─────────────────────────────────────────────────────────
export function formatarDuracao(segundos: number): string {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0');
  const s = (segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ─── Formatar data ────────────────────────────────────────────────────────────
export function formatarData(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatarDataHora(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
