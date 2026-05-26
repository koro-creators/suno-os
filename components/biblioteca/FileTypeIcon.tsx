'use client';

import { Document, Events, Image, Microphone, Video } from '@carbon/icons-react';
import { KnowledgeFileType } from '@/lib/biblioteca-types';

interface FileTypeIconProps {
  fileType?: KnowledgeFileType | string;
  size?: number;
  docType?: 'reuniao';
}

const FILE_TYPE_CONFIG: Record<string, { icon: typeof Document; color: string }> = {
  pdf: { icon: Document, color: '#EF4444' },
  docx: { icon: Document, color: '#3B82F6' },
  txt: { icon: Document, color: 'var(--text-muted)' },
  md: { icon: Document, color: 'var(--text-muted)' },
  png: { icon: Image, color: '#10B981' },
  jpg: { icon: Image, color: '#10B981' },
  webp: { icon: Image, color: '#10B981' },
  mp3: { icon: Microphone, color: '#F59E0B' },
  wav: { icon: Microphone, color: '#F59E0B' },
  mp4: { icon: Video, color: '#8B5CF6' },
  mov: { icon: Video, color: '#8B5CF6' },
};

export default function FileTypeIcon({ fileType, size = 14, docType }: FileTypeIconProps) {
  if (docType === 'reuniao') {
    return <Events size={size} style={{ color: '#06B6D4', flexShrink: 0 }} />;
  }
  const config = fileType ? FILE_TYPE_CONFIG[fileType.toLowerCase()] : undefined;
  const IconComponent = config?.icon ?? Document;
  const color = config?.color ?? 'var(--text-muted)';

  return <IconComponent size={size} style={{ color, flexShrink: 0 }} />;
}
