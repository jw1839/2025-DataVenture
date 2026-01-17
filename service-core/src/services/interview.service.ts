/**
 * 인터뷰 세션 관리 서비스
 */

import prisma from '../utils/prisma';
import { InterviewStatus, MessageRole, ContentType } from '@prisma/client';
import axios from 'axios';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// 인터뷰 질문 생성 중인 세션 추적 (중복 방지)
const processingInterviews = new Set<string>();

/**
 * 새로운 인터뷰 세션 생성
 * @param candidateId 구직자 ID
 * @param jobPostingId 채용 공고 ID (선택)
 * @returns 생성된 인터뷰 세션
 */
export const createInterview = async (
  candidateId: string,
  jobPostingId?: string
) => {
  // 사용자 확인
  const user = await prisma.user.findUnique({
    where: { id: candidateId },
    include: { candidateProfile: true },
  });

  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }

  if (user.role !== 'CANDIDATE') {
    throw new Error('구직자만 인터뷰를 시작할 수 있습니다.');
  }

  // 채용 공고 확인 (선택)
  if (jobPostingId) {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!jobPosting || jobPosting.status !== 'ACTIVE') {
      throw new Error('유효한 채용 공고가 아닙니다.');
    }
  }

  // 인터뷰 세션 생성
  const interview = await prisma.interview.create({
    data: {
      candidateId,
      jobPostingId,
      status: InterviewStatus.IN_PROGRESS,
    },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          position: true,
        },
      },
    },
  });

  // 첫 번째 AI 질문 생성
  try {
    const firstQuestion = await generateFirstQuestion(candidateId, jobPostingId);
    
    // AI 질문 메시지 저장
    await saveMessage(interview.id, MessageRole.AI, firstQuestion, ContentType.TEXT);
  } catch (error) {
    console.error('[Interview Service] 첫 번째 질문 생성 실패:', error);
    // 기본 질문 사용
    const defaultQuestion = '안녕하세요! 오늘 인터뷰에 참여해주셔서 감사합니다. 먼저 간단하게 자기소개를 부탁드립니다.';
    await saveMessage(interview.id, MessageRole.AI, defaultQuestion, ContentType.TEXT);
  }

  return interview;
};

/**
 * 인터뷰 메시지 저장
 * @param interviewId 인터뷰 ID
 * @param role 메시지 역할 (AI/CANDIDATE)
 * @param content 메시지 내용
 * @param contentType 콘텐츠 타입 (TEXT/AUDIO)
 * @param audioUrl 음성 URL (선택)
 * @returns 저장된 메시지
 */
export const saveMessage = async (
  interviewId: string,
  role: MessageRole,
  content: string,
  contentType: ContentType = ContentType.TEXT,
  audioUrl?: string
) => {
  const message = await prisma.interviewMessage.create({
    data: {
      interviewId,
      role,
      content,
      contentType,
      audioUrl,
    },
  });

  return message;
};

/**
 * 인터뷰의 모든 메시지 조회
 * @param interviewId 인터뷰 ID
 * @returns 메시지 목록
 */
export const getInterviewMessages = async (interviewId: string) => {
  const messages = await prisma.interviewMessage.findMany({
    where: { interviewId },
    orderBy: { createdAt: 'asc' },
  });

  return messages;
};

/**
 * AI 서비스에서 첫 번째 질문 생성
 * @param candidateId 구직자 ID
 * @param jobPostingId 채용 공고 ID (선택)
 * @returns AI 생성 질문
 */
const generateFirstQuestion = async (
  candidateId: string,
  jobPostingId?: string
): Promise<string> => {
  try {
    // 구직자 프로필 조회
    const candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: candidateId },
    });

    // 채용 공고 조회 (있는 경우)
    let jobPosting = null;
    if (jobPostingId) {
      jobPosting = await prisma.jobPosting.findUnique({
        where: { id: jobPostingId },
      });
    }

    // AI 서비스 호출
    const response = await axios.post(
      `${AI_SERVICE_URL}/internal/ai/generate-question`,
      {
        candidateProfile: candidateProfile
          ? {
              skills: candidateProfile.skills,
              experience: candidateProfile.experience,
              desiredPosition: candidateProfile.desiredPosition,
            }
          : null,
        jobPosting: jobPosting
          ? {
              title: jobPosting.title,
              position: jobPosting.position,
              requirements: jobPosting.requirements,
            }
          : null,
        isFirstQuestion: true,
      },
      {
        timeout: 10000, // 10초 타임아웃
      }
    );

    return response.data.question;
  } catch (error) {
    console.error('[Interview Service] AI 질문 생성 실패:', error);
    throw error;
  }
};

/**
 * AI 서비스에서 다음 질문 생성
 * @param interviewId 인터뷰 ID
 * @param lastAnswer 마지막 답변
 * @returns AI 생성 질문
 */
