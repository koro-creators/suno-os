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

export type KnowledgeStatus = 'processing' | 'ready' | 'error' | 'novo' | 'utilizado' | 'para gerar conhecimento' | 'gerado';

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
  /** Phase 21 — Reuniões e documentos gerados como sub-tipos da Biblioteca */
  docType?: 'reuniao' | 'base';
  meetingDate?: string;
  meetingParticipants?: string[];
  meetingDuration?: string;
  company?: string; // empresa mencionada na ata
}
