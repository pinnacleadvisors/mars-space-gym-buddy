import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassCardProps {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryName: string | null;
  onClick: () => void;
  className?: string;
}

export const ClassCard = ({
  id,
  name,
  description,
  imageUrl,
  categoryName,
  onClick,
  className,
}: ClassCardProps) => {
  // Fallback gradient if no image
  const backgroundImage = imageUrl || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-3xl shadow-lg cursor-pointer",
        "transition-shadow duration-300 ease-out",
        "hover:shadow-xl",
        // Ensure aspect ratio is maintained
        "aspect-[4/5] min-h-[400px]",
        className
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Background Image - Full bleed, sharp in base state */}
      <div
        className={cn(
          "absolute inset-0 w-full h-full",
          "transition-transform duration-300 ease-out",
          "md:group-hover:scale-[1.02]"
        )}
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : backgroundImage,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Gradient Overlay - Blurred and darkened on hover only */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b",
          "from-black/0 via-black/0 to-black/0",
          "md:group-hover:from-black/20 md:group-hover:via-black/40 md:group-hover:to-black/70",
          "transition-all duration-300 ease-out",
          "backdrop-blur-0 md:group-hover:backdrop-blur-[3px]",
          "opacity-0 md:group-hover:opacity-100",
          "z-[5]"
        )}
      />

      {/* Content Container */}
      <div className="relative h-full flex flex-col justify-between p-6 z-10">
        {/* Category Tag - Top Left (above overlay) */}
        {categoryName && (
          <div className="absolute top-6 left-6 z-30">
            <span
              className={cn(
                "inline-block px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider",
                "bg-black/70 backdrop-blur-sm text-white",
                "transition-opacity duration-300"
              )}
            >
              {categoryName}
            </span>
          </div>
        )}

        {/* Bottom Section - Title, Description */}
        <div className="mt-auto space-y-4 pb-2">
          {/* Title */}
          <h3
            className={cn(
              "text-3xl md:text-4xl font-bold text-white",
              "transition-all duration-300 ease-out",
              "translate-y-0 opacity-100"
            )}
          >
            {name}
          </h3>

          {/* Description - Hidden by default, shown on hover with slide-up */}
          {description && (
            <p
              className={cn(
                "text-white text-base font-medium leading-relaxed",
                "transition-all duration-300 ease-out",
                "opacity-0 translate-y-[10px] max-w-[85%]",
                "md:group-hover:opacity-100 md:group-hover:translate-y-0",
                // Mobile: always hidden
                "hidden md:block"
              )}
            >
              {description}
            </p>
          )}
        </div>

        {/* Arrow Button - Bottom Right (absolute positioning) */}
        <div className="absolute bottom-6 right-6 z-30">
          <div
            className={cn(
              "w-12 h-12 rounded-full border-2 border-white",
              "flex items-center justify-center",
              "transition-all duration-300 ease-out",
              "opacity-90 md:group-hover:opacity-100",
              "md:group-hover:shadow-lg md:group-hover:shadow-white/30"
            )}
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

