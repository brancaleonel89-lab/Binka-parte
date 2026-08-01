-- =============================================
-- BINKA · Parte Diario — Setup de base de datos
-- Ejecutar en: Supabase → SQL Editor → New query
-- =============================================

-- Crear la tabla principal de datos
CREATE TABLE IF NOT EXISTS public.app_data (
  key         text        PRIMARY KEY,
  value       jsonb       NOT NULL,
  updated_at  timestamptz DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Política de acceso total (uso interno sin autenticación)
CREATE POLICY "Acceso publico total" ON public.app_data
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Confirmar
SELECT 'Tabla app_data creada correctamente.' AS resultado;
