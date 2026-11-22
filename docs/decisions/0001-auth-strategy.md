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

현재 구현에는 Kakao와 Google OAuth 로그인이 포함되어 있다. 비로그인 사용자는 공개 랜딩 페이지에서 서비스를 살펴본 뒤 로그인하도록 한다.

## 결정

KickPick의 1차 인증 리팩터링은 다음 방향으로 진행한다.

1. 기본 SNS 로그인은 Kakao OAuth로 제공하고, Google OAuth는 보조 SNS 로그인으로 유지한다.
2. 이메일/비밀번호 로그인과 회원가입은 제거한다.
3. 익명 체험 로그인을 제공하지 않는다. 비로그인 사용자는 공개 랜딩 페이지를 확인한 뒤 Kakao 또는 Google 로그인을 진행한다.
4. OAuth 사용자는 기존 `teams.owner_user_id` 소유권 모델을 사용한다.
5. 로그인 성공 후에는 항상 사용자의 팀 workspace를 보장한다.
6. 인증 리팩터링과 함께 `current team resolver` 기반을 정리하되, 팀 여러 개 생성/전환 UI는 이번 범위에 포함하지 않는다.

## 인증 방식별 의미

### Kakao 로그인

Kakao 로그인은 Kakao OIDC authorize/token 교환 후 Supabase `signInWithIdToken`으로 처리한다.

사용자가 Kakao 버튼을 누르면 앱은 Kakao 인가 URL을 직접 만들고, Kakao 인증이 끝나면 `/auth/kakao/callback`으로 돌아온다. callback route는 Kakao token endpoint에서 `id_token`을 받은 뒤 Supabase 세션을 만들고, 현재 사용자의 팀 workspace가 없으면 새로 만든다.

프론트엔드 관점에서는 다음 흐름으로 이해하면 된다.

```txt
로그인 버튼 클릭
  -> Kakao OIDC 요청
  -> Kakao 인증 화면
  -> /auth/kakao/callback
  -> Supabase signInWithIdToken
  -> Supabase 세션 저장
  -> 팀 workspace 보장
  -> /home 홈 화면 이동
```

### 비로그인 랜딩

비로그인 사용자는 `/`에서 서비스 소개와 기능 목업을 확인한다. 저장형 기능을 사용하려면 Kakao 또는 Google 로그인이 필요하며, 인증 후 `/home` 시작 화면으로 이동한다.

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
3. 공개 랜딩 페이지에서 서비스 기능과 로그인 필요 여부를 확인한다.

이메일 인증 설정, SMTP, redirect 문제로 제품 진입이 막히는 상황을 줄이기 위해 이메일 로그인은 제공하지 않는다.

비로그인 사용자에게는 공개 랜딩에서 주요 기능과 로그인 필요 여부를 안내한다.

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
```

권장 액션:

```ts
signInWithOAuth(formData);
signOut();
ensureDefaultTeamForUser(userId, teamName);
getCurrentTeamId();
```

### 2단계: Kakao OIDC 추가

Kakao Developers에서 OpenID Connect를 활성화하고 redirect URI를 설정한다. Kakao Login Client Secret을 활성화한 경우 서버 환경변수 `KAKAO_CLIENT_SECRET`도 설정한다.

앱 코드에서는 Kakao 인가 URL을 직접 만든다.

```ts
const authorizeUrl = new URL("https://kauth.kakao.com/oauth/authorize");
authorizeUrl.searchParams.set("scope", "openid,profile_nickname,profile_image");
```

callback route에서는 Kakao token endpoint에서 받은 `id_token`으로 Supabase 세션을 만든다.

```ts
await supabase.auth.signInWithIdToken({
  provider: "kakao",
  token: idToken,
  access_token: accessToken,
  nonce,
});
```

Kakao authorize 요청에는 `state`를 포함해 callback을 검증한다. Supabase는 `signInWithIdToken`에 전달된 raw nonce를 SHA-256으로 해시해 `id_token`의 nonce claim과 비교하므로, Kakao에는 해시된 nonce를 보내고 Supabase에는 raw nonce를 넘긴다.

### 3단계: 로그인 UI 리팩터링

`LoginForm`은 인증 방식별 책임을 컴포넌트로 분리한다.

- `OAuthLoginButton`: Kakao 등 SNS 로그인 버튼
- 익명 체험 버튼과 액션 제거

### 4단계: 공개 랜딩과 앱 화면 분리

- `/`에는 비로그인 공개 랜딩을 제공한다.
- `/home`에는 로그인 후 사용하는 시작 화면을 제공한다.
- OAuth callback 기본 이동 경로를 `/home`으로 설정한다.

## RLS와 보안 고려사항

주의할 점:

- RLS는 로그인 사용자 ID와 팀 소유권을 기준으로 데이터 접근을 제한한다.

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

- 현재 제품에서는 유지하지 않는다. 비로그인 사용자는 공개 랜딩에서 기능을 확인하고 OAuth로 로그인한다.

### 대안 2: Google OAuth 유지

장점:

- 이미 코드가 있다.
- Supabase OAuth callback 흐름을 그대로 재사용할 수 있다.

단점:

- 국내 사용자에게 Kakao보다 접근성이 낮을 수 있다.
- 제품 포지셔닝과 마케팅 메시지에서 `Kakao로 바로 시작`이 더 자연스럽다.

결론:

- 보조 SNS 로그인으로 유지하되, 기본 CTA는 Kakao가 적합하다.

### 대안 3: localStorage 기반 비로그인 데모

현재 제품은 데모 데이터 저장이나 편집을 제공하지 않는다. 공개 랜딩에서 기능을 소개하고 실제 데이터 관리는 OAuth 로그인 후 제공한다.

## 결정의 결과

이 결정으로 인증 기능은 다음 원칙을 갖는다.

- 모든 저장형 사용자는 Supabase Auth user id를 가진다.
- 정식 사용자는 Kakao 또는 Google OAuth로 진입한다.
- 비로그인 사용자는 공개 랜딩 페이지를 보고 Kakao 또는 Google OAuth로 진입한다.
- 선수, 포메이션, 경기 데이터는 항상 팀 workspace 아래에 저장한다.
- 기존 Supabase/RLS 기반 데이터 접근 구조를 유지한다.
- 향후 Apple, Google, GitHub 등 추가 OAuth provider를 붙일 수 있도록 provider 고정 함수를 만들지 않는다.

## 후속 작업

- Supabase Dashboard에서 Kakao OAuth provider 설정
- Kakao Developers 앱 생성과 redirect URI 설정
- `features/auth` 리팩터링
- `entities/team`의 current team resolver 정리
- 로그인 화면 CTA 재구성
- 공개 랜딩 페이지와 `/home` 시작 화면 경로 분리
- `docs/project-design.md`의 로그인 기능 소개 업데이트

## 참고 문서

- Supabase Social Login: https://supabase.com/docs/guides/auth/social-login
- Supabase Anonymous Sign-Ins: https://supabase.com/docs/guides/auth/auth-anonymous
- Supabase Users: https://supabase.com/docs/guides/auth/users
