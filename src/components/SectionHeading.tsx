interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  accent?: "purple" | "gold";
  align?: "left" | "center";
}

export default function SectionHeading({
  title,
  subtitle,
  accent = "gold",
  align = "center",
}: SectionHeadingProps) {
  // `accent` is retained for API compatibility; the v3 system uses a single accent.
  void accent;
  return (
    <div className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"}`}>
      {/* Eyebrow rule */}
      <div className={`flex items-center gap-3 mb-4 ${align === "center" ? "justify-center" : ""}`}>
        <div className="h-px w-8 bg-border-strong" />
        <div className="w-2 h-2 rounded-full bg-accent" />
        <div className="h-px w-8 bg-border-strong" />
      </div>

      {/* Title */}
      <h2 className="text-fluid-h2 text-ink">
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className={`mt-4 text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed ${align === "center" ? "mx-auto" : ""}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
