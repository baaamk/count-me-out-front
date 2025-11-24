// src/components/home/LoginPrompt.jsx

/**
 * 로그인 유도 프롬프트 컴포넌트
 * @param {function} onLoginClick - 로그인 버튼 클릭 핸들러
 */
export default function LoginPrompt({ onLoginClick }) {
  return (
    <div className="self-stretch p-5 bg-gray-50 rounded-2xl flex flex-col justify-center items-center gap-3 overflow-hidden">
      <button
        onClick={onLoginClick}
        className="w-20 h-11 px-5 py-3 bg-zinc-800 rounded-[999px] inline-flex justify-center items-center overflow-hidden hover:bg-zinc-900 transition-colors"
      >
        <div className="justify-start text-white text-sm font-medium font-['Inter']">
          로그인
        </div>
      </button>
      <div className="text-center justify-start text-neutral-600 text-sm font-medium font-['Inter']">
        로그인하면 지난 정산을 저장·조회할 수 있어요
      </div>
      <div className="justify-start text-stone-500 text-xs font-normal font-['Inter']">
        로그인 없이도 바로 정산할 수 있어요
      </div>
    </div>
  );
}

