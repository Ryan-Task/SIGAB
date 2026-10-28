import SiteNav from "./SiteNav";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export default function PageShell({ eyebrow, title, description, children }: PageShellProps) {
  return (
    <main className="min-h-screen bg-[#f2e8e3] text-slate-800">
      <SiteNav />
      <section className="bg-[linear-gradient(135deg,#26669a_0%,#174b73_58%,#0d3d5c_100%)] px-6 py-20 text-white">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#82d4d0]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-100/85">{description}</p>
        </div>
      </section>
      <section className="mx-auto max-w-[1100px] px-6 py-12">{children}</section>
    </main>
  );
}
