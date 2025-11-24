import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import MobileLayout from "../layouts/MobileLayout";
import StepIndicator from "../components/settlement/StepIndicator";
import InputOptions from "../components/settlement/InputOptions";
import ButtonContainer from "../components/layout/ButtonContainer";
import SurchargeDistributionModal from "../components/modals/SurchargeDistributionModal";
import NaverMap from "../components/map/NaverMap";
import { recognizeTextFromImage, parseTaxiReceipt } from "../utils/ocr";

export default function TaxiStep2ReceiptInputPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [isEditingDeparture, setIsEditingDeparture] = useState(false); // 출발지 수정 모드
  const [isEditingArrival, setIsEditingArrival] = useState(false); // 도착지 수정 모드
  const [isEditingTotalAmount, setIsEditingTotalAmount] = useState(false); // 총 금액 수정 모드
  const [showSurchargeModal, setShowSurchargeModal] = useState(false);
  const [surchargeDistribution, setSurchargeDistribution] = useState(null); // "equal" 또는 "boundary"
  const [hasOutOfCitySurcharge, setHasOutOfCitySurcharge] = useState(false); // 시외 할증 적용 여부
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const handlePhotoInput = () => {
    // 파일 입력 트리거
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일인지 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setSelectedImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // 네이버 클로바 OCR API 호출하여 텍스트 인식
    setIsProcessingOCR(true);
    try {
      const ocrResult = await recognizeTextFromImage(file);
      
      if (ocrResult.success && ocrResult.text) {
        // OCR 결과를 파싱하여 택시 정보 추출
        const parsedInfo = parseTaxiReceipt(ocrResult.text);
        
        // 추출된 정보를 자동으로 입력 필드에 채우기
        if (parsedInfo.departure) {
          setDeparture(parsedInfo.departure);
        }
        if (parsedInfo.arrival) {
          setArrival(parsedInfo.arrival);
        }
        if (parsedInfo.totalAmount > 0) {
          setTotalAmount(parsedInfo.totalAmount.toLocaleString());
        }
        
        // 추출된 정보 확인 및 사용자에게 표시
        const extractedInfo = [];
        if (parsedInfo.departure) extractedInfo.push(`출발지: ${parsedInfo.departure}`);
        if (parsedInfo.arrival) extractedInfo.push(`도착지: ${parsedInfo.arrival}`);
        if (parsedInfo.totalAmount > 0) extractedInfo.push(`총 금액: ${parsedInfo.totalAmount.toLocaleString()}원`);
        
        if (extractedInfo.length > 0) {
          alert(`영수증 정보가 자동으로 입력되었습니다.\n\n추출된 정보:\n${extractedInfo.join('\n')}\n\n확인 후 수정해주세요.`);
        } else {
          alert(`영수증에서 정보를 찾을 수 없습니다.\n\n인식된 텍스트:\n${ocrResult.text.substring(0, 200)}\n\n수동으로 입력해주세요.`);
        }
      } else {
        // OCR은 성공했지만 파싱 실패한 경우 인식된 텍스트 표시
        const errorMsg = ocrResult.error 
          ? `텍스트 인식에 실패했습니다: ${ocrResult.error}`
          : "텍스트 인식에 실패했습니다.";
        alert(`${errorMsg}\n\n수동으로 입력해주세요.`);
      }
    } catch (error) {
      console.error("OCR 처리 중 오류:", error);
      console.error("에러 상세:", error.message, error.stack);
      alert(`텍스트 인식 중 오류가 발생했습니다.\n\n에러: ${error.message}\n\n브라우저 콘솔(F12)에서 자세한 정보를 확인하세요.`);
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleArrivalSelect = (location) => {
    // TODO: 실제로는 좌표를 확인하여 시외 할증 여부 판단
    // 임시로 특정 위치 선택 시 모달 표시
    const isOutOfCity = true; // 실제로는 좌표 기반 판단
    
    if (isOutOfCity) {
      setShowSurchargeModal(true);
    } else {
      setArrival(location);
      setIsEditingArrival(false);
    }
  };

  const handleSurchargeConfirm = (option) => {
    setSurchargeDistribution(option);
    setHasOutOfCitySurcharge(true);
    // 모달이 닫힌 후 도착지 설정 완료
    setIsEditingArrival(false);
  };

  // 금액 포맷팅 함수 (천 단위 쉼표 추가)
  const formatAmount = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^0-9]/g, "");
    if (!numbers) return "";
    // 천 단위 쉼표 추가
    return parseInt(numbers, 10).toLocaleString("ko-KR");
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // 숫자만 추출하여 포맷팅
    const formatted = formatAmount(value);
    setTotalAmount(formatted);
  };

  const handlePrevious = () => {
    navigate("/taxi/settlement/start");
  };

  const handleNext = async () => {
    // TODO: 필수 항목 검증
    if (!departure || !arrival || !totalAmount) {
      alert("출발지, 도착지, 총 금액을 모두 입력해주세요.");
      return;
    }
    
    // 출발지/도착지 좌표 가져오기 (네이버 지도 Geocoder API 사용)
    let departureInfo = { name: departure, lat: 37.5572, lng: 126.9234 }; // 기본값
    let arrivalInfo = { name: arrival, lat: 37.4980, lng: 127.0276 }; // 기본값
    
    if (window.naver && window.naver.maps) {
      try {
        const geocoder = new window.naver.maps.Service.Geocoder();
        
        // 출발지 좌표 검색
        await new Promise((resolve) => {
          geocoder.addressSearch(departure, (status, response) => {
            if (status === window.naver.maps.Service.Status.OK && response.result.items.length > 0) {
              const place = response.result.items[0];
              departureInfo = {
                name: place.address || place.title || departure,
                lat: parseFloat(place.point.y),
                lng: parseFloat(place.point.x),
              };
            }
            resolve();
          });
        });
        
        // 도착지 좌표 검색
        await new Promise((resolve) => {
          geocoder.addressSearch(arrival, (status, response) => {
            if (status === window.naver.maps.Service.Status.OK && response.result.items.length > 0) {
              const place = response.result.items[0];
              arrivalInfo = {
                name: place.address || place.title || arrival,
                lat: parseFloat(place.point.y),
                lng: parseFloat(place.point.x),
              };
            }
            resolve();
          });
        });
      } catch (error) {
        console.error("좌표 검색 오류:", error);
      }
    }
    
    // 항상 3단계(결제 정보 입력)로 이동 (출발지/도착지 정보 전달)
    navigate("/taxi/settlement/step3", {
      state: {
        departureInfo,
        arrivalInfo,
      },
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-6 py-[60px] bg-[#fafcff] min-h-screen w-full">
        {/* Step Indicator */}
        <StepIndicator currentStep={2} className="w-full max-w-[342px]" />

        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 w-full max-w-[342px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">카카오T 영수증 입력</h1>
          <p className="font-normal text-base text-gray-500">
            {(departure || arrival)
              ? "인식된 정보를 확인하고 수정해주세요"
              : "인식된 정보를 확인하거나 직접 입력해주세요"}
          </p>
        </div>

        {/* Input Options */}
        <div className="flex flex-col gap-5 items-center justify-center p-2.5 rounded-2xl w-full max-w-[342px] bg-white">
          <InputOptions
            icon="🚕"
            text={isProcessingOCR ? "텍스트 인식 중..." : "카카오T 영수증 사진 넣기"}
            onClick={handlePhotoInput}
            disabled={isProcessingOCR}
          />
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {/* Image Preview */}
          {imagePreview && (
            <div className="flex flex-col gap-2 w-full">
              <div className="relative w-full max-h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="영수증 미리보기"
                  className="w-full h-auto max-h-64 object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                >
                  ✕
                </button>
              </div>
              {selectedImage?.name && (
                <p className="text-xs text-gray-500 text-center">
                  {selectedImage.name}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Taxi Info Section */}
        <div className="bg-white border border-[#edf0f5] h-[406px] relative rounded-2xl w-full max-w-[342px]">
          <div className="flex flex-col gap-3 items-center p-4 rounded-[inherit] w-full">
            <h2 className="font-semibold text-base text-[#1a1a1a] w-full text-left">택시 정보</h2>

            {/* Departure */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex h-8 items-center p-4 w-full gap-1">
                <div className="flex h-6 items-center shrink-0 w-[99px]">
                  <label className="font-semibold text-sm text-[#1a1a1a]">출발지</label>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingDeparture ? (
                    <input
                      type="text"
                      placeholder="입력 또는 지도 선택"
                      value={departure}
                      onChange={(e) => setDeparture(e.target.value)}
                      className="bg-transparent border-0 h-auto w-full text-sm font-bold text-[#1a1a1a] outline-none placeholder:text-gray-500"
                      autoFocus
                    />
                  ) : (
                    <p 
                      onClick={() => setIsEditingDeparture(true)}
                      className="font-bold text-sm text-[#1a1a1a] cursor-pointer truncate"
                    >
                      {departure || "출발지를 입력해주세요"}
                    </p>
                  )}
                </div>
                {isEditingDeparture ? (
                  <button
                    onClick={() => {
                      if (!departure.trim()) {
                        alert("출발지를 입력해주세요.");
                        return;
                      }
                      setIsEditingDeparture(false);
                    }}
                    className="bg-neutral-50 border border-[#e0e0e0] h-[25px] flex items-center justify-center px-2 py-1 rounded-lg shrink-0 w-[63px] hover:bg-neutral-100 transition-colors"
                  >
                    <span className="font-bold text-sm text-[#111111]">확인</span>
                  </button>
                ) : departure ? (
                  <button
                    onClick={() => setIsEditingDeparture(true)}
                    className="bg-neutral-50 border border-[#e0e0e0] h-[25px] flex items-center justify-center px-2 py-1 rounded-lg shrink-0 w-[63px] hover:bg-neutral-100 transition-colors"
                  >
                    <span className="font-bold text-sm text-[#111111]">수정</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Arrival */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex h-8 items-center p-4 w-full gap-1">
                <div className="flex h-6 items-center shrink-0 w-[99px]">
                  <label className="font-semibold text-sm text-[#1a1a1a]">도착지</label>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingArrival ? (
                    <input
                      type="text"
                      placeholder="입력 또는 지도 선택"
                      value={arrival}
                      onChange={(e) => setArrival(e.target.value)}
                      className="bg-transparent border-0 h-auto w-full text-sm font-bold text-[#1a1a1a] outline-none placeholder:text-gray-500"
                      autoFocus
                    />
                  ) : (
                    <p 
                      onClick={() => setIsEditingArrival(true)}
                      className="font-bold text-sm text-[#1a1a1a] cursor-pointer truncate"
                    >
                      {arrival || "도착지를 입력해주세요"}
                    </p>
                  )}
                </div>
                {isEditingArrival ? (
                  <button
                    onClick={() => {
                      if (!arrival.trim()) {
                        alert("도착지를 입력해주세요.");
                        return;
                      }
                      setIsEditingArrival(false);
                    }}
                    className="bg-neutral-50 border border-[#e0e0e0] h-[25px] flex items-center justify-center px-2 py-1 rounded-lg shrink-0 w-[63px] hover:bg-neutral-100 transition-colors"
                  >
                    <span className="font-bold text-sm text-[#111111]">확인</span>
                  </button>
                ) : arrival ? (
                  <button
                    onClick={() => setIsEditingArrival(true)}
                    className="bg-neutral-50 border border-[#e0e0e0] h-[25px] flex items-center justify-center px-2 py-1 rounded-lg shrink-0 w-[63px] hover:bg-neutral-100 transition-colors"
                  >
                    <span className="font-bold text-sm text-[#111111]">수정</span>
                  </button>
                ) : null}
              </div>
            </div>

            {/* Map Mini View */}
            <div className="bg-[#f2f7ff] flex flex-col gap-2 h-[188px] items-start p-4 w-full">
              <p className="font-semibold text-sm text-[#1a1a1a]">📍 지도 미니뷰</p>
              <p className="font-normal text-xs text-gray-500">
                출발지와 도착지를 확인할 수 있습니다
              </p>
              <div className="w-full h-full mt-2 rounded-lg overflow-hidden">
                <NaverMap
                  width="100%"
                  height={140}
                  centerLat={37.5665}
                  centerLng={126.9780}
                  level={5}
                  clickable={false}
                  markers={[
                    ...(departure
                      ? [
                          {
                            lat: 37.5563,
                            lng: 126.9230,
                            name: "출발지",
                            color: "#3366cc",
                          },
                        ]
                      : []),
                    ...(arrival
                      ? [
                          {
                            lat: 37.4980,
                            lng: 127.0276,
                            name: "도착지",
                            color: "#ff6b6b",
                          },
                        ]
                      : []),
                  ]}
                  draggable={true}
                />
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="bg-[#f5f0ff] flex h-14 items-center justify-between p-4 rounded-xl w-full">
              <p className="font-bold text-base text-[#1a1a1a]">총 금액</p>
              <div className="flex gap-2 items-center flex-1 min-w-0">
                {hasOutOfCitySurcharge && (
                  <div className="bg-[#ffcc00] flex h-5 items-center justify-center px-2 py-1 rounded-[20px] shrink-0 w-[80px]">
                    <p className="font-semibold text-[10px] text-white">시외 이동 포함</p>
                  </div>
                )}
                {isEditingTotalAmount ? (
                  <input
                    type="text"
                    placeholder="금액을 입력해 주세요"
                    value={totalAmount}
                    onChange={handleAmountChange}
                    onBlur={() => setIsEditingTotalAmount(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setIsEditingTotalAmount(false);
                      }
                    }}
                    className="bg-transparent font-extrabold text-base text-[#6e29d9] outline-none text-right placeholder:text-[#6e29d9] placeholder:opacity-60 flex-1 min-w-0"
                    autoFocus
                  />
                ) : (
                  <p 
                    onClick={() => setIsEditingTotalAmount(true)}
                    className="font-extrabold text-base text-[#6e29d9] cursor-pointer text-right flex-1 min-w-0 truncate"
                  >
                    {totalAmount || "금액을 입력해 주세요"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Button Container */}
        <ButtonContainer
          onPrevious={handlePrevious}
          onNext={handleNext}
          className="w-full max-w-[342px]"
        />
      </div>

      {/* Surcharge Distribution Modal */}
      <SurchargeDistributionModal
        isOpen={showSurchargeModal}
        onClose={() => setShowSurchargeModal(false)}
        onConfirm={handleSurchargeConfirm}
      />
    </MobileLayout>
  );
}

