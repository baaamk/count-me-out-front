import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import MobileLayout from "../layouts/MobileLayout";
import NaverMap from "../components/map/NaverMap";

export default function TaxiLocationSelectionConfirmedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDistanceDetails, setShowDistanceDetails] = useState(false);
  
  // 이전 페이지에서 전달된 선택된 위치 가져오기
  const [selectedLocation, setSelectedLocation] = useState(
    location.state?.selectedLocation || { lat: 37.5665, lng: 126.9780 }
  );

  // TODO: Firebase Realtime Database에서 가져올 데이터
  const totalParticipants = 4;
  const currentParticipants = 4; // 모두 참여 완료 상태
  const remainingParticipants = totalParticipants - currentParticipants;
  const allParticipantsCompleted = remainingParticipants === 0; // 모든 참여자 완료 여부

  // TODO: Firebase Realtime Database에서 가져올 팀원 위치 데이터
  const teamMemberLocations = allParticipantsCompleted
    ? [
        {
          name: "철수",
          lat: 37.5665,
          lng: 126.9780,
        },
        {
          name: "진수",
          lat: 37.5651,
          lng: 126.9895,
        },
        {
          name: "민수",
          lat: 37.5670,
          lng: 126.9770,
        },
      ]
    : [
        {
          name: "철수",
          lat: 37.5665,
          lng: 126.9780,
        },
        {
          name: "민수",
          lat: 37.5651,
          lng: 126.9895,
        },
      ];

  // TODO: 실제 계산된 거리 데이터
  const myLocationData = {
    departure: "홍대입구역 5번출구",
    distance: 5.3, // km
  };

  const handleReselect = () => {
    // 위치 재선택 페이지로 이동
    navigate("/taxi/settlement/room/location-selection", {
      state: { selectedLocation },
    });
  };

  const handleViewDistanceDetails = () => {
    setShowDistanceDetails(!showDistanceDetails);
  };

  return (
    <MobileLayout>
      <div className="flex flex-col gap-5 items-center p-5 bg-[#f8f8f8] min-h-screen w-full">
        {/* Header Section */}
        <div className="bg-white h-[106px] overflow-clip relative shrink-0 w-full max-w-[350px]">
          <div className="absolute flex flex-col gap-2 items-start leading-0 left-5 top-[18px] w-[194px]">
            <h1 className="font-bold text-xl text-[#1a1a1a] w-[215px]">
              <span className="font-normal">🚕</span>
              <span> 하차위치 선택하기</span>
            </h1>
            <div className="font-medium h-9 text-sm text-gray-500 w-[205px]">
              {allParticipantsCompleted ? (
                <>
                  <p className="mb-0">모두 참여 완료!</p>
                  <p>방장의 정산 확정을 기다려주세요</p>
                </>
              ) : (
                <>
                  <p className="leading-normal mb-0">
                    {totalParticipants}명 중 {currentParticipants}명이 참여 중이에요
                  </p>
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
            <span className="font-medium text-sm text-[#666666] whitespace-nowrap">✏️ 재선택</span>
          </button>
        </div>

        {/* Content Card */}
        <div className="bg-white flex flex-col gap-5 h-[452px] items-center overflow-clip p-5 relative rounded-3xl shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-lg text-[#1a1a1a]">내 하차 위치 선택</h2>
          <div className="font-normal text-sm text-[#666666] text-center whitespace-nowrap">
            <p className="mb-0">팀원들이 찍은 위치 중 선택하거나</p>
            <p>직접 지도에 핀을 찍어주세요</p>
          </div>

          {/* Map Box */}
          <div className="h-[280px] w-full max-w-[310px] rounded-2xl overflow-hidden">
            <NaverMap
              width="100%"
              height={280}
              centerLat={selectedLocation.lat}
              centerLng={selectedLocation.lng}
              level={3}
              clickable={false}
              markers={teamMemberLocations.map((member) => ({
                lat: member.lat,
                lng: member.lng,
                name: member.name,
                color: "#3366cc",
              }))}
              selectedMarker={
                selectedLocation
                  ? {
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      name: "나",
                    }
                  : null
              }
              draggable={false}
            />
          </div>

          <p className="font-normal text-sm text-[#666666]">
            선택한 위치는 팀원들에게 실시간으로 표시돼요
          </p>
        </div>

        {/* Bottom Section */}
        <div
          className={`bg-white flex flex-col gap-4 items-start overflow-clip p-5 sticky bottom-0 rounded-[10px] shrink-0 w-full max-w-[350px] z-10 ${
            showDistanceDetails ? "h-[187px]" : "h-[72px]"
          }`}
        >
          <button
            onClick={handleViewDistanceDetails}
            className="bg-[#f2f2f2] flex gap-2 h-8 items-center justify-center px-4 py-2 rounded-[10px] text-[#666666] w-full max-w-[310px] hover:bg-[#e6e6e6] transition-colors"
          >
            <span className="font-medium text-sm">내 하차 거리</span>
            <span
              className={`font-normal text-xs transition-transform ${
                showDistanceDetails ? "rotate-180" : ""
              }`}
            >
              ▼
            </span>
          </button>

          {/* Expanded Details */}
          {showDistanceDetails && (
            <div className="flex flex-col gap-2 h-[100px] items-start px-0 py-2 shrink-0 w-full max-w-[310px]">
              {/* Divider Line */}
              <div className="bg-[#e6e6e6] h-px shrink-0 w-full" />

              {/* Distance Details */}
              <div className="flex flex-col gap-2 h-[75px] items-start px-0 py-2 shrink-0 w-full">
                <div className="flex h-[59px] items-center justify-between text-sm w-full">
                  <div className="font-medium text-[#4d4d4d] whitespace-nowrap">
                    <p className="mb-0">출발지 부터</p>
                    <p className="mb-0 text-sm">&nbsp;</p>
                    <p>{myLocationData.departure}</p>
                  </div>
                  <p className="font-semibold text-[#1a1a1a]">{myLocationData.distance.toLocaleString()} km</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}

