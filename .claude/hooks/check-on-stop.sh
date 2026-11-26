#!/bin/sh
# Claude가 한 턴을 끝낼 때 npm run check(lint + 타입 체크 + 테스트, 약 2초)를 돌린다.
# 실패하면 exit 2로 끝내지 못하게 막고, 실패 내용을 Claude에게 돌려줘서 고치게 한다.
input=$(cat)
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

if out=$(npm run --silent check 2>&1); then
  exit 0
fi

# 이 훅 때문에 이미 한 번 다시 작업한 뒤라면 또 막지 않는다(무한 반복 방지). 대신 사용자에게 알린다.
if printf '%s' "$input" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  jq -n --arg m "npm run check가 아직 실패합니다. 터미널에서 npm run check로 확인해 주세요." '{systemMessage: $m}'
  exit 0
fi

{ echo "npm run check 실패. 아래 문제를 고친 뒤 작업을 끝내세요."; printf '%s\n' "$out" | tail -n 40; } >&2
exit 2
