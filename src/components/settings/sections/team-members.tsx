"use client";

// Settings › Team Members — the roster, the invite form and pending invitations.
//
// Active seats and pending invitations are the same table; a row is pending
// until the invitee accepts and picks up a `member_user_id`. Splitting them in
// the UI (rather than in the schema) means accepting an invite is a single
// column write, not a row move.
//
// Layout: 8/4. The roster row carries six pieces of information — avatar,
// name, email, scopes, role, actions — so it takes the wide column. The invite
// form is now a permanent card rather than a toggle inside the roster card:
// opening it used to push the whole list down.
//
// The Members / Invitations sub-tabs are gone. They set state that nothing
// read — both cards rendered regardless of which tab was active — so they were
// a control that did nothing.

import * as React from "react";
import {
  Eye,
  MoreVertical,
  Shield,
  Trash2,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";

import {
  ROLE_INFO,
  ROLE_OPTIONS,
  SCOPE_OPTIONS,
  formatDate,
  initials,
  scopeSummary,
  type SettingsData,
  type TeamMember,
} from "@/lib/settings/model";
import {
  inviteTeamMember,
  removeTeamMember,
  resendInvitation,
  updateTeamMember,
} from "@/app/(app)/settings/actions";
import {
  Chip,
  EmptyState,
  GhostButton,
  ListRow,
  Monogram,
  PrimaryButton,
  SelectField,
  SettingsCard,
  SettingsColumn,
  SettingsColumns,
} from "../primitives";
import { NeedHelpCard, PromptCard, SummaryRail } from "../summary-rail";
import { useAction } from "../use-section-form";

const ROLE_CHIP = {
  owner: "brand",
  admin: "running",
  editor: "success",
  viewer: "warning",
} as const;

export function TeamMembersSection({ data }: { data: SettingsData }) {
  const members = data.team.filter((m) => m.status !== "pending");
  const pending = data.team.filter((m) => m.status === "pending");

  const counts = {
    admins: data.team.filter((m) => m.role === "admin" || m.role === "owner")
      .length,
    editors: data.team.filter((m) => m.role === "editor").length,
    viewers: data.team.filter((m) => m.role === "viewer").length,
  };

  const seatsLeft = data.counts.seatLimit - data.counts.seatsUsed;

  return (
    <>
      <SettingsColumns>
        <SettingsColumn span={8}>
          <SettingsCard
            title="Team Members"
            blurb={`${data.counts.seatsUsed} / ${data.counts.seatLimit} member seats used · ${members.length} currently active.`}
          >
            {members.length === 0 ? (
              <EmptyState>No team members yet.</EmptyState>
            ) : (
              members.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))
            )}
          </SettingsCard>
        </SettingsColumn>

        <SettingsColumn span={4}>
          <SettingsCard
            title="Invite a teammate"
            blurb={
              seatsLeft > 0
                ? `${seatsLeft} seat${seatsLeft === 1 ? "" : "s"} left on your plan.`
                : "Every seat on your plan is in use."
            }
          >
            <InviteForm disabled={seatsLeft <= 0} />
          </SettingsCard>

          <SettingsCard
            title={`Pending Invitations (${pending.length})`}
            blurb="Invited members haven't accepted the invitation yet."
          >
            {pending.length === 0 ? (
              <EmptyState>Nothing pending — everyone has accepted.</EmptyState>
            ) : (
              pending.map((member) => (
                <PendingRow key={member.id} member={member} />
              ))
            )}
          </SettingsCard>
        </SettingsColumn>
      </SettingsColumns>

      <SummaryRail
        title="Team Summary"
        blurb={`${counts.admins} Admins · ${counts.editors} Editors · ${counts.viewers} Viewers`}
        items={[
          {
            icon: Shield,
            label: "Owner",
            value: ROLE_INFO.owner.blurb,
            tone: "brand",
          },
          { icon: Users, label: "Admin", value: ROLE_INFO.admin.blurb },
          {
            icon: Zap,
            label: "Editor",
            value: ROLE_INFO.editor.blurb,
            tone: "success",
          },
          { icon: Eye, label: "Viewer", value: ROLE_INFO.viewer.blurb },
        ]}
      >
        <PromptCard
          title="About roles"
          body="Roles control what each member can see and do. Change a role any time from the member menu."
          cta="View all permissions"
          href="/help"
        />
        <NeedHelpCard topic="managing team and permissions" />
      </SummaryRail>
    </>
  );
}

// ------------------------------------------------------------------

