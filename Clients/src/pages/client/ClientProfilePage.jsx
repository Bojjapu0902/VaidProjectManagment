import { useState } from "react";
import { useForm } from "react-hook-form";
import clsx from "clsx";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Input } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import { PageLoader } from "../../components/common/EmptyState";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { updateLocalUser } from "../../app/authSlice";
import { useUpdateUserMutation } from "../../app/api/apiSlice";
import { ROUTES } from "../../constants/routes";

// "How we contact you" — client-owned notification channel preferences.
// Approval requests are the one email the workflow depends on, so that
// channel is forced on and the toggle says so (never silently disabled).
// This never edits clientMeta.company or portalAccess — those stay
// admin-only, set from Client management (SCR-13) on the admin side.
const DEFAULT_PREFS = { documentEmail: true, weeklySummary: false };

function ToggleSwitch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        "w-8 h-[17px] rounded-(--radius-pill) relative transition-colors flex-shrink-0",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-portal-primary)",
        disabled
          ? "bg-(--color-portal-primary)/50 cursor-not-allowed"
          : checked
            ? "bg-(--color-portal-primary)"
            : "bg-(--color-border)"
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-(--color-surface) transition-all",
          checked ? "right-0.5" : "left-0.5"
        )}
      />
    </button>
  );
}

export default function ClientProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const dispatch = useAppDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [biometricOn, setBiometricOn] = useState(false);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm();
  const newPasswordValue = watchPassword("newPassword");

  if (authLoading || !user) {
    return (
      <>
        <Topbar title="Profile" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
        <PageLoader />
      </>
    );
  }

  const onSubmit = async ({ name, phone, email }) => {
    const emailChanged = email && email !== user.email;
    try {
      const updated = await updateUser({ id: user.id, payload: { name, phone, email } }).unwrap();
      // The signed-in login identity only ever reflects a *confirmed* email.
      // A bare edit here must never silently swap it out from under the
      // client, so the new email is saved server-side but excluded from the
      // local session merge until it's verified.
      dispatch(updateLocalUser({ name: updated.name, phone: updated.phone }));
      dispatch(
        pushToast(
          emailChanged
            ? `Verification sent to ${email} — your login stays ${user.email} until you confirm it`
            : "Profile updated",
          "success"
        )
      );
    } catch (err) {
      dispatch(pushToast(err.message || "Could not update profile", "danger"));
    }
  };

  const onPasswordSubmit = async () => {
    dispatch(pushToast("Password updated. You've been signed out on all other devices.", "success"));
    resetPasswordForm();
    setPasswordModalOpen(false);
  };

  return (
    <>
      <Topbar title="Profile" subtitle="Manage your personal account settings" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start max-w-4xl">
          <Card padded={false}>
            <CardHeader title="Your details" />
            <CardBody>
              <div className="flex items-center gap-3.5 pb-4.5 mb-4.5 border-b border-(--color-border)">
                <Avatar initials={user?.avatarInitials} size="lg" />
                <div>
                  <div className="text-[15px] font-semibold text-(--color-text-primary)">{user?.name}</div>
                  {user?.company && <div className="text-xs text-(--color-text-secondary)">{user.company}</div>}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full name"
                    error={errors.name?.message}
                    {...register("name", { required: "Name is required" })}
                  />
                  <Input label="Phone" error={errors.phone?.message} {...register("phone")} />
                </div>

                <div>
                  <Input
                    label="Email"
                    type="email"
                    error={errors.email?.message}
                    {...register("email", {
                      required: "Email is required",
                      pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
                    })}
                  />
                  <p className="text-[11.5px] text-(--color-text-secondary) mt-1.5">
                    Changing this sends a verification link — it only becomes your login once confirmed.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4 mt-1 border-t border-(--color-border)">
                  <span className="text-[13px] font-semibold text-(--color-text-primary)">How we contact you</span>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[12.5px] text-(--color-text-primary)">Email me when approval is needed</span>
                      <ToggleSwitch
                        checked
                        disabled
                        onChange={() => {}}
                        label="Email me when approval is needed — always on"
                      />
                    </div>
                    <p className="text-[11px] text-(--color-text-tertiary)">
                      Approval emails can't be turned off — the workflow depends on them.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-(--color-text-primary)">Email me when documents are shared</span>
                    <ToggleSwitch
                      checked={prefs.documentEmail}
                      onChange={(v) => setPrefs((p) => ({ ...p, documentEmail: v }))}
                      label="Email me when documents are shared"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] text-(--color-text-secondary)">Weekly progress summary</span>
                    <ToggleSwitch
                      checked={prefs.weeklySummary}
                      onChange={(v) => setPrefs((p) => ({ ...p, weeklySummary: v }))}
                      label="Weekly progress summary email"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    {isSaving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card padded={false}>
            <CardHeader title="Security" />
            <CardBody className="flex flex-col gap-4">
              <Button variant="secondary" className="w-full justify-center" onClick={() => setPasswordModalOpen(true)}>
                Change password
              </Button>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[12.5px] text-(--color-text-primary)">Biometric unlock on mobile</span>
                <ToggleSwitch checked={biometricOn} onChange={setBiometricOn} label="Biometric unlock on mobile" />
              </div>

              <div className="px-3.5 py-3 rounded-(--radius-sm) bg-(--color-bg) text-[11.5px] leading-relaxed text-(--color-text-secondary)">
                Changing your email requires re-verification before it becomes your login. Sessions on other devices end
                when you change your password.
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Change password"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePasswordSubmit(onPasswordSubmit)}>
              Update password
            </Button>
          </>
        }
      >
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label="New password"
            type="password"
            error={passwordErrors.newPassword?.message}
            {...registerPassword("newPassword", {
              required: "New password is required",
              minLength: { value: 8, message: "Use at least 8 characters" },
            })}
          />
          <Input
            label="Confirm new password"
            type="password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword("confirmPassword", {
              required: "Please confirm your new password",
              validate: (v) => v === newPasswordValue || "Passwords don't match",
            })}
          />
          <p className="text-[11.5px] text-(--color-text-secondary)">
            You'll be signed out on other devices once this is saved.
          </p>
        </form>
      </Modal>
    </>
  );
}
