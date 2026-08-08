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
        체험 모드 데이터는 현재 브라우저 기준으로 사용할 수 있습니다. 계속
        보관하려면 나중에 계정 연결이 필요합니다.
      </p>
    </div>
  );
}
