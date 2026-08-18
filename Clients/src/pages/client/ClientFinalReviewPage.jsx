import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { Textarea } from "../../components/common/FormField";
import { PageLoader } from "../../components/common/EmptyState";
import { useGetProjectByIdQuery, useSubmitFinalReviewMutation } from "../../app/api/apiSlice";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { ROUTES } from "../../constants/routes";

const CHECKLIST_ITEMS = [
  "Final drawings match the approved design",
  "All handover documents have been received",
  "Site walkthrough completed satisfactorily",
];

export default function ClientFinalReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: project, isLoading } = useGetProjectByIdQuery(id);
  const [submitFinalReview, { isLoading: isSubmitting }] = useSubmitFinalReviewMutation();
  const [checked, setChecked] = useState({});
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  if (isLoading || !project) {
    return (
      <>
        <Topbar title="Loading…" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const allChecked = CHECKLIST_ITEMS.every((item) => checked[item]);

  const handleSubmit = async () => {
    try {
      await submitFinalReview({
        projectId: id,
        payload: { rating, feedback, checklist: CHECKLIST_ITEMS.filter((item) => checked[item]) },
      }).unwrap();
      dispatch(pushToast("Thank you — your final review has been submitted.", "success"));
      navigate(ROUTES.CLIENT.PROJECT_DETAIL(id));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not submit your review", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Final review & feedback" subtitle={project.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto max-w-xl">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <Card padded={false} className="mb-4.5">
          <CardHeader title="Final confirmation checklist" />
          <CardBody className="space-y-2.5">
            {CHECKLIST_ITEMS.map((item) => (
              <label key={item} className="flex items-center gap-3 px-3 py-2.5 rounded-(--radius-md) bg-(--color-bg) cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!checked[item]}
                  onChange={() => setChecked((prev) => ({ ...prev, [item]: !prev[item] }))}
                  className="rounded"
                />
                <span className="text-sm text-(--color-text-primary)">{item}</span>
              </label>
            ))}
          </CardBody>
        </Card>

        <Card padded={false} className="mb-4.5">
          <CardHeader title="Rate your experience" />
          <CardBody>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)} aria-label={`${star} stars`}>
                  <Icon
                    name="star"
                    size={28}
                    className={star <= rating ? "text-(--color-amber)" : "text-(--color-border-strong)"}
                    style={{ fill: star <= rating ? "var(--color-amber)" : "none" }}
                  />
                </button>
              ))}
            </div>
            <Textarea
              label="Your feedback"
              placeholder="Tell us about your experience working with the team…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3 pb-8">
          <Button variant="secondary" icon={<Icon name="download" size={15} />}>
            Download handover package
          </Button>
          <Button variant="primary" disabled={!allChecked || rating === 0 || isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Submitting…" : "Submit final review"}
          </Button>
        </div>
      </div>
    </>
  );
}
