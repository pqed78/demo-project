import { z } from "zod";

// LLM이 돌려줘야 하는 분석 결과의 형태.
// 이 스키마를 JSON Schema로 바꿔 Ollama의 `format`에 넘기고, 응답도 이 스키마로 검증한다.
export const AnalysisSchema = z.object({
  summary: z.string().describe("전체 대화 요약 (3~5문장)"),
  key_topics: z
    .array(
      z.object({
        topic: z.string().describe("토픽 이름"),
        summary: z.string().describe("해당 토픽에서 오간 내용 1~2문장"),
      }),
    )
    .describe("대화에서 나온 주요 토픽"),
  action_items: z
    .array(
      z.object({
        title: z.string().describe("방장이 할 일, 동사로 시작"),
        description: z.string().describe("왜, 무엇을 해야 하는지"),
        priority: z.enum(["high", "medium", "low"]),
        related_users: z.array(z.string()).describe("관련된 유저 이름"),
        evidence: z.string().describe("근거가 된 메시지 원문 인용"),
      }),
    )
    .describe("방장이 직접 처리해야 할 액션 아이템"),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

export type AnalyzeResponse =
  | { ok: true; data: Analysis; model: string }
  | { ok: false; error: string };
