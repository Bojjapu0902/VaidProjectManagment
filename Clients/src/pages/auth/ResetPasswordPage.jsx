import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { ROUTES } from "../../constants/routes";
import { authService } from "../../services/authService";
import vaidLogoBlack from "../../images/vaid_logo_black.png";

function passwordStrength(value = "") {
  const checks = [value.length >= 10, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)];
  const score = checks.filter(Boolean).length;
  const label = score >= 4 ? "Strong" : score >= 3 ? "Good" : score >= 1 ? "Weak" : "";
  const color = score >= 4 ? "var(--color-success)" : score >= 3 ? "var(--color-info)" : "var(--color-danger)";
  return { score, label, color };
}

function RequestLinkForm() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: "" } });

  const onSubmit = async ({ email }) => {
    setIsSubmitting(true);
    try {
      await authService.forgotPassword({ email });
    } finally {
      // Same confirmation whether or not the account exists — the API never
      // reveals which email addresses are registered.
      setSubmittedEmail(email);
      setSent(true);
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-5 items-center text-center">
        <div className="w-14 h-14 rounded-full bg-(--color-success-bg) flex items-center justify-center">
          <Icon name="mail" size={24} className="text-(--color-success)" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-(--color-text-primary)">Check your inbox</h1>
          <p className="text-[13.5px] leading-relaxed text-(--color-text-secondary)">
            If an account exists for <strong className="text-(--color-text-primary)">{submittedEmail}</strong>, we've
            sent a link to reset your password. It's valid for 60 minutes.
          </p>
        </div>
        <Link to={ROUTES.LOGIN} className="text-[12.5px] font-semibold text-(--color-navy)">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-(--color-amber-dark)">
          Step 1 of 2
        </span>
        <h1 className="text-xl font-bold text-(--color-text-primary)">Reset your password</h1>
        <p className="text-[13px] leading-relaxed text-(--color-text-secondary)">
          Enter the email on your account and we will send a link valid for 60 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email", { required: "Email is required" })}
        />
        <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full justify-center">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
        <Link to={ROUTES.LOGIN} className="text-[12.5px] font-semibold text-(--color-navy) text-center">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}

function SetPasswordForm({ token, isInvite, projectName }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { password: "", confirmPassword: "" } });

  const password = watch("password");
  const strength = useMemo(() => passwordStrength(password), [password]);

  const onSubmit = async ({ password: newPassword }) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword({ token, password: newPassword });
      setDone(true);
    } catch (err) {
      setTokenInvalid(err.response?.status === 400 || err.response?.status === 401);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenInvalid) {
    return (
      <div className="flex flex-col gap-5 items-center text-center">
        <div className="w-14 h-14 rounded-full bg-(--color-danger-bg) flex items-center justify-center">
          <Icon name="alert-triangle" size={24} className="text-(--color-danger)" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-(--color-text-primary)">This link has expired</h1>
          <p className="text-[13.5px] leading-relaxed text-(--color-text-secondary)">
            The reset link is invalid or has already been used. Request a new one to continue.
          </p>
        </div>
        <Link to={ROUTES.RESET_PASSWORD} className="w-full">
          <Button variant="primary" className="w-full justify-center">
            Request a new link
          </Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-5 items-center text-center">
        <div className="w-14 h-14 rounded-full bg-(--color-success-bg) flex items-center justify-center">
          <Icon name="circle-check" size={24} className="text-(--color-success)" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-(--color-text-primary)">Password set</h1>
          <p className="text-[13.5px] leading-relaxed text-(--color-text-secondary)">
            Your password has been updated. Please log in with your new password.
          </p>
        </div>
        <Link to={ROUTES.LOGIN} className="w-full">
          <Button variant="primary" className="w-full justify-center">
            Go to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-(--color-amber-dark)">
          {isInvite ? "Invitation · Client" : "Step 2 of 2"}
        </span>
        <h1 className="text-xl font-bold text-(--color-text-primary)">Set your password</h1>
        <p className="text-[13px] leading-relaxed text-(--color-text-secondary)">
          {isInvite ? (
            <>
              You have been given access to{" "}
              <strong className="text-(--color-text-primary)">{projectName || "your project"}</strong> by Vaid
              Architects.
            </>
          ) : (
            "Choose a new password for your account."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">New password</label>
          <input
            type="password"
            placeholder="••••••••••"
            className={`input-field font-mono ${errors.password ? "border-(--color-danger)" : ""}`}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 10, message: "Use at least 10 characters" },
            })}
          />
          {password && (
            <>
              <div className="flex gap-1 pt-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="flex-1 h-1 rounded-full"
                    style={{ background: i < strength.score ? strength.color : "var(--color-border)" }}
                  />
                ))}
              </div>
              <span className="text-[11.5px] text-(--color-text-secondary)">
                {strength.label ? `${strength.label} · minimum 10 characters` : "Minimum 10 characters"}
              </span>
            </>
          )}
          {errors.password?.message && <p className="text-xs text-(--color-danger) mt-1">{errors.password.message}</p>}
        </div>

        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••••"
          error={errors.confirmPassword?.message}
          className="font-mono"
          {...register("confirmPassword", {
            required: "Confirm your password",
            validate: (value) => value === password || "Passwords do not match",
          })}
        />

        <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full justify-center">
          {isSubmitting ? "Saving…" : isInvite ? "Set password & continue" : "Reset password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const isInvite = searchParams.get("invite") === "true";
  const projectName = searchParams.get("project");

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4 py-10">
      <div className="w-full max-w-[420px] flex flex-col items-center gap-8">
        <img src={vaidLogoBlack} alt="Vaid" className="h-9 w-auto object-contain" />
        <div className="card p-8 w-full">
          {token ? (
            <SetPasswordForm token={token} isInvite={isInvite} projectName={projectName} />
          ) : (
            <RequestLinkForm />
          )}
        </div>
      </div>
    </div>
  );
}
