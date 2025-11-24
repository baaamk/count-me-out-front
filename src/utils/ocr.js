/**
 * 네이버 클로바 OCR API 유틸리티
 */

/**
 * Firebase Functions를 통해 네이버 클로바 OCR API 호출
 * 보안을 위해 프론트엔드에서는 직접 OCR API를 호출하지 않고,
 * Firebase Functions를 통해 호출합니다.
 * @param {File} imageFile - 이미지 파일
 * @returns {Promise<Object>} OCR 인식 결과
 */
export const recognizeTextFromImage = async (imageFile) => {
  try {
    // 이미지를 base64로 변환
    const base64Image = await fileToBase64(imageFile);
    
    // Firebase Functions URL 가져오기
    const functionsUrl = import.meta.env.VITE_FIREBASE_FUNCTIONS_URL;
    
    if (!functionsUrl) {
      throw new Error("Firebase Functions URL이 설정되지 않았습니다. .env 파일을 확인하세요.");
    }
    
    // Firebase Functions HTTP 호출
    const response = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        imageType: imageFile.type,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Firebase Functions에서 반환하는 형식에 맞게 처리
    if (data.success) {
      return {
        success: true,
        text: data.text || "", // 인식된 전체 텍스트
        fields: data.fields || [], // 구조화된 필드들
      };
    } else {
      return {
        success: false,
        error: data.error || "OCR 인식 실패",
      };
    }
  } catch (error) {
    console.error("OCR 인식 실패:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * File을 Base64 문자열로 변환
 * @param {File} file - 변환할 파일
 * @returns {Promise<string>} Base64 문자열
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // data:image/jpeg;base64, 부분 제거하고 순수 base64만 반환
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 영수증 OCR 결과를 파싱하여 메뉴 항목 추출
 * 
 * @param {string} ocrText - OCR로 인식된 전체 텍스트 (줄바꿈 포함 가능)
 * @param {Array} fields - OCR fields 배열 (선택사항, 위치 정보 포함)
 * @returns {Array<{name: string, price: number}>} 메뉴 항목 배열
 * 
 * 추출 규칙:
 * 1. "메뉴명 가격원" 형식: 같은 줄에 메뉴명과 가격이 있는 경우
 *    예: "삼겹살 10,000원" → { name: "삼겹살", price: 10000 }
 * 
 * 2. "메뉴명\n가격원" 형식: 다른 줄에 있는 경우
 *    예: "삼겹살\n10,000원" → { name: "삼겹살", price: 10000 }
 * 
 * 3. 가격 형식: "10,000원", "10000원", "10,000" 등 지원
 * 
 * 4. 필터링: 가격이 0원이거나 1천만원 이상인 항목은 제외
 * 
 * 예시 입력: "삼겹살 10,000원\n김치찌개 8,000원\n공기밥 1,000원"
 * 예시 출력: [
 *   { name: "삼겹살", price: 10000 },
 *   { name: "김치찌개", price: 8000 },
 *   { name: "공기밥", price: 1000 }
 * ]
 */
export const parseReceiptMenuItems = (ocrText, fields = []) => {
  if (!ocrText || typeof ocrText !== "string") {
    return [];
  }
  
  const menuItems = [];
  
  // 제외할 키워드 (요약 항목)
  const excludeKeywords = [
    "주문금액", "배달비", "할인금액", "카드결제", "총결제금액", 
    "총 금액", "합계", "소계", "부가세", "VAT", "TOTAL", "SUM"
  ];
  
  // 줄바꿈으로 분리하여 각 줄 처리
  const lines = ocrText.split(/\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  console.log("파싱할 줄 수:", lines.length);
  console.log("첫 10줄:", lines.slice(0, 10));
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 요약 항목 제외
    if (excludeKeywords.some(keyword => line.includes(keyword))) {
      continue;
    }
    
    // 패턴 1: "메뉴명 수량 가격" 형식 (표 형식) - 먼저 확인
    // 예: "오품냉채 1 60,000", "전가복 (스페셜) 1 90,000"
    // 또는 "1 60,000" (메뉴명 없이 수량과 가격만)
    const tablePattern = /^(.+?)\s+([0-9]+)\s+([0-9,]+)\s*원?$/;
    const tableMatch = line.match(tablePattern);
    
    if (tableMatch) {
      const namePart = tableMatch[1].trim();
      const quantity = parseInt(tableMatch[2], 10);
      const priceStr = tableMatch[3].replace(/,/g, "");
      const price = parseInt(priceStr, 10);
      
      // 숫자만 있는 경우 (메뉴명 없이 수량과 가격만 있는 경우)
      if (/^[0-9,]+$/.test(namePart)) {
        // 메뉴명은 빈 값, 수량과 가격만 추출
        if (!isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 0 && price < 10000000) {
          console.log("표 형식 매칭 (메뉴명 없음): 수량", quantity, "가격", price);
          menuItems.push({ name: "", price, quantity });
          continue;
        }
      } else if (namePart.length > 1) {
        // 메뉴명이 있는 경우
        if (!isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 0 && price < 10000000) {
          console.log("표 형식 매칭:", namePart, "수량", quantity, "가격", price);
          menuItems.push({ name: namePart, price, quantity });
          continue;
        }
      }
    }
    
    // 패턴 1-2: "수량 가격" 형식 (메뉴명 없이)
    const quantityPricePattern = /^([0-9]+)\s+([0-9,]+)\s*원?$/;
    const quantityPriceMatch = line.match(quantityPricePattern);
    
    if (quantityPriceMatch) {
      const quantity = parseInt(quantityPriceMatch[1], 10);
      const priceStr = quantityPriceMatch[2].replace(/,/g, "");
      const price = parseInt(priceStr, 10);
      
      if (!isNaN(quantity) && quantity > 0 && !isNaN(price) && price > 0 && price < 10000000) {
        console.log("수량+가격 패턴 매칭: 수량", quantity, "가격", price);
        menuItems.push({ name: "", price, quantity });
        continue;
      }
    }
    
    // 패턴 2: "메뉴명 가격원" (같은 줄에 메뉴명과 가격)
    // 예: "삼겹살 10,000원", "오품냉채 60,000원", "전가복 (스페셜) 90,000원"
    const sameLinePattern = /^(.+?)\s+([0-9,]+)\s*원?$/;
    const sameLineMatch = line.match(sameLinePattern);
    
    if (sameLineMatch) {
      const name = sameLineMatch[1].trim();
      const priceStr = sameLineMatch[2].replace(/,/g, "");
      const price = parseInt(priceStr, 10);
      
      // 숫자만 있는 경우 제외 (수량이나 기타 숫자)
      if (/^[0-9,]+$/.test(name)) {
        continue;
      }
      
      // 가격 검증: 0원 초과, 1천만원 미만
      if (name && name.length > 1 && !isNaN(price) && price > 0 && price < 10000000) {
        console.log("같은 줄 패턴 매칭:", name, price);
        menuItems.push({ name, price, quantity: 1 });
        continue;
      }
    }
    
    // 패턴 3: "가격원"만 있는 경우 (이전 줄이 메뉴명일 수 있음)
    const priceOnlyPattern = /^([0-9,]+)\s*원?$/;
    const priceOnlyMatch = line.match(priceOnlyPattern);
    
    if (priceOnlyMatch && menuItems.length > 0) {
      const lastItem = menuItems[menuItems.length - 1];
      // 이전 항목에 가격이 없거나 0원인 경우 가격 추가
      if (!lastItem.price || lastItem.price === 0) {
        const priceStr = priceOnlyMatch[1].replace(/,/g, "");
        const price = parseInt(priceStr, 10);
        if (!isNaN(price) && price > 0 && price < 10000000) {
          lastItem.price = price;
          continue;
        }
      }
    }
    
    // 패턴 4: "메뉴명"만 있는 경우 (다음 줄에 가격이 있을 수 있음)
    // 숫자로만 이루어진 줄은 제외
    const isPriceOnly = /^[0-9,]+$/.test(line);
    if (!isPriceOnly && line.length > 1 && line.length < 50) {
      // 다음 줄이 가격인지 확인
      const nextLine = i < lines.length - 1 ? lines[i + 1] : null;
      const nextIsPrice = nextLine && /^([0-9,]+)\s*원?$/.test(nextLine);
      
      if (nextIsPrice) {
        // 다음 줄이 가격이면 메뉴명으로 저장 (가격은 다음 반복에서 추가됨)
        const priceStr = nextLine.match(/^([0-9,]+)\s*원?$/)[1].replace(/,/g, "");
        const price = parseInt(priceStr, 10);
        if (!isNaN(price) && price > 0 && price < 10000000) {
          menuItems.push({ name: line.trim(), price, quantity: 1 });
          i++; // 다음 줄은 가격이므로 건너뛰기
          continue;
        }
      } else {
        // 다음 줄이 가격이 아니면 메뉴명만 있는 것으로 간주 (가격은 사용자가 입력)
        // 한글이나 영문이 포함된 경우만 메뉴명으로 인식
        if (/[가-힣a-zA-Z]/.test(line)) {
          console.log("메뉴명만 매칭:", line.trim());
          menuItems.push({ name: line.trim(), price: 0, quantity: 1 });
          continue;
        }
      }
    }
  }
  
  console.log("파싱된 메뉴 항목:", menuItems);
  
  // 가격이 0인 항목 제거 (파싱 실패한 항목)
  // 메뉴명이 비어있어도 가격이 있으면 유효한 항목으로 간주
  const filteredItems = menuItems.filter(item => item.price > 0);
  console.log("필터링된 메뉴 항목:", filteredItems);
  return filteredItems;
};

/**
 * 택시 영수증 OCR 결과를 파싱하여 정보 추출
 * 
 * @param {string} ocrText - OCR로 인식된 전체 텍스트
 * @returns {{departure: string, arrival: string, totalAmount: number}} 택시 정보 객체
 * 
 * 파싱 규칙:
 * - 출발지: "출발지:", "출발:", "FROM:" 등의 패턴 뒤의 텍스트
 * - 도착지: "도착지:", "도착:", "TO:" 등의 패턴 뒤의 텍스트
 * - 총 금액: "총", "합계", "요금" 등의 키워드 뒤의 숫자
 * 
 * 예시 입력: "출발지: 강남역\n도착지: 홍대입구\n총 요금: 15,000원"
 * 예시 출력: {
 *   departure: "강남역",
 *   arrival: "홍대입구",
 *   totalAmount: 15000
 * }
 */
export const parseTaxiReceipt = (ocrText) => {
  if (!ocrText || typeof ocrText !== "string") {
    return {
      departure: "",
      arrival: "",
      totalAmount: 0,
    };
  }
  
  const result = {
    departure: "",
    arrival: "",
    totalAmount: 0,
  };
  
  // 출발지 패턴: "출발지:", "출발:", "FROM:" 등
  // 카카오택시 형식: "출발 밝은약국" (콜론 없이)
  const departurePatterns = [
    /출발[지:\s]*[:：]?\s*([가-힣\w\s]+?)(?:\n|$|도착|운행|요금|결제)/i, // 줄바꿈이나 다음 키워드 전까지
    /출발\s+([가-힣\w\s]+?)(?:\n|$|도착|운행|요금|결제)/i, // "출발 밝은약국" 형식
    /FROM[:\s]*[:：]?\s*([가-힣\w\s]+)/i,
    /^([가-힣\w\s]+)\s*→/i, // "강남역 →" 형식
  ];
  
  // 도착지 패턴: "도착지:", "도착:", "TO:" 등
  // 카카오택시 형식: "도착 서울 영등포구 여의도동 7-5" (콜론 없이, 주소가 길 수 있음)
  const arrivalPatterns = [
    /도착[지:\s]*[:：]?\s*([가-힣\w\s\d\-]+?)(?:\n|$|운행|요금|결제|시간|호출)/i, // 줄바꿈이나 다음 키워드 전까지
    /도착\s+([가-힣\w\s\d\-]+?)(?:\n|$|운행|요금|결제|시간|호출)/i, // "도착 서울 영등포구..." 형식
    /TO[:\s]*[:：]?\s*([가-힣\w\s]+)/i,
    /→\s*([가-힣\w\s]+)/i, // "→ 홍대입구" 형식
  ];
  
  // 총 금액 패턴: "총", "합계", "요금", "운행 요금", "결제 금액" 등
  // 카카오택시 형식: "운행 요금 21,600원" 또는 "결제 금액 21,600원"
  const totalPatterns = [
    /(?:운행\s*요금|결제\s*금액)[\s:]*[:：]?\s*([0-9,]+)\s*원?/i, // "운행 요금 21,600원"
    /(?:총|합계|요금|금액)[\s:]*[:：]?\s*([0-9,]+)\s*원?/i, // 일반 형식
    /(?:TOTAL|AMOUNT|FARE)[\s:]*[:：]?\s*([0-9,]+)/i,
  ];
  
  // 출발지 찾기
  for (const pattern of departurePatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      result.departure = match[1].trim();
      break;
    }
  }
  
  // 도착지 찾기
  for (const pattern of arrivalPatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      result.arrival = match[1].trim();
      break;
    }
  }
  
  // 총 금액 찾기
  for (const pattern of totalPatterns) {
    const match = ocrText.match(pattern);
    if (match && match[1]) {
      const amount = parseInt(match[1].replace(/,/g, ""), 10);
      if (amount > 0 && amount < 1000000) { // 가격 범위 검증 (0원 ~ 100만원)
        result.totalAmount = amount;
        break;
      }
    }
  }
  
  return result;
};

