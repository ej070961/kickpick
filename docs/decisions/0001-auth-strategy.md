# ADR 0001: KickPick 인증 전략

## 상태

Accepted

## 날짜

2026-08-08

## 배경

KickPick은 현재 Supabase Auth를 사용해 로그인 사용자의 팀 데이터를 관리한다. 데이터 소유권은 아래 흐름을 기준으로 한다.

```txt
auth.users
  -> teams.owner_user_id
    -> players
    -> formation_templates
    -> matches
```

즉, 사용자가 로그인하면 Supabase Auth의 user id가 생기고, KickPick은 그 user id에 연결된 팀 workspace를 찾아 선수, 포메이션, 경기 데이터를 보여준다.

현재 구현에는 이메일/비밀번호 로그인, 회원가입, Google OAuth 로그인이 포함되어 있다. 그러나 이메일 로그인 플로우가 안정적으로 동작하지 않고, 제품 타깃이 국내 아마추어 축구팀이라는 점을 고려하면 Google보다 접근성이 높은 SNS 로그인이 필요하다. 또한 사용자가 계정 연결 전에 서비스를 바로 경험할 수 있는 `로그인 없이 사용해보기` 기능도 필요하다.

## 결정

KickPick의 1차 인증 리팩터링은 다음 방향으로 진행한다.

1. 기본 SNS 로그인은 Kakao OAuth로 제공하고, Google OAuth는 보조 SNS 로그인으로 유지한다.
2. 이메일/비밀번호 로그인과 회원가입은 제거한다.
3. `로그인 없이 사용해보기`는 완전한 비로그인 모드가 아니라 Supabase Anonymous Sign-In으로 구현한다.
4. OAuth 사용자와 익명 사용자 모두 기존 `teams.owner_user_id` 소유권 모델을 사용한다.
5. 로그인 성공 또는 익명 로그인 성공 후에는 항상 사용자의 팀 workspace를 보장한다.
6. 인증 리팩터링과 함께 `current team resolver` 기반을 정리하되, 팀 여러 개 생성/전환 UI는 이번 범위에 포함하지 않는다.

## 인증 방식별 의미

### Kakao 로그인

Kakao 로그인은 Supabase OAuth provider를 통해 처리한다.

사용자가 Kakao 버튼을 누르면 앱은 Supabase에 OAuth 로그인을 요청한다. Supabase는 사용자를 Kakao 인증 화면으로 보낸 뒤, 인증이 끝나면 다시 KickPick의 `/auth/callback`으로 돌려보낸다. callback route는 Supabase 세션을 만든 뒤 현재 사용자의 팀 workspace가 없으면 새로 만든다.

프론트엔드 관점에서는 다음 흐름으로 이해하면 된다.

```txt
로그인 버튼 클릭
  -> Supabase OAuth 요청
  -> Kakao 인증 화면
  -> /auth/callback
  -> Supabase 세션 저장
  -> 팀 workspace 보장
  -> 대시보드 이동
```

### 로그인 없이 사용해보기

`로그인 없이 사용해보기`는 DB를 공개로 열어두는 기능이 아니다. Supabase의 익명 로그인 기능을 사용해 임시 사용자 계정을 만든다.

익명 사용자도 Supabase Auth user id를 가진다. 따라서 현재 KickPick의 `auth.users -> teams.owner_user_id` 구조를 그대로 사용할 수 있다. 기존 RLS 정책도 큰 틀에서는 유지할 수 있다.

프론트엔드 관점에서는 일반 로그인보다 화면 입력이 적은 로그인이라고 생각하면 된다.

```txt
체험하기 버튼 클릭
  -> Supabase 익명 로그인
  -> 임시 auth user 생성
  -> 체험 팀 workspace 생성
  -> 대시보드 이동
```

## 왜 완전 비로그인 모드를 선택하지 않는가

완전 비로그인 모드는 브라우저 localStorage나 메모리 상태만으로 선수, 포메이션, 경기 데이터를 관리하는 방식이다. 처음에는 단순해 보이지만 현재 KickPick 구조와 잘 맞지 않는다.

선택하지 않은 이유:

- 기존 기능 대부분이 Supabase DB와 Server Action을 기준으로 동작한다.
- 비로그인 전용 저장소를 만들면 선수, 포메이션, 경기 생성, 편집, 내보내기 로직이 두 갈래로 나뉜다.
- 체험 데이터를 나중에 정식 계정으로 이어 붙이는 마이그레이션이 복잡해진다.
- RLS와 권한 검증을 우회하는 별도 경로가 생겨 유지보수 비용이 커진다.

