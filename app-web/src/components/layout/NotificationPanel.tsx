'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationAPI, Notification } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';

export default function NotificationPanel() {
  const { user, isAuthenticated } = useAuthStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 알림 로드
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      loadNotifications();
    }
  }, [isAuthenticated, isOpen]);

  // 주기적으로 미읽음 개수 체크 (30초마다)
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const checkUnread = async () => {
      try {
        const response = await notificationAPI.getAll({ unreadOnly: true, limit: 1 });
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        // 조용히 실패 처리
      }
    };
    
    checkUnread();
    
    const interval = setInterval(checkUnread, 30000); // 30초
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 알림 목록 로드
  const loadNotifications = async () => {
    setIsLoading(true);
    
    try {
      const response = await notificationAPI.getAll({ limit: 20 });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error: any) {
      console.error('알림 로드 실패:', error);
      toast.error('알림을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 읽음 처리
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('알림 읽음 처리 실패:', error);
      toast.error('알림 읽음 처리에 실패했습니다.');
    }
  };

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
      
      toast.success('모든 알림을 읽음 처리했습니다.');
    } catch (error: any) {
      console.error('전체 읽음 처리 실패:', error);
      toast.error('전체 읽음 처리에 실패했습니다.');
    }
  };

  // 알림 삭제
  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.delete(notificationId);
      
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
      
      toast.success('알림이 삭제되었습니다.');
    } catch (error: any) {
      console.error('알림 삭제 실패:', error);
      toast.error('알림 삭제에 실패했습니다.');
    }
  };

  // 알림 타입별 아이콘
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVALUATION_COMPLETE':
        return '📊';
      case 'NEW_MESSAGE':
        return '💬';
      case 'INTERVIEW_SCHEDULED':
        return '📅';
      case 'APPLICATION_UPDATE':
        return '📝';
      default:
        return '🔔';
    }
  };

  // 상대 시간 표시
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full p-2 hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-700" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* 알림 패널 */}
      {isOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 알림 목록 */}
          <Card className="absolute right-0 top-full z-50 mt-2 w-96 max-h-[600px] overflow-hidden shadow-xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold text-gray-900">알림</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    모두 읽음
                  </Button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* 알림 목록 */}
            <div className="max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">알림이 없습니다</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-4 transition-colors ${
                      notification.read
                        ? 'bg-white'
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 아이콘 */}
                      <div className="text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <Badge variant="default" className="shrink-0">
                              NEW
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          {getRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="mt-3 flex items-center gap-2">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          읽음
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
