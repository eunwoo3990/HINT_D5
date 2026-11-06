export type Status = "승인" | "보류" | "불가";
export type Review = { id:string; title:string; status:Status; summary:string; evidence:string[]; action:string };
export type Plan = { id:string; title:string; plant:string; line:string; date:string; owner:string; quantity:number; status:Status; risk:"낮음"|"보통"|"높음"; summary:string; reviews:Review[]; report:string; updated:string };

const scenarios = [
  {title:"11월 2주차 차체 생산 운영안",plant:"울산 1공장",line:"차체 1라인",quantity:1240,status:"승인" as Status,risk:"낮음" as const,summary:"생산계획과 자재 소요량이 일치하고 입고·재고·설비 여력이 모두 기준을 충족합니다.",statuses:["승인","승인","승인","승인","승인"] as Status[],facts:["생산 1,240대 / 자재 소요 1,240세트 일치","주요 자재 입고 예정 11/9, 계획 투입 전 확보","물류 설비 가동률 78%, 기준 85% 이하","기초 420 + 입고 1,100 - 출고 1,240 = 기말 280","운반 장비 허용하중 및 적재 규격 적합"]},
  {title:"전기차 배터리팩 조립 운영안",plant:"울산 전동화공장",line:"배터리 2라인",quantity:980,status:"보류" as Status,risk:"높음" as const,summary:"핵심 셀 모듈 입고가 생산 착수 시점보다 늦어 2일분 생산 차질 가능성이 있습니다.",statuses:["승인","보류","보류","승인","승인"] as Status[],facts:["생산 980대 / 자재 소요 980세트","셀 모듈 300세트 입고가 11/12로 계획보다 2일 지연","입고 지연 시 11/10 야간조부터 재고 부족 예상","현재고 210 + 확정입고 470 - 소요 980 = 부족 300","설비 가동률 81%, 사양 적합"]},
  {title:"도장 공정 주간 운영계획",plant:"아산공장",line:"도장 3라인",quantity:860,status:"불가" as Status,risk:"높음" as const,summary:"도료 공급량이 계획 소요량에 미달하고 대체 자재 승인도 확인되지 않았습니다.",statuses:["승인","불가","보류","승인","보류"] as Status[],facts:["생산 860대 계획","도료 A 공급 가능 620단위로 소요 860단위 대비 240 부족","대체 도료 승인 문서 미첨부","입고 예정일 미확정으로 보충 시점 판단 불가","이송 펌프 처리량이 사양서 기준에 근접"]},
  {title:"엔진 조립라인 증산 운영안",plant:"울산 2공장",line:"엔진 1라인",quantity:1520,status:"보류" as Status,risk:"보통" as const,summary:"증산 물량은 반영됐으나 AGV 운행 대수와 충전 가용 시간이 계획 대비 부족합니다.",statuses:["승인","승인","보류","승인","보류"] as Status[],facts:["생산 1,520대, 전주 대비 12% 증산","부품 소요량은 증산계획과 일치","AGV 8대 중 정비 예정 2대, 가용 6대","피크 시간대 물류 처리량이 시간당 94회로 요구 100회 미달","충전기 2기 중 1기 점검 일정 미반영"]},
  {title:"시트 프레임 재고 조정안",plant:"아산공장",line:"시트 1라인",quantity:740,status:"보류" as Status,risk:"보통" as const,summary:"재고 수불 장부와 실사 수량 사이에 46개 차이가 있어 원인 확인이 필요합니다.",statuses:["승인","승인","승인","보류","승인"] as Status[],facts:["생산 740대 / 소요 740개","공급사 납품 일정 정상","물류 설비 가동률 72%","전산 재고 312개, 실사 재고 266개로 46개 차이","운반대차 적재 규격 적합"]},
  {title:"첨단운전자보조 센서 모듈 운영안",plant:"남양연구소",line:"시험차 조립셀",quantity:180,status:"불가" as Status,risk:"높음" as const,summary:"센서 모듈의 보관 온도 조건이 창고 관리 기준과 맞지 않아 품질 리스크가 있습니다.",statuses:["승인","승인","승인","승인","불가"] as Status[],facts:["시험차 180대분 소요량 반영","공급사 입고 일정 정상","운송 카트 가용률 76%","재고 수량 및 수불 이력 일치","사양서 보관온도 5~25℃, 현 보관구역 관리범위 0~30℃"]},
  {title:"변속기 케이스 주말 특근 계획",plant:"전주공장",line:"가공 2라인",quantity:630,status:"승인" as Status,risk:"낮음" as const,summary:"주말 특근을 포함한 생산량과 자재·설비 운영 조건이 모두 충족됩니다.",statuses:["승인","승인","승인","승인","승인"] as Status[],facts:["생산 630대 / 자재 소요 630세트","주요 원자재 입고 완료","설비 가동률 69%, 특근 운영 가능","기초·입고·출고 수량 대사 완료","가공 치공구 및 운반 장비 사양 적합"]},
  {title:"인포테인먼트 ECU 변경품 적용안",plant:"광명공장",line:"전자모듈 1라인",quantity:1120,status:"보류" as Status,risk:"보통" as const,summary:"변경품 적용 일정은 반영됐으나 구품 재고 소진 기준과 전환 승인번호가 누락됐습니다.",statuses:["승인","보류","승인","보류","승인"] as Status[],facts:["생산 1,120대 계획","신규 ECU 1,120개 소요, 변경품 입고 11/11 예정","물류 설비 가동률 74%","구품 재고 155개에 대한 소진·격리 계획 미기재","변경 승인번호 및 적용 차대 범위 확인 필요"]},
  {title:"수출형 SUV 최종검사 운영안",plant:"울산 5공장",line:"최종검사 2라인",quantity:540,status:"보류" as Status,risk:"높음" as const,summary:"검사 장비의 정기 교정 유효기간이 운영 기간 중 만료될 예정입니다.",statuses:["승인","승인","승인","승인","보류"] as Status[],facts:["생산 540대 / 검사 소모품 수량 일치","소모품 입고 일정 정상","검사 대기 이송 설비 가동률 80%","재고 수불 이력 정상","토크 측정기 교정 만료 11/13, 운영계획 종료일 11/15"]},
  {title:"하이브리드 모터 조립 운영안",plant:"울산 전동화공장",line:"모터 1라인",quantity:910,status:"보류" as Status,risk:"보통" as const,summary:"계획 대비 핵심 부품 수량 산출 근거가 일부 누락되어 생산기술 확인이 필요합니다.",statuses:["보류","보류","승인","승인","승인"] as Status[],facts:["생산 910대 계획이나 계획서에는 900대 기재","자석 어셈블리 소요량 산식 및 여유율 근거 누락","입고 일정 및 물류 처리능력은 기준 충족","재고 장부와 실사 수량 일치","설비 사양과 적재 규격 적합"]}
];

