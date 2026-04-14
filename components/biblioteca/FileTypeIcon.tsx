'use client';

import { FileText, Image, Mic, Video, File } from 'lucide-react';
import { KnowledgeFileType } from '@/lib/biblioteca-types';

interface FileTypeIconProps {
  fileType?: KnowledgeFileType | string;
  size?: number;
}

const FILE_TYPE_CONFIG: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: '#EF4444' },
  docx: { icon: FileText, color: '#3B82F6' },
  txt: { icon: FileText, color: 'var(--text-muted)' },
  md: { icon: FileText, color: 'var(--text-muted)' },
  png: { icon: Image, color: '#10B981' },
  jpg: { icon: Image, color: '#10B981' },
  webp: { icon: Image, color: '#10B981' },
  mp3: { icon: Mic, color: '#F59E0B' },
  wav: { icon: Mic, color: '#F59E0B' },
  mp4: { icon: Video, color: '#8B5CF6' },
  mov: { icon: Video, color: '#8B5CF6' },
};

export default function FileTypeIcon({ fileType, size = 14 }: FileTypeIconProps) {
  const config = fileType ? FILE_TYPE_CONFIG[fileType.toLowerCase()] : undefined;
  const IconComponent = config?.icon ?? File;
  const color = config?.color ?? 'var(--text-muted)';

  return <IconComponent size={size} strokeWidth={1.5} style={{ color, flexShrink: 0 }} />;
}
