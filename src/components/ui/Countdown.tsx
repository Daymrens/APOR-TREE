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

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const isPast = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Mins", value: timeLeft.minutes },
    { label: "Secs", value: timeLeft.seconds },
  ];

  return (
    <div className="card p-5 animate-fade-in">
      {isPast ? (
        <div className="text-center py-4">
          <p className="font-heading text-2xl text-hibiscus mb-1">The reunion has started!</p>
          <p className="text-soft text-sm font-sans">Welcome everyone!</p>
        </div>
      ) : (
        <>
          <p className="font-heading text-xl text-balete text-center mb-3">Countdown to Reunion</p>
          <div className="flex justify-center gap-2 sm:gap-3">
            {blocks.map((block) => (
              <div key={block.label} className="card-inset rounded-xl px-3 py-2.5 min-w-[60px] text-center">
                <p className="font-mono text-2xl text-hibiscus tabular-nums">
                  {String(block.value).padStart(2, "0")}
                </p>
                <p className="text-soft text-xs font-sans mt-1">{block.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}