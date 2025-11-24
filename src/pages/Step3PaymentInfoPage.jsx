import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MobileLayout from "../layouts/MobileLayout";
import StepIndicator from "../components/settlement/StepIndicator";
import ButtonContainer from "../components/layout/ButtonContainer";
import KakaoPayHelpModal from "../components/modals/KakaoPayHelpModal";
import { auth, firestore, database } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, set } from "firebase/database";

export default function Step3PaymentInfoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [nickname, setNickname] = useState("");
  const [kakaoPayCode, setKakaoPayCode] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showKakaoPayHelp, setShowKakaoPayHelp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef(null);
  
  // Step2에서 전달받은 메뉴 데이터 및 참여자 수
  const menuItems = location.state?.menuItems || [];
  const totalParticipants = location.state?.totalParticipants || 2;

  // Step2에서 데이터가 전달되지 않은 경우 이전 단계로 리다이렉트
  // 단, 초기 렌더링 시에는 바로 리다이렉트하지 않고 경고만 표시
  useEffect(() => {
    // location.state가 아직 로드되지 않았을 수 있으므로 약간의 지연 후 확인
    const timer = setTimeout(() => {
      if (!location.state || !location.state.menuItems || location.state.menuItems.length === 0) {
        console.warn("Step2에서 메뉴 데이터가 전달되지 않았습니다.");
        // 사용자가 직접 입력할 수 있도록 경고만 표시하고 리다이렉트는 하지 않음
        // alert("메뉴 정보가 없습니다. 이전 단계로 돌아가서 메뉴를 추가해주세요.");
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.state]);

  // 로그인한 사용자의 결제 정보 자동 채우기
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Firestore에서 사용자 정보 가져오기
          const userRef = doc(firestore, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.nickname) setNickname(userData.nickname);
            if (userData.kakaoPayCode) setKakaoPayCode(userData.kakaoPayCode);
            if (userData.bank) setBank(userData.bank);
            if (userData.accountNumber) setAccountNumber(userData.accountNumber);
          }
        } catch (error) {
          console.error("사용자 정보 조회 실패:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const banks = [
    "경남은행",
    "광주은행",
    "단위농협(지역농축협)",
    "부산은행",
    "새마을금고",
    "산림조합",
    "신한은행",
    "신협",
    "씨티은행",
    "우리은행",
    "우체국예금보험",
    "저축은행중앙회",
    "전북은행",
    "제주은행",
    "카카오뱅크",
    "케이뱅크",
    "토스뱅크",
    "하나은행",
    "홍콩상하이은행",
    "IBK기업은행",
    "KB국민은행",
    "iM뱅크(대구)",
    "한국산업은행",
    "NH농협은행",
    "SC제일은행",
    "Sh수협은행",
  ];

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBankDropdown(false);
      }
    };

    if (showBankDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBankDropdown]);

  const handleKakaoPayHelp = () => {
    setShowKakaoPayHelp(true);
  };

  const handlePrevious = () => {
    navigate("/settlement/receipt/step2");
  };

  const handleNext = async () => {
    // 이미 제출 중이면 중복 실행 방지
    if (isSubmitting) {
      return;
    }

    // 필수 항목 검증 (닉네임, 은행, 계좌번호)
    if (!nickname || !nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    if (!bank || !accountNumber) {
      alert("은행과 계좌번호는 필수 항목입니다.");
      return;
    }
    
    // 메뉴 항목 확인
    if (!menuItems || menuItems.length === 0) {
      alert("메뉴 항목이 없습니다. 이전 단계로 돌아가서 메뉴를 추가해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    
    // 정산 방 생성 (UUID 생성 및 Firebase에 저장)
    try {
      // UUID v4 형식으로 생성
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      const roomId = generateUUID();
      
      console.log("정산 방 생성 시작:", { roomId, menuItemsCount: menuItems.length, totalParticipants });
      
      // Firebase Realtime Database에 정산 방 데이터 저장
      const roomRef = ref(database, `settlements/${roomId}`);
      const roomData = {
        id: roomId,
        type: "receipt",
        createdAt: Date.now(),
        host: {
          nickname: nickname.trim(),
          kakaoPayCode: (kakaoPayCode && kakaoPayCode.trim()) ? kakaoPayCode.trim() : null,
          bank: bank,
          accountNumber: accountNumber,
        },
        menuItems: menuItems.reduce((acc, item) => {
          // 규칙에서 id는 숫자여야 하므로 숫자로 변환
          const menuId = typeof item.id === 'number' ? item.id : Number(item.id);
          acc[menuId] = {
            id: menuId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          };
          return acc;
        }, {}),
        participants: {
          [nickname.trim()]: {
            nickname: nickname.trim(),
            isHost: true,
            selectedMenuIds: null, // 빈 배열 대신 null 사용 (규칙에서 hasChildren() 검증)
            completed: false,
            joinedAt: Date.now(),
            uid: auth.currentUser?.uid || null, // 로그인한 사용자의 UID 저장 (선택사항)
          }
        },
        totalParticipants: totalParticipants,
        currentParticipants: 1,
        status: "active", // active, completed
      };
      
      console.log("저장할 데이터:", JSON.stringify(roomData, null, 2));
      await set(roomRef, roomData);
      console.log("정산 방 생성 완료:", roomId);
      
      // 로그인한 사용자인 경우 Firestore에 송금 정보 저장
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const userRef = doc(firestore, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            // 기존 문서 업데이트 (닉네임과 계좌 정보)
            await updateDoc(userRef, {
              nickname: nickname.trim(),
              bank: bank,
              accountNumber: accountNumber,
              kakaoPayCode: (kakaoPayCode && kakaoPayCode.trim()) ? kakaoPayCode.trim() : null,
              accountUpdatedAt: Date.now(),
            });
          } else {
            // 새 문서 생성
            await setDoc(userRef, {
              email: currentUser.email || "",
              displayName: null,
              photoURL: null,
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
              provider: "nickname",
              nickname: nickname.trim(),
              bank: bank,
              accountNumber: accountNumber,
              kakaoPayCode: (kakaoPayCode && kakaoPayCode.trim()) ? kakaoPayCode.trim() : null,
              accountUpdatedAt: Date.now(),
            });
          }
          console.log("사용자 송금 정보가 Firestore에 저장되었습니다.");
        } catch (firestoreError) {
          console.error("Firestore 저장 실패:", firestoreError);
          // Firestore 저장 실패해도 정산 방 생성은 계속 진행
        }
      }
      
      // 다음 단계로 이동 (roomId 전달)
      console.log("Step4로 이동 시작:", { roomId, menuItemsCount: menuItems.length });
      try {
        navigate("/settlement/receipt/step4", { 
          state: { 
            roomId,
            menuItems,
          } 
        });
        console.log("navigate 호출 완료");
      } catch (navError) {
        console.error("navigate 오류:", navError);
        alert("다음 단계로 이동하는 중 오류가 발생했습니다. 다시 시도해주세요.");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("정산 방 생성 실패:", error);
      console.error("에러 상세:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`정산 방 생성에 실패했습니다.\n\n에러: ${error.message || "알 수 없는 오류"}\n\n다시 시도해주세요.`);
      setIsSubmitting(false);
    }
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center pt-[60px] pb-10 px-6 bg-[#fafcff] min-h-screen w-full">
        {/* Step Indicator */}
        <StepIndicator currentStep={3} className="w-full max-w-[342px]" />

        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 w-full max-w-[342px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">결제 정보 입력</h1>
          <p className="font-normal text-base text-gray-500">
            결제에 필요한 정보를 입력해주세요
          </p>
          <p className="font-normal text-xs text-[#999999]">
            로그인하면 자동으로 채워집니다
          </p>
        </div>

        {/* Info Text */}
        <p className="font-normal text-xs text-[#6b7380] w-full max-w-[342px] text-center whitespace-nowrap">
          카카오페이 송금코드는 선택 항목입니다. 닉네임, 은행, 계좌번호는 필수예요.
        </p>

        {/* Nickname Field */}
        <div className="bg-white border border-[#edf0f5] relative rounded-2xl w-full max-w-[342px]">
          <div className="flex flex-col gap-2 items-start px-5 py-2.5 rounded-[inherit] w-full">
            <label className="font-semibold text-sm text-[#1a1a1a]">닉네임 *</label>
            <input
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="bg-neutral-50 border border-[#e0e0e0] h-10 flex items-center px-4 py-2.5 rounded-xl w-full text-[12.5px] text-[#999999] outline-none focus:ring-2 focus:ring-[#333333] focus:bg-white focus:text-[#1a1a1a]"
            />
          </div>
        </div>

        {/* KakaoPay Field */}
        <div className="bg-white border border-[#edf0f5] relative rounded-2xl w-full max-w-[342px]">
          <div className="flex flex-col gap-2 items-start px-5 py-2.5 rounded-[inherit] w-full">
            {/* KakaoPay Code Label with Help Button */}
            <div className="flex items-center justify-between w-full gap-2">
              <label className="font-semibold text-sm text-[#1a1a1a] flex-shrink-0">
                카카오페이 송금코드
              </label>
              <button
                onClick={handleKakaoPayHelp}
                className="bg-[#d9ebff] h-[23px] flex items-center justify-center px-3 py-2 rounded-lg shrink-0 hover:bg-[#c5dfff] transition-colors whitespace-nowrap"
              >
                <span className="font-extrabold text-xs text-black">
                  송금코드 가져오는 법?
                </span>
              </button>
            </div>
            <input
              type="text"
              placeholder="송금코드를 입력해주세요"
              value={kakaoPayCode}
              onChange={(e) => setKakaoPayCode(e.target.value)}
              className="bg-neutral-50 border border-[#e0e0e0] h-10 flex items-center px-4 py-2.5 rounded-xl w-full text-[12.5px] text-[#999999] outline-none focus:ring-2 focus:ring-[#333333] focus:bg-white focus:text-[#1a1a1a]"
            />

            {/* Bank Dropdown */}
            <label className="font-semibold text-sm text-[#1a1a1a]">은행 *</label>
            <div ref={dropdownRef} className="relative w-full">
              <button
                onClick={() => setShowBankDropdown(!showBankDropdown)}
                className="bg-neutral-50 border border-[#e0e0e0] h-10 flex items-center justify-between px-4 py-2.5 rounded-xl w-full text-[12.5px] text-[#999999] outline-none focus:ring-2 focus:ring-[#333333] focus:bg-white"
              >
                <span className={bank ? "text-[#1a1a1a]" : ""}>
                  {bank || "은행을 선택해주세요"}
                </span>
                <span className="text-sm">▼</span>
              </button>
              {showBankDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e0e0] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {banks.map((bankName) => (
                    <button
                      key={bankName}
                      onClick={() => {
                        setBank(bankName);
                        setShowBankDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-[#1a1a1a] hover:bg-neutral-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      {bankName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Account Number */}
            <label className="font-semibold text-sm text-[#1a1a1a]">계좌번호 *</label>
            <input
              type="text"
              placeholder="예: 110-123-456789"
              value={accountNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9-]/g, "");
                setAccountNumber(value);
              }}
              className="bg-neutral-50 border border-[#e0e0e0] h-10 flex items-center px-4 py-2.5 rounded-xl w-full text-[12.5px] text-[#999999] outline-none focus:ring-2 focus:ring-[#333333] focus:bg-white focus:text-[#1a1a1a]"
            />
          </div>
        </div>

        {/* Button Container */}
        <ButtonContainer
          onPrevious={handlePrevious}
          onNext={handleNext}
          nextDisabled={isSubmitting}
          nextText={isSubmitting ? "처리 중..." : "다음 단계"}
          className="w-full max-w-[342px]"
        />
      </div>

      {/* KakaoPay Help Modal */}
      <KakaoPayHelpModal
        isOpen={showKakaoPayHelp}
        onClose={() => setShowKakaoPayHelp(false)}
      />
    </MobileLayout>
  );
}

