/**
 * 채팅 메시지 컴포넌트
 */

import { InterviewMessage } from '@/types/interview';

interface ChatMessageProps {
  message: InterviewMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isAI = message.role === 'AI';

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-3 ${
          isAI
            ? 'bg-gray-100 text-gray-900'
            : 'bg-primary-600 text-white'
        }`}
      >
        {/* 역할 표시 */}
        <div className={`text-xs font-semibold mb-1 ${isAI ? 'text-gray-500' : 'text-primary-100'}`}>
          {isAI ? 'AI 면접관' : '나'}
        </div>

        {/* 메시지 내용 */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {/* 시간 표시 */}
        <div className={`text-xs mt-1 ${isAI ? 'text-gray-400' : 'text-primary-200'}`}>
          {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

