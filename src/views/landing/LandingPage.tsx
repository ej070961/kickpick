import { LandingCallToAction } from "./LandingCallToAction";
import { LandingFeatures } from "./LandingFeatures";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingSteps } from "./LandingSteps";

/** 비로그인 사용자가 KickPick의 주요 기능과 사용 흐름을 확인하는 공개 랜딩 페이지입니다. */
export function LandingPage() {
  return (
    <main className="overflow-hidden">
      <LandingHeader />
      <LandingHero />
      <LandingFeatures />
      <LandingSteps />
      <LandingCallToAction />
      <LandingFooter />
    </main>
  );
}
