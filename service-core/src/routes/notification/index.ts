import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middlewares/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/notifications
 * 사용자의 알림 목록 조회
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const totalCount = await prisma.notification.count({ where });
    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      notifications,
      totalCount,
      unreadCount,
      hasMore: totalCount > Number(offset) + notifications.length,
    });
  } catch (error) {
    console.error('알림 조회 오류:', error);
    res.status(500).json({ error: '알림 조회에 실패했습니다.' });
  }
});

/**
 * PUT /api/v1/notifications/:id/read
 * 알림을 읽음으로 표시
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (notification.userId !== userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json(updatedNotification);
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    res.status(500).json({ error: '알림 읽음 처리에 실패했습니다.' });
  }
});

/**
 * PUT /api/v1/notifications/read-all
 * 모든 알림을 읽음으로 표시
 */
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      message: '모든 알림을 읽음 처리했습니다.',
      count: result.count,
    });
  } catch (error) {
    console.error('전체 알림 읽음 처리 오류:', error);
    res.status(500).json({ error: '전체 알림 읽음 처리에 실패했습니다.' });
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * 알림 삭제
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: '알림을 찾을 수 없습니다.' });
    }

    // 권한 확인
    if (notification.userId !== userId) {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: '알림이 삭제되었습니다.' });
  } catch (error) {
    console.error('알림 삭제 오류:', error);
    res.status(500).json({ error: '알림 삭제에 실패했습니다.' });
  }
});

export default router;

