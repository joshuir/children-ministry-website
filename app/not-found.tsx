import { Button } from "@/components/ui";
import { Scene } from "@/components/Scene";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center bg-brand-50 pb-20 pt-32">
      <div className="container grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div>
          <p className="font-display text-8xl font-extrabold tracking-tight text-brand-500">404</p>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">This page wandered off like a lost sheep</h1>
          <p className="mt-4 text-lg text-ink-mute">Don&apos;t worry — we&apos;ll help you find your way back.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button href="/">Go home</Button><Button href="/classes/" variant="light">See classes</Button></div>
        </div>
        <div className="aspect-[4/3] overflow-hidden rounded-5xl border-[3px] border-ink shadow-pop"><Scene scene="excursion" tone="mint" className="h-full w-full" /></div>
      </div>
    </section>
  );
}
