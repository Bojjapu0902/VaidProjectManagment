import { useState } from "react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import { Badge } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import { Input, Select } from "../../components/common/FormField";
import { PageLoader, EmptyState } from "../../components/common/EmptyState";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import {
  useGetUsersQuery,
  useGetTeamWorkloadQuery,
  useCreateUserMutation,
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

// Display order + visual identity for each role category on the board.
const CATEGORY_ORDER = [
  ROLES.PROJECT_MANAGER,
  ROLES.ARCHITECT,
  ROLES.PRINCIPAL_DESIGNER,
  ROLES.DESIGNER,
  ROLES.ENGINEER,
  ROLES.ADMIN,
];

const ROLE_META = {
  [ROLES.PROJECT_MANAGER]: { icon: "clipboard-check", color: "var(--color-stage-1)", bg: "var(--color-info-bg)" },
  [ROLES.ARCHITECT]: { icon: "blueprint", color: "var(--color-stage-3)", bg: "#EFE9FB" },
  [ROLES.PRINCIPAL_DESIGNER]: { icon: "star", color: "var(--color-stage-4)", bg: "var(--color-warning-bg)" },
  [ROLES.DESIGNER]: { icon: "palette", color: "var(--color-stage-2)", bg: "var(--color-success-bg)" },
  [ROLES.ENGINEER]: { icon: "building-skyscraper", color: "var(--color-stage-5)", bg: "var(--color-info-bg)" },
  [ROLES.ADMIN]: { icon: "settings", color: "var(--color-navy)", bg: "var(--color-navy-light)" },
};

function MemberCard({ member, meta, activeProjects, onDeactivate }) {
  const isDeactivated = member.isActive === false;

  return (
    <Card className={clsx("flex flex-col gap-4", isDeactivated && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar initials={member.avatarInitials} size="md" />
          <div className="min-w-0">
            <div className="font-semibold text-(--color-text-primary) text-sm truncate">{member.name}</div>
            <div className="flex items-center gap-1.5 text-xs mt-0.5" style={{ color: meta.color }}>
              <Icon name={meta.icon} size={12} />
              {ROLE_LABELS[member.role]}
            </div>
          </div>
        </div>
        {!isDeactivated && (
          <button
            className="icon-btn flex-shrink-0"
            aria-label={`Deactivate ${member.name}`}
            title="Deactivate member"
            onClick={onDeactivate}
          >
            <Icon name="trash" size={14} />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-(--color-text-secondary)">
        <div className="flex items-center gap-1.5 truncate">
          <Icon name="mail" size={13} className="text-(--color-text-tertiary) flex-shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center gap-1.5">
            <Icon name="phone" size={13} className="text-(--color-text-tertiary) flex-shrink-0" />
            {member.phone}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-(--color-border)">
        <span className="text-xs text-(--color-text-secondary)">
          {activeProjects} active project{activeProjects === 1 ? "" : "s"}
        </span>
        <Badge variant={isDeactivated ? "neutral" : "success"}>{isDeactivated ? "Deactivated" : "Active"}</Badge>
      </div>
    </Card>
  );
}

export default function TeamManagementPage() {
  const [isModalOpen, setModalOpen] = useState(false);
  const { data: users = [], isLoading } = useGetUsersQuery({});
  const { data: workload = [] } = useGetTeamWorkloadQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const teamMembers = users.filter((u) => u.role !== ROLES.CLIENT);
  const workloadByUserId = new Map(workload.map((w) => [String(w.userId), w.activeProjects]));

  const membersByRole = teamMembers.reduce((acc, member) => {
    (acc[member.role] = acc[member.role] || []).push(member);
    return acc;
  }, {});

  const onCreate = async (values) => {
    await createUser({ ...values, password: values.password || "changeme123" });
    reset();
    setModalOpen(false);
  };

  return (
    <>
      <Topbar
        title="Team management"
        subtitle={`${teamMembers.length} team members`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setModalOpen(true)}>
            Add member
          </Button>
        }
      />
      <div className="p-8 flex-1 overflow-y-auto">
        {isLoading ? (
          <Card padded={false}>
            <PageLoader />
          </Card>
        ) : teamMembers.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon="users" title="No team members yet" description="Add your first team member to get started." />
          </Card>
        ) : (
          CATEGORY_ORDER.map((role) => {
            const members = membersByRole[role];
            if (!members || members.length === 0) return null;
            const meta = ROLE_META[role];

            return (
              <section key={role} className="mb-8 last:mb-0">
                <div className="flex items-center gap-2.5 mb-4">
                  <div
                    className="w-8 h-8 rounded-(--radius-md) flex items-center justify-center flex-shrink-0"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Icon name={meta.icon} size={16} />
                  </div>
                  <h2 className="text-sm font-bold text-(--color-text-primary)">{ROLE_LABELS[role]}</h2>
                  <span className="text-xs text-(--color-text-tertiary)">{members.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {members.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      meta={meta}
                      activeProjects={workloadByUserId.get(String(member.id)) ?? 0}
                      onDeactivate={() => deactivateUser(member.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Add team member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onCreate)} disabled={isCreating}>
              {isCreating ? "Adding…" : "Add member"}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onCreate)}>
          <Input label="Full name" placeholder="e.g. Kavya Menon" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
          <Input label="Email" type="email" placeholder="name@vaid.com" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
          <Input label="Phone" placeholder="+91 …" {...register("phone")} />
          <Select label="Role" options={TEAM_ROLE_OPTIONS} {...register("role", { required: true })} />
          <Input label="Temporary password" type="password" placeholder="Sent to the member separately" {...register("password")} />
        </form>
      </Modal>
    </>
  );
}
