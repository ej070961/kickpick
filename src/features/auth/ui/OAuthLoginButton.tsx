import Image from "next/image";
import { signInWithOAuth } from "@/features/auth/actions/authActions";

type Props = {
  provider: {
    id: "kakao" | "google";
    label: string;
    iconSrc: string;
    buttonClassName: string;
  };
};

/**
 * SNS 로그인 진입점입니다.
 * provider별 표시 정책은 로그인 조립부에 두고, 버튼은 서버 액션에 안전한 provider 값만 전달합니다.
 */
export function OAuthLoginButton({ provider }: Props) {
  return (
    <form action={signInWithOAuth}>
      <input type="hidden" name="provider" value={provider.id} />
      <button
        type="submit"
        className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition ${provider.buttonClassName}`}
      >
        <Image
          src={provider.iconSrc}
          alt=""
          aria-hidden="true"
          width={20}
          height={20}
          className="size-5 shrink-0"
        />
        {provider.label}
      </button>
    </form>
  );
}
