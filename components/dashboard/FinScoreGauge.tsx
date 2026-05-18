"use client";

import { motion } from "framer-motion";

export function FinScoreGauge({ score, analysis }: { score: number; analysis: string }) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c - (c * Math.max(0, Math.min(100, score))) / 100;

  const getScoreColor = (s: number) => {
    if (s >= 80) return { from: "#10B981", to: "#059669" };
    if (s >= 60) return { from: "#6366F1", to: "#8B5CF6" };
    if (s >= 40) return { from: "#F59E0B", to: "#D97706" };
    return { from: "#EF4444", to: "#DC2626" };
  };

  const colors = getScoreColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col"
    >
      <div className="text-sm font-semibold tracking-wide text-white">FinScore</div>
      <motion.div className="flex flex-1 flex-col items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          <svg className="h-[168px] w-[168px] -rotate-90" viewBox="0 0 140 140">
            <defs>
              <linearGradient id="finScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={colors.from} />
                <stop offset="100%" stopColor={colors.to} />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <circle cx="70" cy="70" r={r} stroke="#1a2030" strokeWidth="10" fill="transparent" />
            <motion.circle
              cx="70"
              cy="70"
              r={r}
              stroke="url(#finScoreGradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              filter="url(#glow)"
              style={{ filter: "drop-shadow(0 0 8px " + colors.from + ")" }}
            />
          </svg>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute flex flex-col items-center"
          >
            <motion.div
              key={score}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-light tracking-tight text-white"
            >
              {score}
            </motion.div>
            <div className="text-xs font-medium text-[var(--color-text-secondary)]">/100</div>
          </motion.div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-4 max-h-[200px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-1.5 text-xs font-semibold uppercase tracking-wider gradient-text"
        >
          AI Analizi
        </motion.div>
        <p className="max-h-[250px] overflow-y-auto whitespace-pre-line break-words text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {analysis}
        </p>
      </motion.div>
    </motion.div>
  );
}
