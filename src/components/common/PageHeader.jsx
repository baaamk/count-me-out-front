// src/components/common/PageHeader.jsx

/**
 * 페이지 헤더 컴포넌트
 * @param {string} title - 제목
 * @param {string} subtitle - 부제목
 * @param {function} onBack - 뒤로가기 핸들러
 * @param {React.ReactNode} rightAction - 오른쪽 액션 버튼
 */
export default function PageHeader({ title, subtitle, onBack, rightAction }) {
  return (
    <div className="flex items-center h-14 w-full relative">
      {onBack && (
        <button
          onClick={onBack}
          className="font-semibold text-2xl text-[#1a1a1a] hover:opacity-70 transition-opacity z-10"
        >
          ←
        </button>
      )}
      <div className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center">
        {title && <h1 className="font-bold text-lg text-[#1a1a1a]">{title}</h1>}
        {subtitle && <p className="font-medium text-sm text-gray-500">{subtitle}</p>}
      </div>
      {rightAction && <div className="ml-auto z-10">{rightAction}</div>}
    </div>
  );
}

