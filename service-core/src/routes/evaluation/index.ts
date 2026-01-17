import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/v1/evaluation/analyze
 * AI 평가 결과 저장 (AI 서비스에서 호출)
 */
router.post('/analyze', async (req, res) => {
  try {
    const {
      interviewId,
      deliveryScore,
      vocabularyScore,
      comprehensionScore,
      communicationAvg,
      informationAnalysis,
      problemSolving,
      flexibleThinking,
      negotiation,
      itSkills,
      overallScore,
      strengthsJson,
      weaknessesJson,
      detailedFeedback,
      recommendedPositions,
    } = req.body;

    // 인터뷰 확인
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId },
      include: { candidate: true },
    });

    if (!interview) {
      return res.status(404).json({ error: '인터뷰를 찾을 수 없습니다.' });
    }

    // 평가 결과 저장
    const evaluation = await prisma.evaluation.create({
      data: {
        interviewId,
        deliveryScore,
        vocabularyScore,
        comprehensionScore,
        communicationAvg,
        informationAnalysis,
        problemSolving,
        flexibleThinking,
        negotiation,
        itSkills,
        overallScore,
        strengthsJson: JSON.stringify(strengthsJson || []),
        weaknessesJson: JSON.stringify(weaknessesJson || []),
        detailedFeedback: detailedFeedback || '',
        recommendedPositions: JSON.stringify(recommendedPositions || []),
      },
    });

    // 알림 생성
    await prisma.notification.create({
      data: {
        userId: interview.candidateId,
        type: 'EVALUATION_COMPLETED',
        title: '인터뷰 평가 완료',
        message: `${interview.mode === 'PRACTICE' ? '연습' : '실전'} 인터뷰 평가가 완료되었습니다.`,
        link: `/evaluation/${evaluation.id}`,
      },
    });

    res.json({
      message: '평가가 완료되었습니다.',
      evaluationId: evaluation.id,
    });
  } catch (error) {
    console.error('평가 저장 오류:', error);
    res.status(500).json({ 
      error: '평가 저장에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
});

/**
 * GET /api/v1/evaluation/:id
 * 평가 결과 조회
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { id },
      include: {
        interview: {
          select: {
            id: true,
            mode: true,
            startedAt: true,
            completedAt: true,
            candidateId: true,
          },
        },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: '평가 결과를 찾을 수 없습니다.' });
    }

    // 권한 확인 (본인만 조회 가능)
    if (!req.user || evaluation.interview.candidateId !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // JSON 파싱
    const response = {
      ...evaluation,
      strengthsJson: JSON.parse(evaluation.strengthsJson || '[]'),
      weaknessesJson: JSON.parse(evaluation.weaknessesJson || '[]'),
      recommendedPositions: JSON.parse(evaluation.recommendedPositions || '[]'),
    };

    res.json(response);
  } catch (error) {
    console.error('평가 조회 오류:', error);
    res.status(500).json({ error: '평가 조회에 실패했습니다.' });
  }
});

/**
 * GET /api/v1/evaluation/interview/:interviewId
 * 인터뷰 ID로 평가 결과 조회
 */
router.get('/interview/:interviewId', authenticateToken, async (req, res) => {
  try {
    const { interviewId } = req.params;

    const evaluation = await prisma.evaluation.findUnique({
      where: { interviewId },
      include: {
        interview: {
          select: {
            id: true,
            mode: true,
            startedAt: true,
            completedAt: true,
            candidateId: true,
          },
        },
      },
    });

    if (!evaluation) {
      return res.status(404).json({ error: '평가 결과를 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (!req.user || evaluation.interview.candidateId !== req.user.id) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    // JSON 파싱
    const response = {
      ...evaluation,
      strengthsJson: JSON.parse(evaluation.strengthsJson || '[]'),
      weaknessesJson: JSON.parse(evaluation.weaknessesJson || '[]'),
      recommendedPositions: JSON.parse(evaluation.recommendedPositions || '[]'),
    };

    res.json(response);
  } catch (error) {
    console.error('평가 조회 오류:', error);
    res.status(500).json({ error: '평가 조회에 실패했습니다.' });
  }
});

export default router;
