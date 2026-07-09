/* =========================================================
   INDUSTRIAL 505 — Configuración de Supabase
   =========================================================
   1. Crea un proyecto en https://supabase.com
   2. Ejecuta el archivo sql_editor.sql en el SQL Editor de tu proyecto
   3. Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con los datos
      de tu proyecto (Project Settings > API)
   4. La ANON KEY es pública y segura de exponer en el frontend
      SIEMPRE que las políticas de RLS estén correctamente
      configuradas (ver sql_editor.sql), como ya se hizo aquí.
   ========================================================= */

const SUPABASE_URL = "https://TU-PROYECTO.supabase.co";
const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";

// El cliente se crea usando la librería global `supabase`
// cargada vía CDN en index.html (window.supabase.createClient)
window.supabaseClient = (SUPABASE_URL.includes("TU-PROYECTO"))
  ? null
  : window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

if (!window.supabaseClient) {
  console.warn(
    "[INDUSTRIAL 505] Configura SUPABASE_URL y SUPABASE_ANON_KEY en js/supabase-config.js para conectar el backend."
  );
}
