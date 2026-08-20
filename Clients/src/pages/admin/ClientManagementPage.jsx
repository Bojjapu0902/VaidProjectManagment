import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Avatar from "../../components/common/Avatar";
import { Badge } from "../../components/common/Badge";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import Table from "../../components/common/Table";
import Modal from "../../components/common/Modal";
import { Input } from "../../components/common/FormField";
import { PageLoader, EmptyState } from "../../components/common/EmptyState";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import { STAGES } from "../../constants/stages";
import { formatDate } from "../../utils/format";
import {
  useGetUsersQuery,
  useGetProjectsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../app/api/apiSlice";

function clientStatus(client) {
  if (client.isActive === false) return { variant: "neutral", label: "Closed" };
  if (client.status === "invited") return { variant: "warning", label: "Invited" };
  return { variant: "success", label: "Active" };
}

const isIndividualClient = (client) => !client.company || /individual/i.test(client.company);

// A toggle switch — no shared <Toggle/> exists yet in components/common, so
// this is a small page-local control built from tokens rather than a new hex value.
function PortalToggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="relative w-8 h-[17px] rounded-(--radius-pill) flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
      style={{ background: checked ? "var(--color-navy)" : "var(--color-border)" }}
    >
      <span
        className="absolute top-[2px] w-[13px] h-[13px] rounded-full bg-white transition-[left,right]"
        style={{ left: checked ? "17px" : "2px" }}
      />
    </button>
  );
}

