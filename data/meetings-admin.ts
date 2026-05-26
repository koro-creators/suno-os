import { Meeting, MeetingSegment } from '@/lib/meeting-types';

function makeSegments(meetingId: string, texts: string[]): MeetingSegment[] {
  return texts.map((text, i) => ({
    id: `seg-${meetingId}-${i + 1}`,
    meeting_id: meetingId,
    text,
    start_time: `00:${String(i * 3).padStart(2, '0')}:00`,
    selected: false,
    context_note: '',
  }));
}

export const initialMeetings: Meeting[] = [
  {
    id: 'mtg-001',
    client_id: 'vivo',
    title: 'Reunião de Planejamento Q3',
    meet_link: 'https://meet.google.com/abc-defg-hij',
    transcript: `Heitor: Bom dia a todos. Vamos começar pela pauta de planejamento do Q3.

Ana: Ótimo. O principal objetivo é lançar a campanha de brand awareness em julho.

Heitor: Concordo. Precisamos definir os entregáveis até o final desta semana.

Carlos: Ficou decidido que o briefing criativo será entregue na sexta-feira, dia 20.

Ana: Também precisamos alinhar com o time de mídia sobre os canais prioritários: Instagram e YouTube.

Heitor: Perfeito. Carlos fica responsável pelo briefing e Ana coordena com mídia.

Carlos: Confirmado. Prazo: 20 de junho.

Heitor: Mais algum ponto? Sem mais pautas, encerramos aqui.`,
    status: 'pending_review',
    duration_minutes: 32,
    participants: ['Heitor Miranda', 'Ana Souza', 'Carlos Lima'],
    created_by: 'admin',
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-05-20T10:32:00Z',
    segments: makeSegments('mtg-001', [
      'O principal objetivo é lançar a campanha de brand awareness em julho.',
      'Ficou decidido que o briefing criativo será entregue na sexta-feira, dia 20.',
      'Precisamos alinhar com o time de mídia sobre os canais prioritários: Instagram e YouTube.',
      'Carlos fica responsável pelo briefing e Ana coordena com mídia. Prazo: 20 de junho.',
    ]),
  },
  {
    id: 'mtg-002',
    client_id: 'americanas',
    title: 'Alinhamento de Estratégia de Conteúdo',
    transcript: `Maria: Hoje discutiremos a estratégia de conteúdo para o segundo semestre.

Pedro: A decisão principal é focar em conteúdo educativo nas redes sociais.

Maria: Isso mesmo. Vamos produzir 4 vídeos por mês no YouTube.

Pedro: Além disso, o blog receberá 2 posts semanais sobre tendências do setor.

Maria: Pedro ficará responsável por coordenar a produção de vídeo.

Pedro: Entendido. Próximo passo: reunião com a agência de produção na próxima terça.`,
    status: 'curated',
    duration_minutes: 45,
    participants: ['Maria Costa', 'Pedro Alves'],
    created_by: 'admin',
    created_at: '2026-05-15T14:00:00Z',
    updated_at: '2026-05-16T09:00:00Z',
    segments: makeSegments('mtg-002', [
      'A decisão principal é focar em conteúdo educativo nas redes sociais.',
      'Vamos produzir 4 vídeos por mês no YouTube.',
      'O blog receberá 2 posts semanais sobre tendências do setor.',
      'Pedro ficará responsável por coordenar a produção de vídeo. Próximo passo: reunião com a agência na próxima terça.',
    ]),
  },
  {
    id: 'mtg-003',
    client_id: 'vivo',
    title: 'Revisão de Performance Mensal — Maio',
    transcript: `Luana: Vamos revisar os resultados de maio.

Roberto: O engajamento cresceu 18% em relação a abril, superando a meta de 15%.

Luana: Excelente. Quais foram os fatores que contribuíram para isso?

Roberto: Os reels têm performado muito melhor do que posts estáticos. Decidimos priorizar reels no mix de junho.

Luana: Ótimo. Outra decisão: aumentar o investimento em tráfego pago em 20%.

Roberto: Confirmado. Roberto ficará responsável pela atualização do media plan até amanhã.`,
    status: 'archived',
    duration_minutes: 28,
    participants: ['Luana Ferreira', 'Roberto Nunes'],
    created_by: 'admin',
    created_at: '2026-05-05T09:00:00Z',
    updated_at: '2026-05-05T09:28:00Z',
    segments: makeSegments('mtg-003', [
      'O engajamento cresceu 18% em relação a abril, superando a meta de 15%.',
      'Os reels têm performado muito melhor do que posts estáticos. Decisão: priorizar reels no mix de junho.',
      'Decisão: aumentar o investimento em tráfego pago em 20%.',
      'Roberto ficará responsável pela atualização do media plan até amanhã.',
    ]),
  },
];
