# Material Ops — 자재운반 설비 관리 프로토타입

자재관리 직무 중 **3. 자재운반 설비 관리하기**의 3.1(공정별·품목별 자재 입고/출고/운반 설비 특성표 작성)과 3.2(설비 운용계획 수립)를 지원하는 시연용 웹 앱입니다.

## 포함 기능
- 10건의 가상 자재운반 설비 운영계획
- 설비 특성표 검토: 대상 자재, 입고·출고·운반 흐름, 설비 종류, 주요 제원, 적재·견인 하중, 처리능력
- 운용계획 검토: 설비 수량·배치, 시간대별 배차, 공정 동선, 피크 대응, 예비 설비
- 안전·점검·정비 조건 확인
- 항목별 승인/보류/불가 판정, 근거, 보완 조치 및 보고서 미리보기

## 로컬 실행
```bash
npm install
npm run dev
```

## 범위와 한계
데이터와 판정은 모두 가상 시연용입니다. 실제 설비 제원·법정 안전기준·현장 물동량에 근거한 검증이 필요합니다. Gemini API 분석은 `GEMINI_API_KEY`가 Vercel 서버 환경변수에 등록된 경우 실제 호출됩니다. 현재 TXT·MD·CSV 텍스트 파일 및 직접 붙여넣기 분석을 지원하며 PDF·XLSX 원본 파싱, ERP/WMS/MES 연동, 실제 승인 기록 기능은 구현되어 있지 않습니다. 무료 등급 한도 초과(429)는 차단하고 유료 모델로 자동 전환하지 않습니다. 실제 무과금을 보장하려면 Google AI Studio에서 무료 등급 프로젝트를 사용하고 Google Cloud 결제를 연결하지 않아야 합니다. 무료 등급 입력 데이터는 Google 제품 개선에 사용될 수 있으므로 기밀 자료는 입력하지 마세요.

## Gemini API 설정
1. Google AI Studio에서 무료 등급 프로젝트의 API 키를 생성합니다.
2. Vercel 프로젝트 `hint_day5`의 Settings → Environment Variables에서 `GEMINI_API_KEY`를 Sensitive로 등록합니다(Production/Preview 필요 환경).
3. Google Cloud 프로젝트에 결제 계정을 연결하지 않은 무료 등급 상태를 유지합니다.
4. Vercel에서 재배포한 뒤 대시보드의 Gemini AI 실자료 분석에서 텍스트를 입력해 테스트합니다.

서버 API는 `gemini-3.5-flash-lite`의 Standard `generateContent`만 호출하며, API 키는 클라이언트에 노출되지 않습니다.
