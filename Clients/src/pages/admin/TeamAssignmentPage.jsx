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

export default function TeamAssignmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const { data: allUsers = [] } = useGetUsersQuery({});
  const { data: workload = [] } = useGetTeamWorkloadQuery();
  const [assignTeamMember, { isLoading: isAssigning }] = useAssignTeamMemberMutation();
  const [removeTeamMember] = useRemoveTeamMemberMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Architect");

  const internalUsers = allUsers.filter((u) => u.role !== ROLES.CLIENT);
  const workloadByUserId = new Map(workload.map((w) => [String(w.userId), w.activeProjects]));

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

  const handleAssign = async () => {
    const user = availableUsers.find((u) => u.id === selectedUserId) || availableUsers[0];
    if (!user) return;
    try {
      await assignTeamMember({
        projectId: id,
        member: { userId: user.id, name: user.name, role: selectedRole },
      }).unwrap();
      dispatch(pushToast(`${user.name} assigned as ${selectedRole}`, "success"));
      setIsModalOpen(false);
    } catch (err) {
      dispatch(pushToast(err.message || "Could not assign team member", "danger"));
    }
  };

  const handleRemove = async (member) => {
    try {
      await removeTeamMember({ projectId: id, userId: member.userId }).unwrap();
      dispatch(pushToast(`${member.name} removed from project`, "info"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not remove team member", "danger"));
    }
  };

  const workloadByUser = (userId) => workloadByUserId.get(String(userId)) ?? 0;

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

        <Card padded={false}>
          <CardHeader title="Assigned team" subtitle={`${project.team.length} members on this project`} />
          <CardBody>
            {project.team.map((member) => (
              <div key={member.userId} className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
                <Avatar initials={member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-(--color-text-primary)">{member.name}</div>
                  <div className="text-xs text-(--color-text-secondary)">{member.role}</div>
                </div>
                <div className="text-xs text-(--color-text-secondary) mr-3">
                  {workloadByUser(member.userId)} active projects
                </div>
                <button
                  className="icon-btn"
                  aria-label="Remove member"
                  onClick={() => handleRemove(member)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            ))}
          </CardBody>
        </Card>
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
              {isAssigning ? "Assigning…" : "Assign"}
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
                ? availableUsers.map((u) => ({ value: u.id, label: `${u.name} — ${ROLE_LABELS[u.role]}` }))
                : [{ value: "", label: "No more staff available" }]
            }
          />
          <Select
            label="Project role"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={[
              { value: "Lead Architect", label: "Lead Architect" },
              { value: "Architect", label: "Architect" },
              { value: "Designer", label: "Designer" },
              { value: "Principal Designer", label: "Principal Designer" },
              { value: "Project Manager", label: "Project Manager" },
            ]}
          />
        </div>
      </Modal>
    </>
  );
}
