import type { ReactNode } from "react";
import { TopBar } from "@/widgets/top-bar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-background text-foreground min-h-dvh">
      <div className="flex min-h-dvh flex-col">
        <TopBar />
        <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-10 lg:py-8 lg:pb-8">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