function MemberRow({ member }: { member: TeamMember }) {
  const { pending, run } = useAction();
  const isOwner = member.role === "owner";
  const [editing, setEditing] = React.useState(false);

  return (
    <ListRow>
      <Monogram
        text={initials(member.full_name ?? member.email)}
        tone={isOwner ? "brand" : "neutral"}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {member.full_name ?? member.email.split("@")[0]}
          {isOwner && (
            <span className="ml-1 font-normal text-ink-tertiary">(You)</span>
          )}
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">{member.email}</p>
      </div>

      <p className="hidden max-w-[200px] truncate text-[11px] text-ink-tertiary lg:block">
        {scopeSummary(member)} ·{" "}
        {formatDate(member.joined_at ?? member.created_at)}
      </p>

      {editing && !isOwner ? (
        <SelectField
          label={`Role for ${member.email}`}
          value={member.role}
          options={ROLE_OPTIONS}
          className="h-8 min-w-[120px]"
          onChange={(role) =>
            run(() => updateTeamMember({ id: member.id, role }), {
              success: "Role updated.",
              onSuccess: () => setEditing(false),
            })
          }
        />
      ) : (
        <Chip tone={ROLE_CHIP[member.role]}>
          {ROLE_INFO[member.role].label}
        </Chip>
      )}

      <GhostButton
        className="h-8 px-3 text-[12px]"
        disabled={isOwner || pending}
        onClick={() => setEditing((v) => !v)}
      >
        Manage
      </GhostButton>

      <button
        type="button"
        aria-label={`Remove ${member.email}`}
        disabled={isOwner || pending}
        onClick={() =>
          run(() => removeTeamMember(member.id), {
            success: "Member removed.",
          })
        }
        className="rounded-lg p-1.5 text-ink-muted transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-danger-bg hover:text-danger disabled:pointer-events-none disabled:opacity-30"
      >
        {isOwner ? (
          <MoreVertical className="size-4" aria-hidden />
        ) : (
          <Trash2 className="size-4" aria-hidden />
        )}
      </button>
    </ListRow>
  );
}

function PendingRow({ member }: { member: TeamMember }) {
  const { pending, run } = useAction();

  return (
    <ListRow>
      <Monogram text={initials(member.email)} tone="running" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-ink">
          {member.full_name ?? member.email.split("@")[0]}
        </p>
        <p className="truncate text-[11px] text-ink-tertiary">
          {member.email} · {ROLE_INFO[member.role].label} ·{" "}
          {formatDate(member.invited_at)}
        </p>
      </div>
      <Chip tone="warning">Pending</Chip>
      <GhostButton
        className="h-8 px-3 text-[12px]"
        disabled={pending}
        onClick={() =>
          run(() => resendInvitation(member.id), {
            success: "Invitation resent.",
          })
        }
      >
        Resend
      </GhostButton>
      <button
        type="button"
        aria-label={`Revoke invitation for ${member.email}`}
        disabled={pending}
        onClick={() =>
          run(() => removeTeamMember(member.id), {
            success: "Invitation revoked.",
          })
        }
        className="rounded-lg p-1.5 text-ink-muted transition-colors duration-100 [transition-timing-function:var(--ease-standard)] hover:bg-danger-bg hover:text-danger disabled:pointer-events-none disabled:opacity-30"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </ListRow>
  );
}

/** Stacked rather than inline: this card lives in the narrow column now. */
function InviteForm({ disabled }: { disabled: boolean }) {
  const { pending, run } = useAction();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("editor");
  const [scopes, setScopes] = React.useState<string[]>([]);

  return (
    <div className="space-y-3 pt-1">
      <input
        type="email"
        value={email}
        disabled={disabled}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@company.com"
        aria-label="Invitee email"
        className="h-9 w-full rounded-lg border border-border-default bg-surface-card px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50"
      />

      <SelectField
        label="Invitee role"
        value={role}
        onChange={setRole}
        options={ROLE_OPTIONS}
        disabled={disabled}
        className="w-full"
      />

      {/* Scopes only apply below admin — admins already have everything. */}
      {role !== "admin" && (
        <div>
          <p className="mb-1.5 text-[11px] text-ink-tertiary">Module access</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {SCOPE_OPTIONS.map((scope) => {
              const on = scopes.includes(scope.value);
              return (
                <button
                  key={scope.value}
                  type="button"
                  aria-pressed={on}
                  disabled={disabled}
                  onClick={() =>
                    setScopes((prev) =>
                      on
                        ? prev.filter((s) => s !== scope.value)
                        : [...prev, scope.value],
                    )
                  }
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors duration-100 [transition-timing-function:var(--ease-standard)] disabled:opacity-50 ${
                    on
                      ? "border-brand/30 bg-selected-bg text-brand"
                      : "border-border-default bg-surface-card text-ink-tertiary hover:bg-hover-bg"
                  }`}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PrimaryButton
        className="w-full"
        disabled={disabled || pending || email.trim() === ""}
        onClick={() =>
          run(() => inviteTeamMember({ email, role, scopes }), {
            success: "Invitation sent.",
            onSuccess: () => {
              setEmail("");
              setScopes([]);
            },
          })
        }
      >
        <UserPlus className="size-4" aria-hidden />
        {pending ? "Sending…" : "Send Invite"}
      </PrimaryButton>
    </div>
  );
}
