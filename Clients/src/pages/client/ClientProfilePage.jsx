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
import { ROUTES } from "../../constants/routes";

export default function ClientProfilePage() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const { register, handleSubmit } = useForm({
    defaultValues: { name: user?.name, email: user?.email, phone: user?.phone, company: user?.company },
  });

  const onSubmit = async ({ name, phone, company }) => {
    try {
      const updated = await updateUser({ id: user.id, payload: { name, phone, company } }).unwrap();
      dispatch(updateLocalUser(updated));
      dispatch(pushToast("Profile updated", "success"));
    } catch (err) {
      dispatch(pushToast(err.message || "Could not update profile", "danger"));
    }
  };

  return (
    <>
      <Topbar title="Profile" subtitle="Manage your personal account settings" notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto max-w-2xl space-y-5">
        <Card padded={false}>
          <CardHeader title="Account details" />
          <CardBody>
            <div className="flex items-center gap-3 mb-5">
              <Avatar initials={user?.avatarInitials} size="lg" />
              <div>
                <div className="text-sm font-semibold">{user?.name}</div>
                <div className="text-xs text-(--color-text-secondary)">{user?.company}</div>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
              <Input label="Full name" {...register("name")} />
              <Input label="Email" type="email" disabled {...register("email")} />
              <Input label="Phone" {...register("phone")} />
              <Input label="Company" {...register("company")} />
              <div className="col-span-2 flex justify-end">
                <Button type="submit" variant="primary" disabled={isSaving}>
                  {isSaving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card padded={false}>
          <CardHeader title="Change password" />
          <CardBody className="grid grid-cols-2 gap-4">
            <Input label="New password" type="password" />
            <Input label="Confirm new password" type="password" />
            <div className="col-span-2 flex justify-end">
              <Button variant="secondary">Update password</Button>
            </div>
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
