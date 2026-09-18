export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden bg-abyss-950 dark:block"
    >
      {/* شبکه‌ی ظریف برای عمق بیشتر */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="aurora-blob left-[-10%] top-[-10%] h-[42vw] w-[42vw] animate-float-slow bg-primary/60" />
      <div className="aurora-blob right-[-12%] top-[8%] h-[34vw] w-[34vw] animate-float bg-secondary-purple/50" />
      <div className="aurora-blob bottom-[-14%] left-[8%] h-[38vw] w-[38vw] animate-float-reverse bg-secondary-pink/40" />
      <div className="aurora-blob bottom-[-10%] right-[-8%] h-[30vw] w-[30vw] animate-float bg-secondary-blue/40" />

      {/* وینیت برای تیره‌تر شدن لبه‌ها و خوانایی بهتر محتوا */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,7,13,0.55)_75%,rgba(5,7,13,0.85)_100%)]" />
    </div>
  );
}
