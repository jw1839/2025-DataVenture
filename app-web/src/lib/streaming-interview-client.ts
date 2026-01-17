/**
 * 스트리밍 면접 클라이언트
 * Whisper + GPT-4o + ElevenLabs 파이프라인
 */

export class StreamingInterviewClient {
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private currentSource: AudioBufferSourceNode | null = null;
  
  // 이벤트 핸들러
  private onUserTranscript?: (text: string) => void;
  private onAITranscriptChunk?: (text: string) => void;
  private onAIAudioEnd?: () => void;
  private onInterviewEnded?: (history: any[]) => void;
  private onError?: (error: Error) => void;
  private onConnected?: () => void;
  
  constructor(
    private wsUrl: string = 'ws://localhost:8000/api/v1/ai/ws/streaming-interview'
  ) {}
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      
      this.ws.onopen = () => {
        console.log('[Streaming] 연결됨');
        this.onConnected?.();
        resolve();
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('[Streaming] 메시지 파싱 실패:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[Streaming] 에러:', error);
        this.onError?.(new Error('WebSocket 에러'));
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('[Streaming] 연결 종료');
      };
    });
  }
  
  private handleMessage(data: any) {
    switch (data.type) {
      case 'user_transcript':
        // 사용자 발화 텍스트
        console.log('[Streaming] 사용자 텍스트:', data.text);
        this.onUserTranscript?.(data.text);
        break;
      
      case 'ai_transcript_chunk':
        // AI 응답 텍스트 (스트리밍)
        this.onAITranscriptChunk?.(data.text);
        break;
      
      case 'ai_audio_chunk':
        // AI 음성 청크
        const audioData = this.base64ToArrayBuffer(data.audio);
        this.queueAudio(audioData);
        break;
      
      case 'ai_audio_end':
        // TTS 완료
        console.log('[Streaming] AI 음성 완료');
        this.onAIAudioEnd?.();
        break;
      
      case 'interview_ended':
        // 인터뷰 종료
        console.log('[Streaming] 인터뷰 종료');
        this.onInterviewEnded?.(data.conversation_history || []);
        break;
      
      case 'error':
        console.error('[Streaming] 서버 에러:', data.message);
        this.onError?.(new Error(data.message));
        break;
    }
  }
  
  async startRecording(stream: MediaStream): Promise<void> {
    // MediaRecorder로 오디오 녹음
    const options: MediaRecorderOptions = {
      mimeType: 'audio/webm'
    };
    
    // mimeType 지원 확인
    if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
      console.warn('[Streaming] audio/webm 미지원, 기본값 사용');
      delete options.mimeType;
    }
    
    this.mediaRecorder = new MediaRecorder(stream, options);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        // Blob → ArrayBuffer → Base64
        event.data.arrayBuffer().then(arrayBuffer => {
          const base64 = this.arrayBufferToBase64(arrayBuffer);
          this.ws?.send(JSON.stringify({
            type: 'audio_chunk',
            audio: base64
          }));
        });
      }
    };
    
    // 1초마다 청크 전송 (너무 짧으면 부담)
    this.mediaRecorder.start(1000);
    console.log('[Streaming] 녹음 시작');
  }
  
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      console.log('[Streaming] 녹음 중지');
    }
  }
  
  private async queueAudio(audioData: ArrayBuffer) {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 44100 });
    }
    
    try {
      // ArrayBuffer → AudioBuffer
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.audioQueue.push(audioBuffer);
      
      // 재생 시작
      if (!this.isPlaying) {
        this.playAudioQueue();
      }
    } catch (error) {
      console.error('[Streaming] 오디오 디코딩 실패:', error);
    }
  }
  
  private async playAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0 || !this.audioContext) return;
    
    this.isPlaying = true;
    
    while (this.audioQueue.length > 0) {
      const audioBuffer = this.audioQueue.shift()!;
      
      // 재생
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      
      this.currentSource = source;
      
      await new Promise<void>((resolve) => {
        source.onended = () => {
          this.currentSource = null;
          resolve();
        };
        source.start();
      });
    }
    
    this.isPlaying = false;
  }
  
  stopAudio(): void {
    // 현재 재생 중인 오디오 중단
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource = null;
      } catch (e) {
        // 이미 중단됨
      }
    }
    
    // 큐 비우기
    this.audioQueue = [];
    this.isPlaying = false;
  }
  
  endInterview(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'end_interview' }));
    }
    this.stopRecording();
    this.stopAudio();
    
    // WebSocket 연결 종료
    setTimeout(() => {
      this.ws?.close();
    }, 500);
  }
  
  disconnect(): void {
    this.stopRecording();
    this.stopAudio();
    this.ws?.close();
    this.ws = null;
  }
  
  // 이벤트 리스너
  on(event: 'user_transcript', handler: (text: string) => void): void;
  on(event: 'ai_transcript', handler: (text: string) => void): void;
  on(event: 'ai_audio_end', handler: () => void): void;
  on(event: 'interview_ended', handler: (history: any[]) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'connected', handler: () => void): void;
  on(event: string, handler: any): void {
    switch (event) {
      case 'user_transcript':
        this.onUserTranscript = handler;
        break;
      case 'ai_transcript':
        this.onAITranscriptChunk = handler;
        break;
      case 'ai_audio_end':
        this.onAIAudioEnd = handler;
        break;
      case 'interview_ended':
        this.onInterviewEnded = handler;
        break;
      case 'error':
        this.onError = handler;
        break;
      case 'connected':
        this.onConnected = handler;
        break;
    }
  }
  
  // 유틸리티
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }
  
  // 상태 확인
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
  
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}

