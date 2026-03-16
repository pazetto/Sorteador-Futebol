import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Jogador, Partida } from './types';

const JOGADORES_COLLECTION = 'jogadores';
const PARTIDAS_COLLECTION = 'partidas';

/**
 * Sincroniza jogadores locais para Firestore
 */
export async function sincronizarJogadores(userId: string, jogadores: Jogador[]) {
  try {
    const batch = writeBatch(db);
    const userJogadoresRef = collection(db, 'usuarios', userId, JOGADORES_COLLECTION);

    // Limpar jogadores antigos
    const snapshot = await getDocs(userJogadoresRef);
    snapshot.forEach((doc) => batch.delete(doc.ref));

    // Adicionar novos jogadores
    jogadores.forEach((jogador) => {
      const docRef = doc(userJogadoresRef, jogador.id);
      batch.set(docRef, jogador);
    });

    await batch.commit();
    console.log('✓ Jogadores sincronizados com Firestore');
  } catch (error) {
    console.error('Erro ao sincronizar jogadores:', error);
    throw error;
  }
}

/**
 * Carrega jogadores do Firestore
 */
export async function carregarJogadoresDoFirestore(userId: string): Promise<Jogador[]> {
  try {
    const userJogadoresRef = collection(db, 'usuarios', userId, JOGADORES_COLLECTION);
    const snapshot = await getDocs(userJogadoresRef);
    const jogadores: Jogador[] = [];

    snapshot.forEach((doc) => {
      jogadores.push(doc.data() as Jogador);
    });

    return jogadores;
  } catch (error) {
    console.error('Erro ao carregar jogadores do Firestore:', error);
    return [];
  }
}

/**
 * Sincroniza partidas locais para Firestore
 */
export async function sincronizarPartidas(userId: string, partidas: Partida[]) {
  try {
    const batch = writeBatch(db);
    const userPartidasRef = collection(db, 'usuarios', userId, PARTIDAS_COLLECTION);

    // Limpar partidas antigas
    const snapshot = await getDocs(userPartidasRef);
    snapshot.forEach((doc) => batch.delete(doc.ref));

    // Adicionar novas partidas
    partidas.forEach((partida) => {
      const docRef = doc(userPartidasRef, partida.id);
      batch.set(docRef, partida);
    });

    await batch.commit();
    console.log('✓ Partidas sincronizadas com Firestore');
  } catch (error) {
    console.error('Erro ao sincronizar partidas:', error);
    throw error;
  }
}

/**
 * Carrega partidas do Firestore
 */
export async function carregarPartidasDoFirestore(userId: string): Promise<Partida[]> {
  try {
    const userPartidasRef = collection(db, 'usuarios', userId, PARTIDAS_COLLECTION);
    const snapshot = await getDocs(userPartidasRef);
    const partidas: Partida[] = [];

    snapshot.forEach((doc) => {
      partidas.push(doc.data() as Partida);
    });

    return partidas;
  } catch (error) {
    console.error('Erro ao carregar partidas do Firestore:', error);
    return [];
  }
}

/**
 * Sincroniza dados do usuário para Firestore
 */
export async function sincronizarDadosUsuario(userId: string, dados: any) {
  try {
    const userRef = doc(db, 'usuarios', userId);
    await setDoc(userRef, dados, { merge: true });
    console.log('✓ Dados do usuário sincronizados com Firestore');
  } catch (error) {
    console.error('Erro ao sincronizar dados do usuário:', error);
    throw error;
  }
}

/**
 * Carrega dados do usuário do Firestore
 */
export async function carregarDadosUsuarioDoFirestore(userId: string) {
  try {
    const userRef = doc(db, 'usuarios', userId);
    const snapshot = await getDocs(collection(db, 'usuarios'));
    
    for (const doc of snapshot.docs) {
      if (doc.id === userId) {
        return doc.data();
      }
    }
    return null;
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
    return null;
  }
}
