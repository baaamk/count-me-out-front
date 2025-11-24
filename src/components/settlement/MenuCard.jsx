// src/components/settlement/MenuCard.jsx

/**
 * 메뉴 카드 컴포넌트
 * @param {string} name - 메뉴 이름
 * @param {number} price - 가격
 * @param {number} participantCount - 참여자 수
 * @param {number} pricePerPerson - 인당 가격
 * @param {boolean} isSelected - 선택 여부
 * @param {Array} participants - 참여자 목록 (예: [{ name: "철수", isParticipating: true }])
 * @param {function} onToggle - 선택 토글 핸들러
 */
export default function MenuCard({
  name,
  price,
  participantCount,
  pricePerPerson,
  isSelected,
  participants = [],
  onToggle,
}) {
  return (
    <div className="bg-white border border-[snow] rounded-[10px] w-full">
      <div className="flex flex-col items-start pb-4 px-4 w-full">
        <div className="bg-white flex h-[50px] items-center justify-between w-full max-w-[318px]">
          <div className="flex flex-col gap-1 h-[38px] items-start w-full max-w-[200px]">
            <div className="text-[#1a1a1a] text-base font-semibold font-['Inter']">
              {name}
            </div>
            <div className="text-[grey] text-xs font-normal font-['Inter']">
              {price.toLocaleString()}원 • {participantCount}명 참여 • {pricePerPerson.toLocaleString()}원/인
            </div>
          </div>
          <button
            onClick={onToggle}
            className={`flex items-center justify-center p-1 rounded-[5px] size-6 ${
              isSelected
                ? "bg-[#3366cc]"
                : "bg-white border border-[#e6e6e6]"
            }`}
          >
            {isSelected && (
              <div className="text-white text-sm font-semibold font-['Inter']">
                ✓
              </div>
            )}
          </button>
        </div>
        <div className="bg-white flex gap-1.5 h-6 items-center w-full max-w-[318px]">
          {participants.map((participant, index) => (
            <div
              key={index}
              className={`flex h-6 items-center justify-center px-2 py-1 rounded-xl ${
                participant.isParticipating
                  ? "bg-[#e5f2ff] text-[#3366cc]"
                  : "bg-[#ffe5e5] text-[#cc3333]"
              }`}
            >
              <div className="text-[11px] font-medium font-['Inter']">
                {participant.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

