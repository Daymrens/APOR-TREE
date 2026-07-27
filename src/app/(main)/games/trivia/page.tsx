"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTriviaQuestions,
  submitTriviaScore,
  getTopScores,
} from "@/lib/firestore/games";
import type { TriviaQuestion, TriviaScore } from "@/lib/types";
import BackButton from "@/components/ui/BackButton";
import Skeleton from "@/components/ui/Skeleton";

type GamePhase = "loading" | "playing" | "answered" | "results";

export default function TriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [topScores, setTopScores] = useState<TriviaScore[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadQuestions = useCallback(async () => {
    setPhase("loading");
    const data = await getTriviaQuestions();
    if (data.length === 0) {
      setPhase("results");
    } else {
      setQuestions(data);
      setCurrentIndex(0);
      setScore(0);
      setCorrectCount(0);
      setSelectedAnswer(null);
      setPhase("playing");
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    const scores = await getTopScores(10);
    setTopScores(scores);
    setLeaderboardLoaded(true);
  }, []);

  useEffect(() => {
    loadQuestions();
    loadLeaderboard();
  }, [loadQuestions, loadLeaderboard]);

  const handleAnswer = (index: number) => {
    if (phase !== "playing") return;

    setSelectedAnswer(index);
    const correct = index === questions[currentIndex].correctIndex;
    setIsCorrect(correct);
    if (correct) {
      setScore((prev) => prev + questions[currentIndex].points);
      setCorrectCount((prev) => prev + 1);
    }
    setPhase("answered");

    setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setPhase("playing");
      } else {
        setPhase("results");
      }
    }, 1500);
  };

  const handleSubmitScore = async () => {
    if (!playerName.trim()) return;
    setIsSubmitting(true);
    await submitTriviaScore({
      playerName: playerName.trim(),
      score,
    });
    await loadLeaderboard();
    setIsSubmitting(false);
  };

  const handlePlayAgain = () => {
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setSelectedAnswer(null);
    setPlayerName("");
    setPhase("playing");
  };

  if (phase === "loading") {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <BackButton />
        <div className="space-y-4 mt-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <BackButton />

      {phase === "playing" && currentQuestion && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-2xl text-balete">Trivia</h1>
            <div className="glass-card rounded-full px-4 py-1.5">
              <span className="font-mono text-sm text-hibiscus tabular-nums">
                {score} pts
              </span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-1 mb-6 overflow-hidden">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-hibiscus to-mango rounded-full transition-all duration-500"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <p className="text-soft text-sm font-sans mb-4">
            Question {currentIndex + 1} of {questions.length}
          </p>

          <div
            key={currentIndex}
            className="glass-card rounded-2xl p-6 mb-6 animate-slide-up"
          >
            <h2 className="font-heading text-xl text-balete leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                className={`w-full text-left px-5 py-4 rounded-xl font-sans text-sm transition-all duration-200 border ${
                  "bg-white/50 border-white/30 text-ink hover:bg-white/70 hover:border-white/40 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-balete/10 flex items-center justify-center text-xs font-mono text-balete shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "answered" && currentQuestion && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-heading text-2xl text-balete">Trivia</h1>
            <div className="glass-card rounded-full px-4 py-1.5">
              <span className="font-mono text-sm text-hibiscus tabular-nums">
                {score} pts
              </span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-1 mb-6 overflow-hidden">
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-hibiscus to-mango rounded-full transition-all duration-500"
                style={{
                  width: `${((currentIndex + 1) / questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <p className="text-soft text-sm font-sans mb-4">
            Question {currentIndex + 1} of {questions.length}
          </p>

          <div className="glass-card rounded-2xl p-6 mb-6">
            <h2 className="font-heading text-xl text-balete leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrectAnswer = i === currentQuestion.correctIndex;
              let buttonStyle = "bg-white/50 border-white/30 text-ink";
              if (isCorrectAnswer) {
                buttonStyle =
                  "bg-gradient-to-r from-emerald-400 to-emerald-500 border-transparent text-white shadow-md shadow-emerald-400/30";
              } else if (isSelected && !isCorrect) {
                buttonStyle =
                  "bg-gradient-to-r from-hibiscus to-[#a82f5a] border-transparent text-parchment shadow-md shadow-hibiscus/30";
              }

              return (
                <button
                  key={i}
                  disabled
                  className={`w-full text-left px-5 py-4 rounded-xl font-sans text-sm transition-all duration-300 border ${buttonStyle}`}
                >
                  <span className="inline-flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                        isCorrectAnswer || (isSelected && !isCorrect)
                          ? "bg-white/20 text-white"
                          : "bg-balete/10 text-balete"
                      }`}
                    >
                      {isCorrectAnswer ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m4.5 12.75 6 6 9-13.5"
                          />
                        </svg>
                      ) : isSelected && !isCorrect ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18 18 6M6 6l12 12"
                          />
                        </svg>
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    {choice}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <p
              className={`font-sans text-sm font-medium ${
                isCorrect ? "text-emerald-600" : "text-hibiscus"
              }`}
            >
              {isCorrect
                ? `Correct! +${currentQuestion.points} points`
                : "Wrong answer!"}
            </p>
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="animate-fade-in">
          <h1 className="font-heading text-3xl text-balete mb-2 text-center animate-slide-up">
            Game Over!
          </h1>

          <div
            className="glass-card rounded-2xl p-6 mb-8 text-center animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-hibiscus/20 to-hibiscus/5 p-[3px] mb-4">
              <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-mango"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.996.178-1.778.998-1.847 1.96-.005.063-.008.127-.01.191M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.996.178 1.778.998 1.847 1.96.005.063.008.127.01.191M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a7.449 7.449 0 0 1-3.02 1.47m0 0c-.633-1.12-1.732-2.07-3.02-1.47m0 0c-1.817-.742-3.903-.824-5.784-.235M12 13.5a7.449 7.449 0 0 1-3.02 1.47"
                  />
                </svg>
              </div>
            </div>

            <p className="font-heading text-4xl text-hibiscus mb-1 tabular-nums animate-count-up">
              {score}
            </p>
            <p className="text-soft text-sm font-sans mb-3">points earned</p>
            <p className="text-balete font-sans text-sm">
              {correctCount} out of {questions.length} correct
            </p>
          </div>

          {!playerName && questions.length > 0 && (
            <div
              className="glass-card rounded-2xl p-6 mb-6 animate-slide-up"
              style={{ animationDelay: "0.2s" }}
            >
              <label
                htmlFor="playerName"
                className="block text-sm font-sans text-ink mb-2"
              >
                Enter your name for the leaderboard
              </label>
              <div className="flex gap-2">
                <input
                  id="playerName"
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 px-4 py-3 bg-white/70 backdrop-blur-sm border border-white/30 rounded-xl font-sans text-ink placeholder:text-soft/40 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all duration-200"
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {isSubmitting && (
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 text-soft font-sans text-sm">
                <div className="w-4 h-4 border-2 border-hibiscus/20 border-t-hibiscus rounded-full animate-spin" />
                Saving score...
              </div>
            </div>
          )}

          {leaderboardLoaded && topScores.length > 0 && (
            <div
              className="glass-card rounded-2xl p-6 mb-6 animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <h2 className="font-heading text-lg text-balete mb-4">
                Leaderboard
              </h2>
              <div className="space-y-2">
                {topScores.map((entry, i) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0"
                  >
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono shrink-0 ${
                        i === 0
                          ? "bg-mango/20 text-mango"
                          : i === 1
                          ? "bg-rattan/20 text-soft"
                          : i === 2
                          ? "bg-mango/10 text-mango"
                          : "bg-white/10 text-soft"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 font-sans text-sm text-ink truncate">
                      {entry.playerName}
                    </span>
                    <span className="font-mono text-sm text-hibiscus tabular-nums">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="flex gap-3 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <button
              onClick={handlePlayAgain}
              className="flex-1 py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.01] active:scale-[0.99]"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
