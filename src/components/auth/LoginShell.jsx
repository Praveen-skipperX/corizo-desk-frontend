export default function LoginShell({
  title,
  subtitle,
  children,
  footer,
  brandTitle = 'Corizo Desk',
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(110, 37, 164, 0.08), transparent)',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src="/logo.jpg"
            alt="Corizo"
            className="mb-5 h-12 w-auto max-w-[200px] object-contain"
          />
          <p className="text-[13px] font-semibold tracking-wide text-primary">{brandTitle}</p>
          <h1 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && (
            <p className="mt-2 max-w-[320px] text-[15px] leading-relaxed text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-white p-7 shadow-elevated sm:p-8">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-[13px]">{footer}</div>}

        <p className="mt-6 text-center text-[12px] text-muted-foreground">
          © {new Date().getFullYear()} Corizo Desk
        </p>
      </div>
    </div>
  );
}
