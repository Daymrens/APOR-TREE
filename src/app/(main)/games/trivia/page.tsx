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

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  function handleAnswer(answerIndex: number) {
    if (selectedAnswer !== null) return;
    const correct = answerIndex === currentQuestion.correctIndex;
    setSelectedAnswer(answerIndex);
    setIsCorrect(correct);
    if (correct) {
      setScore((s) => s + currentQuestion.points);
      setCorrectCount((c) => c + 1);
    }
    setPhase("answered");
  }

  function handleNext() {
    if (isLastQuestion) {
      setPhase("results");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setIsCorrect(false);
      setPhase("playing");
    }
  }

  async function handleSubmitScore(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitTriviaScore({
        playerName: playerName.trim(),
        score,
        correctCount,
        totalQuestions: questions.length,
      });
      setPlayerName("");
      loadLeaderboard();
    } catch (err) {
      if (process.env.NODE_ENV === "development") console.error("Failed to submit score:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePlayAgain() {
    loadQuestions();
  }

  if (phase === "loading") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton />
        <div className="text-center py-16 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-mango/15 mb-4">
            <svg className="w-8 h-8 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V6.75a.75.75 0 0 1-.75.75H5.25a.75.75 0 0 0-.75.75v8.25c0 .414.336.75.75.75h12a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 1-.75-.75" />
            </svg>
          </div>
          <p className="text-soft font-sans">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton />
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-hibiscus/20 to-hibiscus/5 p-[3px] mb-6 animate-scale-in">
            <div className="w-full h-full rounded-full bg-parchment flex items-center justify-center">
              <svg className="w-10 h-10 text-hibiscus" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043A3.745 3.745 0 0 1 4.593 15.068a3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
          </div>
          <h1 className="font-heading text-3xl text-balete mb-2">Quiz Complete!</h1>
          <p className="text-soft font-sans mb-8">You got <span className="font-mono text-hibiscus font-bold text-xl">{correctCount}</span> out of <span className="font-mono text-balete font-bold text-xl">{questions.length}</span> correct.</p>

          <div className="clay rounded-2xl p-6 mb-6 animate-slide-up">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-mono text-3xl text-hibiscus tabular-nums">{score}</p>
                <p className="text-soft text-sm font-sans mt-1">Total Score</p>
              </div>
              <div>
                <p className="font-mono text-3xl text-mango tabular-nums">{correctCount}</p>
                <p className="text-soft text-sm font-sans mt-1">Correct</p>
              </div>
              <div>
                <p className="font-mono text-3xl text-balete tabular-nums">{questions.length - correctCount}</p>
                <p className="text-soft text-sm font-sans mt-1">Missed</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitScore} className="mb-6 animate-slide-up">
            <label htmlFor="player-name" className="block text-sm font-sans text-ink mb-2">Enter your name for the leaderboard</label>
            <div className="flex gap-2">
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={30}
                placeholder="Your name"
                className="flex-1 px-4 py-3 bg-white/50 border border-rattan/30 rounded-xl font-sans text-ink focus:outline-none focus:ring-2 focus:ring-hibiscus/40 focus:border-transparent transition-all"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting || !playerName.trim()}
                className="px-6 py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                {isSubmitting ? "Saving..." : "Save Score"}
              </button>
            </div>
          </form>

          <button
            onClick={handlePlayAgain}
            className="w-full py-3 rounded-xl bg-rattan/10 text-ink font-sans font-medium text-sm hover:bg-rattan/20 transition-colors mb-6"
          >
            Play Again
          </button>

          <div className="clay rounded-xl p-4 animate-fade-in">
            <h3 className="font-heading text-lg text-balete mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-mango" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
              Leaderboard
            </h3>
            {!leaderboardLoaded ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : topScores.length === 0 ? (
              <p className="text-soft text-sm font-sans text-center py-4">No scores yet. Be the first!</p>
            ) : (
              <ol className="space-y-2">
                {topScores.map((entry, index) => (
                  <li key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/30 transition-colors hover:bg-white/50">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold tabular-nums ${
                      index === 0 ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white" :
                      index === 1 ? "bg-gradient-to-br from-gray-400 to-gray-600 text-white" :
                      index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white" :
                      "bg-rattan/20 text-soft"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-sans text-sm text-ink flex-1 truncate">{entry.playerName}</span>
                    <span className="font-mono text-sm text-hibiscus tabular-nums">{entry.score} pts</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackButton />
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <h1 className="font-heading text-2xl text-balete">Family Trivia</h1>
          <span className="font-mono text-sm text-hibiscus tabular-nums">{score} pts</span>
        </div>
        <p className="text-soft text-sm font-sans">Question {currentIndex + 1} of {questions.length}</p>
        <div className="w-full bg-rattan/20 rounded-full h-2 mt-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-hibiscus to-mango h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="clay rounded-2xl p-6 animate-slide-up">
        <h2 className="font-heading text-xl text-balete mb-6 text-center">{currentQuestion.question}</h2>
        <div className="space-y-3">
          {currentQuestion.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
              className={`w-full py-4 px-4 rounded-xl text-left font-sans text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-hibiscus/40 ${
                selectedAnswer !== null
                  ? index === currentQuestion.correctIndex
                    ? "bg-green-500/20 border-2 border-green-500 text-green-700"
                    : index === selectedAnswer
                    ? "bg-red-500/20 border-2 border-red-500 text-red-700"
                    : "bg-white/30 text-soft/50"
                  : "bg-white/50 border border-rattan/30 text-ink hover:bg-white/70 hover:border-hibiscus/30"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold tabular-nums flex-shrink-0 ${
                  selectedAnswer !== null
                    ? index === currentQuestion.correctIndex
                      ? "bg-green-500 text-white"
                      : index === selectedAnswer
                      ? "bg-red-500 text-white"
                      : "bg-rattan/20 text-soft"
                    : "bg-hibiscus/10 text-hibiscus"
                }`}>
                  {String.fromCharCode(65 + index)}
                </span>
                {choice}
              </span>
              {selectedAnswer !== null && index === currentQuestion.correctIndex && (
                <svg className="w-5 h-5 text-green-500 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              )}
              {selectedAnswer !== null && index === selectedAnswer && index !== currentQuestion.correctIndex && (
                <svg className="w-5 h-5 text-red-500 ml-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {phase === "answered" && (
          <div className="mt-6 pt-4 border-t border-rattan/20 animate-fade-in">
            <button
              onClick={handleNext}
              className="w-full py-3 bg-gradient-to-r from-hibiscus to-[#a82f5a] text-parchment rounded-xl font-sans font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-hibiscus/25 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLastQuestion ? "See Results" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
