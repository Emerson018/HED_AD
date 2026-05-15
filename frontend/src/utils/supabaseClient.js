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
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  console.log(`Iniciando upload de ${file.name} (${file.type}) para o Supabase...`);

  const { data, error } = await supabase.storage
    .from('campanhas_midia')
    .upload(filePath, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error("Erro detalhado do Supabase Storage:", error);
    throw error;
  }

  console.log("Upload concluído com sucesso:", data);

  // Pega a URL pública
  const { data: publicData } = supabase.storage
    .from('campanhas_midia')
    .getPublicUrl(filePath);

  return publicData.publicUrl;
};
