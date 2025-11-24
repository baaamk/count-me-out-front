import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "../layouts/MobileLayout";
import AddMenuModal from "../components/modals/AddMenuModal";
import { database } from "../config/firebase";
import { ref, get, update } from "firebase/database";

export default function SettlementMenuEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Firebase에서 메뉴 데이터 가져오기
  useEffect(() => {
    const fetchMenuData = async () => {
      if (!roomId || !database) {
        setLoading(false);
        return;
      }

      try {
        const roomRef = ref(database, `settlements/${roomId}`);
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();

        if (roomData && roomData.menuItems) {
          // menuItems를 배열로 변환
          const items = Array.isArray(roomData.menuItems)
            ? roomData.menuItems
            : Object.values(roomData.menuItems);
          
          setMenuItems(items);
        }
      } catch (error) {
        console.error("메뉴 데이터 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [roomId]);

  const handleAddMenu = () => {
    setEditingItem(null);
    setShowAddMenuModal(true);
  };

  const handleMenuAdd = (menuName, menuPrice) => {
    const newItem = {
      id: Date.now(),
      name: menuName,
      price: menuPrice,
      participantCount: 0,
      pricePerPerson: menuPrice,
      participants: [],
    };
    setMenuItems([...menuItems, newItem]);
  };

  const handleEditMenu = (item) => {
    setEditingItem(item);
    setShowAddMenuModal(true);
  };

  const handleMenuUpdate = (menuName, menuPrice) => {
    if (editingItem) {
      setMenuItems(
        menuItems.map((item) =>
          item.id === editingItem.id
            ? {
                ...item,
                name: menuName,
                price: menuPrice,
                pricePerPerson: menuPrice,
              }
            : item
        )
      );
      setEditingItem(null);
    }
  };

  const handleDeleteMenu = (id) => {
    if (window.confirm("이 메뉴를 삭제하시겠습니까?")) {
      setMenuItems(menuItems.filter((item) => item.id !== id));
    }
  };

  const handleSave = async () => {
    if (!roomId || !database) {
      alert("방 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // Firebase에 메뉴 데이터 저장
      const roomRef = ref(database, `settlements/${roomId}`);
      await update(roomRef, {
        menuItems: menuItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          participantCount: item.participantCount || 0,
          pricePerPerson: item.pricePerPerson || item.price,
        })),
      });

      // 저장 후 방장 페이지로 돌아가기
      navigate(`/settlement/room/${roomId}/host`);
    } catch (error) {
      console.error("메뉴 저장 실패:", error);
      alert("메뉴 저장에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleCancel = () => {
    if (roomId) {
      navigate(`/settlement/room/${roomId}/host`);
    } else {
      navigate("/");
    }
  };

  const calculateTotal = () => {
    return menuItems.reduce((sum, item) => sum + item.price, 0);
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-6 py-8 bg-neutral-50 min-h-screen w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 w-full max-w-[350px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">메뉴 편집</h1>
          <p className="font-normal text-base text-gray-500">
            메뉴를 추가, 수정 또는 삭제할 수 있습니다
          </p>
        </div>

        {/* Menu Items Section */}
        <div className="bg-white border border-[#edf0f5] relative rounded-2xl w-full max-w-[350px]">
          <div className="flex flex-col gap-3 items-center p-4 rounded-[inherit] w-full">
            <h2 className="font-semibold text-base text-[#1a1a1a] w-full text-left">메뉴 목록</h2>

            {menuItems.length === 0 ? (
              /* Empty State */
              <>
                <div className="flex flex-col gap-4 items-center justify-center h-40 p-10 bg-neutral-50 rounded-xl w-full">
                  <div className="flex items-center justify-center rounded-3xl size-12 bg-[#cccccc]">
                    <p className="text-2xl text-[#666666]">🍽️</p>
                  </div>
                  <p className="font-medium text-base text-[#666666]">아직 메뉴가 없습니다</p>
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
                    className="flex h-auto items-center justify-between p-4 w-full border-b border-[#edf0f5] last:border-b-0"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <p className="font-semibold text-base text-[#1a1a1a] truncate">
                        {item.name}
                      </p>
                      <p className="font-normal text-sm text-gray-500">
                        {item.price.toLocaleString()}원
                        {item.participantCount > 0 && (
                          <> • {item.participantCount}명 참여</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center ml-3">
                      <button
                        onClick={() => handleEditMenu(item)}
                        className="bg-[#f2f2f2] h-9 px-3 py-2 rounded-lg text-[#666666] hover:bg-[#e6e6e6] transition-colors"
                      >
                        <span className="font-medium text-sm">수정</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(item.id)}
                        className="bg-[#ffe5e5] h-9 px-3 py-2 rounded-lg text-[#cc3333] hover:bg-[#ffcccc] transition-colors"
                      >
                        <span className="font-medium text-sm">삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
                {/* Total Card */}
                <div className="bg-[#f5f0ff] flex h-14 items-center justify-between p-4 rounded-xl w-full mt-2">
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
        <div className="flex gap-3 w-full max-w-[350px]">
          <button
            onClick={handleCancel}
            className="bg-[#f2f2f2] flex items-center justify-center h-12 px-4 py-3 rounded-xl flex-1 hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-semibold text-base text-[#666666]">취소</span>
          </button>
          <button
            onClick={handleSave}
            className="bg-[#3366cc] flex items-center justify-center h-12 px-4 py-3 rounded-xl flex-1 hover:bg-[#2555e6] transition-colors"
          >
            <span className="font-semibold text-base text-white">저장</span>
          </button>
        </div>
      </div>

      {/* Add/Edit Menu Modal */}
      <AddMenuModal
        isOpen={showAddMenuModal}
        onClose={() => {
          setShowAddMenuModal(false);
          setEditingItem(null);
        }}
        onAdd={editingItem ? handleMenuUpdate : handleMenuAdd}
        editingItem={editingItem}
      />
    </MobileLayout>
  );
}

