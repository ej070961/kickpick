# ADR 0003: 선수 관리 구조와 UX 개선 목표

## 상태

Accepted

## 날짜

2026-08-09

## 배경

KickPick의 선수 관리는 자동 포메이션 생성 품질을 결정하는 기본 데이터 입력 화면이다. 현재 `/players` 화면은 선수 생성, 수정, 삭제, 드래그 기반 우선순위 정렬을 한 화면에서 제공한다.

구현은 FSD 기준으로 크게 다음처럼 나뉘어 있다.

```txt
views/players
  -> 선수 목록 조회와 화면 조립

features/player-manage
  -> 선수 생성, 수정, 삭제 액션과 폼 UI

features/priority-reorder
  -> 선수 우선순위 드래그 정렬과 저장 액션

entities/player
  -> 선수 타입

entities/position
  -> 포지션 코드와 포지션 그룹
```

큰 방향은 제품 문서와 맞지만, 코드 리뷰 결과 다음 개선 필요가 확인되었다.

- 선수 조회와 수정/삭제가 `current team`을 명시적으로 사용하지 않고 RLS에 많이 의존한다.
- 우선순위 저장이 여러 개별 update로 처리되어 일부 실패 시 UI와 DB 상태가 어긋날 수 있다.
- 선수 관리 route에 스켈레톤 UI가 없다.
- 선수 카드의 정보 구조는 기본적으로 직관적이지만, 긴 이름과 모바일 액션 배치에 대한 방어가 부족하다.
- “자동 배치 우선순위” 같은 문구가 내부 구현 개념에 가까워 신규 사용자에게 다소 딱딱하게 느껴질 수 있다.
- 포지션 입력과 카드 표기가 코드값 중심이라 축구 포지션에 익숙하지 않은 사용자에게 친절하지 않을 수 있다.

## 결정

선수 관리 개선은 “명단을 빠르게 만들고, 경기 배치에 쓰이는 순서를 안심하고 정리하는 화면”을 목표로 한다.

이번 개선의 핵심 목표는 다음과 같다.

1. 선수 데이터 조회, 수정, 삭제, 우선순위 저장은 모두 `current team` 기준을 명시한다.
2. 우선순위 저장은 실패 여부를 사용자에게 정확히 보여주고, 일부 저장 성공 상태를 방치하지 않는다.
3. 선수 관리 route에 스켈레톤 UI를 추가해 목록 로딩 중에도 화면 구조를 예측할 수 있게 한다.
4. 선수 카드는 등번호, 이름, 주 포지션, 부 포지션이 한눈에 들어오도록 유지하되, 모바일에서 긴 텍스트와 액션 버튼이 깨지지 않게 보강한다.
5. 사용자-facing 문구는 내부 용어보다 실제 사용 목적을 설명한다.
6. 포지션 코드는 유지하되, 필요 위치에서는 한국어 설명 label을 함께 제공한다.

## 작업 목표

### 1단계: 데이터 소유권 명시

`/players` 화면과 선수 관리 서버 액션은 현재 사용자의 current team id를 기준으로 동작해야 한다.

권장 변경:

```txt
PlayersPage.getPlayers()
  -> requireCurrentTeamId()
  -> players where team_id = currentTeamId and is_deleted = false

updatePlayer()
  -> requireCurrentTeamId()
  -> players update where id = playerId and team_id = currentTeamId and is_deleted = false

deletePlayer()
  -> requireCurrentTeamId()
  -> players soft delete where id = playerId and team_id = currentTeamId
```

RLS는 계속 최종 방어선으로 유지한다. 다만 애플리케이션 로직도 문서의 current team 정책을 직접 표현해야 한다.

### 2단계: 우선순위 저장 안정화

현재 우선순위 저장은 선수 id 배열을 받아 각 row를 병렬 update한다. 이 방식은 일부 update 실패를 구분하기 어렵고, UI가 실패를 저장 완료로 오해할 수 있다.

권장 정책:

1. 서버 액션은 전달받은 선수 id가 current team의 active 선수 목록과 일치하는지 확인한다.
2. 누락되었거나 다른 팀/삭제 선수 id가 섞이면 저장하지 않는다.
3. 저장 실패 시 `{ success: false, message }` 형태의 결과를 반환한다.
4. 클라이언트는 성공일 때만 dirty 상태를 해제한다.
5. 가능하면 DB RPC로 순위 변경을 하나의 transaction으로 묶는다.

권장 RPC 이름:

```txt
replace_player_priorities(
  p_player_ids uuid[]
)
```

RPC 내부 책임:

- `auth.uid()` 소유 current team의 active 선수만 대상으로 한다.
- 전달받은 id 배열과 active 선수 목록의 정합성을 검증한다.
- `priority_rank`를 1부터 순서대로 갱신한다.
- 중간 실패 시 전체 변경을 rollback한다.

