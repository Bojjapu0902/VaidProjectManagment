import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { Card } from "../../components/common/Card";
import { StageBadge } from "../../components/common/Badge";
import ProgressBar from "../../components/common/ProgressBar";
import Table from "../../components/common/Table";
import { PageLoader } from "../../components/common/EmptyState";
import { EmptyState } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useGetProjectsQuery } from "../../app/api/apiSlice";
import { getStageByNumber } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";

export default function AdminProjectListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: projects = [], isLoading } = useGetProjectsQuery({ role: user?.role, userId: user?.id });
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === "all" || String(p.currentStage) === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [projects, search, stageFilter]);

  const columns = [
    {
      key: "title",
      header: "Project",
      render: (row) => (
        <div>
          <div className="font-semibold text-(--color-text-primary)">{row.title}</div>
          <div className="text-xs text-(--color-text-secondary)">{row.projectCode}</div>
        </div>
      ),
    },
    { key: "clientName", header: "Client" },
    { key: "type", header: "Type" },
    {
      key: "stage",
      header: "Stage",
      render: (row) => {
        const stage = getStageByNumber(row.currentStage);
        return <StageBadge stageNumber={row.currentStage} label={stage.statusLabel} />;
      },
    },
    {
      key: "progress",
      header: "Progress",
      render: (row) => (
        <div className="w-[120px]">
          <ProgressBar percent={row.progressPercent} color={getStageByNumber(row.currentStage).color} />
        </div>
      ),
    },
  ];

  return (
    <>
      <Topbar
        title="Projects"
        subtitle={`${filtered.length} of ${projects.length} projects`}
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={16} />} onClick={() => navigate(ROUTES.ADMIN.PROJECT_NEW)}>
            New project
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Icon name="search" size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)" />
            <input
              className="input-field pl-9"
              placeholder="Search projects or clients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field w-auto"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">All stages</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                Stage {n} — {getStageByNumber(n).shortName}
              </option>
            ))}
          </select>
        </div>

        <Card padded={false}>
          {isLoading ? (
            <PageLoader />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="folder"
              title="No projects found"
              description="Try adjusting your search or filters, or create a new project."
            />
          ) : (
            <Table columns={columns} data={filtered} onRowClick={(row) => navigate(ROUTES.ADMIN.PROJECT_DETAIL(row.id))} />
          )}
        </Card>
      </div>
    </>
  );
}
