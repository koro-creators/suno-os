-- 018_skills.sql — Catálogo de Skills (feature SPEC-017). Idempotente.
--
-- Backend para a aba Skills admin (antes só mock no frontend: data/skills-admin.ts).
-- Campos aninhados (moons, assigned_clients, versions) em JSONB. Seed do catálogo
-- real (10 skills); métricas (score/feedbacks) começam zeradas e versions vazias
-- (histórico/score reais surgem com uso). NÃO confundir com api/chat/skills (SKILL.md,
-- código/prompt) nem com skill_defaults (017).

CREATE TABLE IF NOT EXISTS skills (
  id               TEXT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  slug             VARCHAR(120) NOT NULL UNIQUE,
  type             VARCHAR(20)  NOT NULL,
  description      TEXT         NOT NULL DEFAULT '',
  icon             VARCHAR(60),
  status           VARCHAR(20)  NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('active', 'draft', 'archived')),
  system_prompt    TEXT         NOT NULL DEFAULT '',
  model            VARCHAR(50),
  temperature      REAL         NOT NULL DEFAULT 0.7,
  max_tokens       INTEGER      NOT NULL DEFAULT 4096,
  moons            JSONB        NOT NULL DEFAULT '[]',
  assigned_clients JSONB        NOT NULL DEFAULT '[]',
  versions         JSONB        NOT NULL DEFAULT '[]',
  created_by       VARCHAR(200),
  average_score    REAL         NOT NULL DEFAULT 0,
  total_feedbacks  INTEGER      NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skills_status ON skills(status);
CREATE INDEX IF NOT EXISTS idx_skills_type   ON skills(type);

-- Seed do catálogo real (idempotente por slug)
INSERT INTO skills (id, name, slug, type, description, icon, status, system_prompt, model, temperature, max_tokens, moons, assigned_clients)
VALUES
('skill-texto-de-radio','Texto de Rádio','texto-de-radio','criacao','Gera textos publicitários para rádio em diversos formatos: spots, jingles e institucionais.','Radio','active','Você é um redator publicitário especializado em textos para rádio. Crie textos claros, impactantes e adequados ao tempo do formato solicitado. Sempre inclua indicações de locução, trilha e efeitos sonoros.','gemini-pro',0.7,4096,
  '[{"id":"moon-spot-30","name":"Spot 30\"","slug":"spot-30","description":"Spot de rádio de 30 segundos"},{"id":"moon-jingle","name":"Jingle","slug":"jingle","description":"Jingle musical para rádio"},{"id":"moon-institucional","name":"Institucional","slug":"institucional","description":"Texto institucional para rádio"}]',
  '["santander","vivo","sicredi"]'),
('skill-copy-social','Copy Social','copy-social','criacao','Cria copies para redes sociais adaptados a cada plataforma e formato.','MessageSquare','active','Você é um social media copywriter. Crie copies engajantes, adaptados ao tom da marca e ao formato da plataforma. Use CTAs claros e emojis quando apropriado.','gpt-4o',0.8,2048,
  '[{"id":"moon-feed","name":"Feed/Carrossel","slug":"feed-carrossel","description":"Copy para posts de feed e carrossel"},{"id":"moon-stories","name":"Stories/Reels","slug":"stories-reels","description":"Copy para stories e reels"},{"id":"moon-twitter","name":"X/Twitter","slug":"x-twitter","description":"Copy para X/Twitter"}]',
  '["santander","vivo","americanas","mrv","sicredi","bmg","stone"]'),
('skill-roteiro-de-video','Roteiro de Vídeo','roteiro-de-video','criacao','Cria roteiros para vídeos publicitários em diferentes formatos e durações.','Video','active','Você é um roteirista publicitário. Crie roteiros com cenas numeradas, indicações de câmera, locução e grafismo. Adapte o tom à marca e ao objetivo da campanha.','gemini-pro',0.7,8192,
  '[{"id":"moon-tvc","name":"TVC 30\"","slug":"tvc-30","description":"Roteiro de TV comercial 30 segundos"},{"id":"moon-preroll","name":"Digital Pre-roll","slug":"digital-pre-roll","description":"Roteiro para pre-roll digital"}]',
  '["santander","americanas","stone"]'),
