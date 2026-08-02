"use client";

// Settings › Danger Zone — the four irreversible actions.
//
// Each destructive action is gated by a typed confirmation, and the phrase the
// user has to type is the thing being destroyed (the workspace name, their own
// email). That is deliberate: a generic "DELETE" trains people to type it
// without reading, whereas a name has to be looked up.
//
// Layout: 7/5. Reversible and recoverable actions on the left, the terminal
// one on the right alongside the export prompt that should precede it. The
// rail's help cards drop into the footer strip because this section has the
// least content in the module and would otherwise leave ~600px of void.

import Link from "next/link";
import * as React from "react";
import {
  ArrowRight,
  Clock,
  Headset,
  Pause,
  RotateCcw,
  Trash2,
  UserCog,
  Users,
  Zap,
} from "lucide-react";

import type { SettingsData } from "@/lib/settings/model";
import {
  deleteAccount,
  pauseAllAutomations,
  resetWorkspace,
} from "@/app/(app)/settings/actions";
import {
  GhostButton,
  PrimaryButton,
  SettingRow,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useAction } from "../use-section-form";

export function DangerZoneSection({ data }: { data: SettingsData }) {
  const { pending, run } = useAction();
  const [resetting, setResetting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  return (
    <>
      <SettingsColumns>
        <SettingsColumn span={7}>
          <SettingsCard
            title="Workspace Actions"
            blurb="Pausing is reversible. Resetting and transferring are not — both ask you to confirm first."
          >
            <SettingRow
              icon={Pause}
              tone="brand"
              label="Pause All Automations"
              hint="Temporarily stop every automation in this workspace."
              control={
                <GhostButton
                  disabled={pending}
                  onClick={() =>
                    run(
                      async () => {
                        const result = await pauseAllAutomations();
                        return result.ok
                          ? { ok: true as const }
                          : { ok: false as const, error: result.error };
                      },
                      { success: "All automations paused." },
                    )
                  }
                >
                  <Pause className="size-3.5" aria-hidden />
                  Pause All
                </GhostButton>
              }
            />
            <SettingRow
              icon={RotateCcw}
              danger
              label="Reset Workspace"
              hint="Delete all automations, leads and analytics data."
              control={
                <GhostButton tone="danger" onClick={() => setResetting(true)}>
                  <RotateCcw className="size-3.5" aria-hidden />
                  Reset Workspace
                </GhostButton>
              }
            />
            <SettingRow
              icon={UserCog}
              danger
              label="Transfer Ownership"
              hint="Move workspace ownership to another team member."
              control={
                <GhostButton tone="danger" disabled>
                  <UserCog className="size-3.5" aria-hidden />
                  Transfer
                </GhostButton>
              }
            />
          </SettingsCard>
        </SettingsColumn>

        <SettingsColumn span={5}>
          <SettingsCard
            title="Delete Account"
            blurb="The only action here that cannot be undone."
            className="border-danger/20"
          >
            <SettingRow
              icon={Trash2}
              danger
              label="Delete Account"
              hint="Permanently delete your account and all associated data."
              control={
                <GhostButton tone="danger" onClick={() => setDeleting(true)}>
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete Account
                </GhostButton>
              }
            />
          </SettingsCard>

          {/* Moved down from the rail: an export prompt belongs next to the
              action it's warning about, not above two help cards. */}
          <section className="rounded-xl border border-border-default bg-surface-card p-5">
            <h3 className="text-[13px] font-semibold text-ink">
              Before you delete
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-tertiary">
              Export your data first — deleted workspaces and their data cannot
              be recovered.
            </p>
            <Link
              href="/settings?section=privacy"
              className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-lg bg-warning-bg text-[12px] font-medium text-warning-text transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-selected-bg"
            >
              Export my data
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </section>
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="Account Summary"
        blurb="Review before taking action"
        footerStrip
        items={[
          {
            icon: Zap,
            label: "Automations",
            value: `${data.counts.automationsActive} active`,
            tone: "brand",
          },
          {
            icon: Users,
            label: "Leads stored",
            value: data.counts.leadsStored.toLocaleString("en-IN"),
            tone: "success",
          },
          {
            icon: Users,
            label: "Team members",
            value: String(data.counts.seatsUsed),
          },
          {
            icon: Clock,
            label: "Data retention",
            value: `${data.privacy.retention_months} Months`,
          },
        ]}
      >
        <PromptCard
          icon={Headset}
          title="Talk to support first"
          body="Someone can walk you through the consequences before you make an irreversible change."
          cta="Contact Support"
          href="/help"
        />
        <NeedHelpCard topic="what each of these actions does" />
      </SummaryRail>

      <ConfirmDialog
        open={resetting}
        title="Reset this workspace?"
        body="Every automation, lead and analytics record is deleted. Connected accounts, your team and your subscription are kept."
        confirmLabel="Reset workspace"
        phrase={data.workspace.workspace_name}
        phraseHint="workspace name"
        onClose={() => setResetting(false)}
        onConfirm={(confirm) => resetWorkspace({ confirm })}
        successMessage="Workspace reset."
      />

      <DeleteAccountDialog
        open={deleting}
        email={data.profile.email}
        onClose={() => setDeleting(false)}
      />
    </>
  );
}

/** Shared by Danger Zone and the Data & Privacy card, which offers the same exit. */
export function DeleteAccountDialog({
  open,
  email,
  onClose,
}: {
  open: boolean;
  email: string;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      title="Delete your account?"
      body="This removes your profile, connected accounts, automations, leads and every setting. It cannot be undone."
      confirmLabel="Delete account"
      phrase={email}
      phraseHint="email address"
      onClose={onClose}
      onConfirm={(confirm) => deleteAccount({ confirm })}
      successMessage="Account deleted."
      // The session is gone once this succeeds, so send the browser somewhere
      // public rather than letting the page try to re-render behind a redirect.
      onSuccess={() => {
        window.location.href = "/";
      }}
    />
  );
}

function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  phrase,
  phraseHint,
  onClose,
  onConfirm,
  successMessage,
  onSuccess,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  phrase: string;
  phraseHint: string;
  onClose: () => void;
  onConfirm: (
    confirm: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  successMessage: string;
  onSuccess?: () => void;
}) {
  const { pending, run } = useAction();
  const [value, setValue] = React.useState("");

  // Clear the typed confirmation each time the dialog opens, so a cancelled
  // attempt can't leave a matching phrase primed for the next one.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue("");
  }

  if (!open) return null;

  const matches = value.trim().toLowerCase() === phrase.trim().toLowerCase();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-inverse/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border-default bg-surface-card p-6 shadow-floating">
        <h2 className="text-[17px] font-semibold text-danger">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
          {body}
        </p>

        <label className="mt-4 block text-[12px] text-ink-tertiary">
          Type your {phraseHint} —{" "}
          <span className="font-medium text-ink">{phrase}</span> — to confirm.
        </label>
        <input
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          className="mt-2 h-10 w-full rounded-lg border border-border-default bg-surface-card px-3 text-[13px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-danger"
        />

        <div className="mt-5 flex items-center justify-end gap-2">
          <GhostButton onClick={onClose} disabled={pending}>
            Cancel
          </GhostButton>
          <PrimaryButton
            className="bg-danger hover:bg-danger/90 active:bg-danger/80"
            disabled={!matches || pending}
            onClick={() =>
              run(() => onConfirm(value), {
                success: successMessage,
                onSuccess: () => {
                  onClose();
                  onSuccess?.();
                },
              })
            }
          >
            {pending ? "Working…" : confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
