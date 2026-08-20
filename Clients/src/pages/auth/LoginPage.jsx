import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { Input } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { ROUTES } from "../../constants/routes";
import { isAdminPortalRole } from "../../constants/roles";
import vaidLogoWhite from "../../images/vaid_logo_white.png";

const DEMO_ACCOUNTS = [
  { label: "Admin / Team — Project Manager", email: "Suresh@vaid.com" },
  { label: "Admin / Team — Architect", email: "sarika@vaid.com" },
  { label: "Client — Haritha", email: "Haritha@vaid.com" },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ defaultValues: { email: "", password: "password123", rememberMe: true } });

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(isAdminPortalRole(user.role) ? ROUTES.ADMIN.DASHBOARD : ROUTES.CLIENT.DASHBOARD, {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = (formValues) => {
    login(formValues);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4 py-10">
      <div className="w-full max-w-[920px] rounded-(--radius-md) border border-(--color-border) bg-(--color-surface) shadow-(--shadow-sm) overflow-hidden grid md:grid-cols-2">
        {/* Brand panel */}
        <div className="bg-(--color-navy) px-8 py-10 md:px-10 md:py-11 flex flex-col justify-between gap-10 min-h-[400px]">
          <img src={vaidLogoWhite} alt="Vaid" className="h-9 w-auto object-contain" />

          <div className="flex flex-col gap-3">
            <h2 className="text-[22px] font-semibold text-white leading-snug">
              Every drawing, approval and site report in one place.
            </h2>
            <p className="text-[13px] leading-relaxed text-white/65">
              Clients see progress as it happens. The team sees what is waiting on them.
            </p>
          </div>

          <div className="flex gap-6">
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-lg text-(--color-amber)">8</span>
              <span className="text-[11px] text-white/55">stages tracked</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono text-lg text-(--color-amber)">2</span>
              <span className="text-[11px] text-white/55">portals</span>
            </div>
          </div>
        </div>

        {/* Sign-in panel */}
        <div className="px-8 py-10 md:px-10 md:py-11 flex flex-col justify-center gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-(--color-text-primary)">Sign in</h1>
            <p className="text-[13.5px] text-(--color-text-secondary)">
              Use the email address your account was created with.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
            <Input
              label="Email address"
              type="email"
              placeholder="a.nair@vaid.in"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-(--color-text-secondary)">Password</label>
                <Link to={ROUTES.RESET_PASSWORD} className="text-xs font-semibold text-(--color-navy)">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••"
                  className={`input-field font-mono pr-10 ${errors.password ? "border-(--color-danger)" : ""}`}
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-text-tertiary)"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                >
                  <Icon name="eye" size={16} />
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-xs text-(--color-danger) mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div
                className="text-sm text-(--color-danger) bg-(--color-danger-bg) rounded-(--radius-md) px-3 py-2"
                role="alert"
              >
                {error}
              </div>
            )}

            <label className="flex items-center gap-2 text-[13px] text-(--color-text-secondary)">
              <input type="checkbox" className="rounded" {...register("rememberMe")} />
              Keep me signed in for 7 days
            </label>

            <Button type="submit" variant="primary" disabled={isLoading} className="w-full justify-center">
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>

            <p className="text-xs text-(--color-text-tertiary) text-center">
              Trouble signing in? Contact your project manager.
            </p>
          </form>
        </div>
      </div>

      <div className="card p-4 mt-4 fixed bottom-4 right-4 max-w-xs" style={{ display: "none" }}>
        <p className="text-xs font-semibold text-(--color-text-secondary) mb-2">
          Demo accounts (password: password123)
        </p>
        <div className="space-y-1.5">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              onClick={() => setValue("email", acc.email)}
              className="w-full text-left text-xs px-3 py-2 rounded-(--radius-sm) hover:bg-(--color-bg) text-(--color-text-primary) flex items-center justify-between"
            >
              <span>{acc.label}</span>
              <span className="text-(--color-text-tertiary)">{acc.email}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
