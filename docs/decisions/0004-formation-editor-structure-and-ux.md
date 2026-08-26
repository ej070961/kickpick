# ADR 0004: 포메이션 편집기 구조와 UX 확장

## 상태

Accepted

## 날짜

2026-08-19

## 배경

포메이션 편집기는 KickPick의 핵심 작업 화면이다. 현재 사용자는 경기 상세 화면에서 쿼터별 포메이션을 확인하고, 선수 교체, 후보 선수 투입, 명단 수정, 포메이션 변경, 저장, 현재 쿼터 PNG 내보내기를 수행한다.

현재 구현은 기능 흐름은 맞지만, `FormationEditorPage`와 `FormationEditorClient`의 책임이 커지고 있다.

- `FormationEditorPage`가 화면 조립 외에 Supabase 조회, DB row 타입, row 변환, 후보 선수 계산을 함께 가진다.
- `FormationEditorClient`가 UI 조립 외에 저장, PNG 내보내기, 명단 추가/제거, 게스트 저장 액션 흐름을 함께 가진다.
- 일부 타입은 필드의 도메인 의미를 코드만 보고 파악하기 어렵다.
- 앞으로 경기명 수정, 쿼터 순서 변경, 모든 쿼터 사진 일괄 저장이 추가될 예정이라 현재 구조 그대로 확장하면 화면 컨테이너가 더 복잡해질 가능성이 높다.

## 결정

포메이션 편집기는 새 추상화를 과하게 추가하지 않고, 기존 `formation-editor` feature 내부에서 책임을 더 선명하게 나눈다.

1. `FormationEditorPage`는 페이지 헤더와 `FormationEditorClient` 연결만 담당한다.
2. 초기 데이터 조회와 조립은 `formationEditorQueries.ts`에서 담당한다.
3. 데이터 소스 응답 타입과 편집기 상태 타입은 구분하되, “서버 타입/클라이언트 타입”처럼 실행 환경 기준으로 나누지 않는다.
4. 타입 필드에는 역할을 알 수 있는 짧은 주석을 둔다.
5. mapper 함수는 feature 내부 문맥을 활용해 짧고 직접적인 이름을 쓴다.
6. 클라이언트 컨테이너의 명단, 저장, 내보내기 흐름은 전용 hook으로 분리한다.
7. 경기명 수정, 쿼터 순서 변경, 전체 쿼터 사진 저장은 포메이션 편집기 안의 기존 작업 흐름을 방해하지 않는 보조 액션으로 제공한다.
8. 추후 Supabase 직접 조회를 HTTP API 또는 다른 data provider로 교체하더라도 `EditorPlayer`, `EditorQuarter`, `EditorSlot` 등 편집기 상태 타입은 유지한다.

## 구조 방향

권장 파일 구조:

```txt
views/formation-editor/
  FormationEditorPage.tsx

features/formation-editor/
  api/
    formationEditorQueries.ts
    formationEditorRows.ts
    formationEditorDto.ts
  lib/
    formationEditorMappers.ts
    formationEditorFormat.ts
    formationEditorSlots.ts
    formationEditorSummary.ts
    regenerateFormationSlots.ts
  model/
    types.ts
    useFormationEditorState.ts
    useEditorRoster.ts
    useEditorSave.ts
    useFormationExport.ts
    useRegeneration.ts
  ui/
    FormationEditorClient.tsx
    FormationEditorMainArea.tsx
    FormationEditorSidePanel.tsx
    MatchNameDialog.tsx
    QuarterOrderDialog.tsx
    QuarterExportDialog.tsx
```

별도 `formationEditorViewModel.ts`는 만들지 않는다. 현재 규모에서는 `ViewModel`이라는 이름이 책임을 모호하게 만들 수 있다. 초기 화면에 필요한 데이터 조립은 `formationEditorQueries.ts`의 `getFormationEditorData`가 맡는다.

`formationEditorRows.ts`는 Supabase를 직접 사용하는 동안에만 필요한 adapter 내부 타입이다. API 서버를 별도로 두거나 Supabase 호출을 대체하면 이 파일은 제거되거나 `formationEditorDto.ts`로 대체될 수 있다. 반대로 `model/types.ts`의 editor 타입은 UI와 편집 로직의 장기 계약으로 유지한다.

## Page 책임

