import Icon from "../common/Icon";
import Avatar from "../common/Avatar";
import Button from "../common/Button";

export function ReviewQueueList({ approvals = [], onReview }) {
  if (approvals.length === 0) {
    return <p className="text-sm text-(--color-text-secondary) py-6 text-center">Nothing needs your review right now.</p>;
  }
  return (
    <div>
      {approvals.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
          <div className="w-8 h-8 rounded-(--radius-sm) bg-(--color-amber-light) text-(--color-amber-dark) flex items-center justify-center flex-shrink-0">
            <Icon name="clipboard-check" size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-(--color-text-primary) truncate">
              {item.documentName}
            </div>
            <div className="text-[11.5px] text-(--color-text-secondary) mt-0.5">
              Uploaded {item.requestedAt}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={() => onReview?.(item)}>
            Review
          </Button>
        </div>
      ))}
    </div>
  );
}

export function DocumentRow({ doc, onView, onDownload }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-(--color-border) last:border-0">
      <div className="w-[34px] h-[34px] rounded-(--radius-sm) bg-(--color-portal-primary-light) text-(--color-portal-primary-on-tint) flex items-center justify-center flex-shrink-0">
        <Icon name={doc.category === "photo" ? "photo" : doc.category === "drawing" ? "blueprint" : "file-text"} size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-(--color-text-primary) truncate">{doc.name}</div>
        <div className="text-[11.5px] text-(--color-text-secondary)">
          {doc.fileType?.toUpperCase()} · {doc.fileSize} · {doc.createdAt}
        </div>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button className="text-(--color-text-secondary)" onClick={() => onView?.(doc)} aria-label="View">
          <Icon name="eye" size={16} />
        </button>
        <button className="text-(--color-text-secondary)" onClick={() => onDownload?.(doc)} aria-label="Download">
          <Icon name="download" size={16} />
        </button>
      </div>
    </div>
  );
}

export function TeamMemberRow({ member }) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <Avatar initials={member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)} size="sm" />
      <div>
        <div className="text-[13px] font-semibold text-(--color-text-primary)">{member.name}</div>
        <div className="text-[11.5px] text-(--color-text-secondary)">{member.role}</div>
      </div>
    </div>
  );
}
