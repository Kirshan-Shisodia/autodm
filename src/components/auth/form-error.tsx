import * as React from "react";

/**
 * Form-level alert banner (spec §10). Sits above the CTA in danger tokens,
 * `role="alert"` + assertive live region so it's announced on server-action
 * failure. Children so a page can add a follow-up link when appropriate.
 */
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-md bg-danger-bg px-4 py-3 text-[13px] leading-[18px] text-danger"
    >
      {children}
    </div>
  );
}
