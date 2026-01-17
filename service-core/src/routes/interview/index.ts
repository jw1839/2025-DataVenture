import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middlewares/auth.middleware';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/v1/interview/start
 * 인터뷰 시작 (질문 생성 및 인터뷰 세션 생성)
 */
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { mode, duration, selectedQuestions, customQuestions, voiceMode } = req.body;  // ✅ voiceMode 추가
    
    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const userId = req.user.id;

    // 구직자 확인
    if (req.user.role !== 'CANDIDATE') {
      return res.status(403).json({ error: '구직자만 인터뷰를 시작할 수 있습니다.' });
    }

    // mode 검증
    const validModes = ['PRACTICE', 'ACTUAL'];
    const interviewMode = mode?.toUpperCase() || 'PRACTICE';
    
    if (!validModes.includes(interviewMode)) {
      return res.status(400).json({ 
        error: `유효하지 않은 mode 값입니다. 허용된 값: ${validModes.join(', ')}` 
      });
    }

    // 프로필 조회
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return res.status(404).json({ error: '프로필을 먼저 작성해주세요.' });
    }

    // 질문 계획 준비
    let questionPlan = null;
    let aiQuestions = [];
    
    if (selectedQuestions && selectedQuestions.length > 0) {
      // 연습 모드에서 선택한 질문이 있는 경우
      questionPlan = {
        questions: selectedQuestions.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          category: q.category,
          max_follow_ups: q.max_follow_ups || 0,
          asked: false,
          follow_up_count: 0,
          is_custom: false
        })),
        currentIndex: 0
      };
      
      // 커스텀 질문 추가
      if (customQuestions && customQuestions.length > 0) {
        customQuestions.forEach((text: string, index: number) => {
          questionPlan.questions.push({
            id: `custom-${index}`,
            text,
            type: 'common',
            category: '커스텀 질문',
            max_follow_ups: 0,
            asked: false,
            follow_up_count: 0,
            is_custom: true
          });
        });
      }
      
      aiQuestions = questionPlan.questions;
    } else {
      // ✅ 실전 모드 또는 AI 질문 생성 필요
      console.log(`[Interview Start] AI 질문 생성 시작. 모드: ${interviewMode}`);
      
      // 프로필 데이터 변환 (AI 서비스 형식에 맞춤)
      let candidateProfileData = null;
      if (profile) {
        try {
          // careerHistory 파싱하여 경력 년수 계산
          let totalExperienceYears = 0;
          if (profile.careerHistory) {
            const careerHistory = typeof profile.careerHistory === 'string' 
              ? JSON.parse(profile.careerHistory) 
              : profile.careerHistory;
            
            // 각 경력의 기간 계산
            if (Array.isArray(careerHistory)) {
              careerHistory.forEach((career: any) => {
                const startDate = new Date(career.startDate);
                const endDate = career.endDate ? new Date(career.endDate) : new Date();
                const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
                totalExperienceYears += years;
              });
            }
          }
          
          candidateProfileData = {
            skills: profile.skills || [],  // String[] 그대로 전달
            experience: Math.floor(totalExperienceYears),  // 경력 년수 (정수)
            desiredPosition: profile.desiredPosition || '소프트웨어 엔지니어',
          };
          
          console.log(`[Interview Start] 프로필 데이터 변환 완료:`, candidateProfileData);
        } catch (parseError) {
          console.error('[Interview Start] 프로필 데이터 파싱 오류:', parseError);
          // 기본값 사용
          candidateProfileData = {
            skills: profile.skills || [],
            experience: 0,
            desiredPosition: profile.desiredPosition || '소프트웨어 엔지니어',
          };
        }
      }
      
      // ✅ 질문 세트 생성 (실전 모드는 10개)
      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/internal/ai/generate-question-set`,  // ✅ 올바른 엔드포인트
        {
          candidateProfile: candidateProfileData,  // ✅ 올바른 필드명
          jobPosting: {
            title: '신입 개발자 채용',
            position: candidateProfileData?.desiredPosition || '소프트웨어 엔지니어',
            requirements: [],
          },
          mode: interviewMode,
        },
        {
          timeout: 30000,  // 30초 타임아웃
        }
      );

      const { questions } = aiResponse.data;
      aiQuestions = questions;
      
      console.log(`[Interview Start] AI 질문 ${questions.length}개 생성 완료`);
      
      // AI 생성 질문으로 질문 계획 생성
      questionPlan = {
        questions: questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          type: q.type || 'common',
          category: q.category || '일반',
          max_follow_ups: q.max_follow_ups || 1,
          asked: false,
          follow_up_count: 0,
          is_custom: false
        })),
        currentIndex: 0
      };
    }

    // 인터뷰 세션 생성
    const interview = await prisma.interview.create({
      data: {
        candidateId: userId,
        mode: interviewMode,
        timeLimitSeconds: duration ? duration * 60 : 900, // 분을 초로 변환
        isVoiceMode: voiceMode !== undefined ? voiceMode : (interviewMode === 'ACTUAL'),  // ✅ voiceMode 반영
        questionCount: questionPlan.questions.length,
        questionPlanJson: JSON.stringify(questionPlan),
        status: 'IN_PROGRESS',
      },
    });

    res.json({
      interviewId: interview.id,
      questions: aiQuestions,
      interviewPlan: questionPlan,
      duration: interview.timeLimitSeconds,
      questionCount: questionPlan.questions.length,
    });
  } catch (error: any) {
    console.error('인터뷰 시작 오류:', error);
    
    // ✅ AI 서비스 응답 에러
    if (error.response) {
      console.error('[Interview Start] AI 서비스 응답 에러:', {
        status: error.response.status,
        data: error.response.data,
      });
      
      return res.status(500).json({ 
        error: 'AI 질문 생성에 실패했습니다.',
        details: error.response.data?.detail || error.message,
      });
    }
    
    // ✅ AI 서비스 연결 실패
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.error('[Interview Start] AI 서비스 연결 실패');
      
      return res.status(503).json({ 
        error: 'AI 서비스에 연결할 수 없습니다.',
        details: 'service-ai가 실행 중인지 확인해주세요.',
      });
    }
    
    // Prisma validation error 처리
    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(400).json({ 
        error: '잘못된 데이터 형식입니다.',
        details: error.message 
      });
    }
    
    // 기타 에러
    res.status(500).json({ 
      error: '인터뷰 시작에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * GET /api/v1/interview/:id
 * 인터뷰 정보 조회
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ error: '인터뷰를 찾을 수 없습니다.' });
    }

    // 권한 확인 (본인만 조회 가능)
    if (interview.candidateId !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    res.json(interview);
  } catch (error) {
    console.error('인터뷰 조회 오류:', error);
    res.status(500).json({ error: '인터뷰 조회에 실패했습니다.' });
  }
});

/**
 * PUT /api/v1/interview/:id/complete
 * 인터뷰 완료
 */
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { elapsedSeconds } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({ error: '인터뷰를 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (interview.candidateId !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // 인터뷰 완료 처리
    const updatedInterview = await prisma.interview.update({
      where: { id },
      data: {
        completedAt: new Date(),
        elapsedSeconds: elapsedSeconds || null,
        status: 'COMPLETED',
      },
    });

    // AI 서비스에서 평가 생성 및 저장 (비동기)
    (async () => {
      try {
        console.log(`[평가 생성 시작] 인터뷰 ID: ${id}`);
        
        // ✅ 1단계: 먼저 기존 평가 확인 (중복 생성 원천 차단)
        const existingEval = await prisma.evaluation.findUnique({
          where: { interviewId: id }
        });
        
        if (existingEval) {
          console.log(`[평가 생성] 이미 평가가 존재합니다. 인터뷰 ID: ${id}, 평가 ID: ${existingEval.id}`);
          console.log(`[평가 생성] 기존 평가 유지. 종합 점수: ${existingEval.overallScore}점`);
          return; // 생성도 알림도 하지 않음 (이미 완료)
        }
        
        // 2. 메시지 조회
        const messages = await prisma.interviewMessage.findMany({
          where: { interviewId: id },
          orderBy: { createdAt: 'asc' },
        });

        console.log(`[평가 생성] 메시지 ${messages.length}개 조회됨`);

        if (messages.length < 2) {
          console.error(`[평가 생성 실패] 메시지가 부족합니다. (${messages.length}개, 최소 2개 필요)`);
          return;
        }

        // 2. 프로필 조회
        const profile = await prisma.candidateProfile.findUnique({
          where: { userId: interview.candidateId },
        });

        console.log(`[평가 생성] 프로필 조회: ${profile ? '성공' : '없음'}`);

        // 3. AI 서비스 호출 (올바른 경로)
        console.log(`[평가 생성] AI 서비스 호출 중... URL: ${AI_SERVICE_URL}/internal/ai/generate-evaluation`);
        
        // 프로필 데이터 준비 (JSON 문자열을 파싱)
        let profileData = null;
        if (profile) {
          try {
            profileData = {
              education: profile.educationJson ? (typeof profile.educationJson === 'string' ? JSON.parse(profile.educationJson) : profile.educationJson) : null,
              experience: profile.experienceJson ? (typeof profile.experienceJson === 'string' ? JSON.parse(profile.experienceJson) : profile.experienceJson) : null,
              projects: profile.projectsJson ? (typeof profile.projectsJson === 'string' ? JSON.parse(profile.projectsJson) : profile.projectsJson) : null,
              skills: profile.skillsJson ? (typeof profile.skillsJson === 'string' ? JSON.parse(profile.skillsJson) : profile.skillsJson) : null,
              desiredPosition: profile.desiredPosition,
              bio: profile.bio,
            };
          } catch (parseError) {
            console.error('[평가 생성] 프로필 JSON 파싱 오류:', parseError);
            // 파싱 실패 시 원본 데이터 사용
            profileData = {
              desiredPosition: profile.desiredPosition,
              bio: profile.bio,
            };
          }
        }
        
        const aiResponse = await axios.post(
          `${AI_SERVICE_URL}/internal/ai/generate-evaluation`,
          {
            interviewId: id, // 필수 필드 추가
            conversationHistory: messages.map(m => ({
              role: m.role.toUpperCase(), // ✅ 대문자로 통일 (Phase 2)
              content: m.content
            })),
            candidateProfile: profileData,
            jobPosting: null,
          }
        );

        console.log(`[평가 생성] AI 서비스 응답 수신`);
        console.log(`[평가 생성] 점수:`, JSON.stringify(aiResponse.data.scores, null, 2));

        const { scores, feedback } = aiResponse.data;

        // 4. 평가 결과를 DB에 저장
        const evaluation = await prisma.evaluation.create({
          data: {
            interviewId: id,
            // 점수 매핑 (AI 서비스 응답 형식에서 DB 스키마로)
            deliveryScore: scores.communicationScore || 0,
            vocabularyScore: scores.communicationScore || 0,
            comprehensionScore: scores.communicationScore || 0,
            communicationAvg: scores.communicationScore || 0,
            informationAnalysis: scores.technicalScore || 0,
            problemSolving: scores.problemSolvingScore || 0,
            flexibleThinking: scores.problemSolvingScore || 0,
            negotiation: scores.communicationScore || 0,
            itSkills: scores.technicalScore || 0,
            overallScore: scores.overallScore || 0,
            strengthsJson: JSON.stringify(feedback.strengths || []),
            weaknessesJson: JSON.stringify(feedback.weaknesses || []),
            detailedFeedback: feedback.summary || '',
            recommendedPositions: JSON.stringify([]),
          },
        });

        console.log(`[평가 생성 완료] 평가 ID: ${evaluation.id}, 종합 점수: ${evaluation.overallScore}`);

        // 5. 알림 생성
        await prisma.notification.create({
          data: {
            userId: interview.candidateId,
            type: 'EVALUATION_COMPLETED',
            title: '인터뷰 평가 완료',
            message: `${interview.mode === 'PRACTICE' ? '연습' : '실전'} 인터뷰 평가가 완료되었습니다. 종합 점수: ${evaluation.overallScore}점`,
            link: `/evaluation/${id}`,
          },
        });

        console.log(`[평가 생성] 알림 생성 완료`);
      } catch (evalError: any) {
        console.error('[평가 생성 오류] 상세 정보:', evalError);
        
        // ✅ P2002 에러 처리 (방어 코드 - 이론상 발생 안함)
        if (evalError.code === 'P2002') {
          console.log(`[평가 생성] P2002 중복 에러 발생 (방어 코드 작동). 인터뷰 ID: ${id}`);
          console.log(`[평가 생성] 이미 평가가 존재하는 것으로 추정. 알림 생성 스킵.`);
          return; // 에러 알림도 생성하지 않음
        }
        
        if (evalError instanceof Error) {
          console.error('[평가 생성 오류] 메시지:', evalError.message);
          console.error('[평가 생성 오류] 스택:', evalError.stack);
        }
        
        // ✅ 진짜 에러인 경우만 알림 생성 (P2002가 아닌 경우)
        try {
          await prisma.notification.create({
            data: {
              userId: interview.candidateId,
              type: 'SYSTEM',
              title: '평가 생성 오류',
              message: '인터뷰 평가 생성 중 문제가 발생했습니다. 고객센터에 문의해주세요.',
              link: `/dashboard`,
            },
          });
        } catch (notifError) {
          console.error('[평가 생성] 알림 생성 오류:', notifError);
        }
      }
    })();

    res.json({
      message: '인터뷰가 완료되었습니다. 평가가 진행 중입니다.',
      interviewId: updatedInterview.id,
    });
  } catch (error) {
    console.error('인터뷰 완료 오류:', error);
    res.status(500).json({ error: '인터뷰 완료 처리에 실패했습니다.' });
  }
});

/**
 * POST /api/v1/interview/:id/message
 * 인터뷰 메시지 추가 (대화 기록)
 */
router.post('/:id/message', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, content, contentType, audioUrl } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    // content 필수 검증
    if (!content) {
      return res.status(400).json({ error: '메시지 내용이 필요합니다.' });
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      return res.status(404).json({ error: '인터뷰를 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (interview.candidateId !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // enum 값 검증
    const validRoles = ['AI', 'CANDIDATE'];
    const validContentTypes = ['TEXT', 'AUDIO'];
    
    const messageRole = role || 'CANDIDATE';
    const messageContentType = contentType || 'TEXT';
    
    if (!validRoles.includes(messageRole)) {
      return res.status(400).json({ 
        error: `유효하지 않은 role 값입니다. 허용된 값: ${validRoles.join(', ')}` 
      });
    }
    
    if (!validContentTypes.includes(messageContentType)) {
      return res.status(400).json({ 
        error: `유효하지 않은 contentType 값입니다. 허용된 값: ${validContentTypes.join(', ')}` 
      });
    }

    const message = await prisma.interviewMessage.create({
      data: {
        interviewId: id,
        role: messageRole,
        content,
        contentType: messageContentType,
        audioUrl: audioUrl || null,
      },
    });

    res.json(message);
  } catch (error) {
    console.error('메시지 저장 오류:', error);
    
    // Prisma validation error 처리
    if (error instanceof Error && error.message.includes('Invalid')) {
      return res.status(400).json({ 
        error: '잘못된 데이터 형식입니다.',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: '메시지 저장에 실패했습니다.' });
  }
});

export default router;