`FormationEditorPage`는 다음 책임만 가진다.

```txt
getFormationEditorData(matchId)
  -> PageHeader 렌더링
  -> FormationEditorClient 렌더링
```

권장 형태:

```tsx
export async function FormationEditorPage({ matchId }: Props) {
  const data = await getFormationEditorData(matchId);

  return (
    <section>
      <PageHeader
        title={data.match.name}
        description={`${data.match.formationLabel} / ${data.match.quarterCount}쿼터 자동 배치 초안입니다.`}
      />
      <FormationEditorClient {...data.editor} />
    </section>
  );
}
```

## Query 책임

`formationEditorQueries.ts`는 화면 초기화에 필요한 데이터를 가져오고, 편집기 UI가 바로 사용할 수 있는 형태로 조립한다.

권장 함수:

```ts
getFormationEditorData(matchId);
getMatchDetail({ matchId, teamId });
getMatchQuarters(matchId);
getMatchPlayers(matchId);
getRosterPlayers(teamId);
```

현재 구현에서는 각 query가 Supabase row를 읽는다. 추후 API로 전환하면 query 함수의 public contract는 유지하고 내부 구현만 교체한다.

```txt
현재:
Supabase row -> mapper -> Editor 타입

추후:
HTTP API DTO -> mapper -> Editor 타입
```

따라서 UI와 hook은 Supabase row, API DTO, DB 컬럼명을 알면 안 된다. `FormationEditorClient`가 받는 props와 `useFormationEditorState`가 다루는 값은 항상 `match` 의미 데이터와 editor 타입이어야 한다.

`getFormationEditorData`의 반환 타입은 page와 client가 이해하기 쉬운 이름을 사용한다.

```ts
export type FormationEditorData = {
  /** 페이지 헤더와 export에서 공통으로 사용하는 경기 정보 */
  match: FormationEditorMatch;
  /** 편집기 client에 그대로 전달할 초기 props */
  editor: FormationEditorInitialProps;
};
```

## 타입 정책

타입은 “어디서 실행되는가”보다 “어떤 형태의 데이터인가”를 기준으로 나눈다.

유지할 구분:

- Data source 타입: Supabase row 또는 HTTP API DTO처럼 외부 데이터 소스 응답 형태를 표현한다.
- Editor 타입: 편집기 상태, UI props, 순수 편집 로직에서 사용하는 안정적인 camelCase 모델을 표현한다.

피할 구분:

- Server 타입
- Client 타입
- ViewModel 타입

이유:

- `server/client`는 실행 위치를 설명하지만 필드 구조를 설명하지 못한다.
- 현재 문제는 실행 환경 차이가 아니라 외부 데이터 소스 응답과 편집기 상태의 형태 차이다.
- 타입 이름은 변환 이유를 드러내야 한다.
- Supabase를 API로 교체해도 편집기 UI와 상태 hook이 흔들리지 않으려면 외부 응답 타입을 adapter 경계 안에 가둬야 한다.

## Data Source Adapter 경계

포메이션 편집기에서 데이터 변환 경계는 다음처럼 둔다.

```txt
Supabase row 또는 HTTP API DTO
  -> formationEditorQueries.ts
  -> formationEditorMappers.ts
  -> Editor 타입
  -> FormationEditorClient / hooks / UI
```

규칙:

- `ui/`와 `model/`은 `formationEditorRows.ts`를 import하지 않는다.
- `ui/`와 `model/`은 snake_case 필드를 알지 않는다.
- `formationEditorRows.ts`는 Supabase adapter 내부 타입으로 취급한다.
- API 전환 시 `formationEditorDto.ts`를 추가하고 mapper 입력만 row에서 DTO로 바꾼다.
- editor 타입은 player key, slot 위치, manual 여부처럼 화면 편집에 필요한 의미를 기준으로 유지한다.

API 전환 시 권장 DTO 예시:

```ts
export type FormationEditorMatchDto = {
  /** 편집 대상 경기 id */
  id: string;
  /** 사용자가 보는 경기명 */
  name: string | null;
  /** 파일명과 표시용 날짜 */
  matchDate: string | null;
  /** 생성된 쿼터 개수 */
  quarterCount: number;
  /** 경기 생성 시 선택된 포메이션 이름 */
  formation: string;
};
```

