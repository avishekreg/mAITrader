import NiftyChart from "@/components/nifty-chart";
import { StrategyCockpit } from "@/components/strategy-cockpit";
import { TerminalNavbar } from "@/components/terminal-navbar";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#090D16] text-slate-100">
      <a
        href="#execution-desk"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to execution desk
      </a>
      <TerminalNavbar />
      <main
        id="execution-desk"
        className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12"
      >
        <section className="min-h-0 border-b border-slate-800 lg:col-span-8 lg:border-b-0 lg:border-r">
          <NiftyChart />
        </section>
        <aside className="min-h-0 lg:col-span-4">
          <StrategyCockpit />
        </aside>
      </main>
    </div>
  );
}
