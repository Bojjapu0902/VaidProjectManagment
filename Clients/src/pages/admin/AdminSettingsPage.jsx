import { useState } from "react";
import clsx from "clsx";
import { useForm } from "react-hook-form";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Input, Select } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { EmptyState } from "../../components/common/EmptyState";
import Icon from "../../components/common/Icon";
import Avatar from "../../components/common/Avatar";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { updateLocalUser } from "../../app/authSlice";
import { useUpdateUserMutation } from "../../app/api/apiSlice";
import { ROLE_LABELS, ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import { formatRelativeTime } from "../../utils/format";

const NAV_SECTIONS = [
  { key: "studio", label: "Studio profile" },
  { key: "templates", label: "Stage templates" },
  { key: "storage", label: "Storage & recovery" },
  { key: "profile", label: "My profile" },
  { key: "audit", label: "Audit log" },
];

const DEFAULT_TEMPLATES = [
  { id: "full", name: "Full architectural", stageCount: 8 },
  { id: "interior", name: "Interior fit-out", stageCount: 6 },
  { id: "consultancy", name: "Consultancy only", stageCount: 4 },
  { id: "masterplan", name: "Masterplan", stageCount: 9 },
  { id: "blank", name: "Start blank", stageCount: 0 },
];

const WORKFLOW_RULES = [
  {
    key: "requireInternalReview",
    label: "Require internal review before any client approval",
    warnOnOff: "Turning this off lets client approval requests go out without a second pair of eyes on them first — every approval sent from here on will be recorded as unreviewed in the audit log.",
  },
  {
    key: "clientCommentRequired",
    label: "Client comment mandatory when requesting changes",
  },
  {
    key: "autoDeriveProgress",
    label: "Derive stage percentage from milestones automatically",
  },
];

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        "w-8 h-[17px] rounded-(--radius-pill) relative transition-colors flex-shrink-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)",
        checked ? "bg-(--color-navy)" : "bg-(--color-border)"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-(--color-surface) transition-all",
          checked ? "right-0.5" : "left-0.5"
        )}
      />
    </button>
  );
}

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone },
  });

  const [section, setSection] = useState("studio");

  // ---- Studio profile (local — no backend field exists for these yet;
  // Save writes a diffed entry to the session audit log below, same as a
  // real settings write would). ----
  const [studio, setStudio] = useState({
    name: "Vaid Architects & Interiors",
    replyTo: "studio@vaid.in",
    codePrefix: "VA",
    currency: "INR",
    dateFormat: "DD MMM YYYY",
  });
  const [savedStudio, setSavedStudio] = useState(studio);
  const [rules, setRules] = useState({ requireInternalReview: true, clientCommentRequired: true, autoDeriveProgress: true });
  const [savedRules, setSavedRules] = useState(rules);

  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES.map((t, i) => ({ ...t, isDefault: i === 0 })));
  const [auditLog, setAuditLog] = useState([]);

  const logChange = (field, from, to) => {
    if (from === to) return;
    setAuditLog((prev) => [{ id: `${Date.now()}-${field}`, field, from, to, at: new Date(), by: user?.name || "You" }, ...prev]);
  };

  const isAdmin = user?.role === ROLES.ADMIN;

  const onSaveProfile = async ({ name, phone }) => {
    try {
      const updated = await updateUser({ id: user.id, payload: { name, phone } }).unwrap();
      dispatch(updateLocalUser(updated));
      dispatch(pushToast("Profile updated", "success"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not update profile", "danger"));
    }
  };

  const saveStudioProfile = () => {
    Object.entries(studio).forEach(([key, value]) => {
      if (savedStudio[key] !== value) logChange(key, savedStudio[key], value);
    });
    Object.entries(rules).forEach(([key, value]) => {
      if (savedRules[key] !== value) {
        const rule = WORKFLOW_RULES.find((r) => r.key === key);
        logChange(rule?.label || key, savedRules[key] ? "On" : "Off", value ? "On" : "Off");
      }
    });
    setSavedStudio(studio);
    setSavedRules(rules);
    dispatch(pushToast("Studio profile saved", "success"));
  };

  const setDefaultTemplate = (id) => {
    const prevDefault = templates.find((t) => t.isDefault);
    const next = templates.find((t) => t.id === id);
    if (prevDefault?.id === id) return;
    setTemplates((prev) => prev.map((t) => ({ ...t, isDefault: t.id === id })));
    logChange("Studio default template", prevDefault?.name || "—", next?.name || "—");
    dispatch(pushToast(`${next?.name} set as the studio default`, "success"));
  };

  if (!user) return null;

  if (!isAdmin) {
    return (
      <>
        <Topbar title="Settings" subtitle="Platform configuration" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <div className="p-8 flex-1 overflow-y-auto">
          <Card>
            <EmptyState
              icon="lock"
              title="Admins only"
              description="Platform settings change behaviour for everyone on the studio, so only an Admin can open this screen. You're signed in as a Project Manager."
            />
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Platform settings" subtitle="Configuration that applies across the whole studio" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <Card padded={false} className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
            <nav className="border-b md:border-b-0 md:border-r border-(--color-border) p-3.5 flex md:flex-col gap-1 overflow-x-auto">
              {NAV_SECTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSection(s.key)}
                  className={clsx(
                    "text-left text-[13px] font-medium px-3 py-2.5 rounded-(--radius-sm) whitespace-nowrap transition-colors",
                    section === s.key
                      ? "bg-(--color-navy) text-white"
                      : "text-(--color-text-primary) hover:bg-(--color-bg)"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            <div>
              {section === "studio" && (
                <>
                  <CardHeader
                    title="Studio profile"
                    subtitle="Appears on the client portal, emails and exported reports"
                    action={<Button variant="primary" size="sm" onClick={saveStudioProfile}>Save</Button>}
                  />
                  <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4.5">
                    <Input
                      label="Studio name"
                      value={studio.name}
                      onChange={(e) => setStudio((s) => ({ ...s, name: e.target.value }))}
                    />
                    <Input
                      label="Reply-to email"
                      type="email"
                      value={studio.replyTo}
                      onChange={(e) => setStudio((s) => ({ ...s, replyTo: e.target.value }))}
                    />
                    <div>
                      <Input
                        label="Project code prefix"
                        value={studio.codePrefix}
                        onChange={(e) => setStudio((s) => ({ ...s, codePrefix: e.target.value.toUpperCase() }))}
                        className="font-mono"
                      />
                      <p className="text-[11px] text-(--color-text-secondary) mt-1.5">
                        Changing the prefix only affects projects created from now on — existing project codes stay as they are.
                      </p>
                    </div>
                    <Select
                      label="Currency"
                      value={studio.currency}
                      onChange={(e) => setStudio((s) => ({ ...s, currency: e.target.value }))}
                      options={[
                        { value: "INR", label: "INR ₹" },
                        { value: "USD", label: "USD $" },
                      ]}
                    />

                    <div className="sm:col-span-2 pt-4 border-t border-(--color-border) flex flex-col gap-3">
                      <span className="text-[13px] font-semibold text-(--color-text-primary)">Workflow rules</span>
                      {WORKFLOW_RULES.map((rule) => (
                        <div key={rule.key} className="flex flex-col gap-2 pb-3 border-b border-(--color-border) last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[12.5px] text-(--color-text-primary)">{rule.label}</span>
                            <ToggleSwitch
                              checked={rules[rule.key]}
                              onChange={(v) => setRules((r) => ({ ...r, [rule.key]: v }))}
                              label={rule.label}
                            />
                          </div>
                          {rule.warnOnOff && !rules[rule.key] && (
                            <p className="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-(--color-warning) bg-(--color-warning-bg) rounded-(--radius-sm) px-3 py-2">
                              <Icon name="alert-triangle" size={13} className="flex-shrink-0 mt-0.5" />
                              {rule.warnOnOff}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardBody>
                </>
              )}

              {section === "templates" && (
                <>
                  <CardHeader
                    title="Stage templates"
                    subtitle="Choose which stage sequence new projects start from"
                  />
                  <CardBody className="space-y-2.5">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-4 px-4 py-3 rounded-(--radius-sm) border border-(--color-border)"
                      >
                        <div>
                          <div className="text-[13px] font-semibold text-(--color-text-primary)">{t.name}</div>
                          <div className="text-[11.5px] text-(--color-text-secondary) font-mono mt-0.5">
                            {t.stageCount} stage{t.stageCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        {t.isDefault ? (
                          <Badge variant="info">Studio default</Badge>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => setDefaultTemplate(t.id)}>
                            Set as default
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="mt-2 px-3.5 py-3 rounded-(--radius-sm) bg-(--color-bg) text-xs leading-relaxed text-(--color-text-secondary)">
                      Editing a template — renaming, reordering, or adding and removing stages — never changes a live
                      project. Each project owns its own stages once created, managed from that project's Stages tab.
                    </div>
                  </CardBody>
                </>
              )}

              {section === "storage" && (
                <>
                  <CardHeader title="Storage & recovery" subtitle="Deleted items stay recoverable for 30 days" />
                  <CardBody>
                    <div className="mb-4 px-3.5 py-3 rounded-(--radius-sm) bg-(--color-bg) text-xs leading-relaxed text-(--color-text-secondary)">
                      Deleted projects, users and documents move here instead of disappearing immediately. Anything not
                      restored within 30 days of deletion is purged permanently and can't be recovered after that.
                    </div>
                    <EmptyState
                      icon="trash"
                      title="Nothing to recover"
                      description="Nothing has been deleted in the last 30 days."
                    />
                  </CardBody>
                </>
              )}

              {section === "profile" && (
                <>
                  <CardHeader title="My profile" subtitle="Your own account details" />
                  <CardBody>
                    <div className="flex items-center gap-3 mb-5">
                      <Avatar initials={user?.avatarInitials} size="lg" />
                      <div>
                        <div className="text-sm font-semibold">{user?.name}</div>
                        <div className="text-xs text-(--color-text-secondary)">{ROLE_LABELS[user?.role]}</div>
                      </div>
                    </div>
                    <form onSubmit={handleSubmit(onSaveProfile)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Full name" {...register("name")} />
                      <Input label="Email" type="email" disabled {...register("email")} />
                      <Input label="Phone" {...register("phone")} />
                      <div className="sm:col-span-2 flex justify-end">
                        <Button type="submit" variant="primary" disabled={isSaving}>
                          {isSaving ? "Saving…" : "Save changes"}
                        </Button>
                      </div>
                    </form>
                  </CardBody>
                </>
              )}

              {section === "audit" && (
                <>
                  <CardHeader title="Audit log" subtitle="Every settings change this session, with the previous value" />
                  <CardBody>
                    {auditLog.length === 0 ? (
                      <EmptyState
                        icon="clipboard-check"
                        title="No changes yet"
                        description="Settings changes you make will appear here, along with the value they replaced."
                      />
                    ) : (
                      <div className="space-y-2.5">
                        {auditLog.map((entry) => (
                          <div key={entry.id} className="flex items-start justify-between gap-4 pb-2.5 border-b border-(--color-border) last:border-0">
                            <div>
                              <div className="text-[12.5px] font-medium text-(--color-text-primary)">{entry.field}</div>
                              <div className="text-[11.5px] text-(--color-text-secondary) mt-0.5">
                                <span className="line-through">{String(entry.from ?? "—")}</span>
                                {" → "}
                                <span className="font-semibold text-(--color-text-primary)">{String(entry.to)}</span>
                                {" · "}{entry.by}
                              </div>
                            </div>
                            <span className="text-[11px] text-(--color-text-tertiary) whitespace-nowrap">{formatRelativeTime(entry.at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardBody>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
