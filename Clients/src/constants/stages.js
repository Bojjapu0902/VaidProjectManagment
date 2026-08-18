// Single source of truth for the 8-stage project lifecycle.
// Any page that renders stage names, colors, or status badges
// should import from here rather than hardcoding values.

export const STAGES = [
  {
    number: 1,
    key: "initiation",
    name: "Project Initiation",
    shortName: "Initiation",
    statusLabel: "New",
    color: "var(--color-stage-1)",
    colorToken: "stage-1",
    items: ["Client Enquiry", "Requirements", "Budget & Timeline", "Project Scope"],
  },
  {
    number: 2,
    key: "site-survey",
    name: "Site Survey & Analysis",
    shortName: "Site survey",
    statusLabel: "In Progress",
    color: "var(--color-stage-2)",
    colorToken: "stage-2",
    items: ["Site Visit", "Measurements", "Site Photos", "Survey Report", "Site Analysis"],
  },
  {
    number: 3,
    key: "concept-design",
    name: "Concept Design",
    shortName: "Concept design",
    statusLabel: "Design Development",
    color: "var(--color-stage-3)",
    colorToken: "stage-3",
    items: ["Ideas & Planning", "Space Planning", "Concept Sketches", "Design Options"],
  },
  {
    number: 4,
    key: "preliminary-design",
    name: "Preliminary Design",
    shortName: "Preliminary design",
    statusLabel: "Review Pending",
    color: "var(--color-stage-4)",
    colorToken: "stage-4",
    items: ["Floor Plans", "Elevations", "3D Views", "Material Selection"],
  },
  {
    number: 5,
    key: "detailed-design",
    name: "Detailed Design & Documentation",
    shortName: "Detailed design",
    statusLabel: "Documentation",
    color: "var(--color-stage-5)",
    colorToken: "stage-5",
    items: ["Working Drawings", "Structural Drawings", "MEP Drawings", "BOQ Preparation"],
  },
  {
    number: 6,
    key: "approvals",
    name: "Approval & Permissions",
    shortName: "Approvals",
    statusLabel: "Govt Approval",
    color: "var(--color-stage-6)",
    colorToken: "stage-6",
    items: ["Submit Drawings", "Authority Review", "Compliance Check", "Approval Tracking"],
  },
  {
    number: 7,
    key: "construction-support",
    name: "Construction Support",
    shortName: "Construction support",
    statusLabel: "Execution",
    color: "var(--color-stage-7)",
    colorToken: "stage-7",
    items: ["Site Visits", "Progress Reports", "Quality Checks", "Issue Tracking"],
  },
  {
    number: 8,
    key: "final-review",
    name: "Final Review & Submission",
    shortName: "Final review",
    statusLabel: "Completed",
    color: "var(--color-stage-8)",
    colorToken: "stage-8",
    items: ["Final Inspection", "Final Drawings", "Handover Docs", "Completion Report"],
  },
];

export const getStageByNumber = (number) =>
  STAGES.find((s) => s.number === number) || STAGES[0];

export const STATUS_BADGE_STYLES = {
  1: { bg: "#E6F1FB", text: "#185FA5" },
  2: { bg: "#E3F7EF", text: "#0F6E56" },
  3: { bg: "#F0E7FE", text: "#5B3FA8" },
  4: { bg: "#FEEEDD", text: "#C2540C" },
  5: { bg: "#E5F4FC", text: "#0C6E96" },
  6: { bg: "#FEEAEA", text: "#B91C1C" },
  7: { bg: "#FEF3E2", text: "#B97309" },
  8: { bg: "#E3F7EF", text: "#15803D" },
};
