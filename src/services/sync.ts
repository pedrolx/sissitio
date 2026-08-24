import { supabase } from '../lib/supabase';
import { getLocalData, saveLocalData } from './storage';
import { PostgrestError } from '@supabase/supabase-js';

// Tipo para uma operação pendente
export interface PendingOperation {
  id: string;          // UUID para identificar exclusivamente
  table: string;       // 'cliente', 'produto', 'animal', etc.
  action: 'insert' | 'update' | 'delete';
  data: any;           // dados da operação
  timestamp: number;
}

// Chave para armazenar a fila
const QUEUE_KEY = '@pending_queue';

// Adicionar operação à fila
export async function enqueueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getLocalData<PendingOperation[]>(QUEUE_KEY) || [];
  const newOp: PendingOperation = {
    ...operation,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), // ID simples
    timestamp: Date.now(),
  };
  queue.push(newOp);
  await saveLocalData(QUEUE_KEY, queue);
}

// Obter fila de operações pendentes
export async function getPendingQueue(): Promise<PendingOperation[]> {
  return (await getLocalData<PendingOperation[]>(QUEUE_KEY)) || [];
}

// Remover operação da fila após sucesso
async function removeFromQueue(id: string): Promise<void> {
  let queue = await getPendingQueue();
  queue = queue.filter(op => op.id !== id);
  await saveLocalData(QUEUE_KEY, queue);
}

// Processar todas as operações pendentes
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
      // Sucesso: remover da fila
      await removeFromQueue(op.id);
      success++;
    } catch (error) {
      console.error(`Falha ao processar operação ${op.id}:`, error);
      failed++;
    }
  }
  return { success, failed };
}

// Função auxiliar para obter o nome do campo ID de cada tabela
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

// Processar fila periodicamente (usar com NetInfo)
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