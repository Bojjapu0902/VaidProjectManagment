// Scans active projects for stages approaching their expected completion
// date and fires a "deadline_reminder" notification to the assigned team
// (spec Section 9). Runs on a simple in-process interval — swap for a real
// job scheduler (node-cron, a queue, etc.) if this needs to survive
// multiple server instances.
const Project = require("../models/Project");
const { notifyMany } = require("./notification.service");

const REMINDER_WINDOW_DAYS = 3;

async function runDeadlineReminders() {
  const soon = new Date(Date.now() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const projects = await Project.find({
    isArchived: false,
    "timeline.expectedEndDate": { $lte: soon, $gte: new Date() },
  });

  for (const project of projects) {
    await notifyMany(project.team.map((m) => m.userId), {
      projectId: project._id,
      type: "deadline_reminder",
      title: "Upcoming project deadline",
      message: `${project.title} is due ${new Date(project.timeline.expectedEndDate).toDateString()}.`,
    });
  }

  return projects.length;
}

function startDeadlineReminderJob(intervalMs = 24 * 60 * 60 * 1000) {
  // Run once shortly after boot, then on the configured interval.
  setTimeout(() => runDeadlineReminders().catch((err) => console.error("[deadline-reminder]", err.message)), 60_000);
  return setInterval(
    () => runDeadlineReminders().catch((err) => console.error("[deadline-reminder]", err.message)),
    intervalMs
  );
}

module.exports = { runDeadlineReminders, startDeadlineReminderJob };