const categories = ["생산계획 정합성","자재 소요·조달","입고 물류 설비","재고 수불 이력","설비 사양 적합성"];
const actions = [
  "생산계획 담당자가 확정 생산 대수와 기준 버전을 확인합니다.",
  "자재 담당자가 부족 수량, 대체품 승인 및 확정 입고일을 확인합니다.",
  "물류 담당자가 피크 시간대 처리량과 장비 가용 대수를 재검증합니다.",
  "창고 담당자가 실사 수량과 전산 수량 차이를 조정하고 이력을 남깁니다.",
  "설비 담당자가 장비 사양서, 교정 유효기간 및 현장 운영 조건을 대조합니다."
];

export const plans:Plan[] = scenarios.map((s,i)=>({
  id:`MP-2026-${String(1106+i).padStart(4,"0")}`,title:s.title,plant:s.plant,line:s.line,date:"2026-11-09 ~ 11-15",owner:["김민준","박서연","이도윤","최유진","정하늘"][i%5],quantity:s.quantity,status:s.status,risk:s.risk,summary:s.summary,updated:`11/06 1${4+i}:2${i}`,
  reviews:categories.map((title,j)=>({id:String(j+1),title,status:s.statuses[j],summary:s.facts[j],evidence:[["주간 생산계획서 v2.1","라인별 생산 캘린더"],["자재 소요 산출표","공급사 납품 예정 현황"],["입고장비 운영 현황","물류 CAPA 점검표"],["재고 수불 집계","창고 실사 기록"],["설비 사양서","정기 점검·교정 이력"]][j],action:actions[j]})),
  report:`[운영계획 검토 보고서] ${s.title}\n사업장: ${s.plant} / 라인: ${s.line}\n운영기간: 2026.11.09~11.15 / 계획수량: ${s.quantity}대\n\n1. 생산계획\n주간 생산계획 기준 ${s.quantity}대 운영 예정. 라인별 일 생산량 및 교대조 운영 계획을 확인함.\n\n2. 자재 소요 및 조달\nBOM 기준 자재 소요량과 현재고, 확정 입고 예정량을 비교함. 주요 이슈: ${s.facts[1]}.\n\n3. 입고 물류 설비\n입고 도크, AGV 및 이송 장비의 가용 대수와 시간당 처리량을 점검함. ${s.facts[2]}.\n\n4. 재고 수불 이력\n기초재고 + 입고 - 출고 = 기말재고 산식으로 수불 이력을 대사함. ${s.facts[3]}.\n\n5. 설비 사양 적합성\n장비 허용하중, 적재 규격, 처리량 및 교정 유효기간을 사양서와 대조함. ${s.facts[4]}.\n\nAI 검토 요약(시연용): ${s.summary}\n최종 판단은 담당 관리자 확인 후 확정해야 함.`
}));

export const docs = ["생산계획서.xlsx","자재소요산출표.xlsx","입고물류설비현황.xlsx","재고수불이력.csv","설비사양서.pdf"];