DTO는 API 응답 형태를 따르므로 camelCase일 수 있다. 그래도 editor 타입과는 분리한다. API 응답은 전송과 권한 경계의 계약이고, editor 타입은 화면 편집 규칙의 계약이기 때문이다.

## Row 타입 주석

`formationEditorRows.ts`의 row 타입은 DB 컬럼 의미를 필드별로 주석 처리한다. 주석은 구현 절차가 아니라 도메인 역할을 설명한다.

권장 예시:

```ts
export type MatchDetailRow = {
  /** 편집 대상 경기 id */
  id: string;
  /** 사용자가 경기 목록과 상세 화면에서 보는 경기명 */
  name: string | null;
  /** 파일명과 경기 식별에 사용하는 경기 날짜 */
  match_date: string | null;
  /** 생성된 쿼터 개수 */
  quarter_count: number;
  /** 경기 생성 시 선택되어 복사된 포메이션 이름 */
  formation: string;
};

export type SlotRow = {
  /** formation_slots row id. 슬롯 저장 시 식별자로 사용한다. */
  id: string;
  /** 포메이션 슬롯 코드 */
  slot_name: FormationSlotCode;
  /** 축구장 위 가로 위치 퍼센트 */
  x: number;
  /** 축구장 위 세로 위치 퍼센트 */
  y: number;
  /** 배정된 등록 선수 id. 게스트가 배정된 경우 null이다. */
  player_id: string | null;
  /** 배정된 경기 전용 게스트 id. 등록 선수가 배정된 경우 null이다. */
  guest_player_id: string | null;
  /** 포지션 적합도 점수. 미배정 또는 직접 조정된 슬롯에서는 null일 수 있다. */
  fit_score: number | null;
  /** 사용자가 직접 변경한 슬롯인지 여부 */
  is_manual: boolean;
};
```

## Editor 타입 주석

`model/types.ts`도 필드별 주석을 둔다. 특히 `playerId`처럼 실제 DB id가 아니라 editor key인 필드는 반드시 설명한다.

권장 예시:

```ts
export type EditorPlayer = {
  /** 편집기 내부 선수 key. player:{uuid} 또는 guest:{uuid} 형식이다. */
  id: string;
  /** 경기 전용 게스트이면 true */
  isGuest?: boolean;
  /** 자동 배치와 fit score 계산에 가장 먼저 사용하는 포지션 */
  mainPosition: PlayerPositionCode;
  /** 화면에 표시할 선수 이름 */
  name: string;
  /** 등번호. 없으면 이름만 표시한다. */
  playerNumber: number | null;
  /** 자동 배치 우선순위. 낮을수록 먼저 고려한다. */
  priorityRank: number;
  /** 보조 포지션 목록 */
  subPositions: PlayerPositionCode[];
};

export type EditorSlot = {
  /** formation_slots row id */
  id: string;
  /** 포메이션 슬롯 코드 */
  name: FormationSlotCode;
  /** 배정된 편집기 내부 선수 key. 미배정이면 null이다. */
  playerId: string | null;
  /** 축구장 위 가로 위치 퍼센트 */
  x: number;
  /** 축구장 위 세로 위치 퍼센트 */
  y: number;
  /** 포지션 적합도 점수 */
  fitScore: number | null;
  /** 사용자가 직접 변경한 슬롯인지 여부 */
  isManual: boolean;
};
```

## Mapper 네이밍

`formationEditorMappers.ts` 안에서는 파일명이 이미 문맥을 제공하므로 함수명을 짧게 둔다.

권장 이름:

```ts
toEditorPlayer(row);
toRosterCandidate(row);
toEditorSlot(row);
toEditorQuarter(row);
toEditorQuarters(rows);
toSaveSlot(slot);
splitPlayerKey(playerKey);
```

현재처럼 `mapMatchPlayerRowToEditorPlayer`는 정확하지만 반복 사용 시 읽는 비용이 크다. public API로 넓게 노출되는 함수가 아니라 feature 내부 mapper라면 짧은 이름이 낫다.

## Hook 네이밍

feature 내부 hook은 `FormationEditor` prefix를 반복하지 않는다. 파일 경로가 이미 feature 문맥을 제공한다.

권장 hook:

```ts
useFormationEditorState;
useEditorRoster;
useEditorSave;
useFormationExport;
useRegeneration;
```

