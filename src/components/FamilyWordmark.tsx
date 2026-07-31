export default function FamilyWordmark({
  light = false,
  className = "",
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <h1
      className={`kinetic-hero ${light ? "text-parchment" : "text-ink"} ${className}`}
      aria-label="APOR"
    >
      APOR
    </h1>
  );
}
