import { useEffect, useRef, useState, useCallback } from "react";

/**
 * 네이버 지도 컴포넌트
 * @param {Object} props
 * @param {number} props.width - 지도 너비 (기본값: 100%)
 * @param {number} props.height - 지도 높이 (기본값: 400px)
 * @param {number} props.centerLat - 중심 위도 (기본값: 37.5665)
 * @param {number} props.centerLng - 중심 경도 (기본값: 126.9780)
 * @param {number} props.level - 지도 확대 레벨 (기본값: 10)
 * @param {boolean} props.clickable - 클릭 가능 여부 (기본값: true)
 * @param {Function} props.onClick - 지도 클릭 시 호출되는 함수 (lat, lng)
 * @param {Array} props.markers - 마커 배열 [{lat, lng, name, color?}]
 * @param {Object} props.selectedMarker - 선택된 마커 {lat, lng, name?}
 * @param {boolean} props.draggable - 지도 드래그 가능 여부 (기본값: true)
 * @param {Function} props.onMarkerNameClick - 마커 이름 클릭 시 호출되는 함수 (markerName)
 */
export default function NaverMap({
  width = "100%",
  height = 400,
  centerLat = 37.5665,
  centerLng = 126.9780,
  level = 10,
  clickable = true,
  onClick,
  markers = [],
  selectedMarker = null,
  draggable = true,
  onMarkerNameClick,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [naverMaps, setNaverMaps] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const markerRefs = useRef([]);
  const infoWindowRefs = useRef([]);
  const markerEventListeners = useRef([]); // 마커 이벤트 리스너 참조 저장
  const mapClickListenerRef = useRef(null); // 지도 클릭 이벤트 리스너 참조 저장
  const selectedMarkerRef = useRef(null);
  const [groupedMarkerName, setGroupedMarkerName] = useState(null);
  const [groupedMarkers, setGroupedMarkers] = useState([]);
  const handleMarkerNameClickRef = useRef(null);
  const onMarkerNameClickRef = useRef(onMarkerNameClick);

  // onMarkerNameClick ref 업데이트
  useEffect(() => {
    onMarkerNameClickRef.current = onMarkerNameClick;
  }, [onMarkerNameClick]);

  // 마커 이름 클릭 핸들러
  useEffect(() => {
    handleMarkerNameClickRef.current = (markerName) => {
      console.log("=== 마커 이름 클릭 핸들러 실행 ===");
      console.log("마커 이름:", markerName);
      
      if (!map || !naverMaps || markers.length === 0) {
        return;
      }
      
      const clickedMarker = markers.find((m) => m.name === markerName);
      if (!clickedMarker) {
        console.error("클릭한 마커를 찾을 수 없습니다:", markerName);
        return;
      }
      
      console.log("클릭한 마커 좌표:", clickedMarker.lat, clickedMarker.lng);
      
      if (onClick) {
        onClick(clickedMarker.lat, clickedMarker.lng);
      }
      
      const threshold = 0.0001;
      const sameLocationMarkers = markers.filter((marker) => {
        const latDiff = Math.abs(marker.lat - clickedMarker.lat);
        const lngDiff = Math.abs(marker.lng - clickedMarker.lng);
        return latDiff < threshold && lngDiff < threshold;
      });
      
      setGroupedMarkerName((prev) => {
        if (prev === clickedMarker.name || (prev && sameLocationMarkers.some(m => m.name === prev))) {
          console.log("그룹화 해제");
          setGroupedMarkers([]);
          return null;
        } else {
          console.log("그룹화 시작:", sameLocationMarkers.map(m => m.name).join(", "));
          setGroupedMarkers(sameLocationMarkers);
          
          const position = new naverMaps.LatLng(clickedMarker.lat, clickedMarker.lng);
          map.setCenter(position);
          map.setZoom(15);
          
          return clickedMarker.name;
        }
      });
      
      if (onMarkerNameClickRef.current) {
        onMarkerNameClickRef.current(markerName);
      }
    };
  }, [map, naverMaps, markers, selectedMarker, onClick]);

  // 네이버 지도 SDK 동적 로드
  useEffect(() => {
    // 인증 실패 시 호출되는 전역 함수 설정
    // 참고: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
    window.navermap_authFailure = function () {
      console.warn("네이버 지도 API 인증 실패: 클라이언트 ID와 웹 서비스 URL을 확인하세요.");
      console.warn("현재 URL:", window.location.origin);
      // 인증 실패해도 지도는 작동할 수 있으므로 에러를 표시하지 않음
    };
    
    const loadNaverMaps = () => {
      // 이미 로드되어 있으면 바로 사용
      if (window.naver && window.naver.maps) {
        const maps = window.naver.maps;
        console.log("네이버 지도 SDK 초기화 완료!");
        setNaverMaps(maps);
        setLoading(false);
        return;
      }

      // SDK 스크립트가 없으면 동적으로 로드
      const clientId = import.meta.env.VITE_NAVER_MAP_CLIENT_ID || "tln0esz2e2";
      console.log("네이버 지도 Client ID:", clientId);
      console.log("현재 페이지 URL:", window.location.origin);
      console.log("현재 전체 URL:", window.location.href);
      
      // 인증 오류를 무시하고 지도 사용을 계속 시도
      // 인증 오류 메시지가 나와도 지도는 작동할 수 있음
      
      if (!clientId) {
        setError("네이버 지도 API 키가 설정되지 않았습니다. .env 파일에 VITE_NAVER_MAP_CLIENT_ID를 설정하세요.");
        setLoading(false);
        return;
      }

      // 이미 스크립트가 로드 중이면 대기
      if (document.querySelector(`script[src*="naver.com/openapi"]`)) {
        const checkInterval = setInterval(() => {
          if (window.naver && window.naver.maps) {
            const maps = window.naver.maps;
            console.log("네이버 지도 SDK 초기화 완료!");
            setNaverMaps(maps);
            setLoading(false);
            clearInterval(checkInterval);
          }
        }, 100);
        return;
      }

      // 스크립트 동적 로드 (신규 Maps API v3 사용)
      // 참고: https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html
      // 중요: 신규 Maps API v3는 ncpClientId 대신 ncpKeyId를 사용합니다!
      const script = document.createElement("script");
      script.type = "text/javascript";
      // 신규 Maps API v3 엔드포인트 (ncpKeyId 사용)
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
      script.async = true;
      script.defer = true;
      console.log("네이버 지도 SDK 로드 URL:", script.src);
      console.log("웹 서비스 URL 확인:", "콘솔에서 다음 URL이 등록되어 있는지 확인하세요:", window.location.origin);
      script.onload = () => {
        // 인증 오류가 있어도 지도 객체는 생성될 수 있으므로 재시도 로직 강화
        let retryCount = 0;
        const maxRetries = 30; // 최대 6초 대기 (200ms * 30)
        
        const checkMaps = () => {
          if (window.naver && window.naver.maps) {
            const maps = window.naver.maps;
            console.log("네이버 지도 SDK 초기화 완료!");
            console.log("현재 URL:", window.location.href);
            console.log("window.naver.maps 객체:", maps);
            
            // 인증 오류가 있어도 지도는 사용 가능할 수 있으므로 계속 진행
            setNaverMaps(maps);
            setLoading(false);
            return true;
          } else if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(checkMaps, 200);
            return false;
          } else {
            console.warn("window.naver.maps를 찾을 수 없습니다 (최대 재시도 횟수 초과)");
            console.warn("인증 오류가 있을 수 있지만 지도 사용을 계속 시도합니다.");
            // 인증 오류가 있어도 지도가 보일 수 있으므로 에러를 표시하지 않고 null로 설정
            // 지도 초기화는 나중에 다시 시도될 수 있음
            setNaverMaps(null);
            setLoading(false);
            return false;
          }
        };
        
        // 초기 지연 후 확인 시작
        setTimeout(checkMaps, 300);
      };
      script.onerror = (error) => {
        console.error("네이버 지도 SDK 로드 오류:", error);
        setError(`네이버 지도 SDK 로드 중 오류가 발생했습니다. 클라이언트 ID와 웹 서비스 URL을 확인하세요. 현재 URL: ${window.location.href}`);
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    loadNaverMaps();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!naverMaps || !mapRef.current) return;

    if (!naverMaps.Map || !naverMaps.LatLng) {
      console.error("네이버 지도 SDK가 제대로 로드되지 않았습니다", naverMaps);
      setError("네이버 지도 SDK 초기화 실패");
      return;
    }

    const mapOptions = {
      center: new naverMaps.LatLng(centerLat, centerLng),
      zoom: level,
      draggable: draggable,
    };

    const naverMap = new naverMaps.Map(mapRef.current, mapOptions);
    setMap(naverMap);

    // 지도 클릭 이벤트
    if (clickable && onClick) {
      const mapClickListener = (e) => {
        const target = e.originalEvent?.target;
        if (target && target.hasAttribute && target.hasAttribute("data-marker-name")) {
          const markerName = target.getAttribute("data-marker-name");
          console.log("지도 클릭으로 마커 이름 감지:", markerName);
          if (handleMarkerNameClickRef.current) {
            handleMarkerNameClickRef.current(markerName);
          }
          return;
        }
        
        const latlng = e.coord;
        onClick(latlng.lat(), latlng.lng());
      };
      naverMaps.Event.addListener(naverMap, "click", mapClickListener);
      mapClickListenerRef.current = mapClickListener;
    }

    return () => {
      if (naverMap && naverMaps && naverMaps.Event && mapClickListenerRef.current) {
        try {
          // 지도가 유효한 상태인지 확인
          if (naverMap.getContainer && naverMap.getContainer()) {
            naverMaps.Event.removeListener(naverMap, "click", mapClickListenerRef.current);
          }
        } catch (e) {
          // 지도가 이미 제거되었거나 유효하지 않은 경우 무시 (오류 출력하지 않음)
        }
        mapClickListenerRef.current = null;
      }
    };
  }, [naverMaps, centerLat, centerLng, level, clickable, onClick, draggable]);

  // 마커 업데이트
  useEffect(() => {
    if (!map || !naverMaps) return;

    console.log("마커 업데이트 시작, groupedMarkerName:", groupedMarkerName);

    // 기존 마커 및 InfoWindow 제거
    markerRefs.current.forEach((marker, index) => {
      if (marker) {
        // 이벤트 리스너 제거 (마커가 유효한 상태에서만)
        const listener = markerEventListeners.current[index];
        if (listener && naverMaps && naverMaps.Event) {
          try {
            // 마커가 지도에 연결되어 있는지 확인 후 이벤트 리스너 제거
            if (marker.getMap && marker.getMap()) {
              naverMaps.Event.removeListener(marker, "click", listener);
            } else if (marker.setMap) {
              // 마커가 아직 지도에 연결되어 있지 않더라도 이벤트 리스너는 제거 시도
              // 네이버 지도 API는 마커가 제거된 후에도 이벤트 리스너를 제거할 수 있어야 하지만,
              // 안전을 위해 마커를 제거하기 전에 이벤트 리스너를 먼저 제거
              naverMaps.Event.removeListener(marker, "click", listener);
            }
          } catch (e) {
            // 마커가 이미 제거되었거나 유효하지 않은 경우 무시
            // 오류를 콘솔에 출력하지 않음 (너무 많은 경고 방지)
          }
        }
        // 마커를 지도에서 제거
        try {
          if (marker.setMap) {
            marker.setMap(null);
          }
        } catch (e) {
          // 마커가 이미 제거된 경우 무시
        }
      }
    });
    infoWindowRefs.current.forEach((infoWindow) => {
      if (infoWindow) {
        try {
          infoWindow.close();
        } catch (e) {
          console.warn("InfoWindow 닫기 실패:", e);
        }
      }
    });
    markerRefs.current = [];
    infoWindowRefs.current = [];
    markerEventListeners.current = [];

    // 그룹화된 마커들 찾기
    const groupedLocation = groupedMarkerName ? (() => {
      const groupedMarker = markers.find((m) => m.name === groupedMarkerName);
      if (!groupedMarker) return null;
      return { lat: groupedMarker.lat, lng: groupedMarker.lng };
    })() : null;
    
    const threshold = 0.0001;
    const groupedMarkersAtLocation = groupedLocation ? markers.filter((marker) => {
      const latDiff = Math.abs(marker.lat - groupedLocation.lat);
      const lngDiff = Math.abs(marker.lng - groupedLocation.lng);
      return latDiff < threshold && lngDiff < threshold;
    }) : [];
    
    const isSelectedAtGroupedLocation = groupedLocation && selectedMarker ? (() => {
      const latDiff = Math.abs(selectedMarker.lat - groupedLocation.lat);
      const lngDiff = Math.abs(selectedMarker.lng - groupedLocation.lng);
      return latDiff < threshold && lngDiff < threshold;
    })() : false;
    
    const allGroupedNames = groupedLocation ? [
      ...groupedMarkersAtLocation.map(m => m.name),
      ...(isSelectedAtGroupedLocation && selectedMarker ? [selectedMarker.name || "나"] : [])
    ] : [];
    
    // 새 마커 추가
    markers.forEach((markerData, index) => {
      const position = new naverMaps.LatLng(markerData.lat, markerData.lng);
      
      const isAtGroupedLocation = groupedLocation ? (() => {
        const latDiff = Math.abs(markerData.lat - groupedLocation.lat);
        const lngDiff = Math.abs(markerData.lng - groupedLocation.lng);
        return latDiff < threshold && lngDiff < threshold;
      })() : false;
      
      if (isAtGroupedLocation) {
        return;
      }
      
      // 마커 색상 설정 (네이버 지도 기본 마커 사용, CSS로 색상 지정)
      let markerIcon = null;
      if (markerData.color === "#00ff00") {
        // 출발지 (초록색) - 네이버 지도 기본 마커 스타일
        markerIcon = {
          content: '<div style="width:24px;height:35px;background-color:#00ff00;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative;"></div>',
          size: new naverMaps.Size(24, 35),
          anchor: new naverMaps.Point(12, 35),
        };
      } else if (markerData.color === "#ff0000") {
        // 도착지 (빨간색) - 네이버 지도 기본 마커 스타일
        markerIcon = {
          content: '<div style="width:24px;height:35px;background-color:#ff0000;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative;"></div>',
          size: new naverMaps.Size(24, 35),
          anchor: new naverMaps.Point(12, 35),
        };
      }
      
      const marker = new naverMaps.Marker({
        position: position,
        map: map,
        icon: markerIcon,
      });

      // InfoWindow (이름 표시)
      if (markerData.name) {
        const infoWindow = new naverMaps.InfoWindow({
          content: `
            <div style="
              background: white;
              border: 1px solid #e0e0e0;
              border-radius: 12px;
              padding: 4px 8px;
              font-size: 12px;
              font-weight: 500;
              color: ${markerData.color || "#3366cc"};
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              cursor: pointer;
              user-select: none;
            " data-marker-name="${markerData.name}">
              ${markerData.name}
            </div>
          `,
          pixelOffset: new naverMaps.Point(0, -10),
        });
        
        infoWindow.open(map, marker);
        
        // 마커 이름 클릭 이벤트
        const markerClickListener = (e) => {
          if (handleMarkerNameClickRef.current) {
            handleMarkerNameClickRef.current(markerData.name);
          }
        };
        naverMaps.Event.addListener(marker, "click", markerClickListener);
        markerEventListeners.current.push(markerClickListener);
        
        // InfoWindow 내용 클릭 이벤트
        const infoWindowContent = infoWindow.getContent();
        if (infoWindowContent && infoWindowContent.addEventListener) {
          infoWindowContent.addEventListener("click", (e) => {
            e.stopPropagation();
            if (handleMarkerNameClickRef.current) {
              handleMarkerNameClickRef.current(markerData.name);
            }
          });
        }
        
        infoWindowRefs.current.push(infoWindow);
      }

      markerRefs.current.push(marker);
    });
    
    // 그룹화된 위치에 통합 마커 추가
    if (groupedLocation && allGroupedNames.length > 0) {
      const groupedPosition = new naverMaps.LatLng(groupedLocation.lat, groupedLocation.lng);
      const groupedMarker = new naverMaps.Marker({
        position: groupedPosition,
        map: map,
        icon: {
          content: '<div style="width:24px;height:35px;background-color:#ffc107;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>',
          size: new naverMaps.Size(24, 35),
          anchor: new naverMaps.Point(12, 35),
        },
      });
      
      const groupedInfoWindow = new naverMaps.InfoWindow({
        content: `
          <div style="
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 12px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            color: #3366cc;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            user-select: none;
            max-width: 200px;
          " data-marker-name="${groupedMarkerName}">
            <div style="font-weight: 600; margin-bottom: 2px;">${allGroupedNames.join(", ")}</div>
            <div style="font-size: 10px; color: #666; font-weight: 400;">그룹</div>
          </div>
        `,
        pixelOffset: new naverMaps.Point(0, -10),
      });
      
      groupedInfoWindow.open(map, groupedMarker);
      
      const groupedMarkerClickListener = (e) => {
        if (handleMarkerNameClickRef.current) {
          handleMarkerNameClickRef.current(groupedMarkerName);
        }
      };
      naverMaps.Event.addListener(groupedMarker, "click", groupedMarkerClickListener);
      markerEventListeners.current.push(groupedMarkerClickListener);
      
      infoWindowRefs.current.push(groupedInfoWindow);
      markerRefs.current.push(groupedMarker);
    }

    // 모든 마커를 포함하도록 지도 범위 조정
    const allPositions = [];
    markers.forEach((marker) => {
      // 그룹화된 위치의 마커는 제외 (그룹 마커로 대체됨)
      const isAtGroupedLocation = groupedLocation ? (() => {
        const latDiff = Math.abs(marker.lat - groupedLocation.lat);
        const lngDiff = Math.abs(marker.lng - groupedLocation.lng);
        return latDiff < threshold && lngDiff < threshold;
      })() : false;
      
      if (!isAtGroupedLocation) {
        allPositions.push({ lat: marker.lat, lng: marker.lng });
      }
    });
    
    // 그룹화된 마커 위치 포함
    if (groupedLocation) {
      allPositions.push({ lat: groupedLocation.lat, lng: groupedLocation.lng });
    }
    
    // 선택된 마커 위치 포함 (그룹 위치가 아닌 경우만)
    if (selectedMarker && !isSelectedAtGroupedLocation) {
      allPositions.push({ lat: selectedMarker.lat, lng: selectedMarker.lng });
    }
    
    if (allPositions.length > 0) {
      const bounds = new naverMaps.LatLngBounds();
      allPositions.forEach((pos) => {
        bounds.extend(new naverMaps.LatLng(pos.lat, pos.lng));
      });
      
      // fitBounds로 지도 범위 조정 (패딩 추가)
      map.fitBounds(bounds, {
        padding: 50, // 픽셀 단위 패딩
        duration: 300, // 애니메이션 시간 (밀리초)
      });
    }
  }, [map, naverMaps, markers, groupedMarkerName, groupedMarkers, selectedMarker]);

  // 선택된 마커 업데이트
  useEffect(() => {
    if (!map || !naverMaps || !selectedMarker) return;

    const groupedLocation = groupedMarkerName ? (() => {
      const groupedMarker = markers.find((m) => m.name === groupedMarkerName);
      if (!groupedMarker) return null;
      return { lat: groupedMarker.lat, lng: groupedMarker.lng };
    })() : null;
    
    const threshold = 0.0001;
    const isSelectedAtGroupedLocation = groupedLocation ? (() => {
      const latDiff = Math.abs(selectedMarker.lat - groupedLocation.lat);
      const lngDiff = Math.abs(selectedMarker.lng - groupedLocation.lng);
      return latDiff < threshold && lngDiff < threshold;
    })() : false;
    
    if (isSelectedAtGroupedLocation) {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.setMap(null);
        selectedMarkerRef.current = null;
      }
      return;
    }

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
    }

    const position = new naverMaps.LatLng(selectedMarker.lat, selectedMarker.lng);
    const marker = new naverMaps.Marker({
      position: position,
      map: map,
      icon: {
        content: '<div style="width:24px;height:35px;background-color:#3366cc;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);position:relative;"></div>',
        size: new naverMaps.Size(24, 35),
        anchor: new naverMaps.Point(12, 35),
      },
    });

    if (selectedMarker.name) {
      // 마커 이름을 안전하게 이스케이프
      const markerName = selectedMarker.name
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
      
      const infoWindow = new naverMaps.InfoWindow({
        content: `
          <div style="
            background: white;
            border: 2px solid #3366cc;
            border-radius: 12px;
            padding: 4px 8px;
            font-size: 12px;
            font-weight: 500;
            color: #3366cc;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            user-select: none;
            text-align: center;
            line-height: 1.4;
          ">
            ${markerName}
          </div>
        `,
        pixelOffset: new naverMaps.Point(0, -10),
      });
      infoWindow.open(map, marker);
    }

    selectedMarkerRef.current = marker;
    map.setCenter(position);
  }, [map, naverMaps, selectedMarker, groupedMarkerName, markers]);

  if (error) {
    return (
      <div
        style={{
          width: width,
          height: height,
        }}
        className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center p-4">
          <p className="text-red-500 text-sm font-semibold mb-2">지도 로드 실패</p>
          <p className="text-gray-600 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          width: width,
          height: height,
        }}
        className="rounded-2xl overflow-hidden bg-gray-100 flex items-center justify-center"
      >
        <div className="text-center">
          <p className="text-gray-500 text-sm">지도 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: width,
        height: height,
      }}
      className="rounded-2xl overflow-hidden"
    />
  );
}