초기 구현에서는 RPC 없이 서버 액션에서 순차 update와 에러 확인을 먼저 적용할 수 있다. 단, 최종 목표는 원자적 저장이다.

### 3단계: 스켈레톤 UI

선수 관리 route에 `loading.tsx`를 추가한다.

권장 구조:

```txt
src/app/(main)/players/loading.tsx
src/features/player-manage/ui/PlayersSkeleton.tsx
```

스켈레톤은 실제 화면 구조를 따라야 한다.

- 페이지 헤더 영역
- `선수 추가` 버튼 자리
- 목록 요약 카드 자리
- 선수 카드 3~5개
- 모바일과 데스크톱 모두에서 실제 카드 폭과 비슷한 레이아웃

스켈레톤은 단순 회색 박스가 아니라, 사용자가 곧 어떤 정보를 보게 될지 예측할 수 있는 형태를 우선한다.

### 4단계: 선수 카드 UX

선수 카드는 경기 전 현장에서 빠르게 훑는 화면이므로 정보 위계를 명확히 유지한다.

권장 정보 순서:

```txt
드래그 핸들
등번호 + 선수명
주 포지션
부 포지션
편집 / 삭제
```

개선 포인트:

- 긴 선수명은 모바일에서 줄바꿈 또는 clamp 처리한다.
- 우선순위는 목록 순서와 드래그 핸들로 충분히 전달하고, 카드 안에 별도 순위 라벨을 반복하지 않는다.
- 등번호는 선수명 앞에 `No.10`처럼 표시해 우선순위와 구분한다.
- 주 포지션은 가장 강한 badge로 표시한다.
- 부 포지션이 없을 때는 별도 빈 상태 badge를 렌더링하지 않아 카드 밀도를 낮춘다.
- 편집/삭제 버튼은 모바일에서 아이콘만 표시하고, 데스크톱에서만 텍스트 라벨을 함께 표시한다.
- 삭제 확인은 브라우저 confirm보다 앱 내부 dialog로 전환한다.

### 5단계: 문구 개선

선수 관리 화면의 문구는 사용자가 해야 할 일을 중심으로 표현한다.

권장 문구:

```txt
타이틀: 선수 명단
설명: 경기 배치에 사용할 선수 정보와 순서를 정리하세요.

목록 요약: 등록 선수 {count}명
보조 문구: 위에 있을수록 자동 배치에서 먼저 고려돼요.

저장 버튼:
- 변경 전: 변경 없음
- 변경 후: 순서 저장
- 저장 중: 저장 중
- 저장 성공 후: 저장됨

빈 상태:
아직 등록된 선수가 없어요. 첫 선수를 추가해 명단을 만들어보세요.
```

“자동 배치 우선순위”는 정확하지만 내부 로직 중심의 표현이다. 설명이 필요한 위치에서는 “경기에 먼저 배치할 순서”처럼 사용자 행동에 가까운 문구를 우선한다.

### 6단계: 포지션 표시 개선

DB와 내부 타입은 기존 포지션 코드를 유지한다.

```txt
GK, CB, CDM, CM, CAM, LW, CF, RW ...
```

UI에서는 코드만 보여주는 대신 필요하면 설명 label을 함께 제공한다. 다만 선수 카드의 포지션 뱃지는 공간이 좁으므로 코드 중심으로 유지하고, 설명은 뱃지 밖의 보조 UI에서 제공한다.

권장 표시 방식:

```txt
선수 카드 뱃지: RW
선수 카드 보조 설명: 오른쪽 윙어
폼 select option: RW - 오른쪽 윙어
모바일 도움말/tooltip: 오른쪽 윙어
```

카드에서는 뱃지 내부 텍스트를 짧게 유지한다. 설명 label은 다음 방식 중 화면 밀도에 맞게 선택한다.

- 폼과 선택 목록: `RW - 오른쪽 윙어`처럼 코드와 설명을 함께 표시한다.
- 선수 카드: 기본 뱃지는 `RW`만 표시하고, 뱃지 아래 또는 hover/focus tooltip에서 설명을 제공한다.
- 부 포지션 체크칩: `RW 오른쪽 W`처럼 짧은 코드와 compact label만 표시한다.
- 모바일: hover에 의존하지 않고, 포지션 선택 화면 또는 편집 모달에서 설명을 항상 볼 수 있게 한다.

시각 요소는 과하게 장식하지 않고 정보를 빠르게 구분하는 용도로만 사용한다. 이모지는 포지션 맥락과 맞지 않으면 사용하지 않는다. 선수 카드에서는 코드 중심의 짧은 뱃지를 사용하고, 폼에서는 select option의 설명 label로 선택을 돕는다.

선수 카드 예시:

```txt
No.10 홍길동
CB    LB · RB
```

