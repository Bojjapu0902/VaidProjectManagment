import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import { Badge } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import Table from "../../components/common/Table";
import { Input, Select } from "../../components/common/FormField";
import { PageLoader, EmptyState } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import { formatRelativeTime } from "../../utils/format";
import {
  useGetUsersQuery,
  useGetTeamWorkloadQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
} from "../../app/api/apiSlice";

const TEAM_ROLE_OPTIONS = [
  { value: ROLES.PROJECT_MANAGER, label: ROLE_LABELS[ROLES.PROJECT_MANAGER] },
  { value: ROLES.ARCHITECT, label: ROLE_LABELS[ROLES.ARCHITECT] },
  { value: ROLES.PRINCIPAL_DESIGNER, label: ROLE_LABELS[ROLES.PRINCIPAL_DESIGNER] },
  { value: ROLES.DESIGNER, label: ROLE_LABELS[ROLES.DESIGNER] },
  { value: ROLES.ENGINEER, label: ROLE_LABELS[ROLES.ENGINEER] },
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
];

const ROLE_FILTER_OPTIONS = [{ value: "all", label: "All roles" }, ...TEAM_ROLE_OPTIONS];

// Plain-language description of what each role can do — shown directly in the
// "Can" column so an admin never has to cross-reference a permissions matrix.
const ROLE_CAN_TEXT = {
  [ROLES.ADMIN]: "Everything, incl. users & settings",
  [ROLES.PROJECT_MANAGER]: "Create projects, assign, approve",
  [ROLES.ARCHITECT]: "Update stages, upload documents",
  [ROLES.PRINCIPAL_DESIGNER]: "Lead design, upload documents",
  [ROLES.DESIGNER]: "Upload design documents",
  [ROLES.ENGINEER]: "Upload technical documents",
};

// Role badges need per-role colour beyond the fixed Badge variants, so they
// render with the shared `.badge` class directly (same pattern as StageBadge).
const ROLE_BADGE_STYLE = {
  [ROLES.ADMIN]: { bg: "var(--color-danger-bg)", color: "var(--color-danger)" },
  [ROLES.PROJECT_MANAGER]: { bg: "var(--color-navy-light)", color: "var(--color-navy)" },
};
const DEFAULT_ROLE_BADGE_STYLE = { bg: "var(--color-bg)", color: "var(--color-text-secondary)" };

function RoleBadge({ role }) {
  const style = ROLE_BADGE_STYLE[role] || DEFAULT_ROLE_BADGE_STYLE;
  return (
    <span className="badge" style={{ background: style.bg, color: style.color }}>
      {ROLE_LABELS[role]}
    </span>
  );
}

function memberStatus(member) {
  if (member.isActive === false) return "deactivated";
  if (member.status === "invited") return "invited";
  return "active";
}

const STATUS_BADGE = {
  active: { variant: "success", label: "Active" },
  invited: { variant: "warning", label: "Invited" },
  deactivated: { variant: "neutral", label: "Deactivated" },
};

