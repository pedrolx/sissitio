import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from './storage';
import Toast from 'react-native-toast-message';

// Tipo para uma operação pendente
export interface PendingOperation {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

const QUEUE_KEY = '@pending_queue';

export async function enqueueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getLocalData<PendingOperation[]>(QUEUE_KEY) || [];
  const newOp: PendingOperation = {
    ...operation,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    timestamp: Date.now(),
  };
  queue.push(newOp);
  await saveLocalData(QUEUE_KEY, queue);
}

export async function getPendingQueue(): Promise<PendingOperation[]> {
  return (await getLocalData<PendingOperation[]>(QUEUE_KEY)) || [];
}

async function removeFromQueue(id: string): Promise<void> {
  let queue = await getPendingQueue();
  queue = queue.filter(op => op.id !== id);
  await saveLocalData(QUEUE_KEY, queue);
}

function getPrimaryKeyField(table: string): string {
  const mapping: Record<string, string> = {
    cliente: 'idcliente',
    produto: 'idproduto',
    animal: 'idanimal',
    venda: 'idvenda',
    itemvenda: 'iditemvenda',
    estoque: 'idestoque',
    movimentacao: 'idmovimentacao',
    usuario: 'idusuario',
  };
  return mapping[table] || 'id';
}

export async function processQueue(): Promise<{ success: number; failed: number }> {
  const queue = await getPendingQueue();
  let success = 0;
  let failed = 0;

  for (const op of queue) {
    try {
      let query = supabase.from(op.table);
      if (op.action === 'insert') {
        const { error } = await query.insert([op.data]);
        if (error) throw error;
      } else if (op.action === 'update') {
        const idField = getPrimaryKeyField(op.table);
        const idValue = op.data[idField];
        if (!idValue) throw new Error(`ID não encontrado para update na tabela ${op.table}`);
        const { error } = await query.update(op.data).eq(idField, idValue);
        if (error) throw error;
      } else if (op.action === 'delete') {
        const idField = getPrimaryKeyField(op.table);
        const idValue = op.data[idField];
        if (!idValue) throw new Error(`ID não encontrado para delete na tabela ${op.table}`);
        const { error } = await query.delete().eq(idField, idValue);
        if (error) throw error;
      }
      await removeFromQueue(op.id);
      success++;
    } catch (error) {
      console.error(`Falha ao processar operação ${op.id}:`, error);
      failed++;
    }
  }

  // Exibe Toast com o resultado
  if (success > 0 || failed > 0) {
    Toast.show({
      type: failed > 0 ? 'error' : 'success',
      text1: `Sincronização concluída`,
      text2: `${success} operações sincronizadas${failed > 0 ? `, ${failed} falhas` : ''}`,
      visibilityTime: 3000,
      position: 'bottom',
    });
  }

  return { success, failed };
}

export function startPeriodicSync(intervalMs = 60000) {
  const interval = setInterval(() => {
    processQueue().then(({ success, failed }) => {
      if (success > 0 || failed > 0) {
        console.log(`Sincronização: ${success} sucessos, ${failed} falhas`);
      }
    });
  }, intervalMs);
  return () => clearInterval(interval);
}