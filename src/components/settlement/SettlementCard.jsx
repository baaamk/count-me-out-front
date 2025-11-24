// src/components/settlement/SettlementCard.jsx

/**
 * 정산 카드 컴포넌트 (영수증 정산, 택시 정산)
 * @param {string} icon - 아이콘 (이모지)
 * @param {string} title - 카드 제목
 * @param {string} description - 카드 설명
 * @param {function} onClick - 클릭 핸들러
 */
export default function SettlementCard({ icon, title, description, onClick }) {
  return (
    <div
      className="flex-1 p-4 bg-blue-100 rounded-[20px] inline-flex flex-col justify-start items-start gap-1 overflow-hidden cursor-pointer hover:bg-blue-200 transition-colors"
      onClick={onClick}
    >
      <div className="justify-start text-stone-500 text-3xl font-normal font-['Inter']">
        {icon}
      </div>
      <div className="justify-start text-zinc-900 text-base font-semibold font-['Inter']">
        {title}
      </div>
      <div className="justify-start text-zinc-500 text-xs font-normal font-['Inter']">
        {description}
      </div>
    </div>
  );
}

