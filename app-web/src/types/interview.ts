/**
 * 인터뷰 관련 타입 정의
 */

export type InterviewStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type InterviewMode = 'PRACTICE' | 'ACTUAL';
export type MessageRole = 'AI' | 'CANDIDATE';
export type ContentType = 'TEXT' | 'AUDIO';

export interface InterviewMessage {
  id: string;
  role: MessageRole;
  content: string;
  contentType: ContentType;
  audioUrl?: string;
  createdAt: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  jobPostingId?: string;
  mode: InterviewMode;
  status: InterviewStatus;
  startedAt: string;
  completedAt?: string;
  messages?: InterviewMessage[];
}

export interface JobPosting {
  id: string;
  title: string;
  position: string;
}

export interface InterviewState {
  currentInterview: Interview | null;
  messages: InterviewMessage[];
  isConnected: boolean;
  isProcessing: boolean;
  error: string | null;
}

// Socket.IO 이벤트 데이터 타입
export interface InterviewStartData {
  candidateId: string;
  jobPostingId?: string;
}

export interface InterviewStartedEvent {
  interviewId: string;
  interview: Interview;
  firstQuestion: InterviewMessage;
}

export interface InterviewMessageData {
  interviewId: string;
  content: string;
  contentType?: 'TEXT' | 'AUDIO';
  audioUrl?: string;
}

export interface InterviewQuestionEvent {
  id: string;
  role: MessageRole;
  content: string;
  contentType: ContentType;
  createdAt: string;
}

export interface InterviewErrorEvent {
  message: string;
}

export interface InterviewEndData {
  interviewId: string;
}

export interface InterviewEndedEvent {
  interviewId: string;
  message: string;
}