따라서 체험 모드는 Supabase Anonymous Sign-In을 사용한다. 사용자는 로그인하지 않은 것처럼 빠르게 시작하지만, 내부적으로는 인증된 임시 사용자로 처리한다.

## 팀 workspace 생성 원칙

KickPick의 주요 데이터는 항상 팀에 속한다. 따라서 어떤 방식으로 인증하든 팀 workspace를 보장해야 한다.

권장 함수 책임:

- `ensureDefaultTeamForUser(userId, teamName)`: 특정 user id에 기본 팀이 없으면 생성한다.
- `getCurrentTeamId()`: 현재 선택된 팀 id를 조회한다. 1차 구현에서는 첫 번째 팀을 current team으로 간주한다.
- `ensureCurrentTeamId()`: 현재 로그인된 사용자의 current team id를 보장한다.
- `requireCurrentTeamId()`: 현재 로그인된 사용자의 current team id를 조회하고, 없으면 에러 또는 로그인 이동을 처리한다.

Kakao 로그인 기본 팀 이름:

```txt
{카카오 프로필 이름 또는 이메일} 팀
```

익명 체험 기본 팀 이름:

```txt
KickPick 체험 팀
```

## 멀티팀 확장 방향

현재 DB 구조는 `teams.owner_user_id`에 여러 팀이 연결될 수 있는 형태다. 단, 현재 앱 로직은 첫 번째 팀을 current team으로 사용하는 1팀 UX를 전제로 한다.

이번 인증 리팩터링에서는 멀티팀 전체 기능을 구현하지 않는다. 대신 팀 조회와 보장 로직을 `current team resolver`로 감싸서 나중에 팀 선택 UI를 추가할 때 변경 범위를 줄인다.

1차 정책:

```txt
현재 사용자 조회
  -> 사용자의 팀 목록 중 첫 번째 팀 조회
  -> 없으면 기본 팀 생성
  -> 해당 팀을 current team으로 사용
```

추후 멀티팀 정책:

```txt
현재 사용자 조회
  -> 쿠키, URL, 사용자 설정 등에 저장된 selectedTeamId 조회
  -> 해당 팀 접근 권한 확인
  -> 해당 팀을 current team으로 사용
```

이번 범위에 포함하지 않는 작업:

- 팀 여러 개 생성 UI
- 팀 전환 UI
- 팀 삭제/수정 관리 화면
- 팀 멤버 초대
- role 기반 권한
- `team_members` 테이블 도입

## UX 방향

로그인 화면의 우선순위는 다음과 같다.

1. `Kakao로 계속하기`
2. `Google로 계속하기`
3. `로그인 없이 사용해보기`

이메일 인증 설정, SMTP, redirect 문제로 제품 진입이 막히는 상황을 줄이기 위해 이메일 로그인은 제공하지 않는다.

체험 사용자에게는 다음 안내가 필요하다.

- 체험 데이터는 현재 브라우저와 세션에 묶일 수 있다.
- 로그아웃하거나 브라우저 데이터를 삭제하면 같은 체험 데이터에 다시 접근하지 못할 수 있다.
- 데이터를 계속 보관하려면 SNS 계정으로 연결하는 기능이 필요하다.

## 구현 계획

### 1단계: 인증 액션 정리

현재 `signInWithGoogle()`처럼 provider가 고정된 함수를 범용 OAuth 함수로 바꾼다.

권장 구조:

```txt
features/auth/
  actions/
    authActions.ts
  ui/
    LoginForm.tsx
    OAuthLoginButton.tsx
    TrialLoginButton.tsx
```

권장 액션:

```ts
signInWithOAuth(formData);
signInAnonymously();
signOut();
ensureDefaultTeamForUser(userId, teamName);
getCurrentTeamId();
```

### 2단계: Kakao OAuth 추가

Supabase Dashboard에서 Kakao provider를 활성화한다. Kakao Developers에서도 앱과 redirect URI를 설정해야 한다.

앱 코드에서는 provider 값을 `kakao`로 넘긴다.

```ts
await supabase.auth.signInWithOAuth({
  provider: "kakao",
  options: {
    redirectTo: `${origin}/auth/callback?next=/`,
  },
});
```

### 3단계: 익명 체험 추가

Supabase Dashboard에서 Anonymous Sign-Ins를 활성화한다.

앱 코드에서는 체험하기 버튼이 다음 액션을 호출한다.

```ts
const { data, error } = await supabase.auth.signInAnonymously();
```

성공 후 `data.user.id`를 기준으로 `KickPick 체험 팀`을 생성한다.

### 4단계: 로그인 UI 리팩터링

