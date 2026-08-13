"use client";

import { useEffect, useState } from "react";
import type { FamilyMember } from "@/lib/types";
import { BRANCH_COLORS } from "@/lib/branches";

interface TreeLinesProps {
  members: FamilyMember[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface Line {
  kind: "spouse" | "parent-child";
  color: string;
  d: string;
}

interface CardBox {
  cx: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export default function TreeLines({ members, containerRef }: TreeLinesProps) {
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const compute = () => {
      const cRect = container.getBoundingClientRect();
      const boxes = new Map<string, CardBox>();

      container.querySelectorAll<HTMLElement>("[data-member-id]").forEach((el) => {
        const id = el.dataset.memberId;
        if (!id) return;
        const r = el.getBoundingClientRect();
        boxes.set(id, {
          cx: r.left - cRect.left + r.width / 2,
          top: r.top - cRect.top,
          bottom: r.bottom - cRect.top,
          left: r.left - cRect.left,
          right: r.right - cRect.left,
        });
      });

      const next: Line[] = [];

      members.forEach((m) => {
        if (!m.spouseId || m.id >= m.spouseId) return;
        const a = boxes.get(m.id);
        const b = boxes.get(m.spouseId);
        if (!a || !b) return;
        const y = a.top + (a.bottom - a.top) / 2;
        const color = BRANCH_COLORS[m.branch] ?? BRANCH_COLORS["Unassigned"];
        next.push({
          kind: "spouse",
          color,
          d: `M ${a.right} ${y} L ${b.left} ${y}`,
        });
      });

      members.forEach((child) => {
        const c = boxes.get(child.id);
        if (!c) return;
        child.parentIds.forEach((parentId) => {
          const p = boxes.get(parentId);
          if (!p) return;
          const color = BRANCH_COLORS[child.branch] ?? BRANCH_COLORS["Unassigned"];
          const midY = p.bottom + (c.top - p.bottom) / 2;
          next.push({
            kind: "parent-child",
            color,
            d: `M ${p.cx} ${p.bottom} L ${p.cx} ${midY} L ${c.cx} ${midY} L ${c.cx} ${c.top}`,
          });
        });
      });

      setLines(next);
      setSize({ width: cRect.width, height: cRect.height });
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [members, containerRef]);

  if (size.width === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      width={size.width}
      height={size.height}
    >
      {lines.map((line, i) => (
        <path
          key={i}
          d={line.d}
          fill="none"
          stroke={line.color}
          strokeWidth={line.kind === "spouse" ? 1.5 : 1}
          strokeOpacity={line.kind === "spouse" ? 0.55 : 0.35}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
