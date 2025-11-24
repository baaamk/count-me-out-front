// src/components/settlement/InputOptions.jsx

/**
 * 입력 옵션 컴포넌트 (영수증/택시 사진 넣기)
 * @param {string} icon - 아이콘 (이모지)
 * @param {string} text - 설명 텍스트
 * @param {function} onClick - 클릭 핸들러
 * @param {string} className - 추가 클래스명
 * @param {boolean} disabled - 비활성화 여부
 */
export default function InputOptions({
  icon = "📷",
  text = "영수증 촬영 및 사진 넣기",
  onClick,
  className = "",
  disabled = false,
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`bg-[#d9ebff] flex flex-col gap-3 items-center justify-center p-2.5 rounded-xl w-[280px] hover:bg-[#c5dfff] transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <div className="text-[#cc66cc] text-3xl font-normal font-['Inter']">
        {icon}
      </div>
      <div className="text-[#1a1a1a] text-sm font-semibold font-['Inter']">
        {text}
      </div>
    </button>
  );
}

