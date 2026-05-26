export type KnowledgeFileType =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'md'
  | 'png'
  | 'jpg'
  | 'webp'
  | 'mp3'
  | 'wav'
  | 'mp4'
  | 'mov';

export type KnowledgeStatus = 'processing' | 'ready' | 'error';

export interface BibliotecaDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  scope: string[];
  links: { label: string; url: string }[];
  files: { name: string; type: string; size: string }[];
  createdBy: string;
  updatedAt: string;
  /** v2 fields — Knowledge Architecture */
  fileType?: KnowledgeFileType;
  fileUrl?: string;
  thumbnailUrl?: string;
  status?: KnowledgeStatus;
  fileSize?: number;
  /** Phase 21 — Reuniões como sub-tipo da Biblioteca */
  docType?: 'reuniao';
  meetingDate?: string;
  meetingParticipants?: string[];
  meetingDuration?: string;
}
