import { differenceInDays, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Badge } from "../../components/common/Badge";
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

const STATUS_VARIANT = {
  pending: "warning",
  overdue: "danger",
  internal_review: "info",
  approved: "success",
  rejected: "danger",
};

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const csv = rows.map((r) => r.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { data: projectsReport, isLoading: loadingProjects } = useGetProjectsReportQuery();
  const { data: teamReport, isLoading: loadingTeam } = useGetTeamReportQuery();
  const { data: approvalsReport, isLoading: loadingApprovals } = useGetApprovalsReportQuery();

  const isLoading = loadingProjects || loadingTeam || loadingApprovals;

  const stageDistribution = STAGES.map((s) => ({
    name: `S${s.number}`,
    stageLabel: s.shortName,
    count: projectsReport?.byStage.find((b) => b.stage === s.number)?.count || 0,
    color: s.color,
  }));
  const activeTotal = projectsReport?.summary.total ?? 0;

  // "What's stuck": approvals that are still open, ranked by how long they've
  // been waiting rather than by a decorative average — the number that
  // actually changes what the principal does next.
  const openApprovals = (approvalsReport?.recent || [])
    .filter((a) => a.status !== "approved" && a.status !== "rejected")
    .map((a) => ({
      ...a,
      daysOpen: a.requestedAt ? differenceInDays(new Date(), parseISO(a.requestedAt)) : null,
    }))
    .sort((a, b) => (b.daysOpen ?? 0) - (a.daysOpen ?? 0));

  const stageNumbers = [...new Set(openApprovals.map((a) => a.stageNumber))].sort((a, b) => a - b);
  const turnaroundByStage = stageNumbers.map((num) => {
    const items = openApprovals.filter((a) => a.stageNumber === num);
    const avgDays = items.reduce((sum, a) => sum + (a.daysOpen || 0), 0) / items.length;
    return { stage: num, shortName: getStageByNumber(num).shortName, avgDays, count: items.length };
  });
  const maxAvgDays = Math.max(1, ...turnaroundByStage.map((t) => t.avgDays));

  // Rule: turnaround figures are unreliable until at least 3 projects have
  // reached the final stage — hide the medians rather than show noise.
  const completedProjects = projectsReport?.byStage.find((b) => b.stage === 8)?.count ?? 0;
  const turnaroundReliable = completedProjects >= 3;

  const severity = (days) => (days >= 7 ? "danger" : days >= 4 ? "warning" : "success");
  const severityColor = {
    danger: "var(--color-danger)",
    warning: "var(--color-warning)",
    success: "var(--color-success)",
  };

  const handleExport = (type) => {
    if (type === "projects") {
      downloadCsv(
        "project-summary.csv",
        [["Stage", "Count"], ...stageDistribution.map((s) => [s.stageLabel, s.count])]
      );
    } else if (type === "team") {
      downloadCsv(
        "team-performance.csv",
        [
          ["Name", "Role", "Active projects", "Approvals requested"],
          ...(teamReport || []).map((t) => [t.name, t.role, t.activeProjects, t.approvalsRequested]),
        ]
      );
    } else if (type === "approvals") {
      downloadCsv(
        "approvals-open.csv",
        [
          ["Document", "Project", "Stage", "Status", "Days open"],
          ...openApprovals.map((a) => [
            a.documentName,
            a.projectName,
            getStageByNumber(a.stageNumber).shortName,
            a.status.replace("_", " "),
            a.daysOpen ?? "—",
          ]),
        ]
      );
    }
  };

  return (
    <>
      <Topbar
        title="Reports & analytics"
        subtitle="What's stuck across the portfolio, right now"
        notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS}
        actions={
          <Button
            variant="secondary"
            icon={<Icon name="download" size={15} />}
            onClick={() => handleExport("projects")}
          >
            Export
          </Button>
        }
      />

      <div className="p-8 flex-1 overflow-y-auto">
        {isLoading ? (
          <PageLoader />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4.5">
            {/* Left column — where the portfolio is bunched up, and what's stuck */}
            <div className="flex flex-col gap-4.5">
              <Card padded={false}>
                <CardHeader
                  title="Projects by stage"
                  subtitle="Current distribution across the 8-stage lifecycle"
                  action={<span className="text-xs text-(--color-text-secondary)">{activeTotal} active</span>}
                />
                <CardBody>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stageDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={28} />
                      <Tooltip
                        formatter={(value, _name, item) => [`${value} project${value === 1 ? "" : "s"}`, item.payload.stageLabel]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stageDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-5 pt-4 border-t border-(--color-border)">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[13px] font-semibold text-(--color-text-primary)">
                        Approvals waiting — by stage
                      </span>
                      {openApprovals.length > 0 && (
                        <span className="text-xs text-(--color-text-secondary)">{openApprovals.length} open</span>
                      )}
                    </div>

                    {!turnaroundReliable ? (
                      <p className="text-xs text-(--color-text-secondary) py-2">
                        Fewer than 3 projects have reached final review yet — turnaround medians aren't reliable, so they're
                        hidden until then.
                      </p>
                    ) : turnaroundByStage.length === 0 ? (
                      <p className="text-xs text-(--color-text-secondary) py-2">Nothing waiting on approval right now.</p>
                    ) : (
                      <div className="flex flex-col gap-2.5">
                        {turnaroundByStage.map((t) => {
                          const sev = severity(t.avgDays);
                          return (
                            <div key={t.stage} className="grid grid-cols-[110px_1fr_84px] gap-3 items-center">
                              <span className="text-xs text-(--color-text-secondary) truncate">Stage {t.stage} · {t.shortName}</span>
                              <div className="h-2 rounded-(--radius-pill) bg-(--color-bg) overflow-hidden">
                                <div
                                  className="h-2 rounded-(--radius-pill)"
                                  style={{
                                    width: `${Math.min(100, (t.avgDays / maxAvgDays) * 100)}%`,
                                    background: severityColor[sev],
                                  }}
                                />
                              </div>
                              <span className="text-[11px] font-mono text-(--color-text-secondary) text-right">
                                {t.avgDays.toFixed(1)}d avg · {t.count} open
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Card padded={false}>
                <CardHeader
                  title="What's stuck"
                  subtitle="Open approvals, oldest first — this is the list that changes what happens next"
                />
                <CardBody>
                  {openApprovals.length === 0 ? (
                    <p className="text-sm text-(--color-text-secondary) py-4 text-center">Nothing stuck — every approval is resolved.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-1">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-(--color-border) text-left text-xs text-(--color-text-secondary) uppercase">
                            <th className="py-2 px-1">Document</th>
                            <th className="py-2 px-1">Stage</th>
                            <th className="py-2 px-1">Status</th>
                            <th className="py-2 px-1 text-right">Waiting</th>
                          </tr>
                        </thead>
                        <tbody>
                          {openApprovals.slice(0, 8).map((a) => (
                            <tr key={a.id || a._id} className="border-b border-(--color-border) last:border-0">
                              <td className="py-2.5 px-1 font-semibold text-(--color-text-primary)">
                                {a.documentName}
                                <div className="text-xs font-normal text-(--color-text-secondary)">{a.projectName}</div>
                              </td>
                              <td className="py-2.5 px-1 text-(--color-text-secondary)">{getStageByNumber(a.stageNumber).shortName}</td>
                              <td className="py-2.5 px-1">
                                <Badge variant={STATUS_VARIANT[a.status] || "neutral"}>{a.status.replace("_", " ")}</Badge>
                              </td>
                              <td className="py-2.5 px-1 text-right font-mono text-xs">
                                {a.daysOpen != null ? `${a.daysOpen}d` : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right column — who's carrying the load, and getting a document out the door */}
            <div className="flex flex-col gap-4.5">
              <Card padded={false}>
                <CardHeader title="Team performance" subtitle="Active project load and approval activity per person" />
                <CardBody className="space-y-2.5">
                  {(teamReport || []).length === 0 ? (
                    <p className="text-sm text-(--color-text-secondary) py-4 text-center">No team activity yet.</p>
                  ) : (
                    (teamReport || []).map((t) => (
                      <div
                        key={t.userId}
                        className="flex items-center justify-between pb-2.5 border-b border-(--color-border) last:border-0 last:pb-0"
                      >
                        <span className="text-[13px] font-medium text-(--color-text-primary)">{t.name}</span>
                        <span className="text-xs font-mono text-(--color-text-secondary)">
                          {t.activeProjects} project{t.activeProjects === 1 ? "" : "s"} · {t.approvalsRequested} approval
                          {t.approvalsRequested === 1 ? "" : "s"}
                        </span>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              <Card padded={false}>
                <CardHeader title="Export" subtitle="Delivered as a download" />
                <CardBody className="space-y-2">
                  <button
                    className="w-full flex items-center justify-between text-left text-[12.5px] px-3.5 py-2.5 rounded-(--radius-sm) border border-(--color-border) hover:border-(--color-navy) hover:bg-(--color-bg) transition-colors"
                    onClick={() => handleExport("projects")}
                  >
                    Project summary — CSV
                    <Icon name="download" size={14} className="text-(--color-text-tertiary)" />
                  </button>
                  <button
                    className="w-full flex items-center justify-between text-left text-[12.5px] px-3.5 py-2.5 rounded-(--radius-sm) border border-(--color-border) hover:border-(--color-navy) hover:bg-(--color-bg) transition-colors"
                    onClick={() => handleExport("team")}
                  >
                    Team performance — CSV
                    <Icon name="download" size={14} className="text-(--color-text-tertiary)" />
                  </button>
                  <button
                    className="w-full flex items-center justify-between text-left text-[12.5px] px-3.5 py-2.5 rounded-(--radius-sm) border border-(--color-border) hover:border-(--color-navy) hover:bg-(--color-bg) transition-colors"
                    onClick={() => handleExport("approvals")}
                  >
                    Open approvals — CSV
                    <Icon name="download" size={14} className="text-(--color-text-tertiary)" />
                  </button>
                  <div className="w-full text-left px-3.5 py-2.5 rounded-(--radius-sm) border border-(--color-border) opacity-60">
                    <span className="text-[12.5px] text-(--color-text-secondary)">Single project report</span>
                    <p className="text-[11px] text-(--color-text-tertiary) mt-0.5">
                      Not available from this screen — open the project and use its own Export action.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
