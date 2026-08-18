import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Icon from "../../components/common/Icon";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { Input } from "../../components/common/FormField";
import MessageThread from "../../components/common/MessageThread";
import {
  useGetMessagesQuery, useSendMessageMutation, useGetProjectByIdQuery,
  useGetConversationsQuery, useCreateConversationMutation,
} from "../../app/api/apiSlice";
import useAuth from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";

export default function AdminProjectMessagesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project } = useGetProjectByIdQuery(id);
  const { data: conversations = [] } = useGetConversationsQuery(id, { skip: !id });
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { participantIds: [] } });

  // Default to the first conversation (the auto-created "General" group)
  // without needing a setState-in-effect — this is a derived value, not
  // state that needs to persist independently once the list loads.
  const activeConversationId =
    selectedConversationId || conversations[0]?.id || conversations[0]?._id || null;

  const { data: messages = [] } = useGetMessagesQuery(
    { conversationId: activeConversationId, projectId: id },
    { skip: !activeConversationId }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();

  const handleSend = (text) => {
    if (!activeConversationId) return;
    sendMessage({
      conversationId: activeConversationId,
      projectId: id,
      payload: { senderId: user.id, senderName: user.name, message: text },
    });
  };

  const onCreateGroup = async (values) => {
    const result = await createConversation({
      projectId: id,
      name: values.name,
      participantIds: values.participantIds || [],
    });
    reset();
    setModalOpen(false);
    const newId = result?.data?.id || result?.data?._id;
    if (newId) setSelectedConversationId(newId);
  };

  const clientOption = project ? { userId: project.clientId, name: project.clientName } : null;
  const teamOptions = project?.team || [];

  return (
    <>
      <Topbar title="Messages" subtitle={project?.title} notificationsRoute={ROUTES.ADMIN.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto flex flex-col">
        <button
          onClick={() => navigate(ROUTES.ADMIN.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <div className="flex-1 flex gap-4.5" style={{ minHeight: 520 }}>
          <Card padded={false} className="w-64 flex-shrink-0 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--color-border)">
              <span className="text-xs font-bold uppercase tracking-wide text-(--color-text-secondary)">
                Group chats
              </span>
              <button className="icon-btn" aria-label="New group chat" onClick={() => setModalOpen(true)}>
                <Icon name="plus" size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((c) => {
                const cid = c.id || c._id;
                const isActive = cid === activeConversationId;
                return (
                  <button
                    key={cid}
                    onClick={() => setSelectedConversationId(cid)}
                    className="w-full text-left px-4 py-3 flex items-center gap-2.5 border-b border-(--color-border) last:border-0"
                    style={{ background: isActive ? "var(--color-bg)" : "transparent" }}
                  >
                    <Avatar initials={c.name.slice(0, 2).toUpperCase()} size="sm" tone={c.isDefault ? "portal" : "neutral"} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-(--color-text-primary) truncate">{c.name}</div>
                      <div className="text-[11px] text-(--color-text-secondary)">
                        {c.participants?.length || 0} members
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card padded={false} className="flex-1 flex flex-col">
            {activeConversationId ? (
              <MessageThread messages={messages} currentUserId={user?.id} onSend={handleSend} isSending={isSending} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-(--color-text-secondary)">
                Select a group chat
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        title="New group chat"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(onCreateGroup)} disabled={isCreating}>
              {isCreating ? "Creating…" : "Create group"}
            </Button>
          </>
        }
      >
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onCreateGroup)}>
          <Input label="Group name" placeholder="e.g. Design Review" {...register("name", { required: true })} />
          <div>
            <label className="block text-xs font-semibold text-(--color-text-secondary) mb-1.5">Members</label>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border border-(--color-border) rounded-(--radius-md) p-3">
              {clientOption && (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={clientOption.userId} {...register("participantIds")} />
                  {clientOption.name} <span className="text-(--color-text-secondary) text-xs">(Client)</span>
                </label>
              )}
              {teamOptions.map((m) => (
                <label key={m.userId} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" value={m.userId} {...register("participantIds")} />
                  {m.name} <span className="text-(--color-text-secondary) text-xs">({m.role})</span>
                </label>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
