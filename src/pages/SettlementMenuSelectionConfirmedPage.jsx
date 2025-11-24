import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { ref, onValue } from "firebase/database";
import { database } from "../config/firebase";

export default function SettlementMenuSelectionConfirmedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAllSelections, setShowAllSelections] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const roomId = location.state?.roomId;
  const userNickname = location.state?.userNickname || "참여자";

  // Firebase에서 정산 방 데이터 실시간 구독
  useEffect(() => {
    if (!roomId || !database) {
      setLoading(false);
      return;
    }

    const roomRef = ref(database, `settlements/${roomId}`);
    
    // 실시간 구독
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // menuItems를 배열로 변환 (객체인 경우 Object.values 사용)
        const menuItemsArray = Array.isArray(data.menuItems)
          ? data.menuItems
          : data.menuItems
          ? Object.values(data.menuItems)
          : [];
        
        // 메뉴 항목과 참여자 정보 결합
        const menuItemsWithParticipants = menuItemsArray.map((menuItem) => {
          const allParticipants = Object.values(data.participants || {});
          // completed: true인 참여자만 필터링 (확정한 참여자만)
          const completedParticipants = allParticipants.filter(p => p.completed === true);
          
          const participants = allParticipants.map((participant) => {
            const selectedIds = participant.selectedMenuIds;
            // selectedMenuIds가 null이거나 배열이 아니거나 빈 배열이면 선택하지 않은 것으로 처리
            const menuId = typeof menuItem.id === 'number' ? menuItem.id : Number(menuItem.id);
            const isSelected = selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0
              ? selectedIds.some(id => {
                  const selectedId = typeof id === 'number' ? id : Number(id);
                  return selectedId === menuId;
                })
              : false;
            return {
              name: participant.nickname,
              isSelected: isSelected,
            };
          });

          // 본인이 선택한 메뉴인지 확인
          const userParticipant = data.participants?.[userNickname];
          const userSelectedIds = userParticipant?.selectedMenuIds;
          const menuId = typeof menuItem.id === 'number' ? menuItem.id : Number(menuItem.id);
          const isSelected = userSelectedIds && Array.isArray(userSelectedIds) && userSelectedIds.length > 0
            ? userSelectedIds.some(id => {
                const selectedId = typeof id === 'number' ? id : Number(id);
                return selectedId === menuId;
              })
            : false;

          const price = menuItem.price || 0;
          
          // completed: true인 참여자만 카운트 (확정한 참여자만)
          const confirmedCount = completedParticipants.filter((p) => {
            const selectedIds = p.selectedMenuIds;
            if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
              return false;
            }
            return selectedIds.some(id => {
              const selectedId = typeof id === 'number' ? id : Number(id);
              return selectedId === menuId;
            });
          }).length;
          
          // ⚠️ 항상 실시간으로 계산 (Firebase에 저장된 값은 신뢰하지 않음)
          const calculatedPricePerPerson = confirmedCount > 0
            ? Math.floor(price / confirmedCount)
            : 0; // 참여자가 없으면 0
          
          return {
            id: menuItem.id,
            name: menuItem.name || '',
            price: price,
            participantCount: confirmedCount > 0 ? confirmedCount : undefined, // 확정한 참여자만 카운트
            pricePerPerson: calculatedPricePerPerson, // 항상 실시간 계산값 사용
            isSelected: isSelected,
            participants: participants,
          };
        });

        setMenuItems(menuItemsWithParticipants);
        setTotalParticipants(data.totalParticipants || 0);
        setCurrentParticipants(data.currentParticipants || 0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, userNickname]);

  const remainingParticipants = totalParticipants - currentParticipants;
  const allParticipantsCompleted = remainingParticipants === 0; // 모든 참여자 완료 여부

  // 초기 메뉴 데이터 (로딩 중일 때 사용)
  const initialMenuItems = [
    {
      id: 1,
      name: "삼겹살",
      price: 30000,
      participantCount: 3,
      pricePerPerson: 10000,
      isSelected: true,
      participants: [
        { name: "철수", isSelected: true },
        { name: "영희", isSelected: true },
        { name: "민수", isSelected: false },
      ],
    },
    {
      id: 2,
      name: "음료수",
      price: 2000,
      participantCount: 1,
      pricePerPerson: 2000,
      isSelected: false,
      participants: [
        { name: "철수", isSelected: true },
      ],
    },
    {
      id: 3,
      name: "맥주",
      price: 6000,
      participantCount: 3,
      pricePerPerson: 2000,
      isSelected: true,
      participants: [
        { name: "철수", isSelected: true },
        { name: "영희", isSelected: true },
        { name: "민수", isSelected: false },
      ],
    },
  ];

  const handleReselect = () => {
    // 메뉴 선택 페이지로 돌아가기 (roomId를 URL에 포함)
    if (!roomId) {
      alert("방 정보를 찾을 수 없습니다.");
      return;
    }
    navigate(`/settlement/room/${roomId}/menu-selection`, {
      state: { roomId, userNickname }
    });
  };

  const handleViewAllSelections = () => {
    setShowAllSelections(!showAllSelections);
  };

  // 본인이 선택한 메뉴 항목만 필터링
  const selectedItems = menuItems.filter((item) => item.isSelected);
  
  // 총 합계 계산
  const totalAmount = selectedItems.reduce((sum, item) => sum + (item.pricePerPerson || 0), 0);

  return (
    <MobileLayout>
      <div className="flex flex-col gap-2.5 items-center p-5 bg-neutral-50 min-h-screen w-full">
        {/* Header Section */}
        <div className="bg-white h-[106px] overflow-clip relative shrink-0 w-full max-w-[350px]">
          <div className="absolute flex flex-col gap-2 h-[70px] items-start left-5 top-[18px] w-[250px]">
            <h1 className="font-bold text-xl text-[#1a1a1a]">🍽️ 메뉴 선택하기</h1>
            <div className="font-medium h-9 text-sm text-gray-500 w-[205px]">
              {allParticipantsCompleted ? (
                <>
                  <p className="mb-0">모두 참여 완료!</p>
                  <p>방장의 정산 확정을 기다려주세요</p>
                </>
              ) : (
                <>
                  <p className="leading-normal mb-0">{totalParticipants}명 중 {currentParticipants}명이 참여 중이에요</p>
                  <p className="font-semibold leading-normal">
                    미완료 <span className="underline">{remainingParticipants}</span>명
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleReselect}
            className="absolute bg-[#f2f2f2] flex gap-1.5 h-10 items-center justify-center left-[260px] px-3 py-2 rounded-lg text-[#666666] top-[55px] whitespace-nowrap hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-medium text-sm">✏️ 재선택</span>
          </button>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex flex-col gap-2.5 h-[494px] items-start overflow-y-auto px-0 py-2.5 w-full max-w-[350px]">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-snow h-20 relative rounded-[10px] shrink-0 w-full"
            >
              <div className="flex flex-col h-20 items-start overflow-clip pb-4 pt-0 px-4 rounded-[inherit] w-full">
                {/* Top Row */}
                <div className="flex h-[50px] items-center justify-between shrink-0 w-full max-w-[318px]">
                  <div className="flex flex-col gap-1 h-[38px] items-start shrink-0 w-[200px]">
                    <p className="font-semibold text-base text-[#1a1a1a]">{item.name}</p>
                    <p className="font-normal text-xs text-gray-500">
                      {(item.price || 0).toLocaleString()}원
                      {item.participantCount > 0 && (
                        <> • {item.participantCount}명 참여 • {(item.pricePerPerson || 0).toLocaleString()}원/인</>
                      )}
                    </p>
                  </div>
                  {/* Checkbox */}
                  <div
                    className={`flex items-center justify-center p-1 rounded-[5px] shrink-0 size-6 ${
                      item.isSelected
                        ? "bg-[#3366cc]"
                        : "bg-white border border-[#e6e6e6]"
                    }`}
                  >
                    {item.isSelected && (
                      <p className="font-semibold text-sm text-white">✓</p>
                    )}
                  </div>
                </div>

                {/* Participant Chips - 선택한 참여자만 표시 */}
                {item.participants && item.participants.length > 0 && (
                  <div className="flex gap-1.5 h-6 items-center shrink-0 w-full max-w-[318px] flex-wrap">
                    {item.participants
                      .filter(participant => participant.isSelected) // 선택한 참여자만 필터링
                      .map((participant, index) => (
                        <div
                          key={index}
                          className="flex h-6 items-center justify-center px-2 py-1 rounded-xl shrink-0 bg-[#e5f2ff]"
                        >
                          <p className="font-medium text-[11px] text-[#3366cc] whitespace-nowrap">
                            {participant.name}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className={`bg-white flex flex-col gap-4 items-start overflow-clip p-5 sticky bottom-0 rounded-[10px] shrink-0 w-full max-w-[350px] z-10 ${
          showAllSelections ? "h-[200px]" : "h-[72px]"
        }`}>
          <button
            onClick={handleViewAllSelections}
            className="bg-[#f2f2f2] flex gap-2 h-8 items-center justify-center px-4 py-2 rounded-[10px] text-[#666666] w-full max-w-[310px] hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-medium text-sm">내 선택 전체보기</span>
            <span className={`font-normal text-xs transition-transform ${showAllSelections ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {/* Expanded Details */}
          {showAllSelections && (
            <div className="flex flex-col gap-2 h-[120px] items-start px-0 py-2 shrink-0 w-full max-w-[310px]">
              {/* Divider Line */}
              <div className="bg-[#e6e6e6] h-px shrink-0 w-full" />

              {/* Selected Items */}
              <div className="flex flex-col gap-2 h-[60px] items-start px-0 py-2 shrink-0 w-full">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex h-6 items-center justify-between text-sm w-full"
                  >
                    <p className="font-medium text-[#4d4d4d]">{item.name}</p>
                    <p className="font-semibold text-[#1a1a1a]">
                      {(item.pricePerPerson || 0).toLocaleString()}원
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom Divider */}
              <div className="bg-[#e6e6e6] h-px shrink-0 w-full" />

              {/* Total Section */}
              <div className="flex font-bold h-8 items-center justify-between px-0 py-2 text-[#1a1a1a] w-full">
                <p className="text-base">총 합계</p>
                <p className="text-lg">{(totalAmount || 0).toLocaleString()}원</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

