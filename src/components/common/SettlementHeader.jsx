// src/components/common/SettlementHeader.jsx

/**
 * 정산 내역 헤더 컴포넌트
 * @param {string} title - 헤더 제목 (기본값: "정산 내역")
 * @param {string} subtitle - 부제목 (선택사항)
 * @param {string} className - 추가 클래스명
 */
export default function SettlementHeader({ title = "정산 내역", subtitle, className = "" }) {
  return (
    <div className={`bg-white flex flex-col gap-2 h-20 items-center p-5 shrink-0 w-full max-w-[350px] ${className}`}>
      <h1 className="font-bold text-xl text-[#1a1a1a]">💰 {title}</h1>
      {subtitle && (
        <p className="font-medium text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

