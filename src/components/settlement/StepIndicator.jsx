// src/components/settlement/StepIndicator.jsx

/**
 * 단계 진행 표시기 컴포넌트
 * @param {number} currentStep - 현재 단계 (1-5)
 * @param {number} totalSteps - 전체 단계 수 (기본: 5)
 * @param {string} className - 추가 클래스명
 */
export default function StepIndicator({
  currentStep = 1,
  totalSteps = 5,
  className = "",
}) {
  const renderStep = (stepNumber) => {
    const isCompleted = stepNumber < currentStep;
    const isCurrent = stepNumber === currentStep;
    
    const stepBgColor = isCompleted || isCurrent 
      ? "bg-[#3366ff]" 
      : "bg-[#e6e6e6]";
    
    const stepTextColor = isCompleted || isCurrent 
      ? "text-white" 
      : "text-[#666666]";
    
    const connectorColor = stepNumber < currentStep 
      ? "bg-[#3366ff]" 
      : "bg-[#e6e6e6]";

    return (
      <div key={stepNumber} className="flex items-center">
        <div className={`${stepBgColor} flex items-center justify-center rounded-[20px] size-10 flex-shrink-0`}>
          <div className={`${stepTextColor} text-xl font-bold font-['Inter']`}>
            {isCompleted ? "✓" : stepNumber}
          </div>
        </div>
        {stepNumber < totalSteps && (
          <div className={`${connectorColor} h-0.5 w-5 flex-shrink-0`} />
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white flex h-[58px] items-center justify-center px-4 rounded-2xl w-full ${className}`}>
      <div className="flex items-center justify-center w-full">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(renderStep)}
      </div>
    </div>
  );
}