export const generateNextQuestion = async (
  interviewId: string,
  lastAnswer: string
): Promise<string> => {
  // 중복 처리 방지
  if (processingInterviews.has(interviewId)) {
    throw new Error('이미 질문 생성 중입니다.');
  }
  
  processingInterviews.add(interviewId);
  
  try {
    // 인터뷰 정보 조회
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: {
          include: { candidateProfile: true },
        },
        jobPosting: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10, // 최근 10개 메시지
        },
      },
    });

    if (!interview) {
      throw new Error('인터뷰를 찾을 수 없습니다.');
    }

    // 대화 히스토리 구성
    const conversationHistory = interview.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // AI 서비스 호출
    const response = await axios.post(
      `${AI_SERVICE_URL}/internal/ai/generate-question`,
      {
        interviewId,
        candidateProfile: interview.candidate.candidateProfile
          ? {
              skills: interview.candidate.candidateProfile.skills,
              experience: interview.candidate.candidateProfile.experience,
              desiredPosition: interview.candidate.candidateProfile.desiredPosition,
            }
          : null,
        jobPosting: interview.jobPosting
          ? {
              title: interview.jobPosting.title,
              position: interview.jobPosting.position,
              requirements: interview.jobPosting.requirements,
            }
          : null,
        conversationHistory,
        lastAnswer,
        isFirstQuestion: false,
      },
      {
        timeout: 10000,
      }
    );

    return response.data.question;
  } catch (error) {
    console.error('[Interview Service] AI 질문 생성 실패:', error);
    throw error;
  } finally {
    processingInterviews.delete(interviewId);
  }
};

/**
 * 인터뷰 종료
 * @param interviewId 인터뷰 ID
 * @returns 업데이트된 인터뷰
 */
export const completeInterview = async (interviewId: string) => {
  const interview = await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: InterviewStatus.COMPLETED,
      completedAt: new Date(),
    },
  });

  // 평가 생성 (비동기로 실행)
  generateEvaluation(interviewId).catch((error) => {
    console.error('[Interview Service] 평가 생성 실패:', error);
  });

  return interview;
};

/**
 * 평가 생성
 * @param interviewId 인터뷰 ID
 */
export const generateEvaluation = async (interviewId: string): Promise<void> => {
  try {
    // 인터뷰 정보 조회
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        candidate: {
          include: { candidateProfile: true },
        },
        jobPosting: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!interview) {
      throw new Error('인터뷰를 찾을 수 없습니다.');
    }

    // 대화 히스토리 구성
    const conversationHistory = interview.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // AI 서비스 호출 (평가 생성)
    const response = await axios.post(
      `${AI_SERVICE_URL}/internal/ai/generate-evaluation`,
      {
        interviewId,
        conversationHistory,
        candidateProfile: interview.candidate.candidateProfile
          ? {
              skills: interview.candidate.candidateProfile.skills,
              experience: interview.candidate.candidateProfile.experience,
              desiredPosition: interview.candidate.candidateProfile.desiredPosition,
            }
          : null,
        jobPosting: interview.jobPosting
          ? {
              title: interview.jobPosting.title,
              position: interview.jobPosting.position,
              requirements: interview.jobPosting.requirements,
            }
          : null,
      },
      {
        timeout: 60000, // 60초 타임아웃 (평가 생성은 시간이 걸릴 수 있음)
      }
    );

    const { scores, feedback } = response.data;

    // 평가 결과 저장 (Sprint 8-9 새로운 스키마)
    await prisma.evaluation.create({
      data: {
        interviewId,
        // 의사소통능력 (공통 평가)
        deliveryScore: scores.deliveryScore || scores.communicationScore || 70,
        vocabularyScore: scores.vocabularyScore || scores.communicationScore || 70,
        comprehensionScore: scores.comprehensionScore || scores.problemSolvingScore || 70,
        communicationAvg: scores.communicationAvg || scores.communicationScore || 70,
        // 직무 특별 평가
        informationAnalysis: scores.informationAnalysis || scores.technicalScore || 70,
        problemSolving: scores.problemSolving || scores.problemSolvingScore || 70,
        flexibleThinking: scores.flexibleThinking || scores.problemSolvingScore || 70,
        negotiation: scores.negotiation || scores.communicationScore || 70,
        itSkills: scores.itSkills || scores.technicalScore || 70,
        // 종합 점수
        overallScore: scores.overallScore || 70,
        // 피드백
        strengthsJson: JSON.stringify(feedback.strengths || []),
        weaknessesJson: JSON.stringify(feedback.weaknesses || []),
        detailedFeedback: feedback.summary || feedback.detailedFeedback || '',
        // 추천 직무
        recommendedPositions: JSON.stringify(feedback.recommendedPositions || []),
      },
    });

    console.log(`[Interview Service] 평가 생성 완료: ${interviewId}`);
  } catch (error) {
    console.error('[Interview Service] 평가 생성 실패:', error);
    throw error;
  }
};

/**
 * 인터뷰 조회
 * @param interviewId 인터뷰 ID
 * @returns 인터뷰 정보
 */
export const getInterview = async (interviewId: string) => {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: {
      candidate: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      jobPosting: {
        select: {
          id: true,
          title: true,
          position: true,
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!interview) {
    throw new Error('인터뷰를 찾을 수 없습니다.');
  }

  return interview;
};

/**
 * 사용자의 인터뷰 목록 조회
 * @param userId 사용자 ID
 * @returns 인터뷰 목록
 */
export const getUserInterviews = async (userId: string) => {
  const interviews = await prisma.interview.findMany({
    where: { candidateId: userId },
    include: {
      jobPosting: {
        select: {
          title: true,
          position: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  });

  return interviews;
};