권장 변수:

```ts
const editor = useFormationEditorState(...);
const roster = useEditorRoster(...);
const save = useEditorSave(...);
const exportImage = useFormationExport(...);
const regeneration = useRegeneration(...);
```

권장 반환 API:

```ts
roster.players;
roster.candidates;
roster.isPending;
roster.addPlayer;
roster.removePlayer;
roster.saveGuest;

save.isPending;
save.submit;

exportImage.ref;
exportImage.downloadCurrent;
exportImage.downloadAll;
```

핸들러를 컴포넌트 안에서 `handleAddRosterPlayer`처럼 다시 감싸지 않고, hook의 action을 그대로 하위 컴포넌트에 전달한다.

## UI 분리

`FormationEditorClient`는 상태 hook을 연결하고 화면 블록을 조립한다.

권장 분리:

```txt
FormationEditorClient
  -> FormationToolbar
  -> AssignmentSummary
  -> FormationEditorMainArea
  -> FormationEditorSidePanel
  -> MatchNameDialog
  -> RosterManagementDialog
  -> FormationRegenerationDialog
  -> QuarterOrderDialog
  -> QuarterExportDialog
```

`FormationEditorMainArea` 책임:

- 쿼터 탭 표시
- 활성 쿼터 변경
- 축구장 필드 렌더링
- 슬롯 선택

`FormationEditorSidePanel` 책임:

- 선택 슬롯 정보
- 후보 선수 목록
- 저장과 내보내기 액션
- 액션 메시지

## 추가 요구사항 1: 경기명 수정

### UX 목표

경기명 수정은 사용자가 경기 상세 화면에서 가장 자연스럽게 찾을 수 있어야 한다. 단, 포메이션 편집 흐름보다 우선순위가 높아서는 안 된다.

### UI 결정

페이지 헤더의 경기명 옆에 작은 편집 버튼을 둔다.

```txt
{경기명} [편집 아이콘]
4-3-3 / 4쿼터 자동 배치 초안입니다.
```

모바일에서는 제목 줄이 좁아질 수 있으므로 편집 버튼은 제목 오른쪽에 icon button으로 둔다. 버튼에는 접근성 label을 제공한다.

```txt
aria-label="경기명 수정"
```

버튼 클릭 시 `MatchNameDialog`를 연다.

Dialog 구성:

- input label: `경기명`
- placeholder: `예: 8월 셋째 주 자체전`
- 취소 버튼
- 저장 버튼

저장 성공 시:

- 페이지 헤더 title 갱신
- export 파일명 기준 갱신
- 경기 목록에서 보일 이름도 동일하게 저장

검증:

- 빈 문자열은 허용하지 않는다.
- 앞뒤 공백은 trim한다.
- 너무 긴 경기명은 UI 깨짐을 막기 위해 최대 길이를 둔다. 권장 최대 50자.

권장 hook/action:

```txt
actions/updateMatchName
model/useMatchName
ui/MatchNameDialog
```

권장 반환 API:

```ts
const matchName = useMatchName({
  initialName,
  matchId,
  onMessage: editor.setMessage,
});

matchName.value;
matchName.isPending;
matchName.open;
matchName.close;
matchName.submit;
```

### DB 영향

기존 `matches.name` 컬럼을 사용한다. 새 컬럼은 필요 없다. 서버 액션은 `requireCurrentTeamId()` 후 `matches.id`와 `matches.team_id`를 함께 조건으로 사용한다.

## 추가 요구사항 2: 쿼터 순서 변경

### UX 목표

쿼터 순서 변경은 “선수 배정과 슬롯을 통째로 옮기는 작업”임을 명확히 보여줘야 한다. 사용자는 3Q와 4Q를 바꾸면 해당 쿼터의 모든 슬롯 배정도 같이 이동한다고 이해해야 한다.

### UI 결정

`FormationToolbar`에 `쿼터 순서` 버튼을 추가한다.

버튼 위치:

```txt
포메이션 변경 | 선수 명단 | 쿼터 순서
```

`QuarterOrderDialog`에서 쿼터 카드를 세로 목록으로 보여준다.

카드 정보:

```txt
1Q
출전 11명 / 후보 N명
주요 배정: GK 홍길동, CF 김철수 ...
[위로] [아래로]
```

