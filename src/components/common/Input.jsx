// src/components/common/Input.jsx

/**
 * 공통 Input 컴포넌트
 * @param {string} type - 입력 타입: 'text' | 'email' | 'password' | 'number'
 * @param {string} placeholder - 플레이스홀더 텍스트
 * @param {string} value - 입력 값
 * @param {function} onChange - 변경 핸들러
 * @param {string} className - 추가 클래스명
 * @param {boolean} disabled - 비활성화 여부
 * @param {boolean} error - 에러 상태
 * @param {string} errorMessage - 에러 메시지
 * @param {string} size - 입력 크기: 'sm' | 'md' | 'lg'
 */
export default function Input({
  type = "text",
  placeholder = "",
  value,
  onChange,
  className = "",
  disabled = false,
  error = false,
  errorMessage = "",
  size = "md",
  ...props
}) {
  const baseStyles = "w-full px-4 rounded-xl border transition-colors outline-none";
  
  const sizeStyles = {
    sm: "h-10 py-2.5 text-sm",
    md: "h-12 py-3 text-base",
    lg: "h-14 py-4 text-lg",
  };
  
  const stateStyles = error
    ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
    : disabled
    ? "border-[#e0e0e0] bg-[#f2f2f2] text-gray-500 cursor-not-allowed"
    : "border-[#e0e0e0] bg-neutral-50 text-[#1a1a1a] focus:ring-2 focus:ring-[#333333] focus:bg-white placeholder:text-gray-500";

  return (
    <div className="w-full">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${baseStyles} ${sizeStyles[size]} ${stateStyles} ${className}`}
        {...props}
      />
      {error && errorMessage && (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

