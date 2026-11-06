import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "gemini-3.8-flash";
const MAX_INPUT_CHARS = 24000;

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API 키가 설정되지 않았습니다. Vercel 환경변수 GEMINI_API_KEY를 등록해 주세요.", code: "MISSING_API_KEY" },
      { status: 503 }
    );
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (typeof body.content !== "string" || !body.content.trim()) {
    return NextResponse.json({ error: "분석할 설비 특성표 또는 운용계획 내용을 입력해 주세요." }, { status: 400 });
  }
  if (body.content.length > MAX_INPUT_CHARS) {
    return NextResponse.json({ error: "입력 내용이 너무 깁니다. 24,000자 이하로 나누어 분석해 주세요." }, { status: 413 });
  }

  const prompt = `당신은 제조 현장의 자재운반 설비 관리 검토자입니다.
아래 자료를 바탕으로 직무능력 3.1(공정별·품목별 자재의 입고·출고·운반에 필요한 설비/기기의 특성표 작성)과 3.2(공정별·품목별 자재 입고·출고·운반 설비의 운용계획 수립)만 검토하세요.

검토 원칙:
- 자료에 없는 수치, 법규, 설비 제원, 안전인증을 추정하거나 만들어내지 마세요.
- 근거가 없으면 "자료 확인 필요"라고 표시하세요.
- 적재하중/견인하중, 단위, 운반거리, 처리량, 이동 경로, 교차·혼잡 구간, 설비 대수, 가동률, 교대·충전·정비시간을 서로 대조하세요.
- 적합/부적합을 단정하기 어려우면 보류로 판단하고 필요한 추가자료를 구체적으로 적으세요.
- AI 검토는 의사결정 보조이며 최종 승인은 담당자가 해야 한다고 명시하세요.

다음 형식으로 한국어 보고서를 작성하세요:
1. 종합 판정(승인 권고/보완 후 재검토/운영 불가 권고 중 하나와 이유)
2. 3.1 설비 특성표 검토(대상 자재, 입고·출고·운반 경로, 설비 종류, 주요 제원, 정격하중, 처리능력, 누락 항목)
3. 3.2 운용계획 검토(설비 수량·배치, 시간대별 운용·배차, 피크 물동량 대응, 예비 설비, 공정 간 동선)
4. 안전·점검·정비 검토(자료에 있는 내용만 평가하고 누락사항 표시)
5. 주요 위험 및 근거(표 형태: 항목 / 자료상 근거 / 위험 / 추가 확인사항)
6. 우선 보완 조치(우선순위 순서)
7. 최종 담당자 확인 체크리스트

분석 대상 자료:
${body.content}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 3000, thinkingConfig: { thinkingLevel: "low" } },
        }),
        cache: "no-store",
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const googleMessage = payload?.error?.message || "";
      if (response.status === 429 || payload?.error?.status === "RESOURCE_EXHAUSTED") {
        return NextResponse.json(
          { error: "Gemini 무료 사용 한도 또는 요청 속도 제한에 도달했습니다. 유료 API로 전환하지 않고 요청을 차단했습니다. 잠시 후 또는 한도 초기화 후 다시 시도해 주세요.", code: "FREE_TIER_LIMIT" },
          { status: 429 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: "이 API 프로젝트에서 Gemini 무료 이용 권한이 없거나 접근이 거부되었습니다. 유료 결제를 활성화하지 말고 Google AI Studio에서 프로젝트의 무료 등급 상태를 확인해 주세요.", code: "FREE_TIER_ACCESS_DENIED" },
          { status: 403 }
        );
      }
      console.error("Gemini API error:", response.status, googleMessage);
      return NextResponse.json(
        { error: "Gemini API 요청에 실패했습니다. API 키, 모델 접근 권한 및 프로젝트 설정을 확인해 주세요.", code: "GEMINI_API_ERROR" },
        { status: response.status >= 500 ? 502 : 400 }
      );
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return NextResponse.json({ error: "Gemini가 분석 결과를 반환하지 않았습니다.", code: "EMPTY_RESPONSE" }, { status: 502 });
    }

    return NextResponse.json({ analysis: text, model: MODEL });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return NextResponse.json(
      { error: "Gemini API에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.", code: "NETWORK_ERROR" },
      { status: 502 }
    );
  }
}
