import { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { formatRelativeTime } from "../../utils/format";

export default function MessageThread({ messages = [], currentUserId, onSend, isSending = false }) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!draft.trim()) return;
    onSend?.(draft.trim());
    setDraft("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg) => {
          const isOwn = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
              <Avatar
                initials={msg.senderName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                size="sm"
                tone={isOwn ? "portal" : "neutral"}
              />
              <div className={`max-w-[70%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className="rounded-(--radius-md) px-3.5 py-2.5 text-sm"
                  style={{
                    background: isOwn ? "var(--color-portal-primary)" : "var(--color-bg)",
                    color: isOwn ? "#fff" : "var(--color-text-primary)",
                  }}
                >
                  {msg.message}
                </div>
                <span className="text-[10.5px] text-(--color-text-tertiary) mt-1 px-1">
                  {msg.senderName} · {formatRelativeTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-(--color-border) p-4 flex items-center gap-2.5">
        <button className="icon-btn flex-shrink-0" aria-label="Attach file">
          <Icon name="paperclip" size={16} />
        </button>
        <input
          className="input-field flex-1"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="icon-btn flex-shrink-0"
          style={{ background: "var(--color-portal-primary)", color: "#fff", borderColor: "var(--color-portal-primary)" }}
          onClick={handleSend}
          disabled={isSending}
          aria-label="Send message"
        >
          <Icon name="send" size={15} />
        </button>
      </div>
    </div>
  );
}
