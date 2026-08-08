import { CircleHelp } from "lucide-react";
import { signInAnonymously } from "@/features/auth/actions/authActions";

/**
 * 계정 연결 전 제품을 바로 경험하기 위한 진입점입니다.
 * 내부적으로는 익명 Supabase user와 팀 workspace를 생성해 기존 권한 모델을 유지합니다.
 */
export function TrialLoginButton() {
  return (
    <div className="group relative flex justify-center">
      <div className="text-muted hover:text-foreground inline-flex items-center gap-1 text-xs">
        <button
          type="button"
          aria-describedby="trial-login-notice"
          aria-label="체험 모드 안내"
          className="focus-visible:bg-surface focus-visible:text-foreground grid size-5 place-items-center rounded-full transition focus-visible:outline-none"
        >
          <CircleHelp size={14} aria-hidden="true" />
        </button>
        <form action={signInAnonymously}>
          <button
            type="submit"
            className="focus-visible:text-foreground font-semibold underline underline-offset-4 transition focus-visible:outline-none"
          >
            로그인 없이 사용해보기
          </button>
        </form>
      </div>

      <p
        id="trial-login-notice"
        role="tooltip"
        className="border-border bg-foreground pointer-events-none absolute top-full left-1/2 z-10 mt-2 hidden w-64 -translate-x-1/2 rounded-lg border px-3 py-2 text-center text-xs leading-5 text-white shadow-md group-focus-within:block group-hover:block"
      >
        로그아웃하면 체험 중 저장한 내용을 다시 불러올 수 없어요. 계속 쓰려면
        Kakao나 Google로 시작해주세요.
      </p>
    </div>
  );
}