폼에서는 주 포지션을 select로 유지한다. 포지션 후보가 많아 카드형 그리드로 펼쳐지면 모달 높이가 커지고 가시성이 떨어지므로, 주 포지션은 한 줄 선택 UI를 우선한다.

```txt
주 포지션 select
GK - 골키퍼
CB - 센터백
CM - 중앙 미드필더
RW - 오른쪽 윙어
```

선택된 포지션은 배경과 테두리를 강화하고, 보조 포지션은 outline 스타일로 구분한다.

```txt
부 포지션 선택
[ LB 왼쪽 SB ] [ RB 오른쪽 SB ] [ CDM 수비 MF ] [ CM 중앙 MF ]
```

카드에서 권장하는 최종 형태:

- 주 포지션: `CB`처럼 코드 중심으로 표시하고, 필요하면 작은 `DF` 그룹 약어를 붙인다.
- 부 포지션: `LB · RB`처럼 코드만 작은 outline 뱃지로 표시한다.
- 포지션 설명: 카드에는 항상 길게 노출하지 않고, 편집 모달이나 선택 UI에서 확인하게 한다.
- 폼 UI: 주 포지션은 select, 부 포지션은 짧은 체크칩을 사용한다.
- 색상: 포지션 그룹별로 은은한 배경색을 다르게 주되, 포지션 코드와 그룹 약어가 먼저 읽히게 한다.
- 접근성: 시각적 약어만으로 의미가 사라지지 않도록 `aria-label`에는 전체 포지션 설명을 포함한다.

권장 위치:

```txt
src/entities/position/config/positionLabels.ts
```

포지션 설명은 선수 관리 폼, 선수 카드, 경기 생성 선수 선택 UI에서 재사용 가능하게 `entities/position`에 둔다.

## 제외 범위

이번 개선에서 포함하지 않는 작업:

- 선수 검색/필터 전체 기능
- 선수 통계, 출전 기록, 출석 상태
- 선수별 사진 또는 아바타 업로드
- 멀티팀 선택 UI
- role 기반 팀 권한
- 경기 생성/편집 알고리즘 변경

단, 선수 관리의 포지션 label 개선이 다른 화면에도 쉽게 재사용될 수 있도록 entity config로 분리하는 것은 포함한다.

## DB 고려사항

문서상 `players`는 다음 invariant를 가진다.

- `team_id`는 `teams(id)`를 참조한다.
- `priority_rank`는 양수이며 낮을수록 먼저 고려된다.
- 삭제는 `is_deleted = true` soft delete를 우선한다.
- RLS는 `teams.owner_user_id = auth.uid()` ownership chain을 따른다.

로컬 마이그레이션에는 선수 테이블 제약과 RLS 정책이 포함되어 있지 않다. 따라서 실제 Supabase schema가 `docs/database-schema.md`와 일치하는지 별도 확인이 필요하다.

권장 확인 항목:

```txt
players.team_id foreign key
players.priority_rank check priority_rank > 0
players.player_number check player_number between 0 and 99
players.sub_positions default '{}'
players.is_deleted default false
players RLS enabled
players select/insert/update/delete policies use teams.owner_user_id = auth.uid()
```

우선순위 저장을 RPC로 전환할 경우, RPC는 RLS 우회 여부를 신중히 결정해야 한다. `security invoker`로 충분하면 그 방식을 우선하고, `security definer`가 필요하면 함수 내부에서 `auth.uid()`와 팀 소유권을 직접 검증해야 한다.

## 성공 기준

개선 완료 후 다음을 만족해야 한다.

- `/players`는 current team 선수만 조회한다.
- 선수 수정/삭제는 current team 조건 없이 성공하지 않는다.
- 우선순위 저장 실패 시 UI가 “저장 완료”를 보여주지 않는다.
- 선수 관리 로딩 중 스켈레톤이 표시된다.
- 모바일에서 긴 선수명, 긴 포지션 목록, 편집/삭제 버튼이 겹치지 않는다.
- 주요 문구가 사용자의 행동과 결과를 설명한다.
- 포지션 코드는 유지하면서도 필요한 화면에서 한국어 label을 제공한다.
- 관련 구현 변경 시 `docs/project-design.md`, `docs/component-conventions.md`, `docs/database-schema.md`와 불일치가 생기지 않는다.

## 구현 순서

권장 순서:

1. current team 기반 조회/수정/삭제 조건 보강
2. 우선순위 저장 결과 반환과 UI 실패 처리
3. 선수 관리 스켈레톤 UI 추가
4. 선수 카드 모바일 레이아웃과 긴 텍스트 방어
5. 삭제 확인 dialog 전환
6. 포지션 label config 추가와 폼/카드 문구 개선
7. 실제 Supabase schema와 RLS 정책 확인 후 필요 시 migration 추가
