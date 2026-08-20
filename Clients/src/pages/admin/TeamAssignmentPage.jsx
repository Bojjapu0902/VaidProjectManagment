import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Modal from "../../components/common/Modal";
import { Select } from "../../components/common/FormField";
import { PageLoader } from "../../components/common/EmptyState";
import {
  useGetProjectByIdQuery,
  useGetUsersQuery,
  useGetTeamWorkloadQuery,
  useAssignTeamMemberMutation,
  useRemoveTeamMemberMutation,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";

const WORKLOAD_HEAVY_THRESHOLD = 4; // matches "flagged amber" rule from the reference spec

const isProjectManagerRow = (role) => (role || "").trim().toLowerCase() === "project manager";

function workloadTone(count) {
  if (count >= WORKLOAD_HEAVY_THRESHOLD) {
    return { bar: "var(--color-amber)", text: "text-(--color-warning)", suffix: " — at capacity" };
  }
  if (count <= 1) {
    return { bar: "var(--color-success)", text: "text-(--color-success)", suffix: " — free" };
  }
  return { bar: "var(--color-navy)", text: "text-(--color-text-secondary)", suffix: "" };
}

export default function TeamAssignmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: allUsers = [] } = useGetUsersQuery({});
  const { data: workload = [] } = useGetTeamWorkloadQuery();
  const [assignTeamMember, { isLoading: isAssigning }] = useAssignTeamMemberMutation();
  const [removeTeamMember, { isLoading: isRemoving }] = useRemoveTeamMemberMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Architect");
  const [memberToRemove, setMemberToRemove] = useState(null);

  const internalUsers = allUsers.filter((u) => u.role !== ROLES.CLIENT);
  const usersById = new Map(allUsers.map((u) => [String(u.id), u]));
  const workloadByUserId = new Map(workload.map((w) => [String(w.userId), w.activeProjects]));
  const workloadByUser = (userId) => workloadByUserId.get(String(userId)) ?? 0;

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const assignedIds = new Set(project.team.map((m) => m.userId));
  const availableUsers = internalUsers.filter((u) => !assignedIds.has(u.id));
  const hasProjectManager = project.team.some((m) => isProjectManagerRow(m.role));

  const roleOptions = [
    { value: "Lead Architect", label: "Lead Architect" },
    { value: "Architect", label: "Architect" },
    { value: "Designer", label: "Designer" },
    { value: "Principal Designer", label: "Principal Designer" },
    { value: "Engineer", label: "Engineer" },
    ...(hasProjectManager ? [] : [{ value: "Project Manager", label: "Project Manager" }]),
  ];

  const handleAssign = async () => {
    const user = availableUsers.find((u) => u.id === selectedUserId) || availableUsers[0];
    if (!user) return;
    try {
      await assignTeamMember({
        projectId: id,
        member: { userId: user.id, name: user.name, role: selectedRole },
      }).unwrap();
      dispatch(pushToast(`${user.name} assigned as ${selectedRole} — they've been notified`, "success"));
      setIsModalOpen(false);
      setSelectedUserId("");
    } catch (err) {
      dispatch(pushToast(err.message || "Could not assign team member", "danger"));
    }
  };

  const confirmRemove = async () => {
    if (!memberToRemove) return;
    try {
      await removeTeamMember({ projectId: id, userId: memberToRemove.userId }).unwrap();
      dispatch(pushToast(`${memberToRemove.name} removed from project`, "info"));
      setMemberToRemove(null);
    } catch (err) {
      dispatch(pushToast(err.message || "Could not remove team member", "danger"));
    }
  };

  // Sorted heaviest-first so the workload panel reads as a priority list,
  // same as the reference — the person you're most likely to overload sits
  // at the top, right next to the assign action.
  const workloadRows = [...internalUsers]
    .map((u) => ({ user: u, count: workloadByUser(u.id) }))
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <Topbar
        title="Team assignment"
        subtitle={project.title}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setIsModalOpen(true)}>
            Assign member
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
          <Card padded={false}>
            <CardHeader
              title={`Assigned team · ${project.team.length}`}
              subtitle="Role, workload, and removal control for each member"
            />
            <CardBody>
              {project.team.map((member) => {
                const isPM = isProjectManagerRow(member.role);
                const count = workloadByUser(member.userId);
                const tone = workloadTone(count);
                const email = usersById.get(String(member.userId))?.email;

                return (
                  <div
                    key={member.userId}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 border-b border-(--color-border) last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-[190px] flex-1">
                      <Avatar initials={member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-(--color-text-primary) truncate">{member.name}</div>
                        {email && <div className="text-xs text-(--color-text-secondary) truncate">{email}</div>}
                      </div>
                    </div>

                    <span
                      className="font-mono text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-(--radius-pill)"
                      style={
                        isPM
                          ? { background: "var(--color-navy-light)", color: "var(--color-navy-on-tint)" }
                          : { background: "var(--color-bg)", color: "var(--color-text-secondary)" }
                      }
                    >
                      {member.role}
                    </span>

                    <span className={`text-xs ${tone.text} whitespace-nowrap`}>
                      {count} active project{count === 1 ? "" : "s"}
                      {tone.suffix}
                    </span>

                    <div className="ml-auto flex-shrink-0">
                      {isPM ? (
                        <span
                          className="flex items-center gap-1.5 text-xs text-(--color-text-tertiary)"
                          title="Exactly one project manager is required on a project. Remove is disabled — assign a replacement instead."
                        >
                          <Icon name="lock" size={13} /> Locked
                        </span>
                      ) : (
                        <button
                          className="icon-btn"
                          aria-label={`Remove ${member.name}`}
                          disabled={isRemoving}
                          onClick={() => setMemberToRemove(member)}
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Card padded={false} className="lg:sticky lg:top-5">
            <CardHeader title="Workload before you assign" subtitle="Active projects per member this month" />
            <CardBody className="flex flex-col gap-4">
              {workloadRows.map(({ user, count }) => {
                const tone = workloadTone(count);
                const widthPct = Math.min(count * 20, 100);
                return (
                  <div key={user.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-(--color-text-primary) font-medium">{user.name}</span>
                      <span className={`font-mono ${tone.text}`}>
                        {count} project{count === 1 ? "" : "s"}
                        {tone.suffix}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-(--radius-pill) bg-(--color-bg) overflow-hidden">
                      <div
                        className="h-full rounded-(--radius-pill)"
                        style={{ width: `${widthPct}%`, background: tone.bar }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="rounded-(--radius-sm) border border-(--color-border) bg-(--color-bg) p-3.5 flex flex-col gap-1 mt-1">
                <span className="text-xs font-semibold text-(--color-text-primary)">Client &amp; consultants</span>
                <span className="text-xs leading-relaxed text-(--color-text-secondary)">
                  Clients with portal access are not part of the project team. External consultants are
                  typically added as engineers, with view-and-upload rights limited to their own stage.
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign team member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssign} disabled={isAssigning || availableUsers.length === 0}>
              {isAssigning
                ? "Assigning…"
                : availableUsers.length === 0
                ? "No staff available"
                : "Assign"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Team member"
            value={selectedUserId || availableUsers[0]?.id || ""}
            onChange={(e) => setSelectedUserId(e.target.value)}
            options={
              availableUsers.length > 0
                ? availableUsers.map((u) => {
                    const count = workloadByUser(u.id);
                    const flag = count >= WORKLOAD_HEAVY_THRESHOLD ? " · at capacity" : "";
                    return {
                      value: u.id,
                      label: `${u.name} — ${ROLE_LABELS[u.role]} · ${count} project${count === 1 ? "" : "s"}${flag}`,
                    };
                  })
                : [{ value: "", label: "No more staff available" }]
            }
          />
          <Select
            label="Project role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={roleOptions}
          />
          {hasProjectManager && (
            <p className="text-xs text-(--color-text-secondary)">
              This project already has a project manager, so that role isn't offered here — a project
              can only have exactly one.
            </p>
          )}
          <p className="text-xs text-(--color-text-secondary)">
            The member is notified immediately once assigned.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        title="Remove team member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMemberToRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmRemove} disabled={isRemoving}>
              {isRemoving ? "Removing…" : "Remove"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--color-text-secondary) leading-relaxed">
          Remove <strong className="text-(--color-text-primary)">{memberToRemove?.name}</strong> from this
          project? Their uploads stay in place and their name remains in the project's audit trail — only
          their access and assignment are removed.
        </p>
      </Modal>
    </>
  );
}
