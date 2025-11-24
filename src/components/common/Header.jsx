// src/components/common/Header.jsx

/**
 * 공통 Header 컴포넌트
 * @param {string} title - 페이지 타이틀
 * @param {string} subtitle - 서브타이틀 (선택)
 * @param {React.ReactNode} leftAction - 왼쪽 액션 (뒤로가기 등)
 * @param {React.ReactNode} rightAction - 오른쪽 액션 (마이페이지, 로그인 등)
 * @param {string} className - 추가 클래스명
 */
export default function Header({
  title,
  subtitle = "",
  leftAction,
  rightAction,
  className = "",
  ...props
}) {
  return (
    <div
      className={`px-5 py-3 bg-white inline-flex justify-between items-center ${className}`}
      {...props}
    >
      <div className="flex items-center gap-3">
        {leftAction && <div>{leftAction}</div>}
        <div className="flex flex-col">
          <div className="text-zinc-900 text-xl font-bold font-['Inter']">
            {title}
          </div>
          {subtitle && (
            <div className="text-zinc-500 text-sm font-normal font-['Inter']">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {rightAction && <div>{rightAction}</div>}
    </div>
  );
}

