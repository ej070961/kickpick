import { OAuthLoginButton } from "./OAuthLoginButton";
import { TrialLoginButton } from "./TrialLoginButton";

type OAuthLoginOption = {
  id: "kakao" | "google";
  label: string;
  iconSrc: string;
  buttonClassName: string;
};

/**
 * 로그인 화면의 인증 선택지를 조립합니다.
 * 이메일 로그인은 제공하지 않고, OAuth와 체험 모드만 제품 진입점으로 노출합니다.
 */
export function LoginForm() {
  return (
    <div>
      <div className="space-y-3">
        {OAUTH_LOGIN_OPTIONS.map((provider) => (
          <OAuthLoginButton key={provider.id} provider={provider} />
        ))}
        <TrialLoginButton />
      </div>
    </div>
  );
}

const OAUTH_LOGIN_OPTIONS = [
  {
    id: "kakao",
    label: "Kakao로 계속하기",
    iconSrc: "/images/oauth/kakao.svg",
    buttonClassName:
      "border-[#f1d95d] bg-[#fee500] text-[#191600] hover:brightness-95",
  },
  {
    id: "google",
    label: "Google로 계속하기",
    iconSrc: "/images/oauth/google.svg",
    buttonClassName: "border-border bg-white text-foreground hover:bg-surface",
  },
] as const satisfies readonly OAuthLoginOption[];
