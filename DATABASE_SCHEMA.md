# Firebase Realtime Database 구조

## 데이터베이스 스키마

### 정산 방 (Settlements)

```
settlements/
  {roomId}/
    id: string                    // 방 ID (예: "room_1234567890_abc123")
    type: string                  // 정산 타입: "receipt" | "taxi"
    createdAt: number             // 생성 시간 (timestamp)
    status: string                // 상태: "active" | "completed"
    completedAt?: number          // 완료 시간 (timestamp, 선택사항)
    
    // 방장 정보
    host: {
      nickname: string            // 방장 닉네임
      kakaoPayCode: string | null // 카카오페이 송금코드 (선택사항)
      bank: string                // 은행명
      accountNumber: string       // 계좌번호
    }
    
    // 메뉴 항목 (일반 정산의 경우)
    menuItems: [
      {
        id: number                // 메뉴 ID
        name: string              // 메뉴명
        price: number             // 메뉴 가격
        quantity: number          // 수량
        participantCount: number   // 선택한 참여자 수
        pricePerPerson: number    // 1인당 금액
      }
    ]
    
    // 택시 정산 정보 (택시 정산의 경우)
    taxiInfo?: {
      departure: {
        name: string              // 출발지 이름
        lat: number               // 위도
        lng: number               // 경도
      }
      arrival: {
        name: string              // 도착지 이름
        lat: number               // 위도
        lng: number               // 경도
      }
      totalAmount: number         // 총 택시 요금
      calculatedRoute?: {         // 계산된 경로 정보
        distance: number          // 거리 (km)
        duration: number          // 소요 시간 (분)
        taxiFare: number          // 택시 요금
      }
    }
    
    // 참여자 정보
    participants: {
      {nickname}: {               // 닉네임을 키로 사용
        nickname: string          // 참여자 닉네임
        isHost: boolean           // 방장 여부
        selectedMenuIds: number[] // 선택한 메뉴 ID 배열
        selectedLocation?: {      // 택시 정산의 경우 선택한 하차 위치
          name: string
          lat: number
          lng: number
        }
        completed: boolean        // 선택 완료 여부
        joinedAt: number          // 참여 시간 (timestamp)
        completedAt?: number      // 완료 시간 (timestamp, 선택사항)
      }
    }
    
    // 참여자 통계
    totalParticipants: number     // 총 참여자 수
    currentParticipants: number   // 현재 완료한 참여자 수
```

## 데이터베이스 규칙 (Security Rules)

**중요**: 방 ID를 모르면 접근할 수 없습니다. 방 목록 조회도 불가능합니다.

```json
{
  "rules": {
    "settlements": {
      "$roomId": {
        // 읽기: 방 ID를 아는 사람만 접근 가능
        // 주의: 방 ID를 알면 누구나 읽을 수 있음 (더 안전하게 하려면 인증 필요)
        ".read": true,
        
        // 쓰기: 방 ID를 아는 사람만 수정 가능
        ".write": true,
        
        // 방 정보 검증
        "id": {
          ".validate": "newData.isString() && newData.val().length > 0"
        },
        "type": {
          ".validate": "newData.isString() && (newData.val() === 'receipt' || newData.val() === 'taxi')"
        },
        "createdAt": {
          ".validate": "newData.isNumber()"
        },
        "status": {
          ".validate": "newData.isString() && (newData.val() === 'active' || newData.val() === 'completed')"
        },
        
        // 방장 정보 검증
        "host": {
          "nickname": {
            ".validate": "newData.isString() && newData.val().length > 0"
          },
          "bank": {
            ".validate": "newData.isString() && newData.val().length > 0"
          },
          "accountNumber": {
            ".validate": "newData.isString() && newData.val().length > 0"
          }
        },
        
        // 메뉴 항목 검증
        "menuItems": {
          "$menuId": {
            "id": {
              ".validate": "newData.isNumber()"
            },
            "name": {
              ".validate": "newData.isString()"
            },
            "price": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "quantity": {
              ".validate": "newData.isNumber() && newData.val() > 0"
            },
            "participantCount": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            },
            "pricePerPerson": {
              ".validate": "newData.isNumber() && newData.val() >= 0"
            }
          }
        },
        
        // 참여자 정보 검증
        "participants": {
          "$nickname": {
            "nickname": {
              ".validate": "newData.isString() && newData.val().length > 0"
            },
            "isHost": {
              ".validate": "newData.isBoolean()"
            },
            "selectedMenuIds": {
              ".validate": "newData.isArray()"
            },
            "completed": {
              ".validate": "newData.isBoolean()"
            },
            "joinedAt": {
              ".validate": "newData.isNumber()"
            }
          }
        },
        
        // 통계 정보 검증
        "totalParticipants": {
          ".validate": "newData.isNumber() && newData.val() >= 0"
        },
        "currentParticipants": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= newData.parent().parent().child('totalParticipants').val()"
        }
      }
    }
  }
}
```

## 사용 예시

### 1. 정산 방 생성 (일반 정산)

```javascript
// UUID v4 형식으로 생성
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
const roomId = generateUUID(); // 예: "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789"
await set(ref(database, `settlements/${roomId}`), {
  id: roomId,
  type: "receipt",
  createdAt: Date.now(),
  status: "active",
  host: {
    nickname: "방장",
    kakaoPayCode: "12345678",
    bank: "KB국민은행",
    accountNumber: "110-123-456789"
  },
  menuItems: [
    {
      id: 1,
      name: "삼겹살",
      price: 30000,
      quantity: 1,
      participantCount: 0,
      pricePerPerson: 0
    }
  ],
  participants: {
    "방장": {
      nickname: "방장",
      isHost: true,
      selectedMenuIds: [],
      completed: false,
      joinedAt: Date.now()
    }
  },
  totalParticipants: 4,
  currentParticipants: 1
});
```

### 2. 참여자 메뉴 선택 확정

```javascript
await update(ref(database, `settlements/${roomId}/participants/${nickname}`), {
  selectedMenuIds: [1, 3],
  completed: true,
  completedAt: Date.now()
});
```

### 3. 메뉴별 참여자 수 업데이트

```javascript
await update(ref(database, `settlements/${roomId}`), {
  "menuItems/0/participantCount": 3,
  "menuItems/0/pricePerPerson": 10000,
  currentParticipants: 3
});
```

## 주의사항

1. **roomId 형식**: `room_{timestamp}_{random}` 형식 사용
2. **닉네임 중복**: 참여자 닉네임은 고유해야 함 (같은 방 내에서)
3. **참여자 수**: `currentParticipants`는 `totalParticipants`를 초과할 수 없음
4. **메뉴 ID**: 각 메뉴 항목의 `id`는 고유해야 함
5. **타임스탬프**: 모든 시간은 밀리초 단위 timestamp 사용

