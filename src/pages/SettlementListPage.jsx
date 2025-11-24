import MobileLayout from "../layouts/MobileLayout";
import { PageHeader, Card } from "../components/common";
import { useNavigation } from "../hooks/useNavigation";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDateShort } from "../utils/format";
import { useState, useRef, useEffect } from "react";
import { auth, firestore } from "../config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

export default function SettlementListPage() {
  const { goBack } = useNavigation();
  const navigate = useNavigate();
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const monthDropdownRef = useRef(null);

  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 상태 확인
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setSettlements([]);
        setLoading(false);
        return;
      }

      try {
        // Firestore에서 사용자별 정산 내역 가져오기
        const settlementsRef = collection(firestore, `users/${user.uid}/settlements`);
        const q = query(
          settlementsRef,
          where("status", "==", "completed"),
          orderBy("completedAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        
        const settlementList = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const completedDate = new Date(data.completedAt);
          const year = completedDate.getFullYear();
          const month = completedDate.getMonth() + 1;
          
          settlementList.push({
            id: doc.id,
            uuid: data.roomId,
            type: data.type,
            amount: data.amount,
            totalAmount: data.totalAmount,
            date: completedDate,
            yearMonth: `${year}년 ${month}월`,
            nickname: data.nickname,
          });
        });
        
        setSettlements(settlementList);
      } catch (error) {
        console.error("정산 리스트 조회 실패:", error);
        setSettlements([]);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 최근 12개월 생성
  const generateMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      months.push(`${year}년 ${month}월`);
    }
    return months;
  };

  const months = generateMonths();
  const categories = ["전체", "영수증", "택시"];
  const selectedMonth = months[selectedMonthIndex];


  const handlePrevMonth = () => {
    if (selectedMonthIndex > 0) {
      setSelectedMonthIndex(selectedMonthIndex - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex < months.length - 1) {
      setSelectedMonthIndex(selectedMonthIndex + 1);
    }
  };

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
    };

    if (showMonthDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMonthDropdown]);

  const handleSettlementClick = (settlement) => {
    // 로그인된 상태라면 정산 상세 페이지로 이동
    if (settlement.type === "taxi") {
      navigate(`/taxi/settlement/${settlement.uuid}`);
    } else {
      navigate(`/settlement/${settlement.uuid}`);
    }
  };

  // 필터링된 정산 리스트
  const filteredSettlements = settlements.filter((settlement) => {
    // 월별 필터링
    if (settlement.yearMonth !== selectedMonth) {
      return false;
    }
    
    // 카테고리 필터링
    if (selectedCategory === "전체") return true;
    if (selectedCategory === "영수증") return settlement.type === "receipt";
    if (selectedCategory === "택시") return settlement.type === "taxi";
    return true;
  });

  return (
    <MobileLayout>
      <div className="flex flex-col gap-4 items-center px-4 py-4 bg-[#f7f8fa] min-h-screen w-full">
        <PageHeader title="정산 리스트" onBack={goBack} />

        {/* Month Selector - 좌우 화살표로 이동 + 드롭다운 */}
        <div className="bg-white flex gap-2 h-[60px] items-center justify-between px-5 py-3 rounded-[18px] w-full max-w-[358px] relative z-50" ref={monthDropdownRef}>
          {/* 이전 월 버튼 (왼쪽 - 과거로) */}
          <button
            onClick={handleNextMonth}
            disabled={selectedMonthIndex === months.length - 1}
            className={`flex items-center justify-center h-9 w-9 rounded-[18px] shrink-0 transition-colors ${
              selectedMonthIndex === months.length - 1
                ? "bg-[#f2f2f2] opacity-50 cursor-not-allowed"
                : "bg-[#f2f2f2] hover:bg-[#e6e6e6]"
            }`}
          >
            <span className="font-normal text-sm text-[#666666]">‹</span>
          </button>

          {/* 현재 선택된 월 표시 (클릭 시 드롭다운) */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowMonthDropdown(!showMonthDropdown)}
              className="bg-[#f2f6fe] border border-[#3366cc] flex items-center justify-center h-9 px-3.5 py-2.5 rounded-[18px] shrink-0 cursor-pointer"
            >
              <span className="font-semibold text-sm text-[#3366cc] whitespace-nowrap">
                {selectedMonth}
              </span>
            </button>
          </div>

          {/* 다음 월 버튼 (오른쪽 - 최근으로) */}
          <button
            onClick={handlePrevMonth}
            disabled={selectedMonthIndex === 0}
            className={`flex items-center justify-center h-9 w-9 rounded-[18px] shrink-0 transition-colors ${
              selectedMonthIndex === 0
                ? "bg-[#f2f2f2] opacity-50 cursor-not-allowed"
                : "bg-[#f2f2f2] hover:bg-[#e6e6e6]"
            }`}
          >
            <span className="font-normal text-sm text-[#666666]">›</span>
          </button>

          {/* 드롭다운 메뉴 (다른 요소 위에 표시) */}
          {showMonthDropdown && (
            <div className="absolute top-full left-5 right-5 mt-2 bg-white border border-[#e0e0e0] rounded-xl shadow-lg max-h-64 overflow-y-auto z-[100]">
              {months.map((month, index) => (
                <button
                  key={month}
                  onClick={() => {
                    setSelectedMonthIndex(index);
                    setShowMonthDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                    selectedMonthIndex === index ? "bg-[#f2f6fe]" : ""
                  }`}
                >
                  <span
                    className={`font-medium text-sm ${
                      selectedMonthIndex === index ? "text-[#3366cc]" : "text-[#1a1a1a]"
                    }`}
                  >
                    {month}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="bg-white flex gap-2 h-14 items-center px-3 py-3 rounded-3xl w-full max-w-[358px]">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex items-center justify-center h-8 px-4 py-2 rounded-2xl shrink-0 transition-colors ${
                selectedCategory === category
                  ? "bg-[#3a79ff]"
                  : "bg-[#f2f2f2]"
              }`}
            >
              <span
                className={`font-medium text-sm ${
                  selectedCategory === category ? "text-white" : "text-[#666666]"
                }`}
              >
                {category}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 items-start w-full max-w-[358px]">
          {filteredSettlements.length === 0 ? (
            <Card className="flex items-center justify-center h-32 w-full">
              <p className="font-medium text-sm text-gray-500">정산 내역이 없습니다.</p>
            </Card>
          ) : (
            filteredSettlements.map((settlement) => (
              <Card
                key={settlement.id}
                onClick={() => handleSettlementClick(settlement)}
                hover
                className="border border-[#f2f2f2] flex gap-3 h-[54px] items-center px-4 py-4 w-full"
              >
                <span className="text-2xl shrink-0">{settlement.icon}</span>
                <div className="flex flex-col gap-0.5 items-start flex-1 min-w-0">
                  <p className="font-bold text-[15px] text-[#111111]">
                    {settlement.date} {settlement.title}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 items-end justify-center min-w-0 shrink-0">
                  <p className="font-bold text-base text-[#3a79ff]">
                    {formatCurrency(settlement.amount)}
                  </p>
                </div>
                <span className="font-normal text-xl text-[#b3b3b3] shrink-0">›</span>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

