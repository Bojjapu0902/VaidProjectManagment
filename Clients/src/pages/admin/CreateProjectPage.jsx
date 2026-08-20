import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { differenceInCalendarMonths, parseISO } from "date-fns";
import clsx from "clsx";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import { Input, Select, Textarea } from "../../components/common/FormField";
import FileUpload from "../../components/common/FileUpload";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import { PageLoader, EmptyState } from "../../components/common/EmptyState";
import {
  useCreateProjectMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useGetProjectByIdQuery,
  useAssignTeamMemberMutation,
  useRemoveTeamMemberMutation,
} from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";
import { ROLES, ROLE_LABELS } from "../../constants/roles";
import { STAGES } from "../../constants/stages";
import { isValidEmail } from "../../utils/validators";
import { formatDate } from "../../utils/format";

const PROJECT_TYPES = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Civic", label: "Civic" },
];

const NEW_CLIENT_VALUE = "__new_client__";

const MAX_DATE = "9999-12-31";

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

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Five-step wizard, matching SCR-05: the client and the project's own
// lifecycle are both created on save, so budget and documents (often
// filled in by a different person, later) get their own steps rather
// than being crammed into one long form.
const WIZARD_STEPS = [
  { key: "client", label: "Client" },
  { key: "details", label: "Details" },
  { key: "lifecycle", label: "Lifecycle & timeline" },
  { key: "budget", label: "Budget" },
  { key: "documents", label: "Documents" },
];

const stageColorAt = (idx) => STAGES[idx % STAGES.length].color;

// Every project runs its own lifecycle, so the template only seeds the
// starting point — stage colours come from the 8-colour system palette,
// never a free picker, matching the create-flow rule.
const STAGE_TEMPLATES = [
  {
    id: "full",
    name: "Full architectural",
    meta: "8 stages · studio default",
    stages: [
      { name: "Project Initiation", clientGate: false },
      { name: "Site Survey & Analysis", clientGate: false },
      { name: "Concept Design", clientGate: true },
      { name: "Preliminary Design", clientGate: true },
      { name: "Detailed Design & Documentation", clientGate: true },
      { name: "Approval & Permissions", clientGate: false },
      { name: "Construction Support", clientGate: false },
      { name: "Final Review & Submission", clientGate: true },
    ],
  },
  {
    id: "interior",
    name: "Interior fit-out",
    meta: "6 stages · no statutory",
    stages: [
      { name: "Kickoff & Brief", clientGate: false },
      { name: "Concept & Mood Boards", clientGate: true },
      { name: "Design Development", clientGate: true },
      { name: "Working Drawings", clientGate: false },
      { name: "Execution & Site", clientGate: false },
      { name: "Handover", clientGate: true },
    ],
  },
  {
    id: "consultancy",
    name: "Consultancy only",
    meta: "4 stages · design to GFC",
    stages: [
      { name: "Requirements & Brief", clientGate: false },
      { name: "Concept Design", clientGate: true },
      { name: "Design Development to GFC", clientGate: false },
      { name: "Final Documentation", clientGate: true },
    ],
  },
  {
    id: "masterplan",
    name: "Masterplan",
    meta: "9 stages · two statutory",
    stages: [
      { name: "Site & Context Study", clientGate: false },
      { name: "Feasibility", clientGate: false },
      { name: "Concept Masterplan", clientGate: true },
      { name: "Statutory Submission I", clientGate: true },
      { name: "Detailed Masterplan", clientGate: false },
      { name: "Statutory Submission II", clientGate: true },
      { name: "Infrastructure Design", clientGate: false },
      { name: "Phasing & Handover Plan", clientGate: false },
      { name: "Final Masterplan Report", clientGate: true },
    ],
  },
  { id: "blank", name: "Start blank", meta: "Build the stages yourself", stages: [] },
];

