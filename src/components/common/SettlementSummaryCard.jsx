// src/components/common/SettlementSummaryCard.jsx

/**
 * 정산 요약 카드 컴포넌트
 * @param {number} totalAmount - 총 금액
 * @param {number} participantCount - 참여자 수
 * @param {string} date - 날짜
 * @param {string} className - 추가 클래스명
 */
export default function SettlementSummaryCard({
  totalAmount,
  participantCount,
  date,
  className = "",
}) {
  return (
    <div className={`bg-[#e5ffe5] flex flex-col gap-3 h-[88px] items-center p-5 shrink-0 w-full max-w-[350px] ${className}`}>
      <p className="font-bold text-base text-[#1a801a]">✅ 정산이 완료되었습니다!</p>
      <p className="font-medium text-sm text-[#4d804d]">
        총 {totalAmount.toLocaleString()}원 • {participantCount}명 참여 • {date}
      </p>
    </div>
  );
}

