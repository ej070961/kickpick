import { redirect } from "next/navigation";

/**
 * 기존 우선순위 관리 URL을 통합된 선수 관리 화면으로 이동시킵니다.
 */
export default function PriorityRoute() {
  redirect("/players");
}
