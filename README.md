# 나는 빼줘

친구들과 함께 식사하거나 택시를 탈 때, 간편하게 정산할 수 있는 웹 애플리케이션입니다.

사용자가 영수증 사진을 업로드하면 OCR로 메뉴를 자동 인식하고, 각자 먹은 메뉴만 선택하면 실시간으로 1인당 금액이 자동 계산되는 서비스입니다.

식사 후 계산기로 복잡하게 나누거나, 카카오톡으로 송금 요청하는 번거로움을 해결하고자 본 프로젝트를 기획하게 되었습니다.

기존 정산 앱들은 메뉴를 수동으로 입력해야 하는 불편함이 있었고, 이를 OCR과 실시간 동기화로 보완하고자 본 프로젝트를 개발하게 되었습니다.

**선정 아이템**: OCR 기반 실시간 정산 서비스  
**목표**: 영수증 사진만으로 메뉴를 자동 인식하고, 실시간으로 정산 금액을 계산하는 서비스 구현

## How to Start?

### Step 0 : 처음 시작한 경우

```bash
npm install
```

### Step 1 : 실행

```bash
npm run dev
```

## 사용 기술 스택

- **React** 19.2
- **JavaScript**
- **Tailwind CSS**
- **Vite** 7.2

## 주요 라이브러리

- **react-router-dom** - 라우팅
- **firebase** - 백엔드 서비스 (Realtime Database, Firestore, Auth, Functions)
- **axios** - HTTP 클라이언트

## 주요 API

- **네이버 클로바 OCR** – 영수증 이미지에서 메뉴 정보 추출
- **네이버 지도 API** – 택시 정산 시 위치 선택 및 경로 표시
- **네이버 Directions API** – 택시 경로 및 요금 계산
- **Firebase Realtime Database** – 실시간 정산 방 데이터 동기화
- **Firebase Firestore** – 사용자 정보 및 정산 내역 저장

## 프로젝트 구조

<details>
<summary>클릭하여 프로젝트 구조 보기</summary>

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트 (Button, Input, Modal 등)
│   ├── home/           # 홈 페이지 컴포넌트
│   ├── layout/         # 레이아웃 컴포넌트
│   ├── map/            # 지도 관련 컴포넌트
│   ├── modals/         # 모달 컴포넌트
│   └── settlement/     # 정산 관련 컴포넌트
├── config/             # 설정 파일
│   └── firebase.js     # Firebase 초기화
├── constants/          # 상수 정의
├── hooks/              # 커스텀 훅
├── layouts/            # 페이지 레이아웃
├── pages/              # 페이지 컴포넌트
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── SignUpPage.jsx
│   ├── MyPage.jsx
│   ├── Step*.jsx       # 영수증 정산 단계별 페이지
│   ├── TaxiStep*.jsx  # 택시 정산 단계별 페이지
│   └── Settlement*.jsx # 정산 방 관련 페이지
├── types/              # 타입 정의
├── utils/              # 유틸리티 함수
└── App.jsx             # 메인 앱 컴포넌트
```

</details>

## 주요 기능

### 영수증 정산
- OCR을 통한 영수증 자동 인식
- 메뉴별 개별 선택
- 실시간 1인당 금액 자동 계산
- 링크 공유로 친구 초대

### 택시 정산 (개발 중)
- 지도 기반 하차 위치 선택
- 자동 택시 요금 계산
- 실시간 위치 공유

### 사용자 기능
- 닉네임 기반 간편 로그인
- 정산 내역 관리
- 결제 정보 자동 저장
- 월별 정산 통계

## 배포

### Vercel 배포
1. Vercel에 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 완료

---

**개발자**: [Your Name]  
**프로젝트 시작일**: 2024
