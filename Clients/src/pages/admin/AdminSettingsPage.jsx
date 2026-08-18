import { useForm } from "react-hook-form";
import Topbar from "../../components/layout/Topbar";
import { Card, CardHeader, CardBody } from "../../components/common/Card";
import { Input } from "../../components/common/FormField";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import useAuth from "../../hooks/useAuth";
import { useAppDispatch } from "../../app/hooks";
import { pushToast } from "../../app/uiSlice";
import { updateLocalUser } from "../../app/authSlice";
import { useUpdateUserMutation } from "../../app/api/apiSlice";
import { ROLE_LABELS } from "../../constants/roles";
import { ROUTES } from "../../constants/routes";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone },
  });

  const onSubmit = async ({ name, phone }) => {
    try {
      const updated = await updateUser({ id: user.id, payload: { name, phone } }).unwrap();
      dispatch(updateLocalUser(updated));
      dispatch(pushToast("Profile updated", "success"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not update profile", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Settings" subtitle="Platform configuration and personal preferences" notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto max-w-2xl space-y-5">
        <Card padded={false}>
          <CardHeader title="Profile" />
          <CardBody>
            <div className="flex items-center gap-3 mb-5">
              <Avatar initials={user?.avatarInitials} size="lg" />
              <div>
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs text-(--color-text-secondary)">{ROLE_LABELS[user?.role]}</div>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <Input label="Full name" {...register("name")} />
              <Input label="Email" type="email" disabled {...register("email")} />
              <Input label="Phone" {...register("phone")} />
              <div className="col-span-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card padded={false}>
          <CardHeader title="Notification preferences" />
          <CardBody className="space-y-3">
            <label className="flex items-center justify-between text-sm">
              <span>Email notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>In-app notifications</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
