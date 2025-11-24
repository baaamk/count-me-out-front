/**
 * 정산 관련 타입 정의 (JSDoc)
 */

/**
 * @typedef {Object} Settlement
 * @property {string} id - 정산 ID
 * @property {string} type - 정산 타입: 'receipt' | 'taxi'
 * @property {string} date - 날짜
 * @property {string} title - 제목
 * @property {number} amount - 금액
 * @property {number} participantCount - 참여자 수
 * @property {string} status - 상태: 'pending' | 'completed' | 'cancelled'
 */

/**
 * @typedef {Object} Participant
 * @property {string} id - 참여자 ID
 * @property {string} nickname - 닉네임
 * @property {boolean} isCompleted - 완료 여부
 * @property {number} amount - 정산 금액
 */

/**
 * @typedef {Object} MenuItem
 * @property {string} id - 메뉴 ID
 * @property {string} name - 메뉴 이름
 * @property {number} price - 가격
 * @property {number} quantity - 수량
 * @property {number} participantCount - 참여자 수
 * @property {number} pricePerPerson - 인당 가격
 */

/**
 * @typedef {Object} AccountInfo
 * @property {string} bank - 은행명
 * @property {string} accountNumber - 계좌번호
 * @property {string} kakaoPayLink - 카카오페이 링크
 */