초기 구현은 drag and drop보다 위/아래 버튼을 우선한다. 경기장 현장에서 모바일 사용 비중이 높고, 버튼 방식이 구현과 접근성 모두 단순하다. 나중에 필요하면 drag handle을 추가한다.

동작 정책:

- 카드의 순서를 바꾸면 화면에서는 임시 순서로 미리 보여준다.
- 저장 전에는 실제 DB를 변경하지 않는다.
- 저장 버튼을 누르면 `quarter_formations.quarter_number`를 새 순서대로 갱신한다.
- 저장 성공 후 쿼터 탭과 활성 쿼터 라벨을 새 순서로 갱신한다.
- 슬롯 row는 이동하지 않는다. `quarter_formations` row가 가진 슬롯 묶음은 그대로 유지하고, `quarter_number`만 바꾼다.

예시:

```txt
변경 전:
quarter A = 1Q, slots A
quarter B = 2Q, slots B

1Q와 2Q 교체 후:
quarter A = 2Q, slots A
quarter B = 1Q, slots B
```

주의:

`quarter_number`에 `unique(match_id, quarter_number)` 제약이 있으므로 단순 순차 update는 중간에 충돌할 수 있다. 최종 구현은 RPC 또는 transaction 성격의 서버 함수를 사용한다.

권장 RPC:

```txt
reorder_match_quarters(
  p_match_id uuid,
  p_quarter_ids uuid[]
)
```

Expected behavior:

- 현재 사용자가 소유한 match인지 검증한다.
- 전달받은 quarter id 목록이 해당 match의 전체 quarter 목록과 정확히 일치하는지 검증한다.
- 임시 번호 또는 단일 SQL update 전략으로 unique 충돌 없이 `quarter_number`를 재배치한다.
- 모든 변경은 하나의 transaction으로 처리한다.

권장 hook/action:

```txt
actions/reorderMatchQuarters
model/useQuarterOrder
ui/QuarterOrderDialog
```

권장 반환 API:

```ts
const quarterOrder = useQuarterOrder({
  quarters: editor.editedQuarters,
  onApply: editor.replaceEditedQuarters,
  onMessage: editor.setMessage,
});

quarterOrder.isOpen;
quarterOrder.open;
quarterOrder.close;
quarterOrder.moveUp;
quarterOrder.moveDown;
quarterOrder.submit;
```

### DB 영향

기존 `quarter_formations.quarter_number`를 사용한다. 새 컬럼은 필요 없다. 단, 안정적인 저장을 위해 RPC 추가를 권장한다. RPC를 추가하면 `docs/database-schema.md`에 함수와 동작을 함께 문서화한다.

## 추가 요구사항 3: 모든 쿼터 사진 일괄 저장

### UX 목표

전체 쿼터 저장은 경기 전 팀 공유를 빠르게 만드는 기능이다. 사용자는 현재 보고 있는 쿼터만 저장할지, 전체 쿼터를 저장할지 명확히 선택할 수 있어야 한다.

### UI 결정

`FormationEditorActions`의 내보내기 영역을 두 액션으로 나눈다.

```txt
[현재 쿼터 저장] [전체 쿼터 저장]
```

모바일에서는 버튼이 줄바꿈되어도 터치 영역이 유지되도록 세로 배치를 허용한다.

전체 쿼터 저장 버튼 클릭 시 `QuarterExportDialog`를 연다.

Dialog 구성:

- 저장 대상: `1Q, 2Q, 3Q, 4Q`
- 파일명 기준: 현재 경기명과 날짜
- 저장 방식 안내: 브라우저 설정에 따라 여러 PNG가 각각 다운로드될 수 있음
- 취소 버튼
- 저장 시작 버튼

내보내기 정책:

- MVP는 ZIP 없이 쿼터별 PNG를 순차 다운로드한다.
- 파일명은 `{경기명}_{날짜}_{n}Q.png` 형식을 사용한다.
- 전체 저장 중에는 버튼을 disabled 처리하고 진행 상태를 표시한다.
- 저장 도중 실패한 쿼터가 있으면 몇 Q가 실패했는지 메시지를 보여준다.

진행 표시:

```txt
전체 쿼터 저장 중 2 / 4
```

왜 ZIP을 MVP에서 제외하는가:

- 브라우저에서 여러 canvas를 이미지화하고 ZIP으로 묶으려면 추가 라이브러리와 메모리 고려가 필요하다.
- 현재 제품 목표는 팀 채팅방 공유용 PNG 확보가 우선이다.
- ZIP은 “기록 보관” 목적이 강해 일괄 PNG 저장이 안정화된 뒤 추가해도 된다.

권장 hook:

```txt
model/useFormationExport
```

권장 반환 API:

```ts
exportImage.ref;
exportImage.isExporting;
exportImage.progress;
exportImage.downloadCurrent;
exportImage.downloadAll;
```

### 렌더링 전략

현재 `FormationField`는 활성 쿼터를 캡처하는 구조다. 전체 쿼터 저장에는 두 가지 선택지가 있다.

1. 쿼터를 순차로 활성화하고 같은 export ref를 캡처한다.
2. 화면 밖에 export 전용 `FormationField`를 임시 렌더링하고 순차 캡처한다.

결정:

MVP는 1번을 사용한다. 구현이 단순하고 기존 export 동작을 재사용할 수 있다. 단, 저장 중에는 사용자가 쿼터를 바꾸거나 슬롯을 편집하지 못하게 pending 상태를 걸어야 한다.

추후 품질 개선:

- 화면 깜빡임이나 활성 탭 변경이 불편하면 2번으로 전환한다.
- ZIP 저장을 추가할 때 export 전용 렌더링 영역으로 분리한다.

## 문구 방향

사용자-facing 문구는 내부 구현보다 실제 행동을 설명한다.

권장 문구:

```txt
경기명 수정
쿼터 순서
현재 쿼터 저장
전체 쿼터 저장
전체 쿼터 저장 중 {done} / {total}
쿼터 순서를 저장했어요.
경기명을 저장했어요.
{failedQuarters}Q 저장에 실패했어요. 다시 시도해주세요.
```

피할 문구:

```txt
ViewModel
quarter_formation 변경
일괄 export mutation
```

## 구현 순서

### 1단계: 구조 정리

- `FormationEditorPage`를 얇게 만든다.
- 초기 데이터 조회를 `getFormationEditorData`로 이동한다.
- row 타입과 editor 타입 필드 주석을 추가한다.
- mapper 이름을 `toEditorPlayer`, `toEditorSlot`처럼 단순화한다.

### 2단계: Client hook 분리

- `useEditorSave` 추가
- `useEditorRoster` 추가
- `useFormationExport` 추가
- 필요하면 `useFormationRegeneration`을 `useRegeneration`으로 축약한다.
- `FormationEditorMainArea`, `FormationEditorSidePanel`로 JSX를 분리한다.

### 3단계: 경기명 수정

- `updateMatchName` 서버 액션 추가
- `MatchNameDialog` 추가
- PageHeader와 export 파일명 상태 갱신

### 4단계: 쿼터 순서 변경

- `QuarterOrderDialog` 추가
- `useQuarterOrder` 추가
- `reorderMatchQuarters` 서버 액션 추가
- unique 충돌 방지를 위해 RPC 도입을 우선 검토한다.

### 5단계: 전체 쿼터 저장

- `useFormationExport.downloadAll` 추가
- `QuarterExportDialog` 추가
- 저장 진행 상태와 실패 메시지 추가

## 제외 범위

이번 결정에 포함하지 않는 작업:

- 쿼터 추가/삭제
- 경기 날짜 수정
- 경기 완료 상태 관리
- ZIP 저장
- 쿼터 순서 drag and drop
- 팀원에게 직접 공유하는 외부 연동
- 포메이션 자동 배치 알고리즘 변경

## 문서 동기화

구현 시 함께 확인할 문서:

- `docs/project-design.md`: 경기명 수정, 쿼터 순서 변경, 전체 쿼터 저장이 현재 준비 중인 기능에서 제공 기능으로 이동하는 시점에 갱신한다.
- `docs/component-conventions.md`: 타입 주석 정책이 전역 규칙으로 확정되면 컴포넌트 책임 분리 섹션에 반영한다.
- `docs/database-schema.md`: 쿼터 순서 저장 RPC를 추가하면 RPC signature와 expected behavior를 추가한다.
- `features/formation-editor/README.md`: 새 hook, dialog, action 파일 역할을 갱신한다.