('skill-plano-de-midia','Plano de Mídia','plano-de-midia','midia','Gera planos de mídia completos com alocação de budget, canais e cronograma.','BarChart3','active','Você é um planejador de mídia sênior. Crie planos detalhados com: objetivo, público, canais, formatos, budget, cronograma e KPIs. Use dados de benchmark do mercado brasileiro.','gemini-pro',0.5,8192,
  '[{"id":"moon-digital","name":"Digital","slug":"digital","description":"Planejamento de mídia digital"},{"id":"moon-ooh","name":"OOH","slug":"ooh","description":"Planejamento de mídia out-of-home"},{"id":"moon-tv-radio","name":"TV/Rádio","slug":"tv-radio","description":"Planejamento de mídia TV e rádio"}]',
  '["santander","vivo","mrv","sicredi","stone"]'),
('skill-report-performance','Report Performance','report-performance','midia','Gera relatórios de performance de campanhas com análise de métricas e recomendações.','TrendingUp','active','Você é um analista de performance digital. Crie relatórios claros com: resumo executivo, métricas-chave, análise por canal, insights e recomendações de otimização.','gemini-flash',0.3,4096,
  '[{"id":"moon-semanal","name":"Semanal","slug":"semanal","description":"Report de performance semanal"},{"id":"moon-mensal","name":"Mensal","slug":"mensal","description":"Report de performance mensal"}]',
  '["santander","americanas","bmg"]'),
('skill-persona-sintetica','Persona Sintética','persona-sintetica','planejamento','Cria personas sintéticas baseadas em dados demográficos e comportamentais.','UserCircle','active','Você é um estrategista de planejamento. Crie personas detalhadas com: demografia, comportamento, dores, desejos, jornada de compra e touchpoints. Use linguagem acessível e insights acionáveis.','claude',0.6,4096,
  '[{"id":"moon-jovem","name":"Jovem 18-25","slug":"jovem-18-25","description":"Persona sintética jovem 18-25 anos"},{"id":"moon-premium","name":"Premium 35+","slug":"premium-35","description":"Persona sintética premium 35+"},{"id":"moon-mei","name":"MEI/PJ","slug":"mei-pj","description":"Persona sintética MEI e PJ"}]',
  '["santander","americanas","sicredi","stone"]'),
('skill-brief-builder','Brief Builder','brief-builder','planejamento','Estrutura briefs criativos completos para campanhas e projetos always-on.','FileText','active','Você é um planejador estratégico. Crie briefs completos com: contexto, objetivo, público, mensagem-chave, tom de voz, entregáveis, cronograma e referências. Seja conciso e acionável.','gemini-pro',0.6,4096,
  '[{"id":"moon-campanha","name":"Campanha","slug":"campanha","description":"Brief para campanha pontual"},{"id":"moon-alwayson","name":"Always-on","slug":"always-on","description":"Brief para always-on"}]',
  '["vivo","mrv","bmg"]'),
('skill-analise-de-mercado','Análise de Mercado','analise-de-mercado','planejamento','Realiza análises de mercado, concorrência e tendências para embasar estratégias.','Search','active','Você é um analista de mercado. Realize análises completas com: panorama do setor, análise SWOT, benchmarks de concorrência, tendências e oportunidades. Use dados públicos do mercado brasileiro.','claude',0.4,8192,
  '[{"id":"moon-concorrencia","name":"Concorrência","slug":"concorrencia","description":"Análise de concorrência"},{"id":"moon-tendencias","name":"Tendências","slug":"tendencias","description":"Análise de tendências de mercado"}]',
  '["vivo","sicredi","bmg"]'),
('skill-analise-competitiva','Análise Competitiva','analise-competitiva','planejamento','Análise detalhada de concorrentes diretos e indiretos com mapeamento de posicionamento.','Target','draft','','claude',0.5,8192,'[]','[]'),
('skill-roteiro-de-podcast','Roteiro de Podcast','roteiro-de-podcast','criacao','Cria roteiros para episódios de podcast com estrutura, pautas e perguntas.','Mic','draft','','gemini-pro',0.7,8192,'[]','[]')
ON CONFLICT (slug) DO NOTHING;
