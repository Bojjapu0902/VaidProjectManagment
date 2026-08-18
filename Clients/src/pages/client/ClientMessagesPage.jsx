import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Topbar from "../../components/layout/Topbar";
import { Card } from "../../components/common/Card";
import Icon from "../../components/common/Icon";
import Avatar from "../../components/common/Avatar";
import MessageThread from "../../components/common/MessageThread";
import {
  useGetMessagesQuery, useSendMessageMutation, useGetProjectByIdQuery, useGetConversationsQuery,
} from "../../app/api/apiSlice";
import useAuth from "../../hooks/useAuth";
import { ROUTES } from "../../constants/routes";

export default function ClientMessagesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: project } = useGetProjectByIdQuery(id);
  const { data: conversations = [] } = useGetConversationsQuery(id, { skip: !id });
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const activeConversationId =
    selectedConversationId || conversations[0]?.id || conversations[0]?._id || null;

  const { data: messages = [] } = useGetMessagesQuery(
    { conversationId: activeConversationId, projectId: id },
    { skip: !activeConversationId }
  );
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  const handleSend = (text) => {
    if (!activeConversationId) return;
    sendMessage({
      conversationId: activeConversationId,
      projectId: id,
      payload: { senderId: user.id, senderName: user.name, message: text },
    });
  };

  return (
    <>
      <Topbar title="Messages" subtitle={project?.title} notificationsRoute={ROUTES.CLIENT.NOTIFICATIONS} />
      <div className="p-8 flex-1 overflow-y-auto flex flex-col">
        <button
          onClick={() => navigate(ROUTES.CLIENT.PROJECT_DETAIL(id))}
          className="flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-4"
        >
          <Icon name="arrow-left" size={14} /> Back to project
        </button>

        <div className="flex-1 flex gap-4.5" style={{ minHeight: 520 }}>
          {conversations.length > 1 && (
            <Card padded={false} className="w-64 flex-shrink-0 flex flex-col">
              <div className="px-4 py-3.5 border-b border-(--color-border)">
                <span className="text-xs font-bold uppercase tracking-wide text-(--color-text-secondary)">
                  Group chats
                </span>
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
          )}

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
    </>
  );
}
