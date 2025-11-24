import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import MobileLayout from "../layouts/MobileLayout";
import NaverMap from "../components/map/NaverMap";
import { database, auth, firestore } from "../config/firebase";
import { ref, update, get } from "firebase/database";
import { doc, setDoc } from "firebase/firestore";

export default function TaxiLocationSelectionHostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = location.state?.roomId; // 택시 정산 방 ID
  const [showDistanceDetails, setShowDistanceDetails] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // 호스트가 선택한 위치 {lat, lng}
  const [isDestination, setIsDestination] = useState(false); // 도착지 선택 여부
  const [hasHostSelectedLocation, setHasHostSelectedLocation] = useState(false); // 호스트 위치 선택 완료 여부
  const [participantOrders, setParticipantOrders] = useState({}); // 각 참여자의 하차 순서 { "민수": 1, "진수": 2, ... }
  const [calculatedRoute, setCalculatedRoute] = useState(null); // 계산된 경로 정보
  const [calculatedTaxiFare, setCalculatedTaxiFare] = useState(null); // 계산된 택시 요금
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false); // 경로 계산 중 여부
  
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
  const currentParticipants = 4; // 모든 참여자 완료 (테스트용)
  const remainingParticipants = totalParticipants - currentParticipants;
  const allParticipantsCompleted = remainingParticipants === 0; // 모든 참여자 완료 여부

  // TODO: Firebase Realtime Database에서 가져올 팀원 위치 데이터
  const teamMemberLocations = allParticipantsCompleted
    ? [
        {
          name: "민수",
          lat: 37.5665,
          lng: 126.9780,
        },
        {
          name: "진수",
          lat: 37.5651,
          lng: 126.9895,
        },
        {
          name: "철수",
          lat: 37.5670,
          lng: 126.9770,
        },
        {
          name: "지수",
          lat: 37.5645,
          lng: 126.9800,
        },
      ]
    : [
        {
          name: "철수",
          lat: 37.5670,
          lng: 126.9770,
        },
        {
          name: "민수",
          lat: 37.5651,
          lng: 126.9895,
        },
      ];

  // 모든 참여자 목록 (호스트 포함)
  const allParticipants = allParticipantsCompleted
    ? [...teamMemberLocations, { name: "나", lat: selectedLocation?.lat || 37.5665, lng: selectedLocation?.lng || 126.9780 }]
    : teamMemberLocations;

  // 같은 위치에 있는 참여자들을 그룹화 (threshold: 0.0001도 = 약 11m)
  const threshold = 0.0001;
  const locationGroups = allParticipantsCompleted ? (() => {
    const groups = [];
    const processed = new Set();
    
    allParticipants.forEach((participant) => {
      if (processed.has(participant.name)) return;
      
      const group = [participant];
      processed.add(participant.name);
      
      // 같은 위치에 있는 다른 참여자들 찾기
      allParticipants.forEach((other) => {
        if (processed.has(other.name)) return;
        if (participant.name === other.name) return;
        
        const latDiff = Math.abs(participant.lat - other.lat);
        const lngDiff = Math.abs(participant.lng - other.lng);
        
        if (latDiff < threshold && lngDiff < threshold) {
          group.push(other);
          processed.add(other.name);
        }
      });
      
      // 도착지 위치인지 확인 (도착지와 같은 위치인지)
      const isDestinationGroup = (() => {
        const latDiff = Math.abs(participant.lat - arrivalInfo.lat);
        const lngDiff = Math.abs(participant.lng - arrivalInfo.lng);
        return latDiff < threshold && lngDiff < threshold;
      })();
      
      groups.push({
        id: `group-${groups.length}`,
        participants: group,
        location: { lat: participant.lat, lng: participant.lng },
        displayName: group.length > 1 
          ? `${group.map(p => p.name).join(", ")} (같은 위치)`
          : group[0].name,
        isDestination: isDestinationGroup,
      });
    });
    
    return groups;
  })() : [];

  // 도착지 그룹 자동으로 마지막 순서 할당
  useEffect(() => {
    if (!allParticipantsCompleted || locationGroups.length === 0) return;
    
    const destinationGroup = locationGroups.find(g => g.isDestination);
    if (destinationGroup && !participantOrders[destinationGroup.id]) {
      const lastOrder = locationGroups.length;
      setParticipantOrders((prev) => ({
        ...prev,
        [destinationGroup.id]: lastOrder,
      }));
    }
  }, [allParticipantsCompleted, locationGroups, participantOrders]);

  // 모든 그룹의 순서가 할당되었는지 확인 (도착지 그룹은 자동 할당되므로 제외)
  const allOrdersAssigned = allParticipantsCompleted && 
    locationGroups.length > 0 &&
    locationGroups.every((group) => {
      if (group.isDestination) {
        // 도착지 그룹은 자동으로 마지막 순서 할당
        return participantOrders[group.id] === locationGroups.length;
      }
      const groupOrder = participantOrders[group.id];
      return groupOrder !== undefined && groupOrder !== null;
    });

  // 사용 가능한 순서 목록 (1부터 그룹 수-1까지, 마지막은 도착지 전용)
  const availableOrders = Array.from({ length: locationGroups.length - 1 }, (_, i) => i + 1);

  // 순서대로 정렬된 경유지 및 도착지 계산 (메모이제이션)
  const sortedRoute = useMemo(() => {
    if (!allOrdersAssigned) return null;
    const sortedGroups = [...locationGroups].sort((a, b) => {
      const orderA = participantOrders[a.id] || 999;
      const orderB = participantOrders[b.id] || 999;
      return orderA - orderB;
    });
    
    const waypoints = sortedGroups.slice(0, -1).map(group => ({
      name: group.displayName,
      lat: group.location.lat,
      lng: group.location.lng,
      order: participantOrders[group.id],
    }));
    
    const destination = sortedGroups[sortedGroups.length - 1];
    
    return {
      departure: departureInfo,
      waypoints,
      destination: {
        name: destination.displayName,
        lat: destination.location.lat,
        lng: destination.location.lng,
        order: participantOrders[destination.id],
      },
    };
  }, [allOrdersAssigned, locationGroups, participantOrders, departureInfo]);

  // 카카오맵 Directions API로 경로 및 택시 요금 계산
  useEffect(() => {
    if (!allOrdersAssigned || !sortedRoute || isCalculatingRoute) return;
    
    let isMounted = true;
    
    const calculateRoute = async () => {
      setIsCalculatingRoute(true);
      console.log("경로 계산 시작");
      try {
        // 출발지, 경유지, 도착지 좌표 준비
        // 네이버 Directions 5 API 형식: "경도,위도" (경도가 먼저!)
        const origin = `${departureInfo.lng},${departureInfo.lat}`;
        // 경유지: "경도,위도|경도,위도|..." 형식 (최대 5개)
        const waypoints = sortedRoute.waypoints.length > 0 
          ? sortedRoute.waypoints
              .slice(0, 5) // 최대 5개까지만
              .map(wp => `${wp.lng},${wp.lat}`) // 경도,위도 순서
              .join("|") // '|'로 구분
          : null;
        const destination = `${sortedRoute.destination.lng},${sortedRoute.destination.lat}`;
        
        console.log("경로 계산 요청:", {
          origin,
          waypoints,
          destination,
          waypointsCount: sortedRoute.waypoints.length,
        });
        
        // Firebase Functions를 통해 네이버 Directions API 호출
        const calculateRouteUrl = import.meta.env.VITE_FIREBASE_CALCULATE_ROUTE_URL || 
          "https://calculateroute-fnh7exjfcq-uc.a.run.app";
        
        console.log("calculateRoute URL:", calculateRouteUrl);
        
        const requestBody = {
          origin,
          destination,
          waypoints,
        };
        
        // 타임아웃 설정 (10초로 단축)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.warn("경로 계산 API 타임아웃 (10초 초과)");
        }, 10000);
        
        let response;
        try {
          response = await fetch(calculateRouteUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error("경로 계산이 시간 초과되었습니다. 대체 계산을 사용합니다.");
          }
          throw fetchError;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: errorText || response.statusText };
          }
          console.error("경로 계산 API 오류:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            url: calculateRouteUrl,
            requestBody
          });
          // 네이버 API 오류 메시지 파싱
          let errorMessage = errorData.error || `경로 계산 실패: ${response.status}`;
          if (typeof errorMessage === 'object') {
            errorMessage = errorMessage.message || errorMessage.error || JSON.stringify(errorMessage);
          }
          
          // 401 오류인 경우 상세 안내
          if (response.status === 401 || (errorData.error && errorData.error.errorCode === "210")) {
            errorMessage = `네이버 Directions API 인증 실패: ${errorMessage}\n\n해결 방법:\n1. 네이버 클라우드 플랫폼 콘솔에서 Application의 "Web 서비스 URL"에 다음 URL 추가:\n   - https://calculateroute-fnh7exjfcq-uc.a.run.app\n   - https://calculateroute-fnh7exjfcq-uc.a.run.app/*\n2. 저장 후 2-3분 대기\n3. Firebase Functions 환경 변수 확인 (NAVER_APIGW_API_KEY_ID, NAVER_APIGW_API_KEY)`;
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        console.log("경로 계산 API 응답:", data);
        
        // Firebase Functions 응답 형식: { success: true, route: { distance, duration, taxiFare } }
        if (data.success && data.route) {
          const route = data.route;
          const distance = route.distance / 1000; // km (미터 -> 킬로미터)
          const duration = route.duration / 60; // 분 (초 -> 분)
          
          // 택시 요금: 네이버 API에서 제공하면 사용, 없으면 계산
          let taxiFare = route.taxiFare;
          if (!taxiFare || taxiFare === 0) {
            // 네이버 API에서 택시 요금이 없으면 서울시 택시 기본 요금 체계로 계산
            // 기본 요금: 4,800원 (2km)
            // 이후 100m당 200원
            taxiFare = 4800; // 기본 요금
            if (distance > 2) {
              const additionalDistance = distance - 2; // km
              const additionalFare = Math.ceil(additionalDistance * 10) * 200; // 100m 단위로 올림
              taxiFare += additionalFare;
            }
          }
          
          if (isMounted) {
            setCalculatedRoute({
              distance,
              duration,
              waypoints: sortedRoute.waypoints,
            });
            
            setCalculatedTaxiFare(taxiFare);
          }
        } else {
          throw new Error("경로를 찾을 수 없습니다.");
        }
      } catch (error) {
        console.error("경로 계산 오류:", error);
        if (error.name === 'AbortError') {
          console.error("경로 계산 타임아웃 (30초 초과)");
          alert("경로 계산이 시간 초과되었습니다. 다시 시도해주세요.");
        } else {
          console.error("경로 계산 실패:", error.message);
          // 에러 메시지를 사용자에게 표시하지 않고 대체 계산 사용
        }
        // Firebase Functions가 없으면 간단한 거리 계산으로 대체
        const allPoints = [
          { lat: departureInfo.lat, lng: departureInfo.lng },
          ...sortedRoute.waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
          { lat: sortedRoute.destination.lat, lng: sortedRoute.destination.lng },
        ];
        
        // 간단한 거리 계산 (대체 방법)
        const calculateDistance = (lat1, lng1, lat2, lng2) => {
          const R = 6371; // 지구 반지름 (km)
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLng = (lng2 - lng1) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        
        let totalDistance = 0;
        for (let i = 0; i < allPoints.length - 1; i++) {
          totalDistance += calculateDistance(
            allPoints[i].lat,
            allPoints[i].lng,
            allPoints[i + 1].lat,
            allPoints[i + 1].lng
          );
        }
        
        let taxiFare = 4800;
        if (totalDistance > 2) {
          const additionalDistance = totalDistance - 2;
          const additionalFare = Math.ceil(additionalDistance * 10) * 200;
          taxiFare += additionalFare;
        }
        
        const estimatedDuration = (totalDistance / 30) * 60;
        
        if (isMounted) {
          setCalculatedRoute({
            distance: totalDistance,
            duration: estimatedDuration,
            waypoints: sortedRoute.waypoints,
          });
          
          setCalculatedTaxiFare(taxiFare);
        }
      } finally {
        if (isMounted) {
          setIsCalculatingRoute(false);
        }
      }
    };
    
    calculateRoute();
    
    return () => {
      isMounted = false;
    };
  }, [allOrdersAssigned, sortedRoute]);

  // TODO: 실제 계산된 거리 데이터 (계산된 경로가 있으면 사용)
  const myLocationData = calculatedRoute
    ? {
        departure: departureInfo.name,
        distance: calculatedRoute.distance,
      }
    : {
        departure: departureInfo.name,
        distance: 5.3, // km (기본값)
      };

  const handleEdit = () => {
    // 출발지/도착지 편집 페이지로 이동
    navigate("/taxi/settlement/room/location-edit", {
      state: {
        taxiInfo: {
          departure: myLocationData.departure,
          arrival: "도착지", // TODO: 실제 도착지 데이터 가져오기
          totalAmount: 15000, // TODO: 실제 총 금액 가져오기
        },
      },
    });
  };

  const handleMapClick = (lat, lng) => {
    // 지도 클릭으로 위치 선택
    setSelectedLocation({ lat, lng });
    setIsDestination(false);
  };

  const handleSelectDestination = () => {
    // 도착지 선택
    setIsDestination(true);
    setSelectedLocation({ lat: arrivalInfo.lat, lng: arrivalInfo.lng });
    // 지도 중심을 도착지로 이동 (NaverMap의 centerLat/centerLng props는 업데이트되지만, 
    // 지도 객체의 중심을 직접 이동시키는 것이 더 부드럽습니다)
    // NaverMap 컴포넌트가 selectedMarker 변경 시 자동으로 fitBounds를 호출하므로
    // 별도로 지도 중심 이동은 필요 없을 수 있지만, 명시적으로 처리하기 위해
    // centerLat/centerLng를 업데이트하는 대신 지도 객체를 직접 조작할 수도 있습니다.
  };

  const handleSelectTeamMemberLocation = (memberName) => {
    // 팀원이 선택한 위치를 내 위치로 선택
    const member = teamMemberLocations.find((m) => m.name === memberName);
    if (member) {
      setSelectedLocation({ lat: member.lat, lng: member.lng });
    }
  };

  const handleCompleteLocationSelection = () => {
    if (!selectedLocation) {
      alert("하차 위치를 선택해주세요.");
      return;
    }
    // TODO: 선택한 위치를 Firebase에 저장
    setHasHostSelectedLocation(true);
    // 위치 선택 완료 후 현재 페이지에 그대로 머물러서 정산 확정 화면으로 전환
  };

  const handleReselect = () => {
    // 위치 재선택 - 선택 상태 초기화
    setSelectedLocation(null);
    setIsDestination(false);
    setHasHostSelectedLocation(false);
  };

  const handleViewDistanceDetails = () => {
    setShowDistanceDetails(!showDistanceDetails);
  };

  const handleOrderChange = (groupId, order) => {
    // 빈 값이면 선택 해제
    if (!order || isNaN(order)) {
      setParticipantOrders((prev) => {
        const newOrders = { ...prev };
        delete newOrders[groupId];
        return newOrders;
      });
      return;
    }

    // 같은 순서가 이미 다른 그룹에게 할당되어 있는지 확인
    const existingGroup = Object.keys(participantOrders).find(
      (id) => id !== groupId && participantOrders[id] === order
    );

    if (existingGroup) {
      // 기존 그룹의 순서를 제거하고 새 그룹에 할당
      setParticipantOrders((prev) => {
        const newOrders = { ...prev };
        delete newOrders[existingGroup];
        newOrders[groupId] = order;
        return newOrders;
      });
    } else {
      setParticipantOrders((prev) => ({
        ...prev,
        [groupId]: order,
      }));
    }
  };

  const handleConfirmSettlement = async () => {
    if (!allParticipantsCompleted) {
      alert("모든 참여자가 완료할 때까지 기다려주세요.");
      return;
    }
    if (!allOrdersAssigned) {
      alert("모든 참여자의 하차 순서를 선택해주세요.");
      return;
    }
    if (!calculatedTaxiFare) {
      alert("택시 요금 계산이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!roomId) {
      alert("정산 방 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      // Firebase Realtime Database에 택시 정산 확정 정보 저장
      const roomRef = ref(database, `settlements/${roomId}`);
      const waypoints = sortedRoute
        ?.filter((point) => point.id !== "destination")
        .map((point, index) => ({
          name: point.name,
          lat: point.lat,
          lng: point.lng,
          order: index + 1,
        })) || [];

      // breakdown 계산 (참여자별 요금 분배)
      const breakdown = {};
      if (calculatedTaxiFare && locationGroups.length > 0) {
        // 간단한 분배: 각 그룹의 거리 비율에 따라 분배
        // TODO: 실제 거리 기반 분배로 개선 필요
        const farePerGroup = Math.floor(calculatedTaxiFare / locationGroups.length);
        locationGroups.forEach((group) => {
          const farePerPerson = Math.floor(farePerGroup / group.participants.length);
          group.participants.forEach((p) => {
            breakdown[p.name] = {
              amount: farePerPerson,
              distance: calculatedRoute?.distance || 0,
            };
          });
        });
      }

      await update(roomRef, {
        status: "completed",
        completedAt: Date.now(),
        "taxiInfo/participantOrders": participantOrders,
        "taxiInfo/calculatedTaxiFare": {
          total: calculatedTaxiFare,
          breakdown: breakdown,
        },
        "taxiInfo/calculatedRoute": calculatedRoute
          ? {
              distance: calculatedRoute.distance,
              duration: calculatedRoute.duration,
              taxiFare: calculatedTaxiFare,
              waypoints: waypoints,
            }
          : null,
      });

      // 정산 방 데이터 가져오기
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();

      if (roomData) {
        // 모든 참여자의 Firestore에 정산 내역 저장
        const participants = Object.values(roomData.participants || {});
        const totalAmount = roomData.taxiInfo?.totalAmount || calculatedTaxiFare;

        for (const participant of participants) {
          if (participant.uid) {
            // 로그인한 사용자만 Firestore에 저장
            try {
              const userSettlementRef = doc(firestore, `users/${participant.uid}/settlements/${roomId}`);
              const participantAmount = breakdown[participant.nickname]?.amount || 0;

              await setDoc(userSettlementRef, {
                roomId: roomId,
                type: "taxi",
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

      console.log("택시 정산 확정 정보가 저장되었습니다.");
      navigate("/taxi/settlement/room/complete", {
        state: {
          roomId,
          participantOrders,
          taxiFare: calculatedTaxiFare,
          route: calculatedRoute,
          sortedRoute,
        },
      });
    } catch (error) {
      console.error("정산 확정 저장 실패:", error);
      alert("정산 확정 저장에 실패했습니다. 다시 시도해주세요.");
    }
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
          {hasHostSelectedLocation && (
            <>
              <button
                onClick={handleEdit}
                className="absolute bg-[#f2f2f2] flex gap-1.5 h-10 items-center justify-center left-[260px] px-4 py-3 rounded-lg text-[#666666] top-[53px] hover:bg-[#e6e6e6] transition-colors"
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
            </>
          )}
        </div>

        {/* Content Card */}
        <div className="bg-white flex flex-col gap-5 h-[452px] items-center overflow-clip p-5 relative rounded-3xl shrink-0 w-full max-w-[350px]">
          {hasHostSelectedLocation ? (
            <h2 className="font-bold text-lg text-[#1a1a1a]">선택한 하차 위치</h2>
          ) : (
            <>
              <h2 className="font-bold text-lg text-[#1a1a1a]">내 하차 위치 선택</h2>
              <div className="font-normal text-sm text-[#666666] text-center whitespace-nowrap">
                <p className="mb-0">팀원들이 찍은 위치 중 선택하거나</p>
                <p>직접 지도에 핀을 찍어주세요</p>
              </div>
            </>
          )}

          {/* Map Box */}
          <div className="h-[280px] w-full max-w-[310px] rounded-2xl overflow-hidden">
            <NaverMap
              width="100%"
              height={280}
              centerLat={selectedLocation && isDestination ? arrivalInfo.lat : (departureInfo.lat + arrivalInfo.lat) / 2}
              centerLng={selectedLocation && isDestination ? arrivalInfo.lng : (departureInfo.lng + arrivalInfo.lng) / 2}
              level={selectedLocation && isDestination ? 3 : 5}
              clickable={!hasHostSelectedLocation}
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
              draggable={!hasHostSelectedLocation}
            />
          </div>

          {hasHostSelectedLocation ? (
            <div className="font-normal text-sm text-[#666666] text-center">
              <p className="mb-0">
                {isDestination ? "도착지에 하차하셨습니다." : "하차 위치를 선택하셨습니다."}
              </p>
              <p className="mt-1">
                {allParticipantsCompleted 
                  ? "모든 참여자가 완료되었습니다. 하차 순서를 선택해주세요."
                  : "다른 참여자들이 하차 위치를 선택할 때까지 기다려주세요."}
              </p>
            </div>
          ) : (
            <>
              <p className="font-normal text-sm text-[#666666]">
                선택한 위치는 팀원들에게 실시간으로 표시돼요
              </p>
              
              {/* 도착지 선택 버튼 - 하차 위치 선택 전에만 표시 */}
              <button
                onClick={handleSelectDestination}
                className={`w-full max-w-[310px] h-10 px-4 py-2 rounded-lg border-2 transition-colors flex items-center justify-center ${
                  isDestination
                    ? "bg-[#3366cc] border-[#3366cc] text-white"
                    : "bg-[#f2f6fe] border-[#3366cc] text-[#3366cc] hover:bg-[#e6ebff]"
                }`}
              >
                <span className="font-semibold text-sm text-center">도착지에 내렸어요</span>
              </button>
            </>
          )}
        </div>

        {/* Button Container */}
        <div className="bg-[#f8f8f8] flex flex-col h-[51px] items-center justify-center overflow-clip px-0 py-5 shrink-0 w-full max-w-[350px]">
          {!hasHostSelectedLocation ? (
            <button
              onClick={handleCompleteLocationSelection}
              className="bg-[#3366cc] flex h-[52px] items-center justify-center overflow-clip relative rounded-[14px] shrink-0 w-full hover:bg-[#2555e6] transition-colors"
            >
              <span className="font-bold text-base text-white">하차 위치 선택 완료</span>
            </button>
          ) : (
            <button
              onClick={handleConfirmSettlement}
              disabled={!allParticipantsCompleted || !allOrdersAssigned}
              className={`flex gap-2 h-12 items-center justify-center px-4 py-3 rounded-xl shrink-0 w-full max-w-[310px] transition-colors ${
                allParticipantsCompleted && allOrdersAssigned
                  ? "bg-[#3366cc] hover:bg-[#2555e6]"
                  : "bg-[#e6e6e6] cursor-not-allowed"
              }`}
            >
              <span className={`font-semibold text-base ${allParticipantsCompleted && allOrdersAssigned ? "text-white" : "text-gray-400"}`}>
                정산 확정하기
              </span>
            </button>
          )}
        </div>

        {/* 하차 순서 선택 섹션 - 모든 참여자 완료 후에만 표시 */}
        {hasHostSelectedLocation && allParticipantsCompleted && (
          <div className="bg-white flex flex-col gap-4 items-start overflow-clip p-5 rounded-[10px] shrink-0 w-full max-w-[350px] mb-20">
            <h3 className="font-bold text-lg text-[#1a1a1a]">하차 순서 선택</h3>
            <p className="font-medium text-sm text-gray-500">
              같은 위치에 내린 사람들은 그룹으로 묶여 같은 순서를 선택합니다
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              {locationGroups.map((group) => {
                const isDestinationGroup = group.isDestination;
                const lastOrder = locationGroups.length;
                
                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between w-full"
                  >
                    <span className="font-semibold text-base text-[#1a1a1a]">
                      {group.displayName}
                      {isDestinationGroup && (
                        <span className="font-medium text-sm text-[#3366cc] ml-2">(도착지)</span>
                      )}
                    </span>
                    {isDestinationGroup ? (
                      <div className="bg-[#f2f6fe] border border-[#3366cc] rounded-lg px-3 py-2 font-medium text-sm text-[#3366cc]">
                        {lastOrder}번째 (자동)
                      </div>
                    ) : (
                      <select
                        value={participantOrders[group.id] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            handleOrderChange(group.id, null);
                          } else {
                            handleOrderChange(group.id, parseInt(value, 10));
                          }
                        }}
                        className="bg-white border border-[#e0e0e0] rounded-lg px-3 py-2 font-medium text-sm text-[#1a1a1a] focus:outline-none focus:border-[#3366cc] cursor-pointer"
                      >
                        <option value="">선택</option>
                        {availableOrders.map((order) => {
                          const isSelectedByOtherGroup = 
                            participantOrders[group.id] !== order &&
                            Object.values(participantOrders).includes(order);
                          return (
                            <option
                              key={order}
                              value={order}
                              disabled={isSelectedByOtherGroup}
                            >
                              {order}번째
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {!allOrdersAssigned && (
              <p className="font-medium text-xs text-red-500 w-full text-center">
                모든 그룹의 하차 순서를 선택해주세요
              </p>
            )}
            
            {/* 경로 계산 중 표시 */}
            {allOrdersAssigned && isCalculatingRoute && (
              <p className="font-medium text-xs text-blue-500 w-full text-center">
                경로 및 택시 요금 계산 중...
              </p>
            )}
            
            {/* 계산된 택시 요금 표시 */}
            {allOrdersAssigned && calculatedTaxiFare && !isCalculatingRoute && (
              <div className="bg-[#f2f6fe] border border-[#3366cc] rounded-xl p-4 w-full">
                <p className="font-bold text-base text-[#3366cc] mb-2">
                  계산된 택시 요금
                </p>
                <p className="font-semibold text-lg text-[#1a1a1a]">
                  {calculatedTaxiFare.toLocaleString()}원
                </p>
                {calculatedRoute && (
                  <p className="font-medium text-xs text-gray-500 mt-1">
                    총 거리: {calculatedRoute.distance.toFixed(1)}km
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom Section - 위치 선택 완료 후에만 표시, 항상 하단 고정 */}
        {hasHostSelectedLocation && (
          <div
            className={`bg-white flex flex-col gap-4 items-start overflow-clip p-5 fixed bottom-0 left-0 right-0 rounded-t-[10px] shrink-0 w-full max-w-[350px] mx-auto z-10 ${
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
        )}
      </div>
    </MobileLayout>
  );
}

