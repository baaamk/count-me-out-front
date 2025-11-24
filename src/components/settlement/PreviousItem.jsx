// src/components/settlement/PreviousItem.jsx

/**
 * 이전 정산 내역 아이템 컴포넌트
 * @param {string} icon - 아이콘 (이모지)
 * @param {string} date - 날짜
 * @param {string} type - 정산 타입 (영수증, 택시 등)
 * @param {string} amount - 금액
 * @param {function} onClick - 클릭 핸들러
 */
export default function PreviousItem({ icon, date, type, amount, onClick }) {
  return (
    <div
      className="self-stretch h-14 p-4 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-zinc-100 inline-flex justify-center items-center gap-3 overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="justify-start text-black text-2xl font-normal font-['Inter']">
        {icon}
      </div>
      <div className="w-36 pr-2.5 py-2.5 bg-white inline-flex flex-col justify-start items-start gap-0.5 overflow-hidden">
        <div className="justify-start text-zinc-900 text-base font-bold font-['Pretendard']">
          {date} {type} 정산
        </div>
      </div>
      <div className="flex-1 pl-2.5 py-2.5 bg-white inline-flex flex-col justify-center items-end gap-0.5 overflow-hidden">
        <div className="justify-start text-blue-500 text-base font-bold font-['Inter']">
          {amount}
        </div>
      </div>
      <div className="justify-start text-zinc-400 text-xl font-normal font-['Inter']">
        ›
      </div>
    </div>
  );
}

