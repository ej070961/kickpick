# formation-generate

경기 생성과 기존 경기의 포메이션 재배정에서 함께 쓰는 자동 배치 규칙을 소유한다. 이 feature는 UI나 DB 저장을 담당하지 않고, 입력된 선수·포메이션·쿼터 조건으로 배치 결과를 계산한다.

## 파일 역할

- `lib/generateQuarterFormations.ts`: 선수별 출전 quota, 쿼터 참가자 선택, 포지션 적합도와 우선순위를 반영해 전체 쿼터 슬롯 배치를 생성한다.
- `lib/calculateFitScore.ts`: 선수의 주·부 포지션과 포메이션 슬롯 간 적합도를 계산한다.
- `lib/calculateTargetQuotas.ts`: 총 슬롯 수와 선수 수, reduced quota 선택을 바탕으로 선수별 목표 출전량을 계산한다.
- `lib/quotaPlayers.ts`: GK 고정 여부에 따라 고정 GK와 quota 계산 대상 선수·슬롯 수를 계산한다.
- `model/types.ts`: 자동 배치 입력 선수와 생성 결과 타입을 정의한다.

## 사용처와 경계

- 경기 생성 흐름은 `features/match-create`에서 이 feature의 생성 함수를 호출하고, 반환 결과를 경기·쿼터·슬롯 DB row로 변환해 저장한다.
- 편집기 재배정은 `features/formation-editor`에서 전체 재배치에 이 생성 함수를 사용한다. 기존 쿼터 출전 인원을 보존하는 편집기 전용 재배정은 `formation-editor/lib`에 둔다.
- 선수/쿼터 DB row 변환과 Supabase 저장은 이 feature에 두지 않는다.
- quota 대상 선택 UI와 draft state는 경기 생성 흐름에 속하므로 `features/match-create/model/quotaSelection.ts`에 둔다. 자동 배치 알고리즘과 공유하는 quota 계산만 이 feature에서 관리한다.

## 변경 시 확인할 문서

- `docs/project-design.md`: 자동 배치 규칙과 GK 고정 정책
- `docs/database-schema.md`: 경기 참가자·쿼터·슬롯 저장 구조
- `features/match-create/README.md`
- `features/formation-editor/README.md`
