import clsx from "clsx";

export default function Table({ columns, data, onRowClick, emptyMessage = "No records found" }) {
  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-(--color-text-secondary)">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--color-border)">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide py-3 px-4"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                "border-b border-(--color-border) last:border-0",
                idx % 2 === 1 && "bg-(--color-bg)/40",
                onRowClick && "cursor-pointer hover:bg-(--color-bg)"
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-(--color-text-primary)">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
