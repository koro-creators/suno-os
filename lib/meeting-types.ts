// SPEC-016 — Captura Seletiva de Reunioes (Phase 21)
// Types for meetings list, curation flow, and segment selection.

export type MeetingStatus = 'pending_review' | 'curated' | 'archived';

export interface MeetingSegment {
  id: string;
  meeting_id: string;
  text: string;
  start_time?: string; // HH:MM:SS
  selected: boolean;
  context_note: string;
  curated_by?: string;
  curated_at?: string;
}

export interface Meeting {
  id: string;
  client_id: string;
  title: string;
  meet_link?: string;
  transcript: string; // plain text — Gemini Meet stub for Phase 21
  status: MeetingStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  duration_minutes?: number;
  participants?: string[]; // names or emails
  segments?: MeetingSegment[];
}

export interface MeetingCreateData {
  title: string;
  client_id: string;
  meet_link?: string;
  transcript: string;
  participants?: string[];
  duration_minutes?: number;
}

export interface CuratePayload {
  segments: Array<{
    id: string;
    selected: boolean;
    context_note: string;
  }>;
}
