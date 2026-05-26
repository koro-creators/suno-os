'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Meeting, MeetingCreateData, MeetingSegment, MeetingStatus, CuratePayload } from '@/lib/meeting-types';
import { initialMeetings } from '@/data/meetings-admin';

interface MeetingsContextValue {
  meetings: Meeting[];
  loading: boolean;
  error: string | null;
  getMeeting: (id: string) => Meeting | undefined;
  createMeeting: (data: MeetingCreateData) => Meeting;
  curateMeeting: (id: string, payload: CuratePayload) => void;
  updateStatus: (id: string, status: MeetingStatus) => void;
}

const MeetingsContext = createContext<MeetingsContextValue | null>(null);

function splitTranscriptIntoSegments(meetingId: string, transcript: string): MeetingSegment[] {
  // Split on double-newline or paragraph boundaries for the stub mode
  const chunks = transcript
    .split(/\n\n+/)
    .map((t) => t.trim())
    .filter(Boolean);

  return chunks.map((text, i) => ({
    id: `seg-${meetingId}-${i + 1}`,
    meeting_id: meetingId,
    text,
    start_time: undefined,
    selected: false,
    context_note: '',
  }));
}

export function MeetingsProvider({ children }: { children: ReactNode }) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  function getMeeting(id: string): Meeting | undefined {
    return meetings.find((m) => m.id === id);
  }

  function createMeeting(data: MeetingCreateData): Meeting {
    const id = `mtg-${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const segments = splitTranscriptIntoSegments(id, data.transcript);

    const newMeeting: Meeting = {
      id,
      client_id: data.client_id,
      title: data.title,
      meet_link: data.meet_link,
      transcript: data.transcript,
      status: 'pending_review',
      created_by: 'admin',
      created_at: now,
      updated_at: now,
      duration_minutes: data.duration_minutes,
      participants: data.participants,
      segments,
    };

    setMeetings((prev) => [newMeeting, ...prev]);
    return newMeeting;
  }

  function curateMeeting(id: string, payload: CuratePayload) {
    const now = new Date().toISOString();
    setMeetings((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updatedSegments = (m.segments ?? []).map((seg) => {
          const update = payload.segments.find((s) => s.id === seg.id);
          if (!update) return seg;
          return {
            ...seg,
            selected: update.selected,
            context_note: update.context_note,
            curated_by: 'admin',
            curated_at: now,
          };
        });
        return {
          ...m,
          segments: updatedSegments,
          status: 'curated' as MeetingStatus,
          updated_at: now,
        };
      })
    );
  }

  function updateStatus(id: string, status: MeetingStatus) {
    const now = new Date().toISOString();
    setMeetings((prev) =>
      prev.map((m) => (m.id !== id ? m : { ...m, status, updated_at: now }))
    );
  }

  return (
    <MeetingsContext.Provider
      value={{ meetings, loading, error, getMeeting, createMeeting, curateMeeting, updateStatus }}
    >
      {children}
    </MeetingsContext.Provider>
  );
}

export function useMeetings() {
  const ctx = useContext(MeetingsContext);
  if (!ctx) throw new Error('useMeetings must be used within MeetingsProvider');
  return ctx;
}
