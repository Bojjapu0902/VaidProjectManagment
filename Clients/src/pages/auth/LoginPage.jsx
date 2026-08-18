import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { Input } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import Icon from "../../components/common/Icon";
import { ROUTES } from "../../constants/routes";
import { isAdminPortalRole } from "../../constants/roles";
import vaidLogo from "../../images/vaid_logo_black.png";

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
  } = useForm({ defaultValues: { email: "", password: "password123" } });

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
    <div className="min-h-screen flex items-center justify-center bg-(--color-bg) px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8">
          <img src={vaidLogo} alt="VAID Logo" className="h-12 w-auto object-contain" />
        </div>

        <div className="card p-7">
          <h1 className="text-lg font-bold text-(--color-text-primary)">Sign in</h1>
          <p className="text-sm text-(--color-text-secondary) mt-1 mb-6">
            Access your admin workspace or client portal
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              error={errors.email?.message}
              {...register("email", { required: "Email is required" })}
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register("password", { required: "Password is required" })}
              />
              <button
                type="button"
                className="absolute right-3 top-[30px] text-(--color-text-tertiary)"
                onClick={() => setShowPassword((s) => !s)}
                aria-label="Toggle password visibility"
              >
                <Icon name="eye" size={16} />
              </button>
            </div>

            {error && (
              <div className="text-sm text-(--color-danger) bg-(--color-danger-bg) rounded-(--radius-md) px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-(--color-text-secondary)">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <a href="#" className="font-semibold text-(--color-portal-primary, var(--color-navy))">
                Forgot password?
              </a>
            </div>

            <Button type="submit" variant="primary" disabled={isLoading} className="w-full justify-center">
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <div className="card p-4 mt-4 " style={{ display: "none" }}>
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
    </div>
  );
}
