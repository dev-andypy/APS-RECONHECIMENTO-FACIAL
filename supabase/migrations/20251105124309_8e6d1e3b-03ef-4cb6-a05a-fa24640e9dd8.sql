-- Criar tabela para armazenar registros faciais
CREATE TABLE public.face_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  access_level INTEGER NOT NULL CHECK (access_level >= 1 AND access_level <= 3),
  face_descriptor JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.face_registrations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: usuários podem ver apenas seus próprios registros
CREATE POLICY "Usuários podem ver seus próprios registros"
  ON public.face_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Políticas RLS: usuários podem inserir seus próprios registros
CREATE POLICY "Usuários podem criar seus próprios registros"
  ON public.face_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Políticas RLS: usuários podem atualizar seus próprios registros
CREATE POLICY "Usuários podem atualizar seus próprios registros"
  ON public.face_registrations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS: usuários podem deletar seus próprios registros
CREATE POLICY "Usuários podem deletar seus próprios registros"
  ON public.face_registrations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para atualizar automaticamente updated_at
CREATE TRIGGER update_face_registrations_updated_at
  BEFORE UPDATE ON public.face_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para melhorar performance de busca por nível de acesso
CREATE INDEX idx_face_registrations_access_level ON public.face_registrations(access_level);

-- Criar tabela de logs de acesso
CREATE TABLE public.access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_level INTEGER NOT NULL,
  access_granted BOOLEAN NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Política para logs: usuários podem ver apenas seus próprios logs
CREATE POLICY "Usuários podem ver seus próprios logs"
  ON public.access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para inserção de logs
CREATE POLICY "Usuários podem criar seus próprios logs"
  ON public.access_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);