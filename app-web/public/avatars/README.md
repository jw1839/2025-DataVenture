# Ready Player Me 아바타 가이드

## 현재 구현 상태

- ✅ Public demo 아바타 사용 중 (API Key 불필요)
- ✅ GLB 파일 직접 로드
- ✅ Morph Targets (립싱크, 눈 깜빡임) 지원
- ✅ 마우스 추적, 숨쉬기 애니메이션

## 커스텀 아바타 생성 방법

### 옵션 A: Ready Player Me 웹사이트 사용 (무료, 추천)

1. **Ready Player Me 방문**: https://readyplayer.me/
2. **아바타 생성**: 
   - "Create Avatar" 클릭
   - 사진 업로드 또는 직접 커스터마이징
   - 얼굴형, 헤어스타일, 의상 등 선택
3. **GLB URL 복사**:
   - 생성 완료 후 Share 버튼 클릭
   - `.glb` URL 복사 (예: `https://models.readyplayer.me/YOUR_ID.glb`)
4. **코드에 적용**:
   ```typescript
   // app-web/src/components/interview/AIAvatarGLTF.tsx
   const DEFAULT_MODEL_URL = 'https://models.readyplayer.me/YOUR_ID.glb';
   ```

### 옵션 B: Ready Player Me Studio 사용 (고급 기능)

**필요한 경우**:
- 커스텀 의상/액세서리 업로드
- 브랜드 커스터마이징
- User account 통합
- Premium asset 관리

**설정 방법**:

1. **Studio 가입**: https://studio.readyplayer.me/
2. **Application 생성**:
   - Dashboard → Create Application
   - Application ID 받기
3. **API Key 발급**:
   - Developer Tools → API Keys
   - "Create API Key" 클릭
   - Read/Write 권한 설정
4. **환경 변수 설정**:
   ```bash
   # app-web/.env.local
   NEXT_PUBLIC_READYPLAYER_ME_APP_ID=your-app-id
   READYPLAYER_ME_API_KEY=your-api-key  # 서버 사이드만
   ```

## 아바타 요구사항

### ✅ 지원되는 형식
- GLB (Binary glTF) - 권장
- Fullbody 또는 Halfbody
- Morph Targets (ARKit Blend Shapes)

### 📏 권장 사양
- **파일 크기**: < 5MB
- **Polygon Count**: < 100,000 triangles
- **Texture**: 2K 이하
- **Bones**: < 150 joints

## Morph Targets (블렌드 셰이프)

Ready Player Me 모델은 표준 ARKit 블렌드 셰이프를 지원한다:

### 립싱크 (Visemes)
- `viseme_sil` - 침묵
- `viseme_aa` - "아"
- `viseme_E` - "에"
- `viseme_I` - "이"
- `viseme_O` - "오"
- `viseme_U` - "우"
- `viseme_PP` - "ㅁ, ㅂ, ㅍ"
- `viseme_FF` - "ㅍ, ㅂ"
- `viseme_TH` - "ㅅ, ㅆ"
- `viseme_SS` - "ㅅ"
- `viseme_CH` - "ㅊ"
- `viseme_nn` - "ㄴ, ㄹ"
- `viseme_RR` - "ㄹ"

### 표정
- `eyeBlinkLeft` / `eyeBlinkRight` - 눈 깜빡임
- `browInnerUp` - 눈썹 올리기
- `mouthSmile` - 미소

## 성능 최적화

```typescript
// 모델 프리로드
useGLTF.preload('https://models.readyplayer.me/YOUR_ID.glb');

// 복수 인스턴스 사용 시 복제
import { SkeletonUtils } from 'three-stdlib';
const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
```

## 문제 해결

### 모델이 로드되지 않음
- ✅ URL이 `.glb`로 끝나는지 확인
- ✅ CORS 에러: Ready Player Me는 CORS 허용됨
- ✅ Network 탭에서 404/403 확인

### 립싱크가 작동하지 않음
- ✅ `Wolf3D_Head` 메쉬 이름 확인
- ✅ `morphTargetDictionary` 존재 여부 확인
- ✅ Console에서 viseme 이름 출력:
  ```typescript
  console.log(headMesh.morphTargetDictionary);
  ```

### 애니메이션이 끊김
- ✅ `useFrame` 내부에서 `THREE.MathUtils.lerp` 사용
- ✅ FPS 모니터링: Stats.js 추가

## 참고 자료

- 공식 문서: https://docs.readyplayer.me/
- Avatar Creator: https://readyplayer.me/
- Studio: https://studio.readyplayer.me/
- API Reference: https://docs.readyplayer.me/ready-player-me/api-reference/rest-api
- Three.js Docs: https://threejs.org/docs/
- React Three Fiber: https://r3f.docs.pmnd.rs/

