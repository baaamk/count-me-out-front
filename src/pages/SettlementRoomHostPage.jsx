import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import { ref, onValue, update, get } from "firebase/database";
import { database, auth, firestore } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SettlementRoomHostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAllSelections, setShowAllSelections] = useState(false);
  const [menuItemsState, setMenuItemsState] = useState([]);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentParticipants, setCurrentParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [roomData, setRoomData] = useState(null);
  const [hostSelectedMenuIds, setHostSelectedMenuIds] = useState([]);
  
  const roomId = location.state?.roomId;

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
        setRoomData(data); // roomData를 state에 저장
        
        // 방장의 selectedMenuIds 가져오기
        const hostParticipant = Object.values(data.participants || {}).find(p => p.isHost === true);
        const hostSelectedIds = hostParticipant?.selectedMenuIds;
        const hostSelected = hostSelectedIds && Array.isArray(hostSelectedIds) && hostSelectedIds.length > 0
          ? hostSelectedIds.map(id => typeof id === 'number' ? id : Number(id))
          : [];
        setHostSelectedMenuIds(hostSelected);
        
        // menuItems를 배열로 변환 (객체인 경우 Object.values 사용)
        const menuItemsArray = Array.isArray(data.menuItems)
          ? data.menuItems
          : data.menuItems
          ? Object.values(data.menuItems)
          : [];
        
        // 메뉴 항목과 참여자 정보 결합
        const menuItemsWithParticipants = menuItemsArray.map((menuItem, index) => {
          const participants = Object.values(data.participants || {}).map((participant) => {
            // selectedMenuIds가 null이거나 배열이 아니거나 빈 배열이면 선택하지 않은 것으로 처리
            const selectedIds = participant.selectedMenuIds;
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

          const price = menuItem.price || 0;
          // participantCount는 실시간으로 선택한 참여자 수를 계산
          // completed: true인 참여자만 계산 (메뉴 선택 확정한 참여자만, 방장 포함)
          const allParticipants = Object.values(data.participants || {});
          // completed: true인 참여자만 필터링 (방장 포함)
          const completedParticipants = allParticipants.filter(p => p.completed === true);
          const menuId = typeof menuItem.id === 'number' ? menuItem.id : Number(menuItem.id);
          const selectedCount = completedParticipants.filter((p) => {
            const selectedIds = p.selectedMenuIds;
            // null이거나 배열이 아니거나 빈 배열이면 선택하지 않은 것으로 처리
            if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
              return false;
            }
            // 타입 일치 확인 (숫자로 변환하여 비교)
            return selectedIds.some(id => {
              const selectedId = typeof id === 'number' ? id : Number(id);
              return selectedId === menuId;
            });
          }).length;
          
          // 항상 실시간 계산값 사용 (Firebase 저장값 무시)
          const participantCount = selectedCount;
          const calculatedPricePerPerson = participantCount > 0 
            ? Math.floor(price / participantCount) 
            : undefined;
          
          // 방장이 선택한 메뉴인지 확인
          const isHostSelected = hostSelected.includes(menuId);
          
          return {
            id: menuItem.id,
            name: menuItem.name || '',
            price: price,
            participantCount: participantCount > 0 ? participantCount : undefined, // 0이면 undefined로 처리
            pricePerPerson: calculatedPricePerPerson, // 항상 실시간 계산값 사용
            isSelected: isHostSelected, // 방장이 선택한 메뉴인지 표시
            participants: participants,
          };
        });

        setMenuItemsState(menuItemsWithParticipants);
        setTotalParticipants(data.totalParticipants || 0);
        setCurrentParticipants(data.currentParticipants || 0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 모든 참여자가 메뉴 선택을 확정했는지 확인
  const allParticipantsCompleted = roomData ? (() => {
    const participants = Object.values(roomData.participants || {});
    if (participants.length === 0) return false;
    // 모든 참여자가 completed: true이고, selectedMenuIds가 null이 아니고 배열이며 길이가 0보다 큰지 확인
    return participants.every(p => {
      const isCompleted = p.completed === true;
      const hasSelectedMenus = p.selectedMenuIds && Array.isArray(p.selectedMenuIds) && p.selectedMenuIds.length > 0;
      return isCompleted && hasSelectedMenus;
    });
  })() : false;
  
  const remainingParticipants = roomData ? (() => {
    const participants = Object.values(roomData.participants || {});
    const completedCount = participants.filter(p => {
      const isCompleted = p.completed === true;
      const hasSelectedMenus = p.selectedMenuIds && Array.isArray(p.selectedMenuIds) && p.selectedMenuIds.length > 0;
      return isCompleted && hasSelectedMenus;
    }).length;
    return participants.length - completedCount;
  })() : totalParticipants - currentParticipants;

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
      participantCount: allParticipantsCompleted ? 2 : 1,
      pricePerPerson: allParticipantsCompleted ? 1000 : 2000,
      isSelected: false,
      participants: allParticipantsCompleted
        ? [
            { name: "철수", isSelected: true },
            { name: "준수", isSelected: true },
          ]
        : [{ name: "철수", isSelected: true }],
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

  // location.state에서 메뉴 데이터 업데이트 (편집 페이지에서 돌아올 때)
  useEffect(() => {
    if (location.state?.menuItems) {
      setMenuItemsState(location.state.menuItems);
    }
  }, [location.state]);

  const handleMenuToggle = async (itemId) => {
    // 방장의 선택은 Firebase에 저장하지 않음 (방장은 모든 메뉴를 볼 수만 있음)
    setMenuItemsState((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  const handleEdit = () => {
    // 메뉴 편집 페이지로 이동 (roomId를 URL에 포함)
    if (!roomId) {
      alert("방 정보를 찾을 수 없습니다.");
      return;
    }
    navigate(`/settlement/room/${roomId}/menu-edit`, {
      state: { menuItems: menuItemsState, roomId },
    });
  };

  const handleReselect = () => {
    // 메뉴 선택 페이지로 돌아가기 (roomId를 URL에 포함)
    if (!roomId) {
      alert("방 정보를 찾을 수 없습니다.");
      return;
    }
    navigate(`/settlement/room/${roomId}/menu-selection`, { 
      state: { isHost: true, roomId } 
    });
  };

  const handleViewAllSelections = () => {
    setShowAllSelections(!showAllSelections);
  };

  const handleConfirmSettlement = async () => {
    if (!allParticipantsCompleted) {
      alert("모든 참여자가 완료할 때까지 기다려주세요.");
      return;
    }
    
    if (!roomId || !database) {
      alert("방 정보를 불러올 수 없습니다.");
      return;
    }

    try {
      // 정산 상태를 completed로 변경
      await update(ref(database, `settlements/${roomId}`), {
        status: "completed",
        completedAt: Date.now(),
      });

      // 정산 방 데이터 가져오기
      const roomRef = ref(database, `settlements/${roomId}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();

      if (roomData) {
        // menuItems를 배열로 변환 (객체인 경우 Object.values 사용)
        const menuItemsArray = Array.isArray(roomData.menuItems)
          ? roomData.menuItems
          : roomData.menuItems
          ? Object.values(roomData.menuItems)
          : [];
        
        // 모든 참여자의 Firestore에 정산 내역 저장
        const participants = Object.values(roomData.participants || {});
        const totalAmount = menuItemsArray.reduce((sum, item) => sum + (item.price || 0), 0);

        for (const participant of participants) {
          if (participant.uid) {
            // 로그인한 사용자만 Firestore에 저장
            try {
              const userSettlementRef = doc(firestore, `users/${participant.uid}/settlements/${roomId}`);
              const participantAmount = menuItemsArray
                .filter((item) => participant.selectedMenuIds?.includes(item.id))
                .reduce((sum, item) => sum + (item.pricePerPerson || 0), 0);

              await setDoc(userSettlementRef, {
                roomId: roomId,
                type: roomData.type || "receipt",
                role: participant.isHost ? "host" : "participant",
                nickname: participant.nickname,
                joinedAt: participant.joinedAt,
                amount: participantAmount,
                totalAmount: totalAmount,
                status: "completed",
                createdAt: roomData.createdAt,
                completedAt: roomData.completedAt || Date.now(),
              });
            } catch (firestoreError) {
              console.error(`사용자 ${participant.uid} 정산 내역 저장 실패:`, firestoreError);
              // Firestore 저장 실패해도 정산 확정은 계속 진행
            }
          }
        }
      }
      
      navigate("/settlement/complete", { state: { roomId } });
    } catch (error) {
      console.error("정산 확정 실패:", error);
      alert("정산 확정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 본인이 선택한 메뉴 항목만 필터링
  const selectedItems = menuItemsState.filter((item) => item.isSelected);

  // 총 합계 계산 (실시간으로 pricePerPerson 계산)
  const totalAmount = selectedItems.reduce((sum, item) => {
    // 실시간으로 pricePerPerson 계산
    const allParticipants = Object.values(roomData?.participants || {});
    const completedParticipants = allParticipants.filter(p => p.completed === true);
    const confirmedCount = completedParticipants.filter((p) => {
      const selectedIds = p.selectedMenuIds;
      if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
        return false;
      }
      const menuId = typeof item.id === 'number' ? item.id : Number(item.id);
      return selectedIds.some(id => {
        const selectedId = typeof id === 'number' ? id : Number(id);
        return selectedId === menuId;
      });
    }).length;
    const pricePerPerson = confirmedCount > 0 
      ? Math.floor((item.price || 0) / confirmedCount)
      : item.price || 0;
    return sum + pricePerPerson;
  }, 0);
  
  // 방장이 메뉴 선택을 완료했는지 확인 (선택한 메뉴가 있는지)
  const hasHostSelectedMenu = selectedItems.length > 0;

  return (
    <MobileLayout>
      <div className="flex flex-col gap-2.5 items-center p-5 bg-neutral-50 min-h-screen w-full">
        {/* Header Section */}
        <div className="bg-white h-[106px] overflow-clip relative shrink-0 w-full max-w-[350px]">
          <div className="absolute flex flex-col gap-2 h-[70px] items-start left-5 top-[18px] w-[140px]">
            <h1 className="font-bold text-xl text-[#1a1a1a] whitespace-nowrap">🍽️ 메뉴 선택하기</h1>
            <div className="font-medium h-9 text-sm text-gray-500 w-[205px]">
              {allParticipantsCompleted ? (
                <>
                  <p className="mb-0">모두 참여 완료!</p>
                  <p>정산 확정을 해주세요!</p>
                </>
              ) : (
                <>
                  <p className="leading-normal mb-0">
                    {totalParticipants}명 중 {currentParticipants}명이 참여 중
                  </p>
                  <p className="font-semibold leading-normal">
                    미완료 <span className="underline">{remainingParticipants}</span>명
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleEdit}
            className="absolute bg-[#f2f2f2] flex gap-1.5 h-10 items-center leading-normal left-[260px] px-4 py-3 rounded-lg text-[#666666] top-[53px] hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-medium text-base">✏️</span>
            <span className="font-medium text-sm">편집</span>
          </button>
          <button
            onClick={handleReselect}
            className="absolute bg-[#f2f2f2] flex gap-1.5 h-10 items-center left-[180px] px-4 py-3 rounded-lg top-[53px] hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-medium text-sm text-[#666666]">재선택</span>
          </button>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex flex-col gap-2.5 h-[494px] items-start overflow-y-auto px-0 py-2.5 w-full max-w-[350px]">
          {menuItemsState.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-snow h-20 relative rounded-[10px] shrink-0 w-full"
            >
              <div className="flex flex-col h-20 items-start overflow-hidden pb-4 pt-0 px-4 rounded-[inherit] w-full">
                {/* Top Row */}
                <div className="flex h-[50px] items-center justify-between shrink-0 w-full gap-2">
                  <div className="flex flex-col gap-1 h-[38px] items-start shrink-0 flex-1 min-w-0">
                    <p className="font-semibold text-base text-[#1a1a1a] truncate">{item.name}</p>
                    <p className="font-normal text-xs text-gray-500 truncate">
                      {(item.price || 0).toLocaleString()}원
                      {item.participantCount > 0 && (
                        <> • {item.participantCount}명 참여 • {(item.pricePerPerson || 0).toLocaleString()}원/인</>
                      )}
                    </p>
                  </div>
                  {/* Checkbox - 방장은 선택 불가 (읽기 전용) */}
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
                  <div className="flex gap-1.5 h-6 items-center shrink-0 w-full flex-wrap">
                    {item.participants
                      .filter(participant => participant.isSelected) // 선택한 참여자만 필터링
                      .map((participant, index) => (
                        <div
                          key={index}
                          className="flex h-6 items-center justify-center px-2 py-1 rounded-xl shrink-0 bg-[#e5f2ff]"
                        >
                          <p className="font-medium text-[11px] whitespace-nowrap text-[#3366cc]">
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
        <div
          className={`bg-white flex flex-col gap-4 items-start overflow-clip p-5 sticky bottom-0 rounded-[10px] shrink-0 w-full max-w-[350px] z-10 ${
            showAllSelections && hasHostSelectedMenu ? "h-[263px]" : hasHostSelectedMenu ? "h-[136px]" : "h-[72px]"
          }`}
        >
          {hasHostSelectedMenu && (
            <>
              <button
                onClick={handleViewAllSelections}
                className="bg-[#f2f2f2] flex gap-2 h-8 items-center justify-center px-4 py-2 rounded-[10px] text-[#666666] w-full max-w-[310px] hover:bg-[#e6e6e6] transition-colors"
              >
                <span className="font-medium text-sm">내 선택 전체보기</span>
                <span
                  className={`font-normal text-xs transition-transform ${
                    showAllSelections ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {/* Expanded Details */}
              {showAllSelections && (
            <div className="flex flex-col gap-2 h-[120px] items-start px-0 py-2 shrink-0 w-full max-w-[310px]">
              {/* Divider Line */}
              <div className="bg-[#e6e6e6] h-px shrink-0 w-full" />

              {/* Selected Items */}
              <div className="flex flex-col gap-2 h-[60px] items-start px-0 py-2 shrink-0 w-full overflow-y-auto">
                {selectedItems.map((item) => {
                  // 실시간으로 pricePerPerson 계산
                  const allParticipants = Object.values(roomData?.participants || {});
                  const completedParticipants = allParticipants.filter(p => p.completed === true);
                  const confirmedCount = completedParticipants.filter((p) => {
                    const selectedIds = p.selectedMenuIds;
                    if (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0) {
                      return false;
                    }
                    const menuId = typeof item.id === 'number' ? item.id : Number(item.id);
                    return selectedIds.some(id => {
                      const selectedId = typeof id === 'number' ? id : Number(id);
                      return selectedId === menuId;
                    });
                  }).length;
                  const pricePerPerson = confirmedCount > 0 
                    ? Math.floor((item.price || 0) / confirmedCount)
                    : item.price || 0;
                  
                  return (
                    <div
                      key={item.id}
                      className="flex h-6 items-center justify-between text-sm w-full"
                    >
                      <p className="font-medium text-[#4d4d4d]">{item.name}</p>
                      <p className="font-semibold text-[#1a1a1a]">
                        {pricePerPerson.toLocaleString()}원
                      </p>
                    </div>
                  );
                })}
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
            </>
          )}

          {/* Settlement Confirm Button */}
          <button
            onClick={handleConfirmSettlement}
            disabled={!allParticipantsCompleted}
            className={`flex gap-2 h-12 items-center justify-center px-4 py-3 rounded-xl shrink-0 w-full max-w-[310px] transition-colors ${
              allParticipantsCompleted
                ? "bg-[#3366cc] hover:bg-[#2555e6]"
                : "bg-[#e6e6e6] cursor-not-allowed"
            }`}
          >
            <span
              className={`font-semibold text-base ${
                allParticipantsCompleted ? "text-white" : "text-[#999999]"
              }`}
            >
              정산 확정하기
            </span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

