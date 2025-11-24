import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import MobileLayout from "../layouts/MobileLayout";
import NaverMap from "../components/map/NaverMap";

export default function TaxiLocationEditPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 기존 출발지/도착지 데이터를 location.state에서 가져오거나 기본값 사용
  const initialData = location.state?.taxiInfo || {
    departure: "홍대입구역 5번출구",
    arrival: "강남역 2번출구",
    totalAmount: 15000,
  };

  const [departure, setDeparture] = useState(initialData.departure || "");
  const [arrival, setArrival] = useState(initialData.arrival || "");
  const [totalAmount, setTotalAmount] = useState(
    initialData.totalAmount ? initialData.totalAmount.toLocaleString() : ""
  );
  const [departureLocation, setDepartureLocation] = useState({ lat: 37.5563, lng: 126.9230 }); // 홍대입구역
  const [arrivalLocation, setArrivalLocation] = useState({ lat: 37.4980, lng: 127.0276 }); // 강남역
  const [isEditingDeparture, setIsEditingDeparture] = useState(false);
  const [isEditingArrival, setIsEditingArrival] = useState(false);
  const [isEditingTotalAmount, setIsEditingTotalAmount] = useState(false);

  // 금액 포맷팅 함수 (천 단위 쉼표 추가)
  const formatAmount = (value) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (!numbers) return "";
    return parseInt(numbers, 10).toLocaleString("ko-KR");
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    const formatted = formatAmount(value);
    setTotalAmount(formatted);
  };

  const handleSave = () => {
    if (!departure.trim()) {
      alert("출발지를 입력해주세요.");
      return;
    }
    if (!arrival.trim()) {
      alert("도착지를 입력해주세요.");
      return;
    }
    if (!totalAmount) {
      alert("총 금액을 입력해주세요.");
      return;
    }

    const amount = parseInt(totalAmount.replace(/,/g, ""));
    
    // TODO: Firebase에 출발지/도착지/금액 저장
    // 저장 후 택시 정산 방으로 돌아가기
    navigate("/taxi/settlement/room/host", {
      state: {
        taxiInfo: {
          departure,
          arrival,
          totalAmount: amount,
        },
      },
    });
  };

  const handleCancel = () => {
    navigate("/taxi/settlement/room/host");
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center px-6 py-8 bg-[#fafcff] min-h-screen w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-2 items-center justify-center p-2.5 w-full max-w-[342px]">
          <h1 className="font-bold text-2xl text-[#1a1a1a]">택시 정보 편집</h1>
          <p className="font-normal text-base text-gray-500">
            출발지, 도착지, 총 금액을 수정할 수 있습니다
          </p>
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
                  centerLat={(departureLocation.lat + arrivalLocation.lat) / 2}
                  centerLng={(departureLocation.lng + arrivalLocation.lng) / 2}
                  level={5}
                  clickable={false}
                  markers={[
                    {
                      lat: departureLocation.lat,
                      lng: departureLocation.lng,
                      name: "출발지",
                      color: "#3366cc",
                    },
                    {
                      lat: arrivalLocation.lat,
                      lng: arrivalLocation.lng,
                      name: "도착지",
                      color: "#ff6b6b",
                    },
                  ]}
                  draggable={true}
                />
              </div>
            </div>

            {/* Total Amount Card */}
            <div className="bg-[#f5f0ff] flex h-14 items-center justify-between p-4 rounded-xl w-full">
              <p className="font-bold text-base text-[#1a1a1a]">총 금액</p>
              <div className="flex gap-2 items-center flex-1 min-w-0">
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
                    {totalAmount ? `${totalAmount}원` : "금액을 입력해 주세요"}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Button Container */}
        <div className="flex gap-3 w-full max-w-[342px]">
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
    </MobileLayout>
  );
}

