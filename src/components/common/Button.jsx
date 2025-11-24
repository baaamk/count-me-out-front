// src/components/common/Button.jsx

/**
 * 공통 Button 컴포넌트
 * @param {string} variant - 버튼 스타일: 'primary' | 'secondary' | 'ghost' | 'blue' | 'kakao'
 * @param {string} size - 버튼 크기: 'sm' | 'md' | 'lg' | 'xl'
 * @param {React.ReactNode} children - 버튼 내용
 * @param {string} className - 추가 클래스명
 * @param {function} onClick - 클릭 핸들러
 * @param {boolean} disabled - 비활성화 여부
 * @param {string} type - 버튼 타입: 'button' | 'submit' | 'reset'
 */
export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  onClick,
  disabled = false,
  type = "button",
  ...props
}) {
  const baseStyles = "flex items-center justify-center rounded-xl font-semibold transition-colors";
  
  const variantStyles = {
    primary: "bg-[#333333] text-white hover:bg-[#444444]",
    secondary: "bg-[#f2f2f2] text-[#666666] hover:bg-[#e6e6e6]",
    ghost: "bg-transparent text-[#666666] hover:bg-gray-100",
    blue: "bg-[#3366cc] text-white hover:bg-[#2555e6]",
    kakao: "bg-[#ffcc00] text-white hover:bg-[#ffc000]",
    gray: "bg-[#e6e6e6] text-white cursor-not-allowed",
  };

  const sizeStyles = {
    sm: "h-10 px-3 text-sm",
    md: "h-12 px-4 py-3 text-base",
    lg: "h-14 px-6 text-lg",
    xl: "h-[56px] px-4 py-3 text-base",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

