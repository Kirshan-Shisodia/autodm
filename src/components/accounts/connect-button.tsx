"use client";

import { Plug } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ConnectButton({ label = "Connect Instagram Account" }: { label?: string }) {
  // A plain full navigation (not router.push / fetch) is intentional —
  // OAuth requires a top-level redirect.
  return (
    <Button asChild>
      <a href="/api/auth/instagram/start">
        <Plug className="h-4 w-4" />
        {label}
      </a>
    </Button>
  );
}
