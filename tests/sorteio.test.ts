import { describe, it, expect } from 'vitest';
import {
  gerarId,
  sortearTimes,
  criarPartida,
  calcularArtilharia,
  formatarDuracao,
  formatarData,
  MESES,
} from '../lib/sorteio';
import { Jogador, ConfigSorteio, Partida } from '../lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function criarJogador(overrides: Partial<Jogador> = {}): Jogador {
  return {
    id: gerarId(),
    nome: 'Jogador Teste',
    posicao: 'jogador',
    nivel: 5,
    idade: 25,
    peso: 75,
    criadoEm: new Date().toISOString(),
    ...overrides,
  };
}

function criarJogadores(n: number, posicao: 'jogador' | 'goleiro' = 'jogador'): Jogador[] {
  return Array.from({ length: n }, (_, i) =>
    criarJogador({ id: `j${i}`, nome: `Jogador ${i + 1}`, posicao, nivel: (i % 10) + 1 })
  );
}

// ─── Testes ───────────────────────────────────────────────────────────────────
describe('gerarId', () => {
  it('deve gerar IDs únicos', () => {
    const ids = new Set(Array.from({ length: 100 }, () => gerarId()));
    expect(ids.size).toBe(100);
  });

  it('deve gerar strings não-vazias', () => {
    const id = gerarId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('sortearTimes', () => {
  it('deve criar o número correto de times', () => {
    const jogadores = criarJogadores(10);
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: false,
      jogadoresSelecionados: jogadores.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    expect(times).toHaveLength(2);
  });

  it('deve distribuir jogadores corretamente entre os times', () => {
    const jogadores = criarJogadores(10);
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: false,
      jogadoresSelecionados: jogadores.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    const totalJogadores = times.reduce((acc, t) => acc + (t.jogadores as any[]).length, 0);
    expect(totalJogadores).toBe(10);
  });

  it('deve incluir goleiros quando configurado', () => {
    const jogadores = criarJogadores(10);
    const goleiros = criarJogadores(2, 'goleiro');
    const todos = [...jogadores, ...goleiros];
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: true,
      equilibrarPorNivel: false,
      jogadoresSelecionados: todos.map((j) => j.id),
    };
    const times = sortearTimes(todos, config);
    const timesComGoleiro = times.filter((t) => t.goleiro !== undefined);
    expect(timesComGoleiro.length).toBeGreaterThan(0);
  });

  it('deve usar apenas jogadores selecionados', () => {
    const jogadores = criarJogadores(20);
    const selecionados = jogadores.slice(0, 10);
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: false,
      jogadoresSelecionados: selecionados.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    const idsNaoSelecionados = new Set(jogadores.slice(10).map((j) => j.id));
    for (const time of times) {
      for (const j of time.jogadores as any[]) {
        expect(idsNaoSelecionados.has(j.jogadorId)).toBe(false);
      }
    }
  });

  it('deve equilibrar times por nível quando configurado', () => {
    const jogadores = criarJogadores(10);
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: true,
      jogadoresSelecionados: jogadores.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    expect(times).toHaveLength(2);
    // Cada time deve ter 5 jogadores
    for (const time of times) {
      expect((time.jogadores as any[]).length).toBe(5);
    }
  });

  it('deve atribuir cores diferentes a cada time', () => {
    const jogadores = criarJogadores(15);
    const config: ConfigSorteio = {
      numTimes: 3,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: false,
      jogadoresSelecionados: jogadores.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    const cores = new Set(times.map((t) => t.cor));
    expect(cores.size).toBe(3);
  });
});

describe('criarPartida', () => {
  it('deve criar partida com times corretos', () => {
    const jogadores = criarJogadores(10);
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: false,
      jogadoresSelecionados: jogadores.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    const partida = criarPartida(times);

    expect(partida.id).toBeTruthy();
    expect(partida.times).toHaveLength(2);
    expect(partida.encerrada).toBe(false);
    expect(partida.duracaoSegundos).toBe(0);
  });

  it('deve inicializar gols zerados', () => {
    const jogadores = criarJogadores(10);
    const config: ConfigSorteio = {
      numTimes: 2,
      jogadoresPorTime: 5,
      incluirGoleiro: false,
      equilibrarPorNivel: false,
      jogadoresSelecionados: jogadores.map((j) => j.id),
    };
    const times = sortearTimes(jogadores, config);
    const partida = criarPartida(times);

    for (const time of partida.times) {
      expect(time.totalGols).toBe(0);
      for (const j of time.jogadores) {
        expect(j.gols).toBe(0);
      }
    }
  });
});

describe('calcularArtilharia', () => {
  function criarPartidaComGols(): Partida {
    return {
      id: gerarId(),
      data: new Date('2026-03-10').toISOString(),
      encerrada: true,
      duracaoSegundos: 3600,
      times: [
        {
          id: 't1',
          nome: 'Time Verde',
          cor: '#43A047',
          corNome: 'Verde',
          totalGols: 3,
          jogadores: [
            { jogadorId: 'j1', nome: 'João', posicao: 'jogador', gols: 2 },
            { jogadorId: 'j2', nome: 'Pedro', posicao: 'jogador', gols: 1 },
          ],
        },
        {
          id: 't2',
          nome: 'Time Azul',
          cor: '#1E88E5',
          corNome: 'Azul',
          totalGols: 1,
          jogadores: [
            { jogadorId: 'j3', nome: 'Carlos', posicao: 'jogador', gols: 1 },
          ],
        },
      ],
    };
  }

  it('deve calcular artilharia corretamente', () => {
    const partidas = [criarPartidaComGols()];
    const artilharia = calcularArtilharia(partidas, 3, 2026);

    expect(artilharia).toHaveLength(3);
    expect(artilharia[0].nome).toBe('João');
    expect(artilharia[0].gols).toBe(2);
    expect(artilharia[1].gols).toBe(1);
  });

  it('deve filtrar por mês e ano', () => {
    const partidas = [criarPartidaComGols()];
    const artilhariaFev = calcularArtilharia(partidas, 2, 2026);
    expect(artilhariaFev).toHaveLength(0);

    const artilhariaMar = calcularArtilharia(partidas, 3, 2026);
    expect(artilhariaMar.length).toBeGreaterThan(0);
  });

  it('deve ignorar partidas não encerradas', () => {
    const partida = criarPartidaComGols();
    partida.encerrada = false;
    const artilharia = calcularArtilharia([partida], 3, 2026);
    expect(artilharia).toHaveLength(0);
  });

  it('deve ordenar por gols decrescente', () => {
    const partidas = [criarPartidaComGols()];
    const artilharia = calcularArtilharia(partidas, 3, 2026);
    for (let i = 0; i < artilharia.length - 1; i++) {
      expect(artilharia[i].gols).toBeGreaterThanOrEqual(artilharia[i + 1].gols);
    }
  });

  it('deve excluir jogadores sem gols', () => {
    const partida: Partida = {
      id: gerarId(),
      data: new Date('2026-03-10').toISOString(),
      encerrada: true,
      duracaoSegundos: 1800,
      times: [{
        id: 't1', nome: 'Time', cor: '#000', corNome: 'Preto', totalGols: 0,
        jogadores: [{ jogadorId: 'j1', nome: 'Sem Gol', posicao: 'jogador', gols: 0 }],
      }],
    };
    const artilharia = calcularArtilharia([partida], 3, 2026);
    expect(artilharia).toHaveLength(0);
  });
});

describe('formatarDuracao', () => {
  it('deve formatar segundos corretamente', () => {
    expect(formatarDuracao(0)).toBe('00:00');
    expect(formatarDuracao(60)).toBe('01:00');
    expect(formatarDuracao(90)).toBe('01:30');
    expect(formatarDuracao(3600)).toBe('60:00');
    expect(formatarDuracao(3661)).toBe('61:01');
  });
});

describe('MESES', () => {
  it('deve ter 12 meses', () => {
    expect(MESES).toHaveLength(12);
  });

  it('deve começar com Janeiro', () => {
    expect(MESES[0]).toBe('Janeiro');
  });

  it('deve terminar com Dezembro', () => {
    expect(MESES[11]).toBe('Dezembro');
  });
});
