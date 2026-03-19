import React from 'react';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useApp } from '@/lib/app-context';
import { useFirebaseAuth } from '@/lib/firebase-auth-context';
import {
  sincronizarJogadores,
  sincronizarPartidas,
  carregarJogadoresDoFirestore,
  carregarPartidasDoFirestore,
} from '@/lib/firebase-sync';

/**
 * Hook que sincroniza dados locais com o Firestore quando o usuário está logado.
 *
 * - Ao fazer login: carrega dados da nuvem (sobrepõe o local)
 * - Ao alterar jogadores/partidas: salva na nuvem em background
 */
export function useFirebaseSync() {
  const { user } = useFirebaseAuth();
  const { estado, adicionarJogador, iniciarPartida } = useApp();
  const jaCarregouRef = useRef(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega dados do Firestore ao fazer login (apenas uma vez por sessão)
  useEffect(() => {
    if (!user || jaCarregouRef.current || estado.carregando) return;

    async function carregarDaNuvem() {
      try {
        console.log('[Sync] Carregando dados do Firestore para', user!.uid);
        const [jogadoresNuvem, partidasNuvem] = await Promise.all([
          carregarJogadoresDoFirestore(user!.uid),
          carregarPartidasDoFirestore(user!.uid),
        ]);

        // Só substitui se houver dados na nuvem
        if (jogadoresNuvem.length > 0) {
          // Limpa os locais e adiciona os da nuvem
          jogadoresNuvem.forEach(j => adicionarJogador(j));
          console.log(`[Sync] ${jogadoresNuvem.length} jogadores carregados da nuvem`);
        }

        jaCarregouRef.current = true;
      } catch (err) {
        console.error('[Sync] Erro ao carregar da nuvem:', err);
      }
    }

    carregarDaNuvem();
  }, [user, estado.carregando]);

  // Resetar flag ao deslogar
  useEffect(() => {
    if (!user) {
      jaCarregouRef.current = false;
    }
  }, [user]);

  // Sincroniza jogadores para a nuvem (debounced — aguarda 2s após última alteração)
  useEffect(() => {
    if (!user || estado.carregando) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await sincronizarJogadores(user.uid, estado.jogadores);
      } catch (err) {
        console.error('[Sync] Erro ao sincronizar jogadores:', err);
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [user, estado.jogadores, estado.carregando]);

  // Sincroniza partidas para a nuvem (debounced)
  useEffect(() => {
    if (!user || estado.carregando) return;

    const timeout = setTimeout(async () => {
      try {
        await sincronizarPartidas(user.uid, estado.partidas);
      } catch (err) {
        console.error('[Sync] Erro ao sincronizar partidas:', err);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [user, estado.partidas, estado.carregando]);
}
