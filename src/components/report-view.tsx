const CONFIDENCE = [
  { re: /s[ée]curis[ée]/i, cls: "bg-safe/15 text-safe border-safe/40" },
  { re: /mod[ée]r[ée]/i, cls: "bg-moderate/15 text-moderate border-moderate/40" },
  { re: /risqu[ée]/i, cls: "bg-risky/15 text-risky border-risky/40" },
];

function inline(text: string, keyPrefix: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) => {
    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
          {chunk.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{chunk}</span>;
  });
}

export function ReportView({ report }: { report: string }) {
  const lines = report.split("\n");

  return (
    <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
      {lines.map((raw, index) => {
        const line = raw.trimEnd();
        if (!line.trim()) return <div key={index} className="h-1" />;

        const badge = CONFIDENCE.find((c) => c.re.test(line));

        if (/^#{1,6}\s/.test(line)) {
          const level = line.match(/^#+/)?.[0].length ?? 2;
          const text = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
          return (
            <h3
              key={index}
              className={
                level <= 2
                  ? "pt-3 font-display text-lg font-bold text-foreground"
                  : "pt-2 font-display text-sm font-semibold uppercase tracking-wider text-primary"
              }
            >
              {text}
            </h3>
          );
        }

        if (/^\s*[-*•]\s+/.test(line)) {
          return (
            <div key={index} className="flex gap-2 pl-1">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              <p className={badge ? `rounded border px-2 py-0.5 ${badge.cls}` : undefined}>
                {inline(line.replace(/^\s*[-*•]\s+/, ""), String(index))}
              </p>
            </div>
          );
        }

        if (/^\s*\d+[.)]\s+/.test(line)) {
          return (
            <p key={index} className="pl-1 font-medium text-foreground">
              {inline(line, String(index))}
            </p>
          );
        }

        return (
          <p key={index} className={badge ? `rounded border px-2 py-1 ${badge.cls}` : undefined}>
            {inline(line, String(index))}
          </p>
        );
      })}
    </div>
  );
}
