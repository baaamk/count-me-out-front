// src/components/layout/ButtonContainer.jsx

/**
 * 이전/다음 단계 버튼 컨테이너
 * @param {function} onPrevious - 이전 단계 클릭 핸들러
 * @param {function} onNext - 다음 단계 클릭 핸들러
 * @param {string} previousText - 이전 버튼 텍스트 (기본: "이전 단계")
 * @param {string} nextText - 다음 버튼 텍스트 (기본: "다음 단계")
 * @param {boolean} previousDisabled - 이전 버튼 비활성화
 * @param {boolean} nextDisabled - 다음 버튼 비활성화
 * @param {string} className - 추가 클래스명
 */
export default function ButtonContainer({
  onPrevious,
  onNext,
  previousText = "이전 단계",
  nextText = "다음 단계",
  previousDisabled = false,
  nextDisabled = false,
  className = "",
}) {
  return (
    <div className={`bg-white flex h-[56px] items-center justify-between w-full max-w-[342px] ${className}`}>
      <button
        onClick={onPrevious}
        disabled={previousDisabled}
        className="bg-[#f2f2f2] flex h-[56px] items-center justify-center px-4 py-3 rounded-2xl w-[150px] text-[#666666] text-base font-semibold font-['Pretendard'] hover:bg-[#e6e6e6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {previousText}
      </button>
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className="bg-[#333333] flex h-[56px] items-center justify-center px-4 py-3 rounded-2xl w-[150px] text-white text-base font-semibold font-['Pretendard'] hover:bg-[#444444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextText}
      </button>
    </div>
  );
}

