/**
 * 포맷팅 유틸리티 함수
 */

/**
 * 금액을 한국 원화 형식으로 포맷팅
 * @param {number} amount - 금액
 * @returns {string} 포맷팅된 금액 문자열 (예: "12,000원")
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0원";
  return `${amount.toLocaleString()}원`;
};

/**
 * 날짜를 "YYYY.MM.DD" 형식으로 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

/**
 * 날짜를 "MM/DD" 형식으로 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷팅된 날짜 문자열
 */
export const formatDateShort = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

/**
 * 년월을 "YYYY년 MM월" 형식으로 포맷팅
 * @param {Date|string} date - 날짜 객체 또는 문자열
 * @returns {string} 포맷팅된 년월 문자열
 */
export const formatYearMonth = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return `${year}년 ${month}월`;
};

/**
 * 거리를 "X.X km" 형식으로 포맷팅
 * @param {number} distance - 거리 (km)
 * @returns {string} 포맷팅된 거리 문자열
 */
export const formatDistance = (distance) => {
  if (distance === null || distance === undefined) return "0 km";
  return `${distance.toLocaleString()} km`;
};

