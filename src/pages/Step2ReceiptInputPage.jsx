import { useNavigate, useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import MobileLayout from "../layouts/MobileLayout";
import StepIndicator from "../components/settlement/StepIndicator";
import InputOptions from "../components/settlement/InputOptions";
import ButtonContainer from "../components/layout/ButtonContainer";
import AddMenuModal from "../components/modals/AddMenuModal";
import { recognizeTextFromImage, parseReceiptMenuItems } from "../utils/ocr";

export default function Step2ReceiptInputPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const totalParticipants = location.state?.totalParticipants || 2;
  const fileInputRef = useRef(null);
  const [menuItems, setMenuItems] = useState([]);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [editingMenuName, setEditingMenuName] = useState(null); // 편집 중인 메뉴 ID

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
        // OCR 결과를 파싱하여 메뉴 항목 추출
        // fields 배열도 전달하여 더 정확한 파싱 가능 (향후 개선용)
        const parsedMenuItems = parseReceiptMenuItems(ocrResult.text, ocrResult.fields || []);
        
        if (parsedMenuItems.length > 0) {
          // 파싱된 메뉴 항목들을 자동으로 추가
          // 수량과 가격은 자동으로, 메뉴명은 빈 값으로 설정 (사용자가 입력)
          const newMenuItems = parsedMenuItems.map((item, index) => ({
            id: Date.now() + index,
            name: item.name || "", // 메뉴명이 없으면 빈 값
            price: item.price,
            quantity: item.quantity || 1, // 수량이 있으면 사용, 없으면 1
          }));
          
          setMenuItems((prev) => [...prev, ...newMenuItems]);
          
          const itemsComplete = parsedMenuItems.filter(item => item.name && item.price > 0);
          const itemsWithoutName = parsedMenuItems.filter(item => !item.name && item.price > 0);
          const itemsWithoutPrice = parsedMenuItems.filter(item => item.name && item.price === 0);
          const itemsWithoutBoth = parsedMenuItems.filter(item => !item.name && item.price === 0);
          
          let alertMessage = `${parsedMenuItems.length}개의 메뉴 항목이 자동으로 추가되었습니다.\n\n`;
          if (itemsComplete.length > 0) {
            alertMessage += `완전히 인식된 항목:\n${itemsComplete.map(item => `- ${item.name}: ${item.quantity || 1}개, ${item.price.toLocaleString()}원`).join('\n')}\n\n`;
          }
          if (itemsWithoutName.length > 0) {
            alertMessage += `메뉴명을 입력해주세요:\n${itemsWithoutName.map((item, idx) => `- 항목 ${idx + 1}: ${item.quantity || 1}개, ${item.price.toLocaleString()}원`).join('\n')}\n\n`;
          }
          if (itemsWithoutPrice.length > 0) {
            alertMessage += `가격을 입력해주세요:\n${itemsWithoutPrice.map(item => `- ${item.name}`).join('\n')}\n\n`;
          }
          if (itemsWithoutBoth.length > 0) {
            alertMessage += `메뉴명과 가격을 입력해주세요:\n${itemsWithoutBoth.map((item, idx) => `- 항목 ${idx + 1}`).join('\n')}`;
          }
          
          alert(alertMessage);
        } else {
          // 디버깅: 전체 OCR 텍스트 표시
          console.log("전체 OCR 텍스트:", ocrResult.text);
          console.log("OCR fields:", ocrResult.fields);
          alert("영수증에서 메뉴 항목을 찾을 수 없습니다.\n\n인식된 텍스트:\n" + ocrResult.text.substring(0, 500) + "\n\n수동으로 입력해주세요.");
        }
      } else {
        alert("텍스트 인식에 실패했습니다. 수동으로 입력해주세요.");
      }
    } catch (error) {
      console.error("OCR 처리 중 오류:", error);
      alert("텍스트 인식 중 오류가 발생했습니다. 수동으로 입력해주세요.");
    } finally {
      setIsProcessingOCR(false);
    }
  };

  const handleAddMenu = () => {
    setShowAddMenuModal(true);
  };

  const handleMenuAdd = (menuName, menuPrice) => {
    const newItem = {
      id: Date.now(),
      name: menuName,
      price: menuPrice,
      quantity: 1,
    };
    setMenuItems([...menuItems, newItem]);
  };

  const handleQuantityChange = (id, delta) => {
    setMenuItems(
      menuItems.map((item) => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleMenuNameChange = (id, newName) => {
    setMenuItems(
      menuItems.map((item) => {
        if (item.id === id) {
          return { ...item, name: newName };
        }
        return item;
      })
    );
  };

  const handleMenuPriceChange = (id, newPrice) => {
    const priceValue = parseInt(newPrice.replace(/,/g, "") || "0", 10);
    setMenuItems(
      menuItems.map((item) => {
        if (item.id === id) {
          return { ...item, price: isNaN(priceValue) ? 0 : priceValue };
        }
        return item;
      })
    );
  };

  const calculateTotal = () => {
    return menuItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePrevious = () => {
    navigate("/settlement/receipt/step1");
  };

  const handleNext = () => {
    // 메뉴가 없으면 다음 단계로 진행 불가
    if (menuItems.length === 0) {
      alert("메뉴를 최소 1개 이상 추가해주세요.");
      return;
    }
    
    // 총 가격이 1,000원 이상인지 확인
    const total = calculateTotal();
    if (total < 1000) {
      alert("총 금액은 최소 1,000원 이상이어야 합니다.");
      return;
    }
    
    // 항상 3단계(결제 정보 입력)로 이동 (메뉴 데이터 및 참여자 수 전달)
    navigate("/settlement/receipt/step3", {
      state: { menuItems, totalParticipants }
    });
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-6 py-[60px] bg-[#fafcff] min-h-screen w-full">
        {/* Step Indicator */}
        <StepIndicator currentStep={2} className="w-full max-w-[342px]" />

        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 w-full max-w-[342px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">영수증 입력</h1>
          <p className="font-normal text-base text-gray-500">
            영수증을 촬영하거나 직접 입력해주세요
          </p>
        </div>

        {/* Input Options */}
        <div className="flex flex-col gap-5 items-center justify-center p-2.5 rounded-2xl w-full max-w-[342px] bg-white">
          <InputOptions
            icon="📷"
            text={isProcessingOCR ? "텍스트 인식 중..." : "영수증 촬영 및 사진 넣기"}
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

        {/* Receipt Items Section */}
        <div className="bg-white border border-[#edf0f5] relative rounded-2xl w-full max-w-[342px]">
          <div className="flex flex-col gap-3 items-center p-4 rounded-[inherit] w-full">
            <h2 className="font-semibold text-base text-[#1a1a1a] w-full text-left">영수증 항목</h2>

            {menuItems.length === 0 ? (
              /* Empty State */
              <>
                <div className="flex flex-col gap-4 items-center justify-center h-40 p-10 bg-neutral-50 rounded-xl w-full">
                  <div className="flex items-center justify-center rounded-3xl size-12 bg-[#cccccc]">
                    <p className="text-2xl text-[#666666]">📄</p>
                  </div>
                  <p className="font-medium text-base text-[#666666]">아직 내역이 없습니다</p>
                </div>
                <button
                  onClick={handleAddMenu}
                  className="bg-[#f2f2f2] h-12 flex items-center justify-center px-4 py-3 rounded-xl w-full hover:bg-[#e6e6e6] transition-colors"
                >
                  <span className="font-semibold text-base text-[#666666]">+ 메뉴 추가</span>
                </button>
              </>
            ) : (
              /* Menu Items List */
              <>
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 w-full gap-3"
                  >
                    <div className="flex gap-2 items-center flex-1 min-w-0">
                      {/* 메뉴명 (좌측) */}
                      {!item.name || editingMenuName === item.id ? (
                        <input
                          type="text"
                          value={item.name || ""}
                          onChange={(e) => handleMenuNameChange(item.id, e.target.value)}
                          onBlur={() => setEditingMenuName(null)}
                          onFocus={() => setEditingMenuName(item.id)}
                          placeholder="메뉴명 입력"
                          className="font-semibold text-sm text-[#1a1a1a] flex-1 min-w-0 border border-[#e0e0e0] rounded px-2 py-1 focus:outline-none focus:border-[#3366cc]"
                          autoFocus={!item.name && item.price > 0}
                        />
                      ) : (
                        <p 
                          className="font-semibold text-sm text-[#1a1a1a] truncate cursor-pointer flex-1 min-w-0"
                          onClick={() => setEditingMenuName(item.id)}
                          title="클릭하여 수정"
                        >
                          {item.name}
                        </p>
                      )}
                      
                      {/* 가격 (우측) */}
                      {item.price === 0 ? (
                        <div className="flex gap-1 items-center shrink-0">
                          <input
                            type="text"
                            value={item.price > 0 ? item.price.toLocaleString() : ""}
                            onChange={(e) => handleMenuPriceChange(item.id, e.target.value)}
                            placeholder="가격 입력"
                            className="font-bold text-sm text-[#1a1a1a] w-20 border border-[#e0e0e0] rounded px-2 py-1 focus:outline-none focus:border-[#3366cc]"
                            autoFocus={item.price === 0 && !item.name}
                          />
                          <span className="font-bold text-sm text-[#1a1a1a]">원</span>
                        </div>
                      ) : (
                        <p className="font-bold text-sm text-[#1a1a1a] shrink-0">
                          {item.price.toLocaleString()}원
                        </p>
                      )}
                    </div>
                    
                    {/* 수량 조절 버튼 (오른쪽) */}
                    <div className="bg-neutral-50 border border-[#e0e0e0] h-[25px] relative rounded-lg shrink-0 w-[63px]">
                      <div className="flex font-bold gap-2 h-[25px] items-center justify-center px-2 py-1 rounded-[inherit] text-sm w-[63px]">
                        <button
                          onClick={() => handleQuantityChange(item.id, -1)}
                          className="text-[#333333] hover:text-[#111111]"
                        >
                          -
                        </button>
                        <p className="text-[#111111]">{item.quantity}</p>
                        <button
                          onClick={() => handleQuantityChange(item.id, 1)}
                          className="text-[#333333] hover:text-[#111111]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Total Card */}
                <div className="bg-[#f5f0ff] flex h-14 items-center justify-between p-4 rounded-xl w-full">
                  <p className="font-bold text-base text-[#1a1a1a]">총 금액</p>
                  <p className="font-extrabold text-base text-[#6e29d9]">
                    {calculateTotal().toLocaleString()}원
                  </p>
                </div>
                {/* Add Menu Button */}
                <button
                  onClick={handleAddMenu}
                  className="bg-[#f2f2f2] h-12 flex items-center justify-center px-4 py-3 rounded-xl w-full hover:bg-[#e6e6e6] transition-colors"
                >
                  <span className="font-semibold text-base text-[#666666]">+ 메뉴 추가</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Button Container */}
        <ButtonContainer
          onPrevious={handlePrevious}
          onNext={handleNext}
          nextDisabled={menuItems.length === 0}
          className="w-full max-w-[342px]"
        />
      </div>

      {/* Add Menu Modal */}
      <AddMenuModal
        isOpen={showAddMenuModal}
        onClose={() => setShowAddMenuModal(false)}
        onAdd={handleMenuAdd}
      />
    </MobileLayout>
  );
}

