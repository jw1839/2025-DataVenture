/**
 * Slug 생성 유틸리티
 */

/**
 * 문자열을 URL 친화적인 slug로 변환
 * @param text - 변환할 텍스트
 * @returns slug 문자열
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-') // 공백을 하이픈으로
    .replace(/[^\w\-가-힣]+/g, '') // 특수문자 제거 (한글은 유지)
    .replace(/\-\-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-+/, '') // 시작 하이픈 제거
    .replace(/-+$/, ''); // 끝 하이픈 제거
}

/**
 * 고유한 username 생성 (중복 방지)
 * @param baseName - 기본 이름
 * @param existingUrls - 이미 존재하는 URL 목록
 * @returns 고유한 username
 */
export function generateUniqueUsername(
  baseName: string,
  existingUrls: string[]
): string {
  const baseSlug = generateSlug(baseName);
  
  // 중복이 없으면 그대로 반환
  if (!existingUrls.includes(baseSlug)) {
    return baseSlug;
  }
  
  // 중복이 있으면 숫자를 추가하여 고유하게 만듦
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingUrls.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

