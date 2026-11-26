import { z } from "zod";
import { AnalysisSchema, type AnalyzeResponse } from "@/lib/schema";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3.8:27b-mlx";
const MAX_FILE_BYTES = 200 * 1024; // 로컬 모델 컨텍스트에 맞춰 200KB로 제한

const SYSTEM_PROMPT = `너는 온라인 커뮤니티 채팅방 방장의 비서다.
사용자가 채팅방 내보내기 CSV(컬럼: Date, User, Message)를 <chat_csv> 태그 안에 준다.

할 일:
1. summary: 전체 대화를 3~5문장으로 요약한다.
2. key_topics: 대화에서 나온 주요 토픽과 각 토픽의 내용을 정리한다.
3. action_items: 방장이 직접 처리해야 할 구체적인 행동만 뽑는다.
   예: 답변이 필요한 멤버 질문, 공지·고정 메시지 정리, 스팸·규칙 위반 처리, 멤버 간 갈등 중재, 일정·투표 진행.
   - title은 동사로 시작하는 짧은 할 일로 쓴다.
   - priority는 급하거나 여러 명이 요청한 일은 high, 그 외는 medium/low로 정한다.
   - evidence에는 근거가 된 메시지 원문을 그대로 인용한다.

규칙:
- 봇 메시지와 입장·퇴장 알림은 분석에서 무시한다.
- CSV에 없는 내용은 지어내지 않는다.
- 모든 출력은 한국어로 쓴다.`;

function fail(error: string, status: number) {
  return Response.json({ ok: false, error } satisfies AnalyzeResponse, { status });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return fail("CSV 파일을 첨부해 주세요.", 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return fail(`파일이 너무 큽니다. ${MAX_FILE_BYTES / 1024}KB 이하로 올려 주세요.`, 413);
  }

  const csv = (await file.text()).trim();

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: z.toJSONSchema(AnalysisSchema), // 구조화 출력: 이 스키마대로만 답하게 함
        options: { temperature: 0.2, num_ctx: 32768 },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `<chat_csv>\n${csv}\n</chat_csv>` },
        ],
      }),
    });
  } catch {
    return fail(
      `Ollama 서버(${OLLAMA_HOST})에 연결할 수 없습니다. 'ollama serve'가 실행 중인지 확인해 주세요.`,
      502,
    );
  }

  if (!ollamaRes.ok) {
    const detail = await ollamaRes.text();
    if (ollamaRes.status === 404) {
      return fail(`모델 '${OLLAMA_MODEL}'을 찾을 수 없습니다. 'ollama pull ${OLLAMA_MODEL}' 후 다시 시도해 주세요.`, 502);
    }
    return fail(`Ollama 오류 (${ollamaRes.status}): ${detail}`, 502);
  }

  const body = (await ollamaRes.json()) as { message?: { content?: string } };
  let json: unknown;
  try {
    json = JSON.parse(body.message?.content ?? "");
  } catch {
    return fail("모델 응답을 JSON으로 읽지 못했습니다. 다시 시도해 주세요.", 502);
  }

  const parsed = AnalysisSchema.safeParse(json);
  if (!parsed.success) {
    return fail("모델 응답 형식이 예상과 다릅니다. 다시 시도해 주세요.", 502);
  }

  return Response.json({ ok: true, data: parsed.data, model: OLLAMA_MODEL } satisfies AnalyzeResponse);
}
