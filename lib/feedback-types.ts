export interface MessageFeedback {
  rating: 'up' | 'down' | null;
  comment: string;
}

export interface SessionFeedback {
  rating: number;
  comment: string;
  submittedAt: string;
}
