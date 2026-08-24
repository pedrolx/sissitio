import AsyncStorage from '@react-native-async-storage/async-storage';

// Salvar dados no cache
export async function saveLocalData<T>(key: string, data: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key}:`, error);
  }
}

// Ler dados do cache
export async function getLocalData<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Erro ao ler ${key}:`, error);
    return null;
  }
}

// Remover dados do cache
export async function removeLocalData(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover ${key}:`, error);
  }
}

// Limpar todo o cache (usar com cuidado)
export async function clearAllCache(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}