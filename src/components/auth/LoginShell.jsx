import { ArrowUpRight, ShieldCheck } from 'lucide-react';

function AbstractArtwork() {
  return <svg className="auth-artwork" viewBox="0 0 620 600" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ribbon-front" x1="150" y1="120" x2="480" y2="480" gradientUnits="userSpaceOnUse"><stop stopColor="#e9deff" /><stop offset=".42" stopColor="#b696ee" /><stop offset="1" stopColor="#6732a7" /></linearGradient>
      <linearGradient id="ribbon-back" x1="480" y1="160" x2="190" y2="470" gradientUnits="userSpaceOnUse"><stop stopColor="#6e39ad" /><stop offset=".54" stopColor="#9465ca" /><stop offset="1" stopColor="#d6c4ed" /></linearGradient>
      <linearGradient id="ribbon-edge" x1="200" y1="150" x2="450" y2="410" gradientUnits="userSpaceOnUse"><stop stopColor="#fbf7ff" /><stop offset="1" stopColor="#b69bd5" /></linearGradient>
      <radialGradient id="art-shadow"><stop stopColor="#6c488d" stopOpacity=".15" /><stop offset="1" stopColor="#6c488d" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="310" cy="283" r="225" stroke="#e4dcea" /><circle cx="310" cy="283" r="177" stroke="#e4dcea" strokeDasharray="3 8" />
    <ellipse cx="313" cy="500" rx="209" ry="37" fill="url(#art-shadow)" />
    <path d="M187 139C243 86 362 81 429 135C499 192 496 269 438 326L281 479L182 380L339 227C358 208 355 189 339 177C320 161 292 163 274 180L187 264L100 177L187 139Z" fill="url(#ribbon-back)" />
    <path d="M435 422C378 476 259 481 192 427C122 370 126 293 183 236L340 83L439 182L282 335C263 354 266 373 282 385C301 401 329 399 347 382L434 298L521 385L435 422Z" fill="url(#ribbon-front)" />
    <path d="M340 83L439 182L427 194L329 95L340 83Z" fill="url(#ribbon-edge)" />
    <path d="M183 236C126 293 122 370 192 427C235 462 300 472 358 460C298 477 229 469 183 432C111 374 117 291 174 235L330 83L340 83L183 236Z" fill="#f2e9ff" fillOpacity=".65" />
    <circle cx="478" cy="113" r="16" fill="#e2d5f4" /><circle cx="128" cy="385" r="8" fill="#a78cc5" /><path d="M465 448H485M475 438V458" stroke="#bba7d0" strokeWidth="1.5" />
  </svg>;
}

export default function LoginShell({ title, subtitle, children, footer, brandTitle = 'Corizo Desk' }) {
  return <div className="auth-shell">
    <section className="auth-story" aria-label="Corizo workspace">
      <div className="auth-wordmark"><img src="/logo.jpg" alt="Corizo" /><span>DESK</span></div>
      <div className="auth-story-body">
        <div className="auth-eyebrow"><span /> THE SPACE TO DO MORE</div>
        <AbstractArtwork />
        <div className="auth-story-copy"><h2>Good work starts<br />with a clear view.</h2><p>Your leads, your team, your next big milestone.<br className="hidden xl:block" /> Bring it all together in one thoughtful workspace.</p></div>
      </div>
      <div className="auth-story-footer"><span>Built for the way your team works.</span><ArrowUpRight size={17} /></div>
    </section>
    <main className="auth-main">
      <div className="auth-mobile-brand"><img src="/logo.jpg" alt="Corizo" /><span>DESK</span></div>
      <div className="auth-form-wrap">
        <div className="mb-9"><p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{brandTitle} / Workspace</p><h1 className="text-[30px] font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-[34px]">{title}</h1>{subtitle && <p className="mt-3 max-w-sm text-[14px] leading-6 text-muted-foreground">{subtitle}</p>}</div>
        {children}
        {footer && <div className="mt-6 text-sm">{footer}</div>}
        <div className="mt-8 flex items-center gap-2 border-t border-border/70 pt-5 text-[12px] text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary/70" />Protected with multi-step verification</div>
      </div>
      <footer className="auth-main-footer"><span>© {new Date().getFullYear()} Corizo</span><span>Your workspace. Connected.</span></footer>
    </main>
  </div>;
}
