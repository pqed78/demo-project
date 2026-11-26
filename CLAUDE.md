@AGENTS.md

## 문서 관리

- 문서는 주제별 파일로 나눠 각각 작게 유지한다. 한 파일에 내용을 몰아넣지 않는다.
- `README.md`: 무엇을 하는 앱인지와 실행 방법만 짧게 쓴다.
- `architecture.md`: 데이터 흐름, 구성 요소, 설계 결정, 보안, 알려진 한계. 이 내용이 바뀌는 변경을 하면 같은 커밋에서 함께 갱신한다.
- 문서가 200줄을 넘으면 주제별 파일로 나누고 `README.md`의 "문서" 목록에 링크를 추가한다.

## 검증

- `npm run check`(lint + 타입 체크 + 테스트, 약 2초)가 기본 검사다. Claude가 작업을 끝낼 때 Stop 훅(`.claude/hooks/check-on-stop.sh`)이 자동으로 돌리고, 실패하면 고칠 때까지 끝내지 못한다.
- PR은 GitHub Actions CI(`.github/workflows/ci.yml`)에서 check와 빌드를 통과해야 `main`에 머지된다.
- 프롬프트, 모델, `route.ts`를 바꾸면 실제 Ollama로 샘플 CSV를 돌려 결과도 확인한다(CI에서는 못 돌림).
- 푸시하기 전에 대상 PR이 아직 열려 있는지 확인한다(`gh pr view`).
