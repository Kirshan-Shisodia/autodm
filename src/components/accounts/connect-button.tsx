"use client";

import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ConnectButton({
  label = "Connect Account",
  className,
}: {
  label?: string;
  className?: string;
}) {
  // A plain full navigation (not router.push / fetch) is intentional —
  // OAuth requires a top-level redirect.
  return (
    <Button
      asChild
      className={cn(
        "h-9 rounded-lg bg-action px-3.5 text-[13px] text-white hover:bg-action-hover",
        className,
      )}
    >
      <a href="/api/auth/instagram/start">
        <Plus className="size-4" />
        {label}
      </a>
    </Button>
  );
}
