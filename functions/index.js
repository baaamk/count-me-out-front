/**
 * Firebase Cloud Functions - OCR Recognition
 * 
 * 네이버 클로바 OCR API Gateway를 프록시하여 안전하게 호출합니다.
 * 
 * 배포 방법:
 * 1. 환경 변수 설정 (Firebase Functions v7 방식):
 *    firebase functions:secrets:set OCR_SECRET_KEY
 *    firebase functions:secrets:set OCR_API_GATEWAY_URL
 *    또는 Google Cloud Console에서 환경 변수 설정
 * 2. 배포: firebase deploy --only functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

// 네이버 클로바 OCR API 호출 함수 (2nd Gen)
exports.ocrRecognize = onRequest(async (req, res) => {
  // CORS 설정
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  try {
    const { image, imageType } = req.body;

    if (!image) {
      res.status(400).json({ success: false, error: "이미지가 제공되지 않았습니다." });
      return;
    }

    // Firebase Functions 환경 변수에서 API Gateway 설정 가져오기
    // Firebase Functions v7에서는 process.env 사용
    const secretKey = process.env.OCR_SECRET_KEY;
    const apiGatewayUrl = process.env.OCR_API_GATEWAY_URL;

    // 디버깅: 환경 변수 확인
    console.log("OCR_SECRET_KEY:", secretKey ? "설정됨" : "없음");
    console.log("OCR_API_GATEWAY_URL:", apiGatewayUrl || "없음");

    if (!secretKey || !apiGatewayUrl) {
      console.error("OCR API Gateway 설정이 완료되지 않았습니다.");
      res.status(500).json({ 
        success: false, 
        error: "OCR API Gateway 설정이 완료되지 않았습니다. Firebase Functions 환경 변수를 확인하세요." 
      });
      return;
    }

    // 네이버 클로바 OCR API Gateway 호출
    console.log("OCR API Gateway 호출 시작");
    console.log("URL:", apiGatewayUrl);
    console.log("Secret Key 길이:", secretKey?.length || 0);
    
    // API Gateway는 일반 OCR API와 다른 형식을 사용할 수 있음
    // 일반 OCR API 형식과 API Gateway 형식 모두 시도
    const requestBody = {
      version: "V2",
      requestId: `req-${Date.now()}`,
      timestamp: Date.now(),
      images: [
        {
          format: imageType?.split("/")[1] || "jpg",
          name: "receipt",
          data: image, // base64 이미지 데이터
          url: null,
        },
      ],
    };
    
    console.log("Request Body keys:", Object.keys(requestBody));
    console.log("Image format:", requestBody.images[0].format);
    
    // 네이버 클로바 OCR API Gateway는 일반 OCR API와 다른 헤더 형식을 사용할 수 있음
    // API Gateway는 X-OCR-SECRET 대신 다른 헤더를 사용할 수 있음
    const ocrResponse = await fetch(apiGatewayUrl, {
      method: "POST",
      headers: {
        "X-OCR-SECRET": secretKey,
        "X-OCR-APIGW-API-KEY": secretKey, // API Gateway는 이 헤더를 사용할 수도 있음
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!ocrResponse.ok) {
      const errorText = await ocrResponse.text();
      console.error("OCR API 오류:", errorText);
      console.error("OCR API Gateway URL:", apiGatewayUrl);
      console.error("OCR Response Status:", ocrResponse.status);
      res.status(ocrResponse.status).json({
        success: false,
        error: `OCR API 호출 실패: ${ocrResponse.statusText} (${ocrResponse.status})`,
        details: errorText,
        apiGatewayUrl: apiGatewayUrl, // 디버깅용
      });
      return;
    }

    const ocrResult = await ocrResponse.json();

    // OCR 결과 검증 및 텍스트 추출
    if (!ocrResult.images || ocrResult.images.length === 0) {
      res.status(500).json({
        success: false,
        error: "OCR 결과에 이미지 데이터가 없습니다.",
      });
      return;
    }

    const imageResult = ocrResult.images[0];
    
    // inferResult 확인
    if (imageResult.inferResult !== "SUCCESS") {
      res.status(500).json({
        success: false,
        error: imageResult.message || "OCR 인식에 실패했습니다.",
        raw: ocrResult,
      });
      return;
    }

    // fields 배열에서 텍스트 추출
    // 각 field의 inferText를 공백으로 연결하여 전체 텍스트 생성
    // lineBreak가 true인 경우 줄바꿈 문자(\n) 추가
    let fullText = "";
    if (imageResult.fields && imageResult.fields.length > 0) {
      fullText = imageResult.fields
        .map((field, index) => {
          const text = field.inferText || "";
          // lineBreak가 true이고 다음 필드가 있으면 줄바꿈 추가
          if (field.lineBreak && index < imageResult.fields.length - 1) {
            return text + "\n";
          }
          return text;
        })
        .join(" ")
        .replace(/\n /g, "\n") // 줄바꿈 뒤 공백 제거
        .trim();
    }

    // 성공 응답
    // 응답 형식: { success: true, text: string, fields: array, raw: object }
    res.status(200).json({
      success: true,
      text: fullText, // 전체 인식 텍스트 (줄바꿈 포함)
      fields: imageResult.fields || [], // 구조화된 필드 배열 (inferText, boundingPoly 등 포함)
      raw: ocrResult, // 디버깅용 원본 OCR 응답 전체
    });
  } catch (error) {
    console.error("OCR 처리 오류:", error);
    res.status(500).json({
      success: false,
      error: error.message || "OCR 처리 중 오류가 발생했습니다.",
    });
  }
});

// 네이버 클라우드 플랫폼 Directions 5 API 프록시 함수 (2nd Gen)
// 참고: https://api.ncloud-docs.com/docs/application-maps-directions5
exports.calculateRoute = onRequest(
  {
    cors: true, // CORS 자동 처리
    region: "us-central1",
    timeoutSeconds: 60,
    memory: "256Mi",
    // 환경 변수 설정 방법:
    // 1. Google Cloud Console에서 설정:
    //    - Google Cloud Console > Cloud Functions > calculateRoute 선택
    //    - "편집" 클릭 > "환경 변수, 네트워킹, 타임아웃 등" 섹션
    //    - "환경 변수 추가" 클릭
    //    - NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 추가
    //    - 저장 후 함수 재배포 필요
    // 2. 또는 Firebase CLI로 설정 (로컬 개발용):
    //    - .env 파일에 추가 (배포 시에는 Google Cloud Console 사용)
  },
  async (req, res) => {
    // CORS 설정 (추가 보안)
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    try {
      const { origin, destination, waypoints } = req.body;

      if (!origin || !destination) {
        res.status(400).json({ success: false, error: "출발지와 도착지가 필요합니다." });
        return;
      }

      // 네이버 클라우드 플랫폼 API Gateway 키 (환경 변수에서 가져오기)
      // ⚠️ 중요: Directions API는 지도 표시용 Client ID와 완전히 다른 키를 사용합니다!
      // - 지도 표시용: maps.js에 사용하는 Client ID (VITE_NAVER_MAP_CLIENT_ID)
      // - Directions API용: API Gateway에서 발급받은 별도의 API Key ID와 API Key
      // Directions API는 API Gateway를 통해 호출하므로 API Gateway 키가 필요합니다.
      const naverApiKeyId = process.env.NAVER_APIGW_API_KEY_ID || process.env.NAVER_CLIENT_ID || "";
      const naverApiKey = process.env.NAVER_APIGW_API_KEY || process.env.NAVER_CLIENT_SECRET || "";
      
      // 디버깅: 모든 환경 변수 확인
      console.log("=== Directions API 환경 변수 디버깅 ===");
      console.log("NAVER_APIGW_API_KEY_ID:", naverApiKeyId ? `설정됨 (길이: ${naverApiKeyId.length})` : "없음");
      console.log("NAVER_APIGW_API_KEY:", naverApiKey ? `설정됨 (길이: ${naverApiKey.length})` : "없음");
      console.log("⚠️ 중요: Directions API는 지도 표시용 Client ID와 다른 API Gateway 키가 필요합니다!");
      console.log("OCR_SECRET_KEY 존재:", process.env.OCR_SECRET_KEY ? "예 (OCR에서 사용 중)" : "아니오");
      console.log("NAVER 관련 환경 변수:", Object.keys(process.env).filter(k => 
        k.includes("NAVER") || k.includes("OCR") || k.includes("CLIENT") || k.includes("SECRET") || k.includes("APIGW")
      ));
      console.log("========================================");
      
      if (!naverApiKeyId || !naverApiKey) {
        console.error("네이버 클라우드 플랫폼 API Gateway 키가 설정되지 않았습니다.");
        res.status(500).json({
          success: false,
          error: "네이버 클라우드 플랫폼 API Gateway 키가 설정되지 않았습니다. Firebase Functions 환경 변수를 확인하세요.",
          hint: "Directions API는 지도 표시용 Client ID와 다른 API Gateway 키가 필요합니다. API Gateway에서 발급받은 NAVER_APIGW_API_KEY_ID와 NAVER_APIGW_API_KEY를 설정하세요.",
          debug: {
            envKeys: Object.keys(process.env).filter(k => 
              k.includes("NAVER") || k.includes("OCR") || k.includes("CLIENT") || k.includes("SECRET") || k.includes("APIGW")
            ),
            hasOcrSecret: !!process.env.OCR_SECRET_KEY,
            hasNaverClientId: !!process.env.NAVER_CLIENT_ID,
            hasNaverClientSecret: !!process.env.NAVER_CLIENT_SECRET,
            hasNaverApiKeyId: !!process.env.NAVER_APIGW_API_KEY_ID,
            hasNaverApiKey: !!process.env.NAVER_APIGW_API_KEY,
          },
        });
        return;
      }

      // 네이버 Directions 5 API URL 구성
      // 공식 문서: https://api.ncloud-docs.com/docs/ko/application-maps-directions5
      // 요청 URI: /driving (GET 메서드)
      // ⚠️ 중요: 공식 문서에 따르면 version 파라미터는 없습니다!
      // 전체 URL: https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving
      const baseUrl = "https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving";
      const params = new URLSearchParams({
        start: origin, // "경도,위도" 형식 (필수)
        goal: destination, // "경도,위도" 형식 (필수)
      });
      
      // 경유지가 있으면 추가 (최대 5개, '|'로 구분)
      // waypoints 형식: "경도,위도|경도,위도|..."
      if (waypoints && waypoints.trim() !== "") {
        // 경유지가 문자열이고 비어있지 않은 경우에만 추가
        const waypointsArray = waypoints.split("|");
        if (waypointsArray.length > 0 && waypointsArray.length <= 5) {
          params.append("waypoints", waypoints);
          console.log("경유지 추가:", waypointsArray.length, "개");
        } else if (waypointsArray.length > 5) {
          console.warn("경유지가 5개를 초과합니다. 처음 5개만 사용합니다.");
          params.append("waypoints", waypointsArray.slice(0, 5).join("|"));
        }
      }
      
      const url = `${baseUrl}?${params.toString()}`;

      console.log("네이버 Directions API 호출:", url);
      console.log("Origin:", origin);
      console.log("Destination:", destination);
      console.log("Waypoints:", waypoints);

      try {
        // Node.js https 모듈 사용
        const https = require("https");
        const urlObj = new URL(url);
        
        const options = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: "GET",
          headers: {
            "X-NCP-APIGW-API-KEY-ID": naverApiKeyId, // API Gateway에서 발급받은 API Key ID (대문자 사용)
            "X-NCP-APIGW-API-KEY": naverApiKey, // API Gateway에서 발급받은 API Key (대문자 사용)
            // 참고: 블로그에서는 소문자 x-ncp-apigw-api-key-id를 사용했지만, 공식 문서에 따르면 대문자도 가능합니다
            "Content-Type": "application/json",
            "User-Agent": "Firebase-Cloud-Functions",
          },
        };
        
        console.log("API 호출 헤더 확인:", {
          "X-NCP-APIGW-API-KEY-ID": naverApiKeyId ? `${naverApiKeyId.substring(0, 5)}...` : "없음",
          "X-NCP-APIGW-API-KEY": naverApiKey ? `${naverApiKey.substring(0, 5)}...` : "없음",
        });
        
        console.log("네이버 Directions API 호출 옵션:", {
          hostname: options.hostname,
          path: options.path,
          method: options.method,
        });
        
        const data = await new Promise((resolve, reject) => {
          const req = https.request(options, (response) => {
            let responseData = "";
            
            response.on("data", (chunk) => {
              responseData += chunk;
            });
            
            response.on("end", () => {
              // 상세한 응답 로깅
              console.log("=== 네이버 Directions API 응답 ===");
              console.log("HTTP 상태 코드:", response.statusCode);
              console.log("응답 헤더:", JSON.stringify(response.headers, null, 2));
              console.log("응답 본문 (처음 1000자):", responseData.substring(0, 1000));
              
              if (response.statusCode >= 200 && response.statusCode < 300) {
                try {
                  const jsonData = JSON.parse(responseData);
                  console.log("응답 코드:", jsonData.code);
                  console.log("응답 메시지:", jsonData.message);
                  
                  // 응답 코드가 0이 아니면 오류 (네이버 API는 HTTP 200이어도 code가 0이 아니면 오류)
                  if (jsonData.code !== 0 && jsonData.code !== undefined) {
                    reject(new Error(`네이버 Directions API 오류 (코드: ${jsonData.code}): ${jsonData.message || "알 수 없는 오류"}`));
                    return;
                  }
                  
                  resolve(jsonData);
                } catch (parseError) {
                  console.error("JSON 파싱 오류:", parseError);
                  reject(new Error(`JSON 파싱 실패: ${parseError.message}`));
                }
              } else {
                // 오류 응답도 파싱해서 상세 정보 제공
                let errorMessage = `HTTP ${response.statusCode}: ${response.statusMessage}`;
                try {
                  const errorData = JSON.parse(responseData);
                  console.error("오류 응답 데이터:", JSON.stringify(errorData, null, 2));
                  
                  if (errorData.error) {
                    errorMessage += `\n${JSON.stringify(errorData.error, null, 2)}`;
                  } else if (errorData.errorCode) {
                    errorMessage += `\n오류 코드: ${errorData.errorCode}\n메시지: ${errorData.message || errorData.details || "알 수 없는 오류"}`;
                  } else {
                    errorMessage += `\n${responseData}`;
                  }
                } catch {
                  errorMessage += `\n${responseData}`;
                }
                reject(new Error(`네이버 Directions API 호출 실패: ${errorMessage}`));
              }
            });
          });
          
          req.on("error", (error) => {
            console.error("네이버 Directions API 요청 오류:", error);
            reject(error);
          });
          
          req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error("요청 타임아웃 (30초)"));
          });
          
          req.end();
        });

        // 네이버 Directions API 응답 형식 확인
        console.log("네이버 Directions API 응답:", JSON.stringify(data, null, 2));
        
        // 네이버 Directions API 응답 형식: { code: 0, route: { traoptimal: [{ summary: { distance, duration, taxiFare } }] } }
        if (data.code === 0 && data.route && data.route.traoptimal && data.route.traoptimal.length > 0) {
          const route = data.route.traoptimal[0];
          const summary = route.summary;

          res.status(200).json({
            success: true,
            route: {
              distance: summary.distance, // 미터
              duration: Math.floor(summary.duration / 1000), // 밀리초 -> 초 변환
              taxiFare: summary.taxiFare || null, // 택시 요금 (있으면 사용)
            },
            raw: data,
          });
        } else {
          // 네이버 API 오류 코드 처리
          const errorMessage = data.message || "경로를 찾을 수 없습니다.";
          console.error("네이버 Directions API 오류:", {
            code: data.code,
            message: errorMessage,
          });
          res.status(500).json({
            success: false,
            error: errorMessage,
            code: data.code,
          });
        }
      } catch (fetchError) {
        console.error("네이버 Directions API fetch 오류:", fetchError);
        console.error("오류 상세:", {
          message: fetchError.message,
          code: fetchError.code,
          errno: fetchError.errno,
          syscall: fetchError.syscall,
          hostname: fetchError.hostname,
        });
        res.status(500).json({
          success: false,
          error: `네이버 Directions API 호출 실패: ${fetchError.message}`,
          details: {
            code: fetchError.code,
            errno: fetchError.errno,
            syscall: fetchError.syscall,
            hostname: fetchError.hostname,
          },
        });
      }
    } catch (error) {
      console.error("경로 계산 오류:", error);
      res.status(500).json({
        success: false,
        error: error.message || "경로 계산 중 오류가 발생했습니다.",
      });
    }
  }
);

// 네이버 검색 API - 장소 검색 프록시 함수 (2nd Gen)
exports.searchPlaces = onRequest(
  {
    cors: true, // CORS 자동 처리
    region: "us-central1",
    timeoutSeconds: 30,
    memory: "256Mi",
    // 환경 변수 설정 방법:
    // 1. Google Cloud Console에서 설정:
    //    - Google Cloud Console > Cloud Functions > searchPlaces 선택
    //    - "편집" 클릭 > "환경 변수, 네트워킹, 타임아웃 등" 섹션
    //    - "환경 변수 추가" 클릭
    //    - NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 추가
    //    - 저장 후 함수 재배포 필요
    // 2. 또는 Firebase CLI로 설정:
    //    - firebase functions:config:set naver.client_id="YOUR_CLIENT_ID"
    //    - firebase functions:config:set naver.client_secret="YOUR_CLIENT_SECRET"
  },
  async (req, res) => {
    // CORS 설정 (추가 보안)
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({ success: false, error: "Method not allowed" });
      return;
    }

    try {
      const query = req.query.query || req.body.query;

      if (!query || !query.trim()) {
        res.status(400).json({ success: false, error: "검색어가 필요합니다." });
        return;
      }

      // 네이버 검색 API 인증 정보 (환경 변수에서 가져오기)
      const clientId = process.env.NAVER_CLIENT_ID || process.env.VITE_NAVER_MAP_CLIENT_ID || "";
      const clientSecret = process.env.NAVER_CLIENT_SECRET || "";

      if (!clientId || !clientSecret) {
        console.error("네이버 검색 API 인증 정보가 설정되지 않았습니다.");
        res.status(500).json({
          success: false,
          error: "네이버 검색 API 인증 정보가 설정되지 않았습니다. Firebase Functions 환경 변수를 확인하세요.",
          hint: "NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 Firebase Functions 환경 변수에 설정하세요.",
        });
        return;
      }

      // 네이버 검색 API - 지역 검색 (Places API)
      const searchUrl = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query.trim())}&display=5&start=1&sort=random`;

      console.log("네이버 검색 API 호출:", searchUrl);

      const response = await fetch(searchUrl, {
        method: "GET",
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("네이버 검색 API 오류:", response.status, errorText);
        res.status(response.status).json({
          success: false,
          error: `네이버 검색 API 호출 실패: ${response.status}`,
          details: errorText,
        });
        return;
      }

      const data = await response.json();

      // 검색 결과 반환
      res.status(200).json({
        success: true,
        items: data.items || [],
        total: data.total || 0,
      });
    } catch (error) {
      console.error("장소 검색 오류:", error);
      res.status(500).json({
        success: false,
        error: error.message || "장소 검색 중 오류가 발생했습니다.",
      });
    }
  }
);