`LoginForm`은 인증 방식별 책임을 컴포넌트로 분리한다.

- `OAuthLoginButton`: Kakao 등 SNS 로그인 버튼
- `TrialLoginButton`: 로그인 없이 체험하기 버튼

### 5단계: 체험 상태 표시

익명 사용자인지 확인해 상단 또는 설정 영역에 체험 상태를 표시한다.

예:

```txt
체험 모드로 사용 중입니다. 데이터를 계속 보관하려면 계정을 연결하세요.
```

Supabase 익명 사용자는 JWT의 `is_anonymous` claim으로 구분할 수 있다.

## RLS와 보안 고려사항

익명 사용자는 완전한 비회원이 아니라 Supabase Auth user다. Supabase 문서 기준으로 익명 사용자도 `authenticated` role을 사용한다.

현재 RLS가 `teams.owner_user_id = auth.uid()`를 기준으로 작성되어 있다면, 익명 사용자도 자신이 만든 팀 데이터에만 접근할 수 있다.

주의할 점:

- 익명 사용자도 DB row를 만들 수 있으므로 남용 방지 전략이 필요하다.
- Supabase의 anonymous sign-in rate limit과 CAPTCHA 또는 Turnstile 설정을 검토한다.
- 오래된 익명 사용자와 그에 연결된 팀/경기 데이터를 정리하는 운영 SQL 또는 배치 작업이 필요할 수 있다.
- 익명 사용자에게 민감하거나 장기 보관이 필요한 기능을 제공할 때는 계정 연결 CTA를 노출한다.

## 대안 검토

### 대안 1: 이메일 로그인 수정 후 유지

장점:

- OAuth provider 설정이 필요 없다.
- 이메일 기반 계정은 범용적이다.

단점:

- SMTP, 이메일 인증, redirect URL 설정 영향을 많이 받는다.
- 현재 문제를 해결해도 사용자의 첫 진입 장벽이 높다.
- 국내 아마추어 팀 사용자에게 SNS 로그인보다 느릴 수 있다.

결론:

- 현재 제품에서는 유지하지 않는다. 로그인 진입점은 OAuth와 익명 체험으로 단순화한다.

### 대안 2: Google OAuth 유지

장점:

- 이미 코드가 있다.
- Supabase OAuth callback 흐름을 그대로 재사용할 수 있다.

단점:

- 국내 사용자에게 Kakao보다 접근성이 낮을 수 있다.
- 제품 포지셔닝과 마케팅 메시지에서 `Kakao로 바로 시작`이 더 자연스럽다.

결론:

- 보조 SNS 로그인으로 유지하되, 기본 CTA는 Kakao가 적합하다.

### 대안 3: localStorage 기반 완전 비로그인 데모

장점:

- Supabase 설정 없이도 데모 화면을 만들 수 있다.
- DB row가 늘지 않는다.

단점:

- 기존 Server Action과 Supabase 기반 기능을 재사용하기 어렵다.
- 같은 기능을 localStorage용과 DB용으로 중복 구현해야 한다.
- 체험 데이터를 정식 계정으로 옮기는 비용이 크다.

결론:

- 현재 코드 구조에서는 선택하지 않는다.

## 결정의 결과

이 결정으로 인증 기능은 다음 원칙을 갖는다.

- 모든 저장형 사용자는 Supabase Auth user id를 가진다.
- 정식 사용자는 Kakao 또는 Google OAuth로 진입한다.
- 체험 사용자는 Supabase Anonymous Sign-In으로 진입한다.
- 선수, 포메이션, 경기 데이터는 항상 팀 workspace 아래에 저장한다.
- 기존 Supabase/RLS 기반 데이터 접근 구조를 유지한다.
- 향후 Apple, Google, GitHub 등 추가 OAuth provider를 붙일 수 있도록 provider 고정 함수를 만들지 않는다.

## 후속 작업

- Supabase Dashboard에서 Kakao OAuth provider 설정
- Kakao Developers 앱 생성과 redirect URI 설정
- Supabase Dashboard에서 Anonymous Sign-Ins 활성화
- `features/auth` 리팩터링
- `entities/team`의 current team resolver 정리
- 로그인 화면 CTA 재구성
- 익명 사용자 안내 배너 또는 계정 연결 CTA 설계
- 오래된 익명 사용자 데이터 정리 정책 수립
- `docs/project-design.md`의 로그인 기능 소개 업데이트
- 필요 시 `docs/database-schema.md`에 체험 사용자 운영 정책 추가

## 참고 문서

- Supabase Social Login: https://supabase.com/docs/guides/auth/social-login
- Supabase Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Users: https://supabase.com/docs/guides/auth/users
