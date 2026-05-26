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

/**
 * Upload de mídia com callback de progresso (usa XMLHttpRequest).
 * @param {File} file - Arquivo para upload
 * @param {function} onProgress - Callback com porcentagem (0-100)
 * @returns {string} URL pública do arquivo
 */
export const uploadMidiaWithProgress = (file, onProgress) => {
  if (!supabase) throw new Error("Supabase não configurado no .env");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  return new Promise((resolve, reject) => {
    const url = `${supabaseUrl}/storage/v1/object/campanhas_midia/${filePath}`;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Cache-Control', 'max-age=3600');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data: publicData } = supabase.storage
          .from('campanhas_midia')
          .getPublicUrl(filePath);
        resolve(publicData.publicUrl);
      } else {
        reject(new Error(`Upload falhou com status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Erro de rede durante o upload.'));
    };

    xhr.send(file);
  });
};
