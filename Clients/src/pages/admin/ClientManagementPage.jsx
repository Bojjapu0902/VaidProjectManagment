import { useState } from "react";
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
import { ROLES } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";
import { useGetUsersQuery, useGetProjectsQuery, useCreateUserMutation } from "../../app/api/apiSlice";

export default function ClientManagementPage() {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const { data: users = [], isLoading } = useGetUsersQuery({ role: ROLES.CLIENT });
  const { data: projects = [] } = useGetProjectsQuery({});
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const clients = users;
  const projectsFor = (clientId) => projects.filter((p) => p.clientId === clientId || p.clientId?._id === clientId);

  const onCreate = async (values) => {
    await createUser({ ...values, role: ROLES.CLIENT, password: values.password || "changeme123" });
    reset();
    setModalOpen(false);
  };

  const columns = [
    {
      key: "name",
      header: "Client",
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar initials={row.avatarInitials} size="sm" tone="neutral" />
          <div>
            <div className="font-semibold text-(--color-text-primary)">{row.name}</div>
            <div className="text-xs text-(--color-text-secondary)">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: "company", header: "Company" },
    { key: "phone", header: "Phone" },
    {
      key: "projects",
      header: "Linked projects",
      render: (row) => `${projectsFor(row.id).length} projects`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <Badge variant={row.isActive === false ? "neutral" : "success"}>
          {row.isActive === false ? "Deactivated" : "Active"}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="Client management"
        subtitle={`${clients.length} clients`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setModalOpen(true)}>
            Add client
          </Button>
        }
      />
      <div className="p-8 flex-1 overflow-y-auto">
        <Card padded={false}>
          {isLoading ? (
            <PageLoader />
          ) : clients.length === 0 ? (
            <EmptyState icon="users" title="No clients yet" description="Add a client account to link them to a project." />
          ) : (
            <Table
              columns={columns}
              data={clients}
              onRowClick={(row) => {
                const clientProjects = projectsFor(row.id);
                if (clientProjects[0]) navigate(ROUTES.ADMIN.PROJECT_DETAIL(clientProjects[0].id || clientProjects[0]._id));
              }}
            />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="Add client"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onCreate)} disabled={isCreating}>
              {isCreating ? "Adding…" : "Add client"}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onCreate)}>
          <Input label="Client / contact name" error={errors.name?.message} {...register("name", { required: "Name is required" })} />
          <Input label="Email" type="email" error={errors.email?.message} {...register("email", { required: "Email is required" })} />
          <Input label="Company" {...register("company")} />
          <Input label="Phone" {...register("phone")} />
          <Input label="Temporary password" type="password" placeholder="Sent to the client separately" {...register("password")} />
        </form>
      </Modal>
    </>
  );
}
