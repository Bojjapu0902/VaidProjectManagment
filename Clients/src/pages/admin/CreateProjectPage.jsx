import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Input, Select, Textarea } from "../../components/common/FormField";
import FileUpload from "../../components/common/FileUpload";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Avatar from "../../components/common/Avatar";
import { useCreateProjectMutation, useGetUsersQuery, useCreateUserMutation } from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { isValidEmail } from "../../utils/validators";

const PROJECT_TYPES = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Civic", label: "Civic" },
];

const NEW_CLIENT_VALUE = "__new_client__";

const MAX_DATE = "9999-12-31";

// Rejects malformed/rolled-over dates (e.g. 2026-02-30, which JS's Date
// constructor would otherwise silently normalize to March 2).
const isValidCalendarDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const PROJECT_ROLE_OPTIONS = [
  { value: "Lead Architect", label: "Lead Architect" },
  { value: "Architect", label: "Architect" },
  { value: "Designer", label: "Designer" },
  { value: "Principal Designer", label: "Principal Designer" },
  { value: "Project Manager", label: "Project Manager" },
  { value: "Engineer", label: "Engineer" },
];

// The account-role select was removed from the "add new member" form — the
// account role a new hire's User record gets is now inferred from the
// project role picked for them here.
const PROJECT_ROLE_TO_ACCOUNT_ROLE = {
  "Lead Architect": ROLES.ARCHITECT,
  Architect: ROLES.ARCHITECT,
  Designer: ROLES.DESIGNER,
  "Principal Designer": ROLES.PRINCIPAL_DESIGNER,
  "Project Manager": ROLES.PROJECT_MANAGER,
  Engineer: ROLES.ENGINEER,
};

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [createProject, { isLoading }] = useCreateProjectMutation();
  const { data: allUsers = [] } = useGetUsersQuery({});
  const [createUser] = useCreateUserMutation();

  const clientOptions = [
    ...allUsers.filter((u) => u.role === ROLES.CLIENT).map((c) => ({ value: c.id, label: c.name })),
    { value: NEW_CLIENT_VALUE, label: "+ Add new client" },
  ];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: "",
      type: "Residential",
      clientId: NEW_CLIENT_VALUE,
      newClientName: "",
      newClientEmail: "",
      newClientPhone: "",
      newClientCompany: "",
      location: "",
      description: "",
      budgetMin: "",
      budgetMax: "",
      startDate: "",
      expectedEndDate: "",
    },
  });

  const isNewClient = watch("clientId") === NEW_CLIENT_VALUE;

  const [stages, setStages] = useState([]);

  const uid = () => `${Date.now()}-${Math.random()}`;

  // Project team
  const internalUsers = allUsers.filter((u) => u.role !== ROLES.CLIENT);
  const [teamMembers, setTeamMembers] = useState([]);
  const availableUsers = internalUsers.filter(
    (u) => !teamMembers.some((m) => m.userId === u.id)
  );

  const [existingUserId, setExistingUserId] = useState("");
  const [existingRole, setExistingRole] = useState(PROJECT_ROLE_OPTIONS[0].value);

  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    projectRole: PROJECT_ROLE_OPTIONS[0].value,
  });
  const [newMemberError, setNewMemberError] = useState("");

  const addExistingMember = () => {
    const user = availableUsers.find((u) => u.id === existingUserId) || availableUsers[0];
    if (!user) return;
    setTeamMembers((prev) => [
      ...prev,
      { id: uid(), userId: user.id, name: user.name, email: user.email, role: existingRole, isNew: false },
    ]);
    setExistingUserId("");
  };

  const addNewMember = () => {
    if (!newMember.name.trim()) {
      setNewMemberError("Name is required");
      return;
    }
    if (!isValidEmail(newMember.email)) {
      setNewMemberError("Enter a valid email address");
      return;
    }
    setTeamMembers((prev) => [
      ...prev,
      {
        id: uid(),
        userId: null,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone.trim(),
        role: newMember.projectRole,
        isNew: true,
      },
    ]);
    setNewMember({
      name: "",
      email: "",
      phone: "",
      projectRole: PROJECT_ROLE_OPTIONS[0].value,
    });
    setNewMemberError("");
    setShowNewMemberForm(false);
  };

  const removeMember = (memberId) =>
    setTeamMembers((prev) => prev.filter((m) => m.id !== memberId));

  const addStage = () =>
    setStages((prev) => [...prev, { id: uid(), name: "", timeline: "", substages: [] }]);

  const removeStage = (stageId) =>
    setStages((prev) => prev.filter((s) => s.id !== stageId));

  const updateStageName = (stageId, name) =>
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, name } : s)));

  const updateStageTimeline = (stageId, timeline) =>
    setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, timeline } : s)));

  const addSubstage = (stageId) =>
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId ? { ...s, substages: [...s.substages, { id: uid(), name: "" }] } : s
      )
    );

  const removeSubstage = (stageId, subId) =>
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId ? { ...s, substages: s.substages.filter((sub) => sub.id !== subId) } : s
      )
    );

  const updateSubstageName = (stageId, subId, name) =>
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? { ...s, substages: s.substages.map((sub) => (sub.id === subId ? { ...sub, name } : sub)) }
          : s
      )
    );

  const onSubmit = async (values) => {
    try {
      let clientId = values.clientId;
      let clientName;

      if (isNewClient) {
        const newClient = await createUser({
          name: values.newClientName,
          email: values.newClientEmail,
          phone: values.newClientPhone,
          company: values.newClientCompany,
          role: ROLES.CLIENT,
          password: "changeme123",
        }).unwrap();
        clientId = newClient?.id;
        clientName = newClient?.name;
      } else {
        clientName = allUsers.find((u) => u.id === clientId)?.name;
      }

      const team = [];
      for (const member of teamMembers) {
        if (member.isNew) {
          const created = await createUser({
            name: member.name,
            email: member.email,
            phone: member.phone,
            role: PROJECT_ROLE_TO_ACCOUNT_ROLE[member.role] || ROLES.ENGINEER,
            password: "changeme123",
          }).unwrap();
          team.push({ userId: created?.id, name: created?.name, role: member.role });
        } else {
          team.push({ userId: member.userId, name: member.name, role: member.role });
        }
      }

      const project = await createProject({
        title: values.title,
        type: values.type,
        location: values.location,
        description: values.description,
        clientId,
        clientName,
        budget: { min: Number(values.budgetMin), max: Number(values.budgetMax), currency: "INR" },
        timeline: { startDate: values.startDate, expectedEndDate: values.expectedEndDate },
        team,
        lifecycle: stages.map(({ name, timeline, substages }) => ({
          name,
          timeline,
          substages: substages.map(({ name: subName }) => ({ name: subName })),
        })),
      }).unwrap();
      dispatch(pushToast(`${project.title} was created successfully`, "success"));
      navigate(ROUTES.ADMIN.PROJECT_DETAIL(project.id));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not create project", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Create project" subtitle="Onboard a new client and project" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />

      <div className="p-8 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-5">
          <Card padded={false}>
            <CardHeader title="Client information" subtitle="Who is this project for?" />
            <CardBody className="grid grid-cols-2 gap-4">
              <Select
                label="Client"
                options={clientOptions}
                {...register("clientId", { required: true })}
                containerClassName="col-span-2"
              />

              {isNewClient && (
                <>
                  <Input
                    label="New client name"
                    placeholder="e.g. Rohit Kumar"
                    error={errors.newClientName?.message}
                    {...register("newClientName", {
                      validate: (v) => !isNewClient || !!v.trim() || "Client name is required",
                    })}
                  />
                  <Input
                    label="New client email"
                    type="email"
                    placeholder="client@email.com"
                    error={errors.newClientEmail?.message}
                    {...register("newClientEmail", {
                      validate: (v) =>
                        !isNewClient || isValidEmail(v) || "Enter a valid email address",
                    })}
                  />
                  <Input label="Phone" placeholder="+91 90000 00000" {...register("newClientPhone")} />
                  <Input label="Company" placeholder="Optional" {...register("newClientCompany")} />
                </>
              )}
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader title="Project details" subtitle="Title, type, description, and location" />
            <CardBody className="grid grid-cols-2 gap-4">
              <Input
                label="Project title"
                placeholder="e.g. BDA Apartments"
                error={errors.title?.message}
                containerClassName="col-span-2"
                {...register("title", { required: "Project title is required" })}
              />
              <Select label="Project type" options={PROJECT_TYPES} {...register("type")} />
              <Input
                label="Location"
                placeholder="City, area"
                error={errors.location?.message}
                {...register("location", { required: "Location is required" })}
              />
              <Textarea
                label="Description"
                placeholder="Brief project scope and context…"
                containerClassName="col-span-2"
                {...register("description")}
              />
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader title="Budget & timeline" />
            <CardBody className="grid grid-cols-2 gap-4">
              <Input
                label="Budget — minimum (₹)"
                type="number"
                min="0"
                placeholder="4500000"
                error={errors.budgetMin?.message}
                {...register("budgetMin", {
                  required: "Minimum budget is required",
                  min: { value: 1, message: "Minimum budget must be greater than 0" },
                })}
              />
              <Input
                label="Budget — maximum (₹)"
                type="number"
                min="0"
                placeholder="5200000"
                error={errors.budgetMax?.message}
                {...register("budgetMax", {
                  required: "Maximum budget is required",
                  validate: (v) => {
                    const min = Number(watch("budgetMin"));
                    if (Number(v) < min) return "Maximum budget must be greater than or equal to the minimum budget";
                    return true;
                  },
                })}
              />
              <Input
                label="Start date"
                type="date"
                max={MAX_DATE}
                error={errors.startDate?.message}
                {...register("startDate", {
                  required: "Start date is required",
                  validate: (v) => {
                    if (!isValidCalendarDate(v)) return "Enter a valid date";
                    if (v < todayStr()) return "Start date cannot be earlier than today";
                    return true;
                  },
                })}
              />
              <Input
                label="Expected completion"
                type="date"
                max={MAX_DATE}
                error={errors.expectedEndDate?.message}
                {...register("expectedEndDate", {
                  required: "Expected completion date is required",
                  validate: (v) => {
                    if (!isValidCalendarDate(v)) return "Enter a valid date";
                    if (v < todayStr()) return "Completion date cannot be earlier than today";
                    const start = watch("startDate");
                    if (start && isValidCalendarDate(start)) {
                      if (v === start) return "Completion date must be different from the start date";
                      if (v < start) return "Completion date must be after the start date";
                    }
                    return true;
                  },
                })}
              />
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader title="Project team" subtitle="Assign people to this project — from existing staff or a new hire" />
            <CardBody>
              {teamMembers.length > 0 && (
                <div className="space-y-2 mb-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 px-3 py-2.5 border border-(--color-border) rounded-(--radius-md)"
                    >
                      <Avatar
                        size="sm"
                        initials={member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-(--color-text-primary)">
                          {member.name}
                          {member.isNew && (
                            <span className="ml-2 text-[10px] font-bold uppercase text-(--color-portal-primary) bg-(--color-portal-primary-light) px-1.5 py-0.5 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-(--color-text-secondary)">
                          {member.role} · {member.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="icon-btn"
                        aria-label={`Remove ${member.name}`}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-3 pb-4 mb-4 border-b border-(--color-border)">
                <Select
                  label="Add existing team member"
                  containerClassName="flex-1"
                  value={existingUserId}
                  onChange={(e) => setExistingUserId(e.target.value)}
                  options={
                    availableUsers.length > 0
                      ? availableUsers.map((u) => ({ value: u.id, label: `${u.name} — ${ROLE_LABELS[u.role]}` }))
                      : [{ value: "", label: "No more staff available" }]
                  }
                />
                <Select
                  label="Project role"
                  containerClassName="w-48"
                  value={existingRole}
                  onChange={(e) => setExistingRole(e.target.value)}
                  options={PROJECT_ROLE_OPTIONS}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addExistingMember}
                  disabled={availableUsers.length === 0}
                >
                  Add
                </Button>
              </div>

              {!showNewMemberForm ? (
                <button
                  type="button"
                  onClick={() => setShowNewMemberForm(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-(--color-portal-primary)"
                >
                  <Icon name="plus" size={13} />
                  Add a new member
                </button>
              ) : (
                <div className="space-y-3 bg-(--color-bg) p-4 rounded-(--radius-md)">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      placeholder="e.g. Rahul Mehta"
                      value={newMember.name}
                      onChange={(e) => setNewMember((m) => ({ ...m, name: e.target.value }))}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="member@vaid.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember((m) => ({ ...m, email: e.target.value }))}
                    />
                    <Input
                      label="Phone"
                      placeholder="Optional"
                      value={newMember.phone}
                      onChange={(e) => setNewMember((m) => ({ ...m, phone: e.target.value }))}
                    />
                    <Select
                      label="Project role"
                      value={newMember.projectRole}
                      onChange={(e) => setNewMember((m) => ({ ...m, projectRole: e.target.value }))}
                      options={PROJECT_ROLE_OPTIONS}
                    />
                  </div>
                  {newMemberError && <p className="text-xs text-(--color-danger)">{newMemberError}</p>}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => {
                        setShowNewMemberForm(false);
                        setNewMemberError("");
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" type="button" onClick={addNewMember}>
                      Add member
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader
              title="Lifecycle progress"
              subtitle="Define the stages and milestones for this project"
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Icon name="plus" size={14} />}
                  onClick={addStage}
                >
                  Add stage
                </Button>
              }
            />
            <CardBody>
              {stages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-(--color-text-tertiary)">
                  <Icon name="git-branch" size={28} />
                  <p className="text-sm">No stages yet — click <strong>Add stage</strong> to begin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stages.map((stage, si) => (
                    <div
                      key={stage.id}
                      className="border border-(--color-border) rounded-(--radius-md) overflow-hidden"
                    >
                      {/* Stage row */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-(--color-bg)">
                        <span className="text-[11px] font-bold text-(--color-text-tertiary) w-5 shrink-0 text-center">
                          {si + 1}
                        </span>
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => updateStageName(stage.id, e.target.value)}
                          placeholder="Stage name…"
                          className="flex-1 text-sm font-semibold text-(--color-text-primary) bg-transparent outline-none placeholder:text-(--color-text-tertiary)"
                        />
                        <input
                          type="text"
                          value={stage.timeline}
                          onChange={(e) => updateStageTimeline(stage.id, e.target.value)}
                          placeholder="Timeline (e.g. 2 weeks)…"
                          className="w-44 shrink-0 text-xs text-(--color-text-secondary) bg-transparent outline-none placeholder:text-(--color-text-tertiary) border-l border-(--color-border) pl-3"
                        />
                        <button
                          type="button"
                          onClick={() => removeStage(stage.id)}
                          className="text-(--color-text-tertiary) hover:text-(--color-danger) transition-colors"
                          aria-label="Remove stage"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </div>

                      {/* Substages */}
                      {stage.substages.length > 0 && (
                        <div className="divide-y divide-(--color-border) border-t border-(--color-border)">
                          {stage.substages.map((sub, subIdx) => (
                            <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 pl-12">
                              <span className="text-[11px] text-(--color-text-tertiary) shrink-0 w-7">
                                {si + 1}.{subIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={sub.name}
                                onChange={(e) => updateSubstageName(stage.id, sub.id, e.target.value)}
                                placeholder="Substage name…"
                                className="flex-1 text-[13px] text-(--color-text-primary) bg-transparent outline-none placeholder:text-(--color-text-tertiary)"
                              />
                              <button
                                type="button"
                                onClick={() => removeSubstage(stage.id, sub.id)}
                                className="text-(--color-text-tertiary) hover:text-(--color-danger) transition-colors"
                                aria-label="Remove substage"
                              >
                                <Icon name="x" size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add substage */}
                      <div className="px-4 py-2 border-t border-(--color-border) bg-(--color-surface)">
                        <button
                          type="button"
                          onClick={() => addSubstage(stage.id)}
                          className="flex items-center gap-1.5 text-xs text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                        >
                          <Icon name="plus" size={12} />
                          Add substage
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader title="Document upload" subtitle="Initial brief, scope documents (optional)" />
            <CardBody>
              <FileUpload multiple />
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3 pb-8">
            <Button variant="secondary" type="button" onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
