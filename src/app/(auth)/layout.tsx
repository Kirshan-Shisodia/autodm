import { Logo } from "@/components/auth/logo";
import { BrandPanel } from "@/components/auth/brand-panel";

/**
 * Shared shell for every auth screen — /login, /signup, /forgot-password,
 * /auth/reset (spec §4, §15, §22). One split-screen surface: a focused form
 * panel (left) and a desktop-only atmospheric brand panel (right). `lg` (1024)
 * is the single device line — below it the brand panel drops and the form fills
 * the viewport. New auth screens slot in as children with zero layout rework.
 *
 * `.font-geist` is applied here because the app's base `font-sans` var is
 * self-referential (globals.css); the landing opts into Geist the same way.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-geist grid min-h-screen grid-cols-1 bg-surface-app lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Form panel */}
      <div className="flex flex-col px-[clamp(20px,6vw,40px)] py-8 lg:py-12">
        <Logo />
        <main className="flex flex-1 flex-col justify-start pt-10 lg:justify-center lg:pt-0">
          <div className="mx-auto w-full max-w-[400px] lg:mx-0">{children}</div>
        </main>
      </div>

      {/* Brand panel — desktop only, decorative */}
      <BrandPanel />
    </div>
  );
}
