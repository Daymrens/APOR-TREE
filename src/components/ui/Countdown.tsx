"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(target: Date): TimeLeft {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({ targetDate }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) return null;

  const isPast = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isPast) {
    return (
      <div className="text-center glass-card rounded-2xl p-6">
        <p className="font-heading text-2xl text-hibiscus mb-1">The reunion is happening!</p>
        <p className="text-soft text-sm font-sans">We hope to see you there.</p>
      </div>
    );
  }

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3 justify-center">
      {blocks.map(({ label, value }) => (
        <div key={label} className="glass-card rounded-xl p-3 min-w-[64px] text-center">
          <p className="font-mono text-2xl text-hibiscus tabular-nums">
            {String(value).padStart(2, "0")}
          </p>
          <p className="text-soft text-xs font-sans mt-1">{label}</p>
        </div>
      ))}
    </div>
  );
}
