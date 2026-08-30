# auth

Supabase Auth 기반 로그인, 체험 시작, 로그아웃 액션과 로그인 화면 UI를 담당하는 feature입니다.

## 폴더 구조

```txt
auth/
  actions/
    authActions.ts
  ui/
    LoginForm.tsx
    OAuthLoginButton.tsx
    TrialLoginButton.tsx
```

## 파일 역할

- `actions/authActions.ts`: OAuth 로그인, 익명 체험 로그인, 로그아웃 Server Action을 제공한다.
- `ui/LoginForm.tsx`: 로그인 화면의 주요 진입점을 조립하고 provider별 버튼 표시 정보를 관리한다.
- `ui/OAuthLoginButton.tsx`: provider 설정을 받아 SNS 로그인 버튼을 렌더링한다.
- `ui/TrialLoginButton.tsx`: 로그인 없이 체험하기 버튼을 렌더링한다.

## 작업 기준

- OAuth provider를 추가할 때는 `LoginForm.tsx`의 표시 정보와 `actions/authActions.ts`의 허용 provider 목록을 함께 갱신한다.
- Kakao 로그인은 Supabase OAuth provider의 기본 `account_email` scope 요청을 피하기 위해 Kakao OIDC authorize/token 교환 후 `signInWithIdToken`으로 Supabase 세션을 만든다.
- Kakao Developers에서 OpenID Connect를 활성화하고, Redirect URI에 `/auth/kakao/callback`을 등록해야 한다.
- Kakao OIDC authorize 요청은 `state`로 callback을 검증하고, nonce는 해시값을 Kakao에 전달한 뒤 raw 값을 Supabase `signInWithIdToken`에 전달한다.
- Kakao Login Client Secret을 활성화했다면 서버 환경변수 `KAKAO_CLIENT_SECRET`도 함께 설정한다.
- provider별 스타일 분기는 JSX 안에서 직접 삼항으로 처리하지 않고 설정 객체에서 꺼내 쓴다.
- 인증 성공 후 팀 workspace 보장은 `entities/team`의 `ensureDefaultTeamForUser`를 사용하고, 새 팀 생성 시 starter template 생성 콜백을 함께 넘긴다.
- Route Handler와 Server Action은 client에서 전달받은 user id를 신뢰하지 않고 Supabase 세션 또는 callback 결과에서 user를 조회한다.
- 로그인 UI 컴포넌트는 파일 하나에 주요 컴포넌트 하나를 두는 것을 기본으로 한다.
- 이메일/비밀번호 로그인은 제공하지 않는다. 로그인 진입점은 OAuth와 익명 체험으로 유지한다.
