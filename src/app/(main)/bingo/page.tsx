"use client";

import { useState, useEffect, useCallback } from "react";
import BackButton from "@/components/ui/BackButton";
import ShareButton from "@/components/ShareButton";

const BINGO_PROMPTS = [
  "Has met Lolo Pedro",
  "Knows the secret lumpia recipe",
  "Can name all 4 branches",
  "Has attended 5+ reunions",
  "Speaks fluent Tagalog",
  "Is the eldest in their branch",
  "Has a family nickname",
  "Married into the Apor family",
  "Knows Lola's pancit recipe",
  "Has met all 4 branches",
  "Can sing the family song",
  "Was born in the Philippines",
  "Has the same birth month as Lolo",
  "Has a family photo from 20+ years ago",
  "Knows the family motto",
  "Has cooked for 20+ people",
  "Is a first-time reunion attendee",
  "Can name Lolo's siblings",
  "Has a relative in the military",
  "Knows the origin of the Apor name",
  "Has visited the ancestral home",
  "Can do the Tinikling dance",
  "Has a family member in healthcare",
  "Knows all the cousins' names",
  "Has brought a dish to share",
];

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function BingoPage() {
  const [board, setBoard] = useState<string[][]>(() => {
    const shuffled = shuffle(BINGO_PROMPTS);
    const rows: string[][] = [];
    for (let i = 0; i < 5; i++) {
      rows.push(shuffled.slice(i * 5, i * 5 + 5));
    }
    return rows;
  });
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [won, setWon] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const toggleMark = (text: string) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(text)) {
        next.delete(text);
      } else {
        next.add(text);
      }
      return next;
    });
  };

  const checkWin = useCallback((markedSet: Set<string>) => {
    const marks = new Set(markedSet);

    // Check rows
    for (let r = 0; r < 5; r++) {
      if (board[r].every((cell) => marks.has(cell))) return true;
    }
    // Check columns
    for (let c = 0; c < 5; c++) {
      if (board.every((row) => marks.has(row[c]))) return true;
    }
    // Check diagonals
    if ([0, 1, 2, 3, 4].every((i) => marks.has(board[i][i]))) return true;
    if ([0, 1, 2, 3, 4].every((i) => marks.has(board[i][4 - i]))) return true;
    return false;
  }, [board]);

  useEffect(() => {
    if (marked.size > 0 && checkWin(marked)) {
      setWon(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [marked, checkWin]);

  function handleNewBoard() {
    const shuffled = shuffle(BINGO_PROMPTS);
    const rows: string[][] = [];
    for (let i = 0; i < 5; i++) {
      rows.push(shuffled.slice(i * 5, i * 5 + 5));
    }
    setBoard(rows);
    setMarked(new Set());
    setWon(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <BackButton />
        <div className="flex gap-2">
          <button
            onClick={handleNewBoard}
            className="px-4 py-2 bg-rattan/10 text-ink rounded-xl font-sans text-sm hover:bg-rattan/20 transition-colors"
          >
            New Card
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-balete text-parchment rounded-xl font-sans text-sm hover:bg-balete/90 transition-colors"
          >
            Print
          </button>
        </div>
      </div>

      <div className="text-center mb-6 animate-fade-in">
        <h1 className="font-heading text-3xl text-balete mb-1">Icebreaker Bingo</h1>
        <p className="text-soft font-sans text-sm">Find relatives who match each square. First to get a line wins!</p>
      </div>

      {name && (
        <div className="mb-4 p-3 clay rounded-xl text-center animate-fade-in">
          <p className="text-soft text-sm font-sans">Playing as <span className="font-medium text-ink">{name}</span></p>
        </div>
      )}

      <div className="clay rounded-2xl p-4 mb-6 animate-fade-in">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 input rounded-xl font-sans text-ink focus:outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-5 gap-1.5 mb-6" role="grid" aria-label="Bingo board">
        {["B", "I", "N", "G", "O"].map((letter, colIndex) => (
          <div key={letter} className="text-center mb-2">
            <div className="text-xs font-mono font-bold text-hibiscus">{letter}</div>
          </div>
        ))}
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isMarked = marked.has(cell);
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => toggleMark(cell)}
                disabled={won}
                className={`aspect-square rounded-xl font-sans text-xs leading-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-hibiscus/50 ${
                  isMarked
                    ? "bg-gradient-to-br from-hibiscus to-[#a82f5a] text-parchment shadow-md shadow-hibiscus/25"
                    : "clay text-ink"
                } ${won ? "opacity-75 cursor-not-allowed" : ""}`}
                style={{ fontSize: "0.7rem" }}
              >
                {cell}
                {isMarked && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-parchment/20 flex items-center justify-center">
                    <svg className="w-3 h-3 text-parchment" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {won && (
        <div className="clay rounded-2xl p-6 text-center animate-fade-in animate-bounce">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl text-balete mb-2">BINGO!</h2>
          <p className="text-soft font-sans mb-4">Congratulations, {name || "Player"}! You got a line!</p>
          <button
            onClick={handleNewBoard}
            className="px-6 py-3 bg-rattan/10 text-ink rounded-xl font-sans font-medium text-sm hover:bg-rattan/20 transition-colors"
          >
            Play Again
          </button>
        </div>
      )}

      {!name && !won && (
        <p className="text-center text-soft/60 text-xs font-sans mt-4">
          Enter your name above to start playing
        </p>
      )}

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                animationDuration: `${0.5 + Math.random() * 1}s`,
                animationDelay: `${Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

