/**
 * 검증 유틸리티 함수
 */

/**
 * 이메일 형식 검증
 * @param {string} email - 이메일 주소
 * @returns {boolean} 유효한 이메일인지 여부
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  // 기본 이메일 형식 검증: local@domain.tld
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // 도메인 부분 추출
  const domainPart = email.split('@')[1];
  if (!domainPart) return false;
  
  // TLD 추출 (마지막 점 이후 부분)
  const parts = domainPart.split('.');
  const tld = parts[parts.length - 1];
  
  // TLD는 2-6자의 알파벳만 허용 (숫자 불가)
  if (!/^[a-zA-Z]{2,6}$/.test(tld)) {
    return false;
  }
  
  // 도메인 이름 부분 검증 (TLD 제외)
  const domainName = parts.slice(0, -1).join('.');
  if (!domainName || domainName.length === 0) {
    return false;
  }
  
  return true;
};

/**
 * 비밀번호 강도 검증 (8자 이상, 영문과 숫자 포함)
 * @param {string} password - 비밀번호
 * @returns {boolean} 유효한 비밀번호인지 여부
 */
export const isValidPassword = (password) => {
  if (!password) return false;
  const minLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return minLength && hasLetter && hasNumber;
};

/**
 * 닉네임 검증 (5글자 이내, 한글 또는 영어만 허용)
 * @param {string} nickname - 닉네임
 * @returns {boolean} 유효한 닉네임인지 여부
 */
export const isValidNickname = (nickname) => {
  if (!nickname) return false;
  const trimmed = nickname.trim();
  
  // 길이 검증 (1자 이상 5자 이내)
  if (trimmed.length < 1 || trimmed.length > 5) {
    return false;
  }
  
  // 한글 또는 영어만 허용 (공백, 숫자, 특수문자 불가)
  // 한글: \uAC00-\uD7A3 (가-힣)
  // 영어: a-zA-Z
  const nicknameRegex = /^[가-힣a-zA-Z]+$/;
  return nicknameRegex.test(trimmed);
};

/**
 * 계좌번호 검증 (기본 형식)
 * @param {string} accountNumber - 계좌번호
 * @returns {boolean} 유효한 계좌번호인지 여부
 */
export const isValidAccountNumber = (accountNumber) => {
  if (!accountNumber) return false;
  // 숫자와 하이픈만 허용, 최소 10자 이상
  const accountRegex = /^[0-9-]+$/;
  return accountRegex.test(accountNumber) && accountNumber.replace(/-/g, "").length >= 10;
};

/**
 * URL 검증
 * @param {string} url - URL 문자열
 * @returns {boolean} 유효한 URL인지 여부
 */
export const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 숫자 검증
 * @param {string|number} value - 검증할 값
 * @returns {boolean} 숫자인지 여부
 */
export const isNumber = (value) => {
  if (value === null || value === undefined) return false;
  return !isNaN(value) && !isNaN(parseFloat(value));
};

