/**
 * 저장된 경기가 없을 때 경기 목록 대신 보여주는 빈 상태입니다.
 */
export function MatchesEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-white/60 px-6 py-12 text-center">
      <p className="text-lg font-bold text-foreground">
        아직 저장된 경기가 없습니다.
      </p>
      <p className="mt-2 text-sm leading-6 text-muted">
        새 경기를 생성하면 이곳에서 다시 열어볼 수 있습니다.
      </p>
    </div>
  );
}
