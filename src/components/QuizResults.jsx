// src/components/QuizResults.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import './QuizResults.css';

// 🎯 Vibrant Gamified Contrast Palette Mappings
const CHART_COLORS = {
  correct: '#58cc02',   /* Bright Active Green */
  incorrect: '#ff4b4b', /* Signature Coral Crimson */
};

const QuizResults = ({ score, totalQuestions, onReturn, xp = 0, sandboxScore = null, sandboxMaxScore = null }) => {
  const { width, height } = useWindowSize();

  const correctAnswers = score;
  const incorrectAnswers = totalQuestions - score;
  const percentageCorrect = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  const hasSandboxData = sandboxScore !== null && sandboxMaxScore !== null && sandboxMaxScore > 0;
  const sandboxPercentage = hasSandboxData ? Math.round((sandboxScore / sandboxMaxScore) * 100) : 0;

  const data = [
    { name: 'Correct', value: correctAnswers },
    { name: 'Incorrect', value: incorrectAnswers },
  ];

  const showConfetti = (score > 0 && score === totalQuestions && totalQuestions > 0) ||
                       (hasSandboxData && sandboxScore > 0 && sandboxScore === sandboxMaxScore);

  return (
    <div className="quiz-results-viewport-wrapper">

      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={250}
          gravity={0.12}
          colors={['#ffbe0b', '#3a86ff', '#58cc02', '#ff006e']}
        />
      )}

      <div className="quiz-results-card-housing">

        {/* ================= STAGE STATUS HEADER ================= */}
        <h2 className="quiz-results-main-title">
          {showConfetti ? '🎉 PERFECT SCORE! 🎉' : 'STAGE COMPLETE!'}
        </h2>

        <p className="quiz-results-subtext-summary">
          {totalQuestions > 0 ? (
            <>You successfully cleared <span className="score-highlight-node">{score}</span> out of{' '}
            <span className="total-highlight-node">{totalQuestions}</span> challenge units correctly.</>
          ) : hasSandboxData ? (
            <>You scored <span className="score-highlight-node">{sandboxScore}</span> out of{' '}
            <span className="total-highlight-node">{sandboxMaxScore}</span> on the simulation challenge.</>
          ) : (
            'Stage cleared successfully.'
          )}
        </p>

        {/* ================= XP TACTILE BADGE ================= */}
        {xp > 0 && (
          <div className="xp-gain-badge-capsule">
            <span className="xp-gain-text">+{xp} Plasma EARNED</span>
          </div>
        )}

        {/* ================= METRICS DATA RING VISUALIZER ================= */}
        {totalQuestions > 0 ? (
          <div className="quiz-results-chart-frame">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={92}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={700}
                  animationEasing="ease-out"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.name === 'Correct' ? CHART_COLORS.correct : CHART_COLORS.incorrect}
                    />
                  ))}
                  <Label
                    value={`${percentageCorrect.toFixed(0)}%`}
                    position="center"
                    className="quiz-chart-center-metric"
                  />
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} ${name} blocks`, name]}
                  contentStyle={{
                    backgroundColor: '#182730',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    fontFamily: '"Nunito", system-ui, sans-serif',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconSize={10}
                  wrapperStyle={{ paddingTop: '15px' }}
                  payload={data.map((item) => ({
                    id: item.name,
                    value: `${item.name} (${totalQuestions > 0 ? ((item.value / totalQuestions) * 100).toFixed(0) : 0}%)`,
                    type: 'circle',
                    color: item.name === 'Correct' ? CHART_COLORS.correct : CHART_COLORS.incorrect,
                  }))}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : hasSandboxData ? (
          <div className="quiz-results-sandbox-score-block">
            <div className="sandbox-score-ring-display">
              <span className="sandbox-score-numerator">{sandboxScore}</span>
              <span className="sandbox-score-separator">/</span>
              <span className="sandbox-score-denominator">{sandboxMaxScore}</span>
            </div>
            <p className="sandbox-accuracy-label">{sandboxPercentage}% MCQ Accuracy</p>
            <p className="sandbox-text-hint">Written responses saved for instructor review.</p>
          </div>
        ) : (
          <p className="quiz-results-empty-notice">No graded records mapped in this segment block.</p>
        )}

        {/* ================= LOWER CHUNKY CONTROLS COCKPIT BUTTON ================= */}
        <button type="button" className="quiz-results-return-trigger-btn" onClick={onReturn}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
