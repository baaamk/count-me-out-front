/**
 * 토스 딥링크 유틸리티
 * 토스 앱에서 인식하는 은행명 매핑 및 딥링크 생성
 */

/**
 * 토스 앱에서 인식하는 은행명 매핑
 * 실제 토스 앱에서 사용하는 은행명과 다를 수 있으므로 테스트 필요
 */
const TOSS_BANK_NAME_MAP = {
  "경남은행": "경남은행",
  "광주은행": "광주은행",
  "단위농협(지역농축협)": "단위농협", // 괄호 제거 또는 다른 이름일 수 있음
  "부산은행": "부산은행",
  "새마을금고": "새마을금고",
  "산림조합": "산림조합",
  "신한은행": "신한은행",
  "신협": "신협",
  "씨티은행": "씨티은행",
  "우리은행": "우리은행",
  "우체국예금보험": "우체국", // 짧은 이름일 수 있음
  "저축은행중앙회": "저축은행중앙회",
  "전북은행": "전북은행",
  "제주은행": "제주은행",
  "카카오뱅크": "카카오뱅크",
  "케이뱅크": "케이뱅크",
  "토스뱅크": "토스뱅크",
  "하나은행": "하나은행",
  "홍콩상하이은행": "홍콩상하이은행",
  "IBK기업은행": "IBK기업은행",
  "KB국민은행": "KB국민은행",
  "iM뱅크(대구)": "iM뱅크", // 괄호 제거 또는 다른 이름일 수 있음
  "한국산업은행": "한국산업은행",
  "NH농협은행": "NH농협은행",
  "SC제일은행": "SC제일은행",
  "Sh수협은행": "Sh수협은행",
};

/**
 * 토스 딥링크 생성
 * @param {number} amount - 송금 금액
 * @param {string} bank - 은행명
 * @param {string} accountNumber - 계좌번호
 * @returns {string} 토스 딥링크 URL
 */
export const generateTossDeepLink = (amount, bank, accountNumber) => {
  // 은행명 매핑 (토스 앱에서 인식하는 이름으로 변환)
  const tossBankName = TOSS_BANK_NAME_MAP[bank] || bank;
  
  // 계좌번호에서 하이픈 제거
  const cleanAccountNumber = accountNumber.replace(/-/g, "").replace(/\s/g, "");
  
  // URL 인코딩
  const encodedBank = encodeURIComponent(tossBankName);
  const encodedAccountNo = encodeURIComponent(cleanAccountNumber);
  
  // 토스 딥링크 생성
  const tossUrl = `supertoss://send?amount=${amount}&bank=${encodedBank}&accountNo=${encodedAccountNo}`;
  
  return tossUrl;
};

/**
 * 토스 딥링크 열기
 * @param {number} amount - 송금 금액
 * @param {string} bank - 은행명
 * @param {string} accountNumber - 계좌번호
 */
export const openTossDeepLink = (amount, bank, accountNumber) => {
  const tossUrl = generateTossDeepLink(amount, bank, accountNumber);
  
  // 딥링크 시도
  window.location.href = tossUrl;
  
  // 토스 앱이 설치되지 않은 경우를 대비한 폴백
  setTimeout(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/android/i.test(userAgent)) {
      window.open("https://play.google.com/store/apps/details?id=viva.republica.toss", "_blank");
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      window.open("https://apps.apple.com/kr/app/toss/id839333328", "_blank");
    }
  }, 500);
};

/**
 * 테스트가 필요한 은행 목록 (잠재적 문제가 있는 은행)
 * 괄호, 긴 이름, 특수문자 등으로 인해 토스 앱에서 인식하지 못할 수 있음
 */
export const BANKS_NEEDING_TEST = [
  "단위농협(지역농축협)", // 괄호 포함
  "우체국예금보험", // 긴 이름 (우체국으로 인식할 수도 있음)
  "iM뱅크(대구)", // 괄호 포함
  "Sh수협은행", // 대소문자 혼합
];

/**
 * 모든 은행 목록
 */
export const ALL_BANKS = [
  "경남은행",
  "광주은행",
  "단위농협(지역농축협)",
  "부산은행",
  "새마을금고",
  "산림조합",
  "신한은행",
  "신협",
  "씨티은행",
  "우리은행",
  "우체국예금보험",
  "저축은행중앙회",
  "전북은행",
  "제주은행",
  "카카오뱅크",
  "케이뱅크",
  "토스뱅크",
  "하나은행",
  "홍콩상하이은행",
  "IBK기업은행",
  "KB국민은행",
  "iM뱅크(대구)",
  "한국산업은행",
  "NH농협은행",
  "SC제일은행",
  "Sh수협은행",
];

