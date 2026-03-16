# Fut Sorteio — TODO

## Configuração e Estrutura
- [x] Configurar tema verde/futebol no theme.config.js
- [x] Criar tipos e modelos de dados (Jogador, Time, Partida, Gol)
- [x] Criar contexto global com AsyncStorage para persistência
- [x] Gerar e configurar logo do app
- [x] Configurar ícones e navegação por abas (5 abas)

## Tela: Home
- [x] Resumo rápido (artilheiro do mês, último sorteio)
- [x] Botão de ação rápida "Novo Sorteio"
- [x] Card de última partida

## Tela: Jogadores
- [x] Listagem de jogadores com FlatList
- [x] Adicionar jogador (nome, posição, nível, idade, peso)
- [x] Editar jogador
- [x] Excluir jogador (swipe ou botão)
- [x] Busca por nome
- [x] Filtro por posição (jogador/goleiro)

## Tela: Sorteio
- [x] Configuração: nº de times (2-10), jogadores por time
- [x] Opção de goleiro por time
- [x] Opção de equilibrar times por nível (idade/peso)
- [x] Seleção de jogadores disponíveis
- [x] Algoritmo de sorteio com equilíbrio
- [x] Exibição de resultado com cores dos times (até 30 cores)
- [x] Botão "Iniciar Partida"

## Tela: Partida em Andamento
- [x] Exibição dos times com placar
- [x] Cronômetro da partida
- [x] Registrar gol (toque no jogador)
- [x] Desfazer último gol
- [x] Encerrar partida e salvar no histórico

## Tela: Histórico
- [x] Lista de partidas passadas
- [x] Filtro por mês/ano
- [x] Detalhes da partida (gols por jogador, placar final)

## Tela: Artilharia
- [x] Tabela de artilharia mensal
- [x] Podium top 3 com destaque visual
- [x] Filtro por mês/ano
- [x] Ranking completo com posição


## Correções e Melhorias (v1.1)
- [x] Corrigir botão de encerrar partida no iOS (acessibilidade)
- [x] Adicionar modal de resumo com total de gols antes de encerrar
- [x] Implementar timer configurável para duração da partida
- [x] Testar acessibilidade em iOS e Android


## Novas Funcionalidades (v1.2)
- [x] Mudar tema principal de verde para azul
- [x] Adicionar botão de voltar no modal de resumo da partida
- [x] Implementar autenticação Google (Android) e Apple (iOS)
- [x] Criar aba de Perfil com dados do usuário autenticado
- [x] Criar aba de Configurações com opções de:
  - [x] Tempo padrão das partidas
  - [x] Cores dos times
  - [x] Nome do grupo de futebol
  - [x] Cor principal do app
- [x] Atualizar Home para exibir nome do grupo personalizado


## Integração Firebase e Autenticação Real (v1.3)
- [x] Configurar Firebase com domínio pazetto.net
- [x] Instalar pacotes Firebase (firebase, react-native-firebase)
- [x] Criar contexto de autenticação Firebase
- [x] Implementar autenticação Google com logotipo oficial
- [x] Implementar autenticação Apple com logotipo oficial
- [x] Migrar dados de AsyncStorage para Firestore
- [x] Sincronizar dados em tempo real com Firebase
- [x] Testar autenticação em iOS e Android
