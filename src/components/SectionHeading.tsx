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
  return (
    <div className={`mb-12 md:mb-16 ${align === "center" ? "text-center" : "text-left"}`}>
      {/* Decorative line */}
      <div className={`flex items-center gap-3 mb-4 ${align === "center" ? "justify-center" : ""}`}>
        <div className={`h-px w-8 ${accent === "gold" ? "bg-shine-gold" : "bg-shine-purple"}`} />
        <div className={`w-2 h-2 rounded-full ${accent === "gold" ? "bg-shine-gold" : "bg-shine-purple"} animate-pulse`} />
        <div className={`h-px w-8 ${accent === "gold" ? "bg-shine-gold" : "bg-shine-purple"}`} />
      </div>

      {/* Title */}
      <h2
        className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight ${
          accent === "gold" ? "gradient-text" : "gradient-text-purple"
        }`}
        style={{ fontFamily: 'var(--font-outfit), Outfit, sans-serif' }}
      >
        {title}
      </h2>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-shine-muted max-w-2xl mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