export default function TeamManagementPage() {
  const { user: currentUser } = useAuth();
  const dispatch = useAppDispatch();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null => invite mode
  const [memberToDeactivate, setMemberToDeactivate] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: users = [], isLoading } = useGetUsersQuery({});
  const { data: workload = [] } = useGetTeamWorkloadQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const teamMembers = useMemo(() => users.filter((u) => u.role !== ROLES.CLIENT), [users]);
  const workloadByUserId = useMemo(
    () => new Map(workload.map((w) => [String(w.userId), w.activeProjects])),
    [workload]
  );
  const visibleMembers = useMemo(
    () => (roleFilter === "all" ? teamMembers : teamMembers.filter((m) => m.role === roleFilter)),
    [teamMembers, roleFilter]
  );
  const invitedCount = teamMembers.filter((m) => memberStatus(m) === "invited").length;
  const activeAdminCount = teamMembers.filter((m) => m.role === ROLES.ADMIN && m.isActive !== false).length;

  const isAdmin = currentUser?.role === ROLES.ADMIN;

  const closeModal = () => {
    setModalOpen(false);
    setEditingMember(null);
  };

  const openInvite = () => {
    setEditingMember(null);
    reset({ name: "", email: "", phone: "", role: ROLES.ARCHITECT, password: "" });
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    reset({ name: member.name, email: member.email, phone: member.phone || "", role: member.role, password: "" });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editingMember) {
        // Editing reuses the exact same form as inviting — a field has one editor.
        await updateUser({
          id: editingMember.id,
          payload: { name: values.name, email: values.email, phone: values.phone, role: values.role },
        }).unwrap();
        dispatch(pushToast(`${values.name}'s details were updated`, "success"));
      } else {
        await createUser({ ...values, password: values.password || "changeme123" }).unwrap();
        dispatch(pushToast(`${values.name} was invited to the team`, "success"));
      }
      closeModal();
    } catch (err) {
      dispatch(pushToast(err?.message || "Could not save the team member", "danger"));
    }
  };

  const handleResend = async (member) => {
    try {
      // No dedicated resend endpoint — bumping invitedAt via the existing
      // update mutation is what re-sends the invitation server-side.
      await updateUser({ id: member.id, payload: { invitedAt: new Date().toISOString() } }).unwrap();
      dispatch(pushToast(`Invitation resent to ${member.name}`, "success"));
    } catch (err) {
      dispatch(pushToast(err?.message || "Could not resend the invitation", "danger"));
    }
  };

  const confirmDeactivate = async () => {
    if (!memberToDeactivate) return;
    try {
      await deactivateUser(memberToDeactivate.id).unwrap();
      dispatch(pushToast(`${memberToDeactivate.name} was deactivated`, "success"));
      setMemberToDeactivate(null);
    } catch (err) {
      dispatch(pushToast(err?.message || "Could not deactivate this member", "danger"));
    }
  };

  if (currentUser && !isAdmin) {
    return (
      <>
        <Topbar title="Team management" subtitle="Restricted" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <div className="p-8 flex-1 overflow-y-auto">
          <Card padded={false}>
            <EmptyState
              icon="lock"
              title="Admin access only"
              description="Team management is limited to admin accounts. Ask an admin if you need a role changed or a teammate added."
            />
          </Card>
        </div>
      </>
    );
  }

  const columns = [
    {
      key: "member",
      header: "Member",
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={row.avatarInitials} size="sm" tone="neutral" />
          <div className="min-w-0">
            <div className="font-semibold text-(--color-text-primary) truncate">{row.name}</div>
            <div className="text-xs text-(--color-text-secondary) truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role", render: (row) => <RoleBadge role={row.role} /> },
    {
      key: "can",
      header: "Can",
      render: (row) => (
        <span className="text-xs text-(--color-text-secondary)">{ROLE_CAN_TEXT[row.role] || "—"}</span>
      ),
    },
    {
      key: "projects",
      header: "Projects",
      render: (row) => (
        <span className="font-mono text-xs text-(--color-text-primary)">
          {workloadByUserId.get(String(row.id)) ?? 0}
        </span>
      ),
    },
    {
      key: "lastActive",
      header: "Last active",
      render: (row) => {
        const status = memberStatus(row);
        const label = status === "invited" && !row.lastActiveAt ? "never" : formatRelativeTime(row.lastActiveAt);
        return <span className="font-mono text-xs text-(--color-text-secondary)">{label}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        const s = STATUS_BADGE[memberStatus(row)];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      render: (row) => {
        const status = memberStatus(row);
        const isLastAdmin = row.role === ROLES.ADMIN && activeAdminCount <= 1;
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            {status === "invited" && (
              <button
                type="button"
                className="icon-btn"
                title="Resend invitation"
                aria-label={`Resend invitation to ${row.name}`}
                onClick={() => handleResend(row)}
              >
                <Icon name="send" size={14} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              title="Edit"
              aria-label={`Edit ${row.name}`}
              onClick={() => openEdit(row)}
            >
              <Icon name="edit" size={14} />
            </button>
            {status !== "deactivated" && (
              <button
                type="button"
                className="icon-btn hover:text-(--color-danger) disabled:opacity-40 disabled:hover:text-(--color-text-secondary) disabled:cursor-not-allowed"
                title={isLastAdmin ? "Can't deactivate the last remaining admin" : "Deactivate"}
                aria-label={
                  isLastAdmin ? `Can't deactivate ${row.name} — the last remaining admin` : `Deactivate ${row.name}`
                }
                disabled={isLastAdmin}
                onClick={() => setMemberToDeactivate(row)}
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Topbar title="Team management" subtitle="Manage who exists and what their role grants" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-(--color-border)">
            <div>
              <h2 className="text-[15px] font-bold text-(--color-text-primary)">Team</h2>
              <p className="text-xs text-(--color-text-secondary) mt-0.5">
                {teamMembers.length} member{teamMembers.length === 1 ? "" : "s"}
                {invitedCount > 0 && ` · ${invitedCount} invitation${invitedCount === 1 ? "" : "s"} pending`}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={ROLE_FILTER_OPTIONS}
                containerClassName="w-full sm:w-44"
              />
              <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={openInvite}>
                Invite member
              </Button>
            </div>
          </div>

          {isLoading ? (
            <PageLoader />
          ) : teamMembers.length === 0 ? (
            <EmptyState icon="users" title="No team members yet" description="Invite your first team member to get started." />
          ) : (
            <Table
              columns={columns}
              data={visibleMembers}
              onRowClick={openEdit}
              emptyMessage="No team members match this filter."
            />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingMember ? "Edit team member" : "Invite team member"}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isCreating || isUpdating}>
              {editingMember
                ? (isUpdating ? "Saving…" : "Save changes")
                : (isCreating ? "Sending invite…" : "Send invite")}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Full name" placeholder="e.g. Kavya Menon" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
          <Input label="Email" type="email" placeholder="name@vaid.com" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
          <Input label="Phone" placeholder="+91 …" {...register("phone")} />
          <Select label="Role" options={TEAM_ROLE_OPTIONS} {...register("role", { required: true })} />
          {!editingMember && (
            <Input label="Temporary password" type="password" placeholder="Sent to the member separately" {...register("password")} />
          )}
        </form>
      </Modal>

      <Modal
        isOpen={!!memberToDeactivate}
        onClose={() => setMemberToDeactivate(null)}
        title="Deactivate team member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMemberToDeactivate(null)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDeactivate}>Deactivate</Button>
          </>
        }
      >
        <p className="text-sm text-(--color-text-secondary)">
          {memberToDeactivate?.name} will lose access immediately. Nothing is deleted — their history and past work
          stay on record and can be restored by reactivating the account later.
        </p>
      </Modal>
    </>
  );
}
