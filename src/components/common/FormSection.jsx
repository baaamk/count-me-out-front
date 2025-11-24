// src/components/common/FormSection.jsx

/**
 * 폼 섹션 컴포넌트
 * @param {string} title - 섹션 제목
 * @param {string} description - 섹션 설명
 * @param {React.ReactNode} children - 자식 요소
 * @param {string} className - 추가 클래스명
 */
export default function FormSection({ title, description, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-4 items-start p-2.5 w-full ${className}`}>
      {(title || description) && (
        <div className="flex flex-col gap-2 items-center justify-center w-full">
          {title && <h2 className="font-bold text-[28px] text-[#1a1a1a]">{title}</h2>}
          {description && <p className="font-normal text-base text-gray-500">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

