# demo-project — 채팅방 액션 아이템 도우미 (MVP)

채팅 내보내기 CSV(`Date,User,Message`)를 올리면 로컬 LLM(Ollama)이 대화를 요약하고, 방장이 처리할 액션 아이템을 뽑아 줍니다.

## 실행

```bash
ollama serve                      # 이미 실행 중이면 생략
ollama pull qwen3.8:27b-mlx       # 기본 모델 (다른 모델은 .env.local의 OLLAMA_MODEL로 변경)
cp .env.example .env.local        # 처음 한 번
npm install
npm run dev                       # http://localhost:3000
npm test                          # API 라우트 테스트 (Ollama 불필요)
```

`fixtures/sample-chat.csv`로 바로 테스트할 수 있습니다.

## 문서

- [architecture.md](architecture.md): 데이터 흐름, 구성 요소, 설계 결정, 보안, 알려진 한계
