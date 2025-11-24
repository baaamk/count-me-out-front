import { useState, useEffect } from "react";
import { Modal } from "../common";

/**
 * 메뉴 추가/편집 모달 컴포넌트
 * @param {boolean} isOpen - 모달 열림 여부
 * @param {function} onClose - 닫기 핸들러
 * @param {function} onAdd - 메뉴 추가/수정 핸들러 (name, price) => void
 * @param {object} editingItem - 편집 중인 메뉴 아이템 (선택사항)
 */
export default function AddMenuModal({ isOpen, onClose, onAdd, editingItem }) {
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");

  useEffect(() => {
    if (editingItem) {
      setMenuName(editingItem.name || "");
      setMenuPrice(editingItem.price?.toString() || "");
    } else {
      setMenuName("");
      setMenuPrice("");
    }
  }, [editingItem, isOpen]);

  const handleSubmit = () => {
    if (!menuName.trim()) {
      alert("메뉴 이름을 입력해주세요.");
      return;
    }

    const price = parseInt(menuPrice.replace(/,/g, ""));

    onAdd(menuName.trim(), price);
    setMenuName("");
    setMenuPrice("");
    onClose();
  };

  const handlePriceChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setMenuPrice(value);
  };

  const handleClose = () => {
    setMenuName("");
    setMenuPrice("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="w-full max-w-[320px] p-6">
      <div className="flex flex-col gap-4 w-full">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-lg text-[#1a1a1a]">
            {editingItem ? "메뉴 수정" : "메뉴 추가"}
          </h2>
          <p className="font-normal text-sm text-gray-500">
            메뉴 이름과 가격을 입력해주세요
          </p>
        </div>

        {/* Menu Name Input */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-[#1a1a1a]">메뉴 이름</label>
          <input
            type="text"
            placeholder="메뉴 이름을 입력하세요"
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            className="bg-neutral-50 border border-[#e0e0e0] h-12 px-4 py-3 rounded-xl w-full text-base text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#333333] focus:bg-white placeholder:text-gray-500"
            autoFocus
          />
        </div>

        {/* Menu Price Input */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold text-sm text-[#1a1a1a]">가격</label>
          <div className="relative">
            <input
              type="text"
              placeholder="가격을 입력하세요"
              value={menuPrice ? parseInt(menuPrice.replace(/,/g, "") || 0).toLocaleString() : ""}
              onChange={handlePriceChange}
              className="bg-neutral-50 border border-[#e0e0e0] h-12 px-4 py-3 rounded-xl w-full text-base text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#333333] focus:bg-white placeholder:text-gray-500"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base text-gray-500">
              원
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleClose}
            className="bg-[#f2f2f2] flex items-center justify-center h-12 px-4 py-3 rounded-xl flex-1 hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-semibold text-base text-[#666666]">취소</span>
          </button>
          <button
            onClick={handleSubmit}
            className="bg-[#333333] flex items-center justify-center h-12 px-4 py-3 rounded-xl flex-1 hover:bg-[#444444] transition-colors"
          >
            <span className="font-semibold text-base text-white">
              {editingItem ? "수정" : "추가"}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