export default function ClientManagementPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [isModalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null); // null => create mode
  const [selectedClientId, setSelectedClientId] = useState(null);

  const { data: users = [], isLoading } = useGetUsersQuery({ role: ROLES.CLIENT });
  const { data: projects = [] } = useGetProjectsQuery({});
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const clients = users;
  const projectsFor = (clientId) => projects.filter((p) => p.clientId === clientId || p.clientId?._id === clientId);
  const contactCountFor = (client) => clients.filter((c) => c.company && c.company === client.company).length;
  const clientTypeLabel = (client) => {
    if (isIndividualClient(client)) return "Individual";
    const count = contactCountFor(client);
    return count > 1 ? `Company · ${count} contacts` : "Company";
  };

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? clients[0] ?? null,
    [clients, selectedClientId]
  );
  const selectedClientProjects = selectedClient ? projectsFor(selectedClient.id) : [];
  const liveClientCount = clients.filter((c) => projectsFor(c.id).length > 0).length;

  const closeModal = () => {
    setModalOpen(false);
    setEditingClient(null);
  };

  const openCreate = () => {
    setEditingClient(null);
    reset({ name: "", email: "", company: "", phone: "", password: "" });
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingClient(client);
    reset({ name: client.name, email: client.email, company: client.company || "", phone: client.phone || "", password: "" });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editingClient) {
        // Same form as "Add client", just in edit mode — a field has one editor.
        await updateUser({
          id: editingClient.id,
          payload: { name: values.name, email: values.email, company: values.company, phone: values.phone },
        }).unwrap();
        dispatch(pushToast(`${values.name}'s details were updated`, "success"));
      } else {
        await createUser({ ...values, role: ROLES.CLIENT, password: values.password || "changeme123" }).unwrap();
        dispatch(pushToast(`${values.name} was added as a client`, "success"));
      }
      closeModal();
    } catch (err) {
      dispatch(pushToast(err?.message || "Could not save this client", "danger"));
    }
  };

  const portalAccess = selectedClient?.clientMeta?.portalAccess || {};
  const timelineOn = portalAccess.timeline ?? true;
  const documentsOn = portalAccess.documents ?? true;
  const budgetOn = portalAccess.budget ?? false;
  const isClosed = selectedClient?.isActive === false;

  const togglePortalAccess = async (key) => {
    if (!selectedClient) return;
    const current = { timeline: timelineOn, documents: documentsOn, budget: budgetOn };
    try {
      await updateUser({
        id: selectedClient.id,
        payload: {
          clientMeta: {
            ...(selectedClient.clientMeta || {}),
            portalAccess: { ...current, [key]: !current[key] },
          },
        },
      }).unwrap();
      dispatch(pushToast("Portal access updated", "success"));
    } catch (err) {
      dispatch(pushToast(err?.message || "Could not update portal access", "danger"));
    }
  };

  const columns = [
    {
      key: "name",
      header: "Client",
      render: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar initials={row.avatarInitials} size="sm" tone="neutral" />
          <div className="min-w-0">
            <div className="font-semibold text-(--color-text-primary) truncate">{row.name}</div>
            <div className="text-xs text-(--color-text-secondary) truncate">{clientTypeLabel(row)}</div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (row) => (
        <div className="flex flex-col min-w-0">
          <span className="text-xs truncate">{row.email}</span>
          {row.phone && <span className="text-xs text-(--color-text-secondary)">{row.phone}</span>}
        </div>
      ),
    },
    {
      key: "projects",
      header: "Projects",
      render: (row) => <span className="font-mono text-xs text-(--color-text-primary)">{projectsFor(row.id).length}</span>,
    },
    {
      key: "portal",
      header: "Portal",
      render: (row) => {
        const s = clientStatus(row);
        const isSelected = selectedClient?.id === row.id;
        return (
          <div className="flex items-center justify-between gap-2">
            <Badge variant={s.variant}>{s.label}</Badge>
            {isSelected && <Icon name="chevron-right" size={14} className="text-(--color-navy) flex-shrink-0" />}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Topbar title="Client management" subtitle="The client record and what each client can see" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        {isLoading ? (
          <Card padded={false}>
            <PageLoader />
          </Card>
        ) : clients.length === 0 ? (
          <Card padded={false}>
            <EmptyState icon="users" title="No clients yet" description="Add a client account to link them to a project." />
          </Card>
        ) : (
          <Card padded={false} className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] overflow-hidden">
            <div className="border-b lg:border-b-0 lg:border-r border-(--color-border) flex flex-col min-w-0">
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-(--color-border)">
                <div>
                  <h2 className="text-[15px] font-bold text-(--color-text-primary)">Clients</h2>
                  <p className="text-xs text-(--color-text-secondary) mt-0.5">
                    {clients.length} account{clients.length === 1 ? "" : "s"} · {liveClientCount} with live projects
                  </p>
                </div>
                <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={openCreate}>
                  Add client
                </Button>
              </div>
              <Table
                columns={columns}
                data={clients}
                onRowClick={(row) => setSelectedClientId(row.id)}
                emptyMessage="No clients yet"
              />
            </div>

            <div className="flex flex-col min-w-0">
              {selectedClient ? (
                <>
                  <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-(--color-border)">
                    <span className="text-sm font-bold text-(--color-text-primary) truncate">{selectedClient.name}</span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-(--color-navy) hover:underline flex-shrink-0"
                      onClick={() => openEdit(selectedClient)}
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 px-5 py-4.5 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-semibold text-(--color-text-secondary) tracking-wide uppercase">Projects</span>
                      {selectedClientProjects.length === 0 ? (
                        <p className="text-xs text-(--color-text-secondary)">No projects linked yet.</p>
                      ) : (
                        selectedClientProjects.map((p) => (
                          <button
                            key={p.id || p._id}
                            type="button"
                            onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(p.id || p._id))}
                            className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 border border-(--color-border) rounded-(--radius-sm) text-left hover:border-(--color-navy) focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-navy)"
                          >
                            <div className="min-w-0">
                              <div className="text-[12.5px] font-medium text-(--color-text-primary) truncate">{p.title}</div>
                              <div className="text-xs text-(--color-text-secondary)">
                                {p.projectCode} · stage {p.currentStage} of {STAGES.length}
                              </div>
                            </div>
                            <span
                              className="badge flex-shrink-0"
                              style={{ background: "var(--color-info-bg)", color: "var(--color-info)" }}
                            >
                              {Math.round(p.progressPercent || 0)}%
                            </span>
                          </button>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5 pt-1">
                      <span className="text-[11px] font-semibold text-(--color-text-secondary) tracking-wide uppercase">Portal access</span>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12.5px] text-(--color-text-primary)">See stage timeline</span>
                        <PortalToggle
                          checked={timelineOn}
                          disabled={isClosed}
                          label={`${timelineOn ? "Disable" : "Enable"} stage timeline for ${selectedClient.name}`}
                          onChange={() => togglePortalAccess("timeline")}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12.5px] text-(--color-text-primary)">Download client-visible documents</span>
                        <PortalToggle
                          checked={documentsOn}
                          disabled={isClosed}
                          label={`${documentsOn ? "Disable" : "Enable"} document downloads for ${selectedClient.name}`}
                          onChange={() => togglePortalAccess("documents")}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[12.5px] text-(--color-text-secondary)">See budget figures</span>
                        <PortalToggle
                          checked={budgetOn}
                          disabled={isClosed}
                          label={`${budgetOn ? "Hide" : "Show"} budget figures for ${selectedClient.name}`}
                          onChange={() => togglePortalAccess("budget")}
                        />
                      </div>
                      <p className="text-[11px] text-(--color-text-tertiary) leading-relaxed">
                        {isClosed
                          ? "This account is closed — access is read-only for the handover package."
                          : "Off by default. Changes apply immediately, including to any open approval request."}
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 pt-3.5 border-t border-(--color-border)">
                      <span className="text-[11px] font-semibold text-(--color-text-secondary) tracking-wide uppercase">History</span>
                      <div className="flex flex-col gap-1 text-xs text-(--color-text-secondary)">
                        <span>Client since {formatDate(selectedClient.invitedAt || selectedClient.createdAt)}</span>
                        <span>
                          {selectedClientProjects.length} linked project{selectedClientProjects.length === 1 ? "" : "s"}
                        </span>
                        <span>Portal access {isClosed ? "closed (read-only)" : "active"}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState icon="user-circle" title="No client selected" description="Choose a client from the list to view their portal access." />
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingClient ? "Edit client" : "Add client"}
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onSubmit)} disabled={isCreating || isUpdating}>
              {editingClient
                ? (isUpdating ? "Saving…" : "Save changes")
                : (isCreating ? "Adding…" : "Add client")}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Client / contact name" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
          <Input label="Company" placeholder="Leave blank for an individual client" {...register("company")} />
          <Input label="Phone" {...register("phone")} />
          {!editingClient && (
            <Input label="Temporary password" type="password" placeholder="Sent to the client separately" {...register("password")} />
          )}
        </form>
      </Modal>
    </>
  );
}
