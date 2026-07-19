/**
 * Inline field-level error (spec §10). The `id` is referenced by the input's
 * `aria-describedby`; the input separately shows the danger border via
 * `aria-invalid`, so this component only carries the message text.
 */
export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="text-[12px] leading-[18px] font-medium text-danger">
      {children}
    </p>
  );
}
