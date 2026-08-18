import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { PageLoader } from "../../components/common/EmptyState";
import { STAGES, getStageByNumber } from "../../constants/stages";
import { ROUTES } from "../../constants/routes";
import {
  useGetProjectsReportQuery,
  useGetTeamReportQuery,
  useGetApprovalsReportQuery,
} from "../../app/api/apiSlice";

const REPORT_TYPES = [
  { value: "project_summary", label: "Project summary" },
  { value: "team_performance", label: "Team performance" },
  { value: "approval_timeline", label: "Approval timeline" },
];

const TYPE_COLORS = {
  Residential: "#3B82F6",
  Commercial: "#7C3AED",
  Civic: "#22C55E",
  Industrial: "#F59E0B",
  "Mixed-Use": "#0EA5E9",
};

function exportReportAsCsv(reportType, projectsReport, teamReport, approvalsReport) {
  let rows = [];
  if (reportType === "project_summary" && projectsReport) {
    rows = [["Stage", "Count"], ...projectsReport.byStage.map((s) => [`Stage ${s.stage}`, s.count])];
  } else if (reportType === "team_performance" && teamReport) {
    rows = [
      ["Name", "Role", "Active projects", "Approvals requested"],
      ...teamReport.map((t) => [t.name, t.role, t.activeProjects, t.approvalsRequested]),
    ];
  } else if (reportType === "approval_timeline" && approvalsReport) {
    rows = [["Status", "Count"], ...Object.entries(approvalsReport.byStatus || {})];
  }
  if (!rows.length) return;

  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${reportType}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState("project_summary");
  const { data: projectsReport, isLoading: loadingProjects } = useGetProjectsReportQuery();
  const { data: teamReport, isLoading: loadingTeam } = useGetTeamReportQuery();
  const { data: approvalsReport, isLoading: loadingApprovals } = useGetApprovalsReportQuery();

  const isLoading = loadingProjects || loadingTeam || loadingApprovals;

  const stageDistribution = STAGES.map((s) => ({
    name: `S${s.number}`,
    count: projectsReport?.byStage.find((b) => b.stage === s.number)?.count || 0,
    color: s.color,
  }));

  const typeDistribution = (projectsReport?.byType || []).map((t) => ({
    name: t.type,
    value: t.count,
    color: TYPE_COLORS[t.type] || "#64748B",
  }));

  return (
    <>
      <Topbar
        title="Reports & analytics"
        subtitle="Insights across all projects and team performance"
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button
            variant="secondary"
            icon={<Icon name="download" size={15} />}
            onClick={() => exportReportAsCsv(reportType, projectsReport, teamReport, approvalsReport)}
          >
            Export CSV
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        <select
          className="input-field w-auto mb-5"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          {REPORT_TYPES.map((rt) => (
            <option key={rt.value} value={rt.value}>
              {rt.label}
            </option>
          ))}
        </select>

        {isLoading ? (
          <PageLoader />
        ) : reportType === "project_summary" ? (
          <div className="grid grid-cols-2 gap-4.5">
            <Card padded={false}>
              <CardHeader title="Projects by stage" subtitle="Current distribution across the 8-stage lifecycle" />
              <CardBody>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stageDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stageDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardBody>
            </Card>

            <Card padded={false}>
              <CardHeader title="Projects by type" />
              <CardBody>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={typeDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                      {typeDistribution.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2 flex-wrap">
                  {typeDistribution.map((t) => (
                    <div key={t.name} className="flex items-center gap-1.5 text-xs text-(--color-text-secondary)">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                      {t.name}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card className="col-span-2">
              <div className="grid grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-(--color-text-primary)">{projectsReport?.summary.total ?? 0}</div>
                  <div className="text-xs text-(--color-text-secondary) mt-1">Active projects</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-(--color-text-primary)">
                    {Math.round(projectsReport?.summary.avgProgress ?? 0)}%
                  </div>
                  <div className="text-xs text-(--color-text-secondary) mt-1">Avg. progress</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-(--color-text-primary)">
                    ₹{((projectsReport?.summary.totalBudgetMin ?? 0) / 1e7).toFixed(1)}Cr
                  </div>
                  <div className="text-xs text-(--color-text-secondary) mt-1">Total budget (min)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-(--color-text-primary)">
                    ₹{((projectsReport?.summary.totalBudgetMax ?? 0) / 1e7).toFixed(1)}Cr
                  </div>
                  <div className="text-xs text-(--color-text-secondary) mt-1">Total budget (max)</div>
                </div>
              </div>
            </Card>
          </div>
        ) : reportType === "team_performance" ? (
          <Card padded={false}>
            <CardHeader title="Team performance" subtitle="Active project load and approval activity per team member" />
            <CardBody>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-secondary) uppercase">
                    <th className="py-2">Name</th>
                    <th className="py-2">Role</th>
                    <th className="py-2">Active projects</th>
                    <th className="py-2">Approvals requested</th>
                  </tr>
                </thead>
                <tbody>
                  {(teamReport || []).map((t) => (
                    <tr key={t.userId} className="border-b border-(--color-border) last:border-0">
                      <td className="py-2.5 font-semibold text-(--color-text-primary)">{t.name}</td>
                      <td className="py-2.5 text-(--color-text-secondary)">{t.role}</td>
                      <td className="py-2.5">{t.activeProjects}</td>
                      <td className="py-2.5">{t.approvalsRequested}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        ) : (
          <Card padded={false}>
            <CardHeader
              title="Approval timeline"
              subtitle={`${approvalsReport?.total ?? 0} total approvals · avg turnaround ${approvalsReport?.avgTurnaroundHours ?? 0}h`}
            />
            <CardBody>
              <div className="grid grid-cols-4 gap-4 mb-5">
                {Object.entries(approvalsReport?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="text-center p-3 rounded-lg bg-(--color-bg)">
                    <div className="text-xl font-bold text-(--color-text-primary)">{count}</div>
                    <div className="text-xs text-(--color-text-secondary) capitalize mt-1">{status.replace("_", " ")}</div>
                  </div>
                ))}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-secondary) uppercase">
                    <th className="py-2">Document</th>
                    <th className="py-2">Stage</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(approvalsReport?.recent || []).map((a) => (
                    <tr key={a.id || a._id} className="border-b border-(--color-border) last:border-0">
                      <td className="py-2.5 font-semibold text-(--color-text-primary)">{a.documentName}</td>
                      <td className="py-2.5 text-(--color-text-secondary)">{getStageByNumber(a.stageNumber).shortName}</td>
                      <td className="py-2.5 capitalize">{a.status.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
