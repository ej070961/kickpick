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
- provider별 스타일 분기는 JSX 안에서 직접 삼항으로 처리하지 않고 설정 객체에서 꺼내 쓴다.
- 인증 성공 후 팀 workspace 보장은 `entities/team`의 `ensureDefaultTeamForUser`를 사용한다.
- Route Handler와 Server Action은 client에서 전달받은 user id를 신뢰하지 않고 Supabase 세션 또는 callback 결과에서 user를 조회한다.
- 로그인 UI 컴포넌트는 파일 하나에 주요 컴포넌트 하나를 두는 것을 기본으로 한다.
- 이메일/비밀번호 로그인은 제공하지 않는다. 로그인 진입점은 OAuth와 익명 체험으로 유지한다.
