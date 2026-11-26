# demo-project — 채팅방 액션 아이템 도우미 (MVP)

채팅 내보내기 CSV(`Date,User,Message`)를 올리면 로컬 LLM(Ollama)이 대화를 요약하고, 방장이 처리할 액션 아이템을 뽑아 줍니다.

## 실행

```bash
ollama serve                      # 이미 실행 중이면 생략
ollama pull qwen3.8:27b-mlx       # 기본 모델 (다른 모델은 .env.local의 OLLAMA_MODEL로 변경)
cp .env.example .env.local        # 처음 한 번
npm install
npm run dev                       # http://localhost:3000
```

`fixtures/sample-chat.csv`로 바로 테스트할 수 있습니다.

## 구조

- `app/page.tsx` — 업로드 화면과 결과(요약 · 토픽 · 액션 아이템 체크리스트)
- `app/api/analyze/route.ts` — CSV를 받아 Ollama `/api/chat`에 JSON 스키마(`format`)와 함께 보냄
- `lib/schema.ts` — 결과 스키마(zod). 프롬프트 출력 형식과 응답 검증에 함께 사용
