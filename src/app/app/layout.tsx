import Link from "next/link";
import type { Metadata } from "next";
import { ResetButton, SideNav, UserSwitcher } from "@/components/AppChrome";
import { MobileMenu } from "@/components/MobileMenu";
import { Logo } from "@/components/ui";
import { dataSource, repo } from "@/lib/data";
import { bedrockEnabled } from "@/lib/ai/narrate";
import { currentUser } from "@/lib/session";
import { fmt } from "@/lib/dates";
import { DEMO_AS_OF } from "@/lib/data/seed";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [projects, people, user] = await Promise.all([repo.listProjects(), repo.getPeople(), currentUser()]);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col bg-char-900 lg:flex lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-14 items-center border-b border-char-800 px-5">
          <Link href="/">
            <Logo dark />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-5">
          <SideNav projects={projects} />
        </div>
        <div className="space-y-3 border-t border-char-800 p-4">
          <UserSwitcher people={people} current={user} />
          {repo.reset && <ResetButton />}
          <div className="space-y-0.5 text-[11px] leading-relaxed text-char-500">
            <div>Data: {dataSource}</div>
            <div>AI narration: {bedrockEnabled() ? "Amazon Bedrock" : "Off (templates)"}</div>
            <div>Demo date: {fmt(DEMO_AS_OF, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-char-800 bg-char-900 px-4 lg:hidden">
          <Link href="/">
            <Logo dark />
          </Link>
          <div className="flex items-center gap-2">
            <span className="max-w-[9rem] truncate text-right text-[11px] leading-tight text-char-400">
              {user.name}
              <br />
              <span className="capitalize">{user.role.replace("_", " ")}</span>
            </span>
            <MobileMenu dark label="Open navigation" panelClassName="ml-auto h-full w-[min(20rem,85vw)] bg-char-900">
              <div className="flex h-full flex-col">
                <div className="flex-1 px-2 py-4">
                  <SideNav projects={projects} />
                </div>
                <div className="space-y-3 border-t border-char-800 p-4">
                  <UserSwitcher people={people} current={user} />
                  {repo.reset && <ResetButton />}
                  <div className="text-[11px] leading-relaxed text-char-500">
                    Data: {dataSource} · AI: {bedrockEnabled() ? "Bedrock" : "templates"}
                  </div>
                </div>
              </div>
            </MobileMenu>
          </div>
        </header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
