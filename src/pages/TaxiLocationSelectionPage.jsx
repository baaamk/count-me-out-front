import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import MobileLayout from "../layouts/MobileLayout";
import NaverMap from "../components/map/NaverMap";
import { Input } from "../components/common";

export default function TaxiLocationSelectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedLocation, setSelectedLocation] = useState(null); // {lat, lng}
  const [isDestination, setIsDestination] = useState(false); // 도착지 선택 여부
  const [searchQuery, setSearchQuery] = useState(""); // 검색어
  const [searchResults, setSearchResults] = useState([]); // 검색 결과
  const [showSearchResults, setShowSearchResults] = useState(false); // 검색 결과 표시 여부
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // 지도 중심
  const searchTimeoutRef = useRef(null);
  
  // 출발지/도착지 정보 (TaxiStep2ReceiptInputPage에서 설정한 값)
  const departureInfo = location.state?.departureInfo || {
    name: "홍대입구역 5번출구",
    lat: 37.5572,
    lng: 126.9234,
  };
  
  const arrivalInfo = location.state?.arrivalInfo || {
    name: "강남역",
    lat: 37.4980,
    lng: 127.0276,
  };

  // TODO: Firebase Realtime Database에서 가져올 데이터
  const totalParticipants = 4;
  const currentParticipants = 3;
  const remainingParticipants = totalParticipants - currentParticipants;

  // TODO: Firebase Realtime Database에서 가져올 팀원 위치 데이터
  const teamMemberLocations = [
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

  const handleMapClick = (lat, lng) => {
    setSelectedLocation({ lat, lng });
    setShowSearchResults(false);
  };

  // 장소 검색 (네이버 지도 Geocoder API 사용)
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    if (!window.naver || !window.naver.maps) {
      console.error("네이버 지도 SDK가 로드되지 않았습니다");
      return;
    }

    try {
      const geocoder = new window.naver.maps.Service.Geocoder();
      
      geocoder.addressSearch(query, (status, response) => {
        if (status === window.naver.maps.Service.Status.OK) {
          const results = response.result.items.slice(0, 5).map((place, index) => ({
            id: place.address || `place-${index}`,
            name: place.address || place.title || query,
            address: place.address || place.title || "",
            lat: parseFloat(place.point.y),
            lng: parseFloat(place.point.x),
          }));
          setSearchResults(results);
          setShowSearchResults(true);
        } else if (status === window.naver.maps.Service.Status.ZERO_RESULT) {
          setSearchResults([]);
          setShowSearchResults(true);
        } else {
          console.error("장소 검색 실패:", status);
        }
      });
    } catch (error) {
      console.error("검색 중 오류:", error);
    }
  };

  // 검색어 변경 핸들러 (디바운싱)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);
  };

  // 검색 결과 선택
  const handleSelectSearchResult = (result) => {
    setSelectedLocation({ lat: result.lat, lng: result.lng });
    setMapCenter({ lat: result.lat, lng: result.lng });
    setSearchQuery(result.name);
    setShowSearchResults(false);
  };

  const handleSelectTeamMemberLocation = (memberName) => {
    // 팀원이 선택한 위치를 내 위치로 선택
    const member = teamMemberLocations.find((m) => m.name === memberName);
    if (member) {
      setSelectedLocation({ lat: member.lat, lng: member.lng });
    }
  };

  const handleSelectDestination = () => {
    // 도착지 선택
    setIsDestination(true);
    setSelectedLocation({ lat: arrivalInfo.lat, lng: arrivalInfo.lng });
    setMapCenter({ lat: arrivalInfo.lat, lng: arrivalInfo.lng });
  };

  const handleComplete = () => {
    if (!selectedLocation) {
      alert("하차 위치를 선택해주세요.");
      return;
    }
    // TODO: 선택한 위치를 Firebase에 저장하고 확인 페이지로 이동
    navigate("/taxi/settlement/room/location-selection-confirmed", {
      state: { 
        selectedLocation,
        isDestination,
      },
    });
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
              <p className="leading-normal mb-0">
                {totalParticipants}명 중 {currentParticipants}명이 참여 중이에요
              </p>
              <p className="font-semibold leading-normal">
                미완료 <span className="underline">{remainingParticipants}</span>명
              </p>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white flex flex-col gap-5 h-[452px] items-center overflow-clip p-5 relative rounded-3xl shrink-0 w-full max-w-[350px]">
          <h2 className="font-bold text-lg text-[#1a1a1a]">내 하차 위치 선택</h2>
          <div className="font-normal text-sm text-[#666666] text-center whitespace-nowrap">
            <p className="mb-0">팀원들이 찍은 위치 중 선택하거나</p>
            <p>직접 지도에 핀을 찍어주세요</p>
          </div>

          {/* 검색 입력 필드 */}
          <div className="relative w-full max-w-[310px]">
            <Input
              type="text"
              placeholder="장소 검색 (예: 홍대입구역, 강남역)"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
              size="md"
              className="w-full"
            />
            
            {/* 검색 결과 목록 */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e0e0e0] rounded-xl shadow-lg max-h-48 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors border-b border-[#e0e0e0] last:border-b-0"
                    >
                      <p className="font-semibold text-sm text-[#1a1a1a]">{result.name}</p>
                      <p className="font-medium text-xs text-gray-500 mt-1">{result.address}</p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-center">
                    <p className="font-medium text-sm text-gray-500">검색 결과가 없습니다</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map Box */}
          <div className="h-[280px] w-full max-w-[310px] rounded-2xl overflow-hidden">
            <NaverMap
              width="100%"
              height={280}
              centerLat={mapCenter.lat}
              centerLng={mapCenter.lng}
              level={3}
              clickable={true}
              onClick={handleMapClick}
              markers={[
                // 출발지 마커
                {
                  lat: departureInfo.lat,
                  lng: departureInfo.lng,
                  name: `출발지: ${departureInfo.name}`,
                  color: "#00ff00", // 초록색
                },
                // 도착지 마커
                {
                  lat: arrivalInfo.lat,
                  lng: arrivalInfo.lng,
                  name: `도착지: ${arrivalInfo.name}`,
                  color: "#ff0000", // 빨간색
                },
                // 팀원 위치 마커
                ...teamMemberLocations.map((member) => ({
                  lat: member.lat,
                  lng: member.lng,
                  name: member.name,
                  color: "#3366cc",
                })),
              ]}
              selectedMarker={
                selectedLocation
                  ? {
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                      name: isDestination ? "나 (도착지)" : "나",
                    }
                  : null
              }
              draggable={true}
            />
          </div>

          <p className="font-normal text-sm text-[#666666]">
            선택한 위치는 팀원들에게 실시간으로 표시돼요
          </p>
        </div>
        
        {/* 검색 결과 외부 클릭 시 닫기 */}
        {showSearchResults && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowSearchResults(false)}
          />
        )}

        {/* Button Container */}
        <div className="bg-[#f8f8f8] flex flex-col h-[51px] items-center justify-center overflow-clip px-0 py-5 shrink-0 w-full max-w-[350px]">
          <button
            onClick={handleComplete}
            className="bg-[#3366cc] flex h-[52px] items-center justify-center overflow-clip relative rounded-[14px] shrink-0 w-full hover:bg-[#2555e6] transition-colors"
          >
            <span className="font-bold text-base text-white">하차 위치 선택 완료</span>
          </button>
        </div>
      </div>
    </MobileLayout>
  );
}