const buildStagesFromTemplate = (template) =>
  template.stages.map((s, idx) => ({
    id: uid(),
    name: s.name,
    color: stageColorAt(idx),
    startDate: "",
    targetDate: "",
    clientGate: s.clientGate,
    removed: false,
  }));

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [createProject, { isLoading }] = useCreateProjectMutation();
  const { data: allUsers = [] } = useGetUsersQuery({});
  const [createUser] = useCreateUserMutation();
  const { data: editingProject, isLoading: isLoadingEditingProject } = useGetProjectByIdQuery(editId, {
    skip: !editId,
  });
  const [assignTeamMember] = useAssignTeamMemberMutation();
  const [removeTeamMemberApi] = useRemoveTeamMemberMutation();

  const [step, setStep] = useState(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const appliedEditRef = useRef(false);

  const clientOptions = [
    ...allUsers.filter((u) => u.role === ROLES.CLIENT).map((c) => ({ value: c.id, label: c.name })),
    { value: NEW_CLIENT_VALUE, label: "+ Add new client" },
  ];

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors, isDirty },
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
    },
  });

  const isNewClient = watch("clientId") === NEW_CLIENT_VALUE;

  const [stages, setStages] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [lifecycleError, setLifecycleError] = useState("");
  const dragIndexRef = useRef(null);

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

  // Edit mode: prefill everything from the existing project once it loads.
  // Only the team step below writes back live (via real mutations) — the
  // rest is shown read-only, since there is no project-update endpoint yet;
  // those fields are managed from their own pages (Stage management, etc).
  useEffect(() => {
    if (!isEditMode || !editingProject || appliedEditRef.current) return;
    appliedEditRef.current = true;
    reset({
      title: editingProject.title || "",
      type: editingProject.type || "Residential",
      clientId: editingProject.clientId || NEW_CLIENT_VALUE,
      newClientName: "",
      newClientEmail: "",
      newClientPhone: "",
      newClientCompany: "",
      location: editingProject.location || "",
      description: editingProject.description || "",
      budgetMin: editingProject.budget?.min ?? "",
      budgetMax: editingProject.budget?.max ?? "",
    });
    if (editingProject.lifecycle?.length) {
      setStages(
        editingProject.lifecycle.map((s, idx) => ({
          id: uid(),
          name: s.name || `Stage ${idx + 1}`,
          color: stageColorAt(idx),
          startDate: s.startDate || "",
          targetDate: s.targetDate || "",
          clientGate: !!s.clientGate,
          removed: false,
        }))
      );
    }
    setTeamMembers(
      (editingProject.team || []).map((m) => ({
        id: uid(),
        userId: m.userId,
        name: m.name,
        email: allUsers.find((u) => u.id === m.userId)?.email || "",
        role: m.role,
        isNew: false,
      }))
    );
  }, [isEditMode, editingProject, reset, allUsers]);

  const addExistingMember = async () => {
    const user = availableUsers.find((u) => u.id === existingUserId) || availableUsers[0];
    if (!user) return;
    const member = { id: uid(), userId: user.id, name: user.name, email: user.email, role: existingRole, isNew: false };
    if (isEditMode && editId) {
      try {
        await assignTeamMember({ projectId: editId, member: { userId: user.id, name: user.name, role: existingRole } }).unwrap();
        dispatch(pushToast(`${user.name} was added to the project team`, "success"));
      } catch (err) {
        dispatch(pushToast(err.message || "Could not add team member", "danger"));
        return;
      }
    }
    setTeamMembers((prev) => [...prev, member]);
    setExistingUserId("");
  };

  const addNewMember = async () => {
    if (!newMember.name.trim()) {
      setNewMemberError("Name is required");
      return;
    }
    if (!isValidEmail(newMember.email)) {
      setNewMemberError("Enter a valid email address");
      return;
    }
    if (isEditMode && editId) {
      try {
        const created = await createUser({
          name: newMember.name.trim(),
          email: newMember.email.trim(),
          phone: newMember.phone.trim(),
          role: PROJECT_ROLE_TO_ACCOUNT_ROLE[newMember.projectRole] || ROLES.ENGINEER,
          password: "changeme123",
        }).unwrap();
        await assignTeamMember({
          projectId: editId,
          member: { userId: created?.id, name: created?.name, role: newMember.projectRole },
        }).unwrap();
        setTeamMembers((prev) => [
          ...prev,
          {
            id: uid(),
            userId: created?.id,
            name: created?.name,
            email: newMember.email.trim(),
            role: newMember.projectRole,
            isNew: true,
          },
        ]);
        dispatch(pushToast(`${created?.name} was added to the project team`, "success"));
      } catch (err) {
        dispatch(pushToast(err.message || "Could not add team member", "danger"));
        return;
      }
    } else {
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
    }
    setNewMember({ name: "", email: "", phone: "", projectRole: PROJECT_ROLE_OPTIONS[0].value });
    setNewMemberError("");
    setShowNewMemberForm(false);
  };

  const removeMember = async (member) => {
    if (isEditMode && editId && member.userId) {
      try {
        await removeTeamMemberApi({ projectId: editId, userId: member.userId }).unwrap();
        dispatch(pushToast(`${member.name} was removed from the project team`, "success"));
      } catch (err) {
        dispatch(pushToast(err.message || "Could not remove team member", "danger"));
        return;
      }
    }
    setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  // ---------- Lifecycle & timeline (step 3) ----------

  const applyTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setStages(buildStagesFromTemplate(template));
    setLifecycleError("");
  };

  const addStage = () =>
    setStages((prev) => [
      ...prev,
      { id: uid(), name: "", color: stageColorAt(prev.length), startDate: "", targetDate: "", clientGate: false, removed: false },
    ]);

  const updateStageField = (id, field, value) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));

  const toggleStageRemoved = (id) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, removed: !s.removed } : s)));

  const handleDragStart = (idx) => () => {
    dragIndexRef.current = idx;
  };
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  const handleDrop = (idx) => (e) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === idx) return;
    setStages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(idx, 0, moved);
      return next;
    });
  };

  const activeStages = stages.filter((s) => !s.removed);
  const gateCount = activeStages.filter((s) => s.clientGate).length;
  const datedStages = activeStages.filter((s) => s.startDate && s.targetDate);
  const programmeStart = datedStages.length
    ? datedStages.reduce((min, s) => (s.startDate < min ? s.startDate : min), datedStages[0].startDate)
    : null;
  const programmeEnd = datedStages.length
    ? datedStages.reduce((max, s) => (s.targetDate > max ? s.targetDate : max), datedStages[0].targetDate)
    : null;
  const programmeMonths =
    programmeStart && programmeEnd
      ? Math.max(1, differenceInCalendarMonths(parseISO(programmeEnd), parseISO(programmeStart)))
      : null;
  let overlapCount = 0;
  for (let i = 1; i < activeStages.length; i++) {
    const prev = activeStages[i - 1];
    const curr = activeStages[i];
    if (prev.targetDate && curr.startDate && curr.startDate < prev.targetDate) overlapCount++;
  }
  const selectedTemplate = STAGE_TEMPLATES.find((t) => t.id === selectedTemplateId);

  // ---------- Wizard navigation ----------

  const stepFieldsMap = {
    1: () => (isNewClient ? ["clientId", "newClientName", "newClientEmail"] : ["clientId"]),
    2: () => ["title", "location"],
    4: () => ["budgetMin", "budgetMax"],
  };

  const goNext = async () => {
    if (step === 3 && !isEditMode) {
      if (activeStages.length < 2) {
        setLifecycleError("Add at least two stages to continue.");
        return;
      }
      if (!activeStages.some((s) => s.clientGate)) {
        setLifecycleError("Mark at least one stage as a client gate before continuing.");
        return;
      }
      if (activeStages.some((s) => !s.name.trim())) {
        setLifecycleError("Every stage needs a name.");
        return;
      }
      if (activeStages.some((s) => !s.startDate || !s.targetDate)) {
        setLifecycleError("Add start and target dates for every stage.");
        return;
      }
      setLifecycleError("");
      setStep(4);
      return;
    }
    if (!isEditMode) {
      const fields = stepFieldsMap[step]?.();
      if (fields) {
        const valid = await trigger(fields);
        if (!valid) return;
      }
    }
    setStep((s) => Math.min(WIZARD_STEPS.length, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleCancelClick = () => {
    const hasContent = isDirty || activeStages.length > 0 || teamMembers.length > 0;
    if (hasContent) {
      setShowCancelConfirm(true);
    } else {
      navigate(ROUTES.ADMIN.PROJECTS);
    }
  };

  const onSubmit = async (values) => {
    if (isEditMode) return;
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
        timeline: {
          startDate: programmeStart || todayStr(),
          expectedEndDate: programmeEnd || undefined,
        },
        team,
        lifecycle: activeStages.map(({ name, startDate, targetDate, clientGate }) => ({
          name,
          startDate,
          targetDate,
          clientGate,
        })),
      }).unwrap();
      dispatch(pushToast(`${project.title} was created successfully`, "success"));
      navigate(ROUTES.ADMIN.PROJECT_DETAIL(project.id));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not create project", "danger"));
    }
  };

  if (isEditMode && isLoadingEditingProject) {
    return (
      <>
        <Topbar title="Edit project" subtitle="Loading project…" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  if (isEditMode && !editingProject) {
    return (
      <>
        <Topbar title="Edit project" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
        <div className="p-8">
          <EmptyState
            icon="alert-triangle"
            title="Project not found"
            description="This project may have been archived or the link is out of date."
            action={
              <Button variant="primary" onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}>
                Back to projects
              </Button>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={isEditMode ? "Edit project" : "Create project"}
        subtitle={isEditMode ? `Reviewing ${editingProject?.title}` : "Onboard a new client and project"}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
      />

      <div className="p-6 md:p-8 flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card padded={false}>
              <div className="px-5 md:px-7 py-5 border-b border-(--color-border) flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-(--color-text-primary)">
                      {isEditMode ? "Edit project" : "Create project"}
                    </h1>
                    <p className="text-xs text-(--color-text-secondary) mt-0.5">
                      {isEditMode
                        ? "Team assignments below save immediately. Other fields are shown for reference and are managed from their dedicated pages."
                        : "The client account and the project's own lifecycle are created on save."}
                    </p>
                  </div>
                  {isEditMode && editingProject && (
                    <div
                      className="px-3.5 py-3 rounded-(--radius-md) text-[12.5px] leading-relaxed text-(--color-text-primary)"
                      style={{ background: "var(--color-info-bg)", borderLeft: "3px solid var(--color-info)" }}
                    >
                      Reviewing <strong className="font-mono">{editingProject.projectCode}</strong>. Update stages from{" "}
                      <Link
                        to={ROUTES.ADMIN.PROJECT_STAGES(editId)}
                        className="font-semibold underline"
                        style={{ color: "var(--color-info)" }}
                      >
                        Stage management
                      </Link>
                      , documents from its Documents tab, and ask an admin to change other project details.
                    </div>
                  )}
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-0 overflow-x-auto pb-1" role="list" aria-label="Create project steps">
                  {WIZARD_STEPS.map((s, idx) => {
                    const num = idx + 1;
                    const isDone = num < step;
                    const isCurrent = num === step;
                    return (
                      <div key={s.key} className="flex items-center flex-1 min-w-[108px]" role="listitem">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                            style={{
                              background: isDone ? "var(--color-green)" : isCurrent ? "var(--color-navy)" : "var(--color-bg)",
                              color: isDone || isCurrent ? "#fff" : "var(--color-text-tertiary)",
                              border: isDone || isCurrent ? "none" : "1px solid var(--color-border)",
                            }}
                          >
                            {isDone ? <Icon name="check" size={12} /> : num}
                          </span>
                          <span
                            className={clsx(
                              "text-[12.5px] whitespace-nowrap",
                              isCurrent
                                ? "font-bold text-(--color-text-primary)"
                                : isDone
                                ? "font-semibold text-(--color-text-primary)"
                                : "text-(--color-text-tertiary)"
                            )}
                          >
                            {s.label}
                          </span>
                        </div>
                        {idx < WIZARD_STEPS.length - 1 && (
                          <span
                            className="flex-1 h-px mx-2.5 min-w-[16px]"
                            style={{ background: isDone ? "#22C55E" : "var(--color-border)" }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 md:px-7 py-6">
                {/* Step 1 — Client */}
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-(--color-text-primary)">Client information</h2>
                      <p className="text-xs text-(--color-text-secondary) mt-0.5">Who is this project for?</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Client"
                        options={clientOptions}
                        disabled={isEditMode}
                        containerClassName="sm:col-span-2"
                        {...register("clientId", { required: true })}
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
                              validate: (v) => !isNewClient || isValidEmail(v) || "Enter a valid email address",
                            })}
                          />
                          <Input label="Phone" placeholder="+91 90000 00000" {...register("newClientPhone")} />
                          <Input label="Company" placeholder="Optional" {...register("newClientCompany")} />
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2 — Details */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h2 className="text-sm font-bold text-(--color-text-primary)">Project details</h2>
                        <p className="text-xs text-(--color-text-secondary) mt-0.5">Title, type, description, and location</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Project title"
                          placeholder="e.g. BDA Apartments"
                          error={errors.title?.message}
                          containerClassName="sm:col-span-2"
                          disabled={isEditMode}
                          {...register("title", { required: "Project title is required" })}
                        />
                        <Select label="Project type" options={PROJECT_TYPES} disabled={isEditMode} {...register("type")} />
                        <Input
                          label="Location"
                          placeholder="City, area"
                          error={errors.location?.message}
                          disabled={isEditMode}
                          {...register("location", { required: "Location is required" })}
                        />
                        <Textarea
                          label="Description"
                          placeholder="Brief project scope and context…"
                          containerClassName="sm:col-span-2"
                          disabled={isEditMode}
                          {...register("description")}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 pt-5 border-t border-(--color-border)">
                      <div>
                        <h2 className="text-sm font-bold text-(--color-text-primary)">Project team</h2>
                        <p className="text-xs text-(--color-text-secondary) mt-0.5">
                          Assign people to this project — from existing staff or a new hire
                        </p>
                      </div>

                      {teamMembers.length > 0 && (
                        <div className="space-y-2">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-3 px-3 py-2.5 border border-(--color-border) rounded-(--radius-md)"
                            >
                              <Avatar
                                size="sm"
                                initials={member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-(--color-text-primary)">
                                  {member.name}
                                  {member.isNew && (
                                    <span className="ml-2 text-[10px] font-bold uppercase text-(--color-portal-primary) bg-(--color-portal-primary-light) px-1.5 py-0.5 rounded">
                                      New
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-(--color-text-secondary) truncate">
                                  {member.role}
                                  {member.email ? ` · ${member.email}` : ""}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMember(member)}
                                className="icon-btn"
                                aria-label={`Remove ${member.name}`}
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-end gap-3 pb-4 border-b border-(--color-border)">
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
                          containerClassName="sm:w-48"
                          value={existingRole}
                          onChange={(e) => setExistingRole(e.target.value)}
                          options={PROJECT_ROLE_OPTIONS}
                        />
                        <Button type="button" variant="secondary" onClick={addExistingMember} disabled={availableUsers.length === 0}>
                          Add
                        </Button>
                      </div>

                      {!showNewMemberForm ? (
                        <button
                          type="button"
                          onClick={() => setShowNewMemberForm(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-portal-primary) self-start"
                        >
                          <Icon name="plus" size={13} />
                          Add a new member
                        </button>
                      ) : (
                        <div className="space-y-3 bg-(--color-bg) p-4 rounded-(--radius-md)">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    </div>
                  </div>
                )}

                {/* Step 3 — Lifecycle & timeline */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    {!isEditMode && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <h2 className="text-sm font-bold text-(--color-text-primary)">Start from a template</h2>
                          <p className="text-xs text-(--color-text-secondary) mt-0.5">
                            Every project runs its own lifecycle. Pick the closest template, then adjust it below.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                          {STAGE_TEMPLATES.map((tpl) => {
                            const isSelected = selectedTemplateId === tpl.id;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => applyTemplate(tpl)}
                                className={clsx(
                                  "text-left rounded-(--radius-md) px-3.5 py-3 border-2 flex flex-col gap-1 transition-colors",
                                  isSelected
                                    ? "border-(--color-navy) bg-(--color-navy-light)"
                                    : "border-(--color-border) hover:border-(--color-border-strong)"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[13px] font-semibold text-(--color-text-primary)">{tpl.name}</span>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-(--color-navy) text-white flex items-center justify-center shrink-0">
                                      <Icon name="check" size={10} />
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11.5px] text-(--color-text-secondary)">{tpl.meta}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-1">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <h2 className="text-sm font-bold text-(--color-text-primary)">
                          Stages for this project{" "}
                          <span className="font-mono text-xs font-normal text-(--color-text-secondary)">
                            {activeStages.length}
                          </span>
                        </h2>
                        {isEditMode ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            icon={<Icon name="timeline" size={14} />}
                            onClick={() => navigate(ROUTES.ADMIN.PROJECT_STAGES(editId))}
                          >
                            Open Stage management
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-[11.5px] text-(--color-text-secondary) hidden sm:inline">Drag to reorder</span>
                            <Button type="button" variant="secondary" size="sm" icon={<Icon name="plus" size={14} />} onClick={addStage}>
                              Add stage
                            </Button>
                          </div>
                        )}
                      </div>

                      {stages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2 text-(--color-text-tertiary) border border-dashed border-(--color-border) rounded-(--radius-md)">
                          <Icon name="timeline" size={26} />
                          <p className="text-sm">Pick a template above, or add stages one at a time.</p>
                        </div>
                      ) : (
                        <div className="border border-(--color-border) rounded-(--radius-md) overflow-x-auto">
                          <div className="min-w-[640px]">
                            <div className="grid grid-cols-[22px_28px_1fr_118px_118px_78px_26px] gap-2.5 px-3.5 py-2.5 bg-(--color-bg) border-b border-(--color-border) text-[10.5px] font-semibold text-(--color-text-secondary) uppercase tracking-wide">
                              <span />
                              <span>No.</span>
                              <span>Stage name</span>
                              <span>Start</span>
                              <span>Target</span>
                              <span className="text-center">Gate</span>
                              <span />
                            </div>
                            {stages.map((stage, idx) => (
                              <div
                                key={stage.id}
                                draggable={!isEditMode && !stage.removed}
                                onDragStart={handleDragStart(idx)}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop(idx)}
                                className={clsx(
                                  "grid grid-cols-[22px_28px_1fr_118px_118px_78px_26px] gap-2.5 px-3.5 py-2.5 items-center border-b border-(--color-border) last:border-b-0",
                                  stage.removed && "opacity-60 bg-(--color-danger-bg)"
                                )}
                              >
                                <span
                                  className="text-(--color-text-tertiary) text-xs select-none"
                                  style={{ cursor: !isEditMode && !stage.removed ? "grab" : "default" }}
                                >
                                  {!isEditMode && !stage.removed ? "⠿" : ""}
                                </span>
                                <span
                                  className="w-[22px] h-[22px] rounded-(--radius-sm) text-[11px] font-bold flex items-center justify-center"
                                  style={{
                                    background: stage.removed ? "var(--color-border)" : stage.color,
                                    color: stage.removed ? "var(--color-text-tertiary)" : "#fff",
                                  }}
                                >
                                  {stage.removed ? "—" : idx + 1}
                                </span>
                                <input
                                  type="text"
                                  value={stage.name}
                                  disabled={isEditMode || stage.removed}
                                  onChange={(e) => updateStageField(stage.id, "name", e.target.value)}
                                  placeholder="Stage name…"
                                  aria-label={`Stage ${idx + 1} name`}
                                  className={clsx(
                                    "input-field text-[13px] py-1.5",
                                    stage.removed && "line-through text-(--color-text-tertiary)"
                                  )}
                                />
                                <input
                                  type="date"
                                  value={stage.startDate}
                                  disabled={isEditMode || stage.removed}
                                  max={MAX_DATE}
                                  onChange={(e) => updateStageField(stage.id, "startDate", e.target.value)}
                                  aria-label={`Stage ${idx + 1} start date`}
                                  className="input-field text-[12px] py-1.5 font-mono"
                                />
                                <input
                                  type="date"
                                  value={stage.targetDate}
                                  disabled={isEditMode || stage.removed}
                                  max={MAX_DATE}
                                  onChange={(e) => updateStageField(stage.id, "targetDate", e.target.value)}
                                  aria-label={`Stage ${idx + 1} target date`}
                                  className="input-field text-[12px] py-1.5 font-mono"
                                />
                                <span className="flex justify-center">
                                  {!stage.removed && (
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={stage.clientGate}
                                      aria-label={`${stage.clientGate ? "Remove" : "Mark"} client gate on ${stage.name || `stage ${idx + 1}`}`}
                                      disabled={isEditMode}
                                      onClick={() => updateStageField(stage.id, "clientGate", !stage.clientGate)}
                                      className="relative w-8 h-[18px] rounded-full transition-colors shrink-0 disabled:cursor-not-allowed"
                                      style={{ background: stage.clientGate ? "var(--color-green)" : "var(--color-border)" }}
                                    >
                                      <span
                                        className="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-all"
                                        style={{ left: stage.clientGate ? "calc(100% - 16px)" : "2px" }}
                                      />
                                    </button>
                                  )}
                                </span>
                                {!isEditMode && (
                                  <button
                                    type="button"
                                    onClick={() => toggleStageRemoved(stage.id)}
                                    className="text-(--color-text-tertiary) hover:text-(--color-danger) justify-self-center transition-colors"
                                    aria-label={stage.removed ? `Restore ${stage.name || "stage"}` : `Remove ${stage.name || "stage"}`}
                                  >
                                    <Icon name={stage.removed ? "arrow-left" : "x"} size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {!isEditMode && (
                              <div className="px-3.5 py-2.5 bg-(--color-bg) flex items-center gap-2 flex-wrap">
                                <button type="button" onClick={addStage} className="text-[12.5px] font-semibold text-(--color-navy)">
                                  + Add a custom stage
                                </button>
                                <span className="text-[11.5px] text-(--color-text-secondary)">
                                  named by you, with its own colour, dates and gate
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {lifecycleError && (
                        <p className="text-xs text-(--color-danger) flex items-center gap-1.5">
                          <Icon name="alert-triangle" size={13} /> {lifecycleError}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-6 gap-y-3 px-4 py-3.5 rounded-(--radius-md) bg-(--color-bg) border border-(--color-border)">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                            Stages
                          </span>
                          <span className="text-sm font-bold text-(--color-text-primary)">
                            {activeStages.length}
                            {selectedTemplate && (
                              <span className="text-xs font-normal text-(--color-text-secondary)">
                                {" "}
                                of {selectedTemplate.stages.length} in template
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="w-px bg-(--color-border) hidden sm:block" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                            Client gates
                          </span>
                          <span className="text-sm font-bold text-(--color-text-primary)">{gateCount}</span>
                        </div>
                        <div className="w-px bg-(--color-border) hidden sm:block" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                            Programme
                          </span>
                          <span className="text-sm font-bold text-(--color-text-primary)">
                            {programmeStart && programmeEnd ? (
                              <>
                                {formatDate(programmeStart, "dd MMM yyyy")} → {formatDate(programmeEnd, "dd MMM yyyy")}{" "}
                                <span className="text-xs font-normal text-(--color-text-secondary)">
                                  · {programmeMonths} month{programmeMonths === 1 ? "" : "s"}
                                </span>
                              </>
                            ) : (
                              <span className="text-(--color-text-tertiary) font-normal text-xs">Add stage dates</span>
                            )}
                          </span>
                        </div>
                        <div className="w-px bg-(--color-border) hidden sm:block" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10.5px] font-semibold uppercase tracking-wide text-(--color-text-secondary)">
                            Gaps or overlaps
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: overlapCount > 0 ? "var(--color-danger)" : "var(--color-success)" }}
                          >
                            {datedStages.length < activeStages.length
                              ? "—"
                              : overlapCount > 0
                              ? `${overlapCount} overlap${overlapCount > 1 ? "s" : ""}`
                              : "None"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4 — Budget */}
                {step === 4 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-sm font-bold text-(--color-text-primary)">Budget</h2>
                      <p className="text-xs text-(--color-text-secondary) mt-0.5">
                        The range the studio and client have agreed to plan around.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Budget — minimum (₹)"
                        type="number"
                        min="0"
                        placeholder="4500000"
                        error={errors.budgetMin?.message}
                        disabled={isEditMode}
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
                        disabled={isEditMode}
                        {...register("budgetMax", {
                          required: "Maximum budget is required",
                          validate: (v) => {
                            const min = Number(watch("budgetMin"));
                            if (Number(v) < min) return "Maximum budget must be greater than or equal to the minimum budget";
                            return true;
                          },
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* Step 5 — Documents */}
                {step === 5 &&
                  (isEditMode ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                      <Icon name="folders" size={28} className="text-(--color-text-tertiary)" />
                      <p className="text-sm text-(--color-text-secondary) max-w-sm">
                        Upload and manage files for this project from its Documents tab.
                      </p>
                      <Button
                        type="button"
                        variant="secondary"
                        icon={<Icon name="arrow-up-right" size={14} />}
                        onClick={() => navigate(ROUTES.ADMIN.PROJECT_DOCUMENTS(editId))}
                      >
                        Open documents
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <h2 className="text-sm font-bold text-(--color-text-primary)">Document upload</h2>
                      <p className="text-xs text-(--color-text-secondary) mt-0.5 mb-3">
                        Initial brief, scope documents (optional)
                      </p>
                      <FileUpload multiple />
                    </div>
                  ))}
              </div>

              <div className="px-5 md:px-7 py-4 border-t border-(--color-border) bg-(--color-bg) rounded-b-(--radius-lg) flex items-center justify-between gap-3 flex-wrap">
                <span className="text-xs text-(--color-text-secondary)">
                  {isEditMode
                    ? "Team changes are saved as you make them."
                    : "Stages can still be edited after the project starts."}
                </span>
                <div className="flex items-center gap-2.5">
                  {isEditMode ? (
                    <Button type="button" variant="secondary" onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(editId))}>
                      Close
                    </Button>
                  ) : (
                    <Button type="button" variant="secondary" onClick={handleCancelClick}>
                      Cancel
                    </Button>
                  )}
                  {step > 1 && (
                    <Button type="button" variant="secondary" onClick={goBack}>
                      Back
                    </Button>
                  )}
                  {step < WIZARD_STEPS.length && (
                    <Button type="button" variant="primary" onClick={goNext}>
                      {`Continue to ${WIZARD_STEPS[step].label.toLowerCase()}`}
                    </Button>
                  )}
                  {step === WIZARD_STEPS.length && !isEditMode && (
                    <Button type="submit" variant="primary" disabled={isLoading}>
                      {isLoading ? "Creating…" : "Create project"}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </form>
        </div>
      </div>

      <Modal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Discard this project?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCancelConfirm(false)}>
              Keep editing
            </Button>
            <Button variant="danger" onClick={() => navigate(ROUTES.ADMIN.PROJECTS)}>
              Discard draft
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--color-text-secondary)">
          You&rsquo;ll lose the client, details, budget and lifecycle you&rsquo;ve entered so far. This can&rsquo;t be undone.
        </p>
      </Modal>
    </>
  );
}
