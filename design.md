# Design do App — Sorteador de Times de Futebol

## Identidade Visual

- **Nome do App:** Fut Sorteio
- **Cores Primárias:**
  - Verde campo: `#1B5E20` (dark) / `#2E7D32` (light accent)
  - Verde gramado: `#4CAF50`
  - Branco: `#FFFFFF`
  - Cinza escuro: `#1C1C1E` (fundo dark mode)
- **Tipografia:** Sistema (SF Pro no iOS, Roboto no Android)
- **Estilo:** Moderno, esportivo, limpo — inspirado em apps de futebol como o Sofascore

---

## Paleta de Cores dos Times (até 30 cores)

Cada time recebe uma cor identificadora:
Vermelho, Azul, Verde, Amarelo, Laranja, Roxo, Rosa, Ciano, Branco, Preto, Cinza, Marrom, Dourado, Prata, Turquesa, Índigo, Lima, Coral, Salmão, Violeta, Azul-marinho, Verde-escuro, Borgonha, Terracota, Azul-celeste, Magenta, Oliva, Pêssego, Lavanda, Cobre.

---

## Telas do Aplicativo

### 1. Home (Tab: Início)
- **Conteúdo:** Resumo rápido — próxima pelada, último sorteio, artilheiro do mês
- **Ações:** Botão grande "Novo Sorteio", acesso rápido ao histórico

### 2. Jogadores (Tab: Jogadores)
- **Conteúdo:** Lista de todos os jogadores cadastrados com nome, nível, posição (jogador/goleiro), idade, peso
- **Ações:** Adicionar, editar, excluir jogador; busca por nome; filtro por posição

### 3. Sorteio (Tab: Sorteio)
- **Conteúdo:** Configuração do sorteio — número de times, jogadores por time, se inclui goleiro, equilíbrio por nível
- **Ações:** Selecionar jogadores disponíveis, sortear times, visualizar resultado com cores dos times, reorganizar manualmente

### 4. Partida em Andamento (Modal/Stack)
- **Conteúdo:** Times sorteados com lista de jogadores, placar, cronômetro
- **Ações:** Registrar gol (toque no jogador), desfazer gol, encerrar partida

### 5. Histórico (Tab: Histórico)
- **Conteúdo:** Lista de partidas passadas com data, times, placar final
- **Ações:** Ver detalhes da partida (gols por jogador), filtrar por mês

### 6. Artilharia (Tab: Artilharia)
- **Conteúdo:** Tabela de artilharia mensal com ranking de gols, podium top 3
- **Ações:** Filtrar por mês/ano, ver detalhes do jogador

---

## Fluxos Principais

### Fluxo de Sorteio
1. Usuário vai para aba "Sorteio"
2. Configura: nº de times, jogadores por time, goleiro por time (sim/não), equilíbrio por nível
3. Seleciona jogadores disponíveis (ou usa todos)
4. Toca "Sortear" → animação de sorteio
5. Visualiza times com cores e jogadores
6. Pode reorganizar manualmente (arrastar ou trocar)
7. Toca "Iniciar Partida" → abre tela de Partida

### Fluxo de Registro de Gols
1. Na tela de Partida, toca no nome do jogador
2. Modal confirma: "+1 gol para [Nome]?"
3. Placar atualiza em tempo real
4. Ao encerrar, salva no histórico automaticamente

### Fluxo de Artilharia
1. Usuário vai para aba "Artilharia"
2. Seleciona mês/ano
3. Vê ranking com foto/avatar, nome, gols totais
4. Podium animado para top 3

---

## Layout por Tela

### Home
```
┌─────────────────────────────┐
│  🏆 Fut Sorteio             │
│  [Avatar] Olá, campeão!     │
│                             │
│  ┌─────────────────────┐    │
│  │  NOVO SORTEIO  ⚽   │    │
│  └─────────────────────┘    │
│                             │
│  Artilheiro do Mês          │
│  🥇 João Silva — 8 gols     │
│                             │
│  Último Sorteio             │
│  Time Verde 3 × 2 Time Azul │
└─────────────────────────────┘
```

### Jogadores
```
┌─────────────────────────────┐
│  Jogadores          [+ Add] │
│  🔍 Buscar...               │
│  ─────────────────────────  │
│  [Avatar] João Silva        │
│  Atacante · Nível 8 · 25a   │
│  ─────────────────────────  │
│  [Avatar] Pedro Costa       │
│  Goleiro · Nível 7 · 30a    │
└─────────────────────────────┘
```

### Sorteio — Configuração
```
┌─────────────────────────────┐
│  Configurar Sorteio         │
│                             │
│  Nº de Times:    [2] [+][-] │
│  Jogadores/Time: [5] [+][-] │
│  Goleiro por time: [ON]     │
│  Equilibrar times: [ON]     │
│                             │
│  Jogadores Disponíveis (20) │
│  [✓] João  [✓] Pedro  ...   │
│                             │
│  [     SORTEAR TIMES     ]  │
└─────────────────────────────┘
```

### Resultado do Sorteio
```
┌─────────────────────────────┐
│  Times Sorteados            │
│                             │
│  🟢 Time Verde              │
│  GK: Pedro Costa            │
│  João Silva · Carlos Lima   │
│  ...                        │
│                             │
│  🔵 Time Azul               │
│  GK: Marcos Souza           │
│  Rafael Nunes · ...         │
│                             │
│  [   INICIAR PARTIDA   ]    │
└─────────────────────────────┘
```

### Partida em Andamento
```
┌─────────────────────────────┐
│  Partida  ⏱ 00:00   [Fim]  │
│                             │
│  🟢 Time Verde  2           │
│  ─────────────────────────  │
│  ⚽ João Silva (1)          │
│  Carlos Lima (0)            │
│                             │
│  🔵 Time Azul   1           │
│  ─────────────────────────  │
│  ⚽ Rafael Nunes (1)        │
│  Marcos Souza (0)           │
└─────────────────────────────┘
```

### Artilharia
```
┌─────────────────────────────┐
│  Artilharia  [Mar 2026 ▼]  │
│                             │
│     🥇 João Silva           │
│         12 gols             │
│  🥈 Pedro   🥉 Carlos       │
│   8 gols     6 gols         │
│                             │
│  # Nome          Gols       │
│  4 Rafael Nunes    5        │
│  5 Marcos Souza    3        │
└─────────────────────────────┘
```
