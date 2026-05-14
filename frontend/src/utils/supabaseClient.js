import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicializamos apenas se as variáveis estiverem presentes (para não quebrar caso falte)
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Função utilitária para fazer upload de mídia para o bucket "campanhas_midia".
 * Retorna a URL pública do arquivo.
 */
export const uploadMidia = async (file) => {
  if (!supabase) throw new Error("Supabase não configurado no .env");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { data, error } = await supabase.storage
    .from('campanhas_midia')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  // Pega a URL pública
  const { data: publicData } = supabase.storage
    .from('campanhas_midia')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
};
