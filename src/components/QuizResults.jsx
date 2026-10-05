// src/components/QuizResults.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useThemeTokens } from './ui';
import './QuizResults.css';

const QuizResults = ({ score, totalQuestions, onReturn, xp = 0, sandboxScore = null, sandboxMaxScore = null }) => {
  const { width, height } = useWindowSize();
  // Chart / confetti colours resolved from the theme tokens (recharts and
  // react-confetti take colour strings, not CSS variables).
  const tk = useThemeTokens();
  const CHART_COLORS = { correct: tk['ui-success'], incorrect: tk['ui-danger'] };

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

  // Presentation only: tone of the summary callout (perfect / partial / none correct).
  const hasGradedData = totalQuestions > 0 || hasSandboxData;
  const pointsEarned = totalQuestions > 0 ? score : (hasSandboxData ? sandboxScore : 0);
  const summaryTone = !hasGradedData ? 'accent' : showConfetti ? 'success' : pointsEarned > 0 ? 'warning' : 'danger';

  return (
    <div className="quiz-results-viewport-wrapper">

      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={250}
          gravity={0.12}
          colors={[tk['cat-amber'], tk['cat-sky'], tk['cat-green'], tk['cat-rose'], tk['ui-accent']]}
        />
      )}

      <div className="quiz-results-card-housing ui-card">

        {/* ================= STAGE STATUS HEADER ================= */}
        <h2 className="quiz-results-main-title">
          {showConfetti ? '🎉 PERFECT SCORE! 🎉' : 'STAGE COMPLETE!'}
        </h2>

        <p className={`quiz-results-subtext-summary ui-callout ui-callout--${summaryTone}`}>
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

        {/* ================= STAT STRIP (score · accuracy · XP) ================= */}
        {(hasGradedData || xp > 0) && (
          <div className="quiz-results-stat-strip ui-stat-strip">
            {totalQuestions > 0 ? (
              <>
                <div className="ui-stat">
                  <span className="ui-stat__value">{score}/{totalQuestions}</span>
                  <span className="ui-stat__label">Correct</span>
                </div>
                <div className="ui-stat">
                  <span className="ui-stat__value">{percentageCorrect.toFixed(0)}%</span>
                  <span className="ui-stat__label">Accuracy</span>
                </div>
              </>
            ) : hasSandboxData ? (
              <>
                <div className="ui-stat">
                  <span className="ui-stat__value">{sandboxScore}/{sandboxMaxScore}</span>
                  <span className="ui-stat__label">Score</span>
                </div>
                <div className="ui-stat">
                  <span className="ui-stat__value">{sandboxPercentage}%</span>
                  <span className="ui-stat__label">MCQ Accuracy</span>
                </div>
              </>
            ) : null}
            {xp > 0 && (
              <div className="ui-stat xp-gain-badge-capsule">
                <span className="ui-stat__value xp-gain-text">+{xp}</span>
                <span className="ui-stat__label">Lightyears earned</span>
              </div>
            )}
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
                    backgroundColor: tk['ui-surface'],
                    border: `1px solid ${tk['ui-border']}`,
                    borderRadius: '12px',
                    color: tk['ui-text'],
                    padding: '8px 12px',
                    fontSize: '13px',
                    fontWeight: '600',
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
            <p className="sandbox-text-hint">Written responses saved for instructor review.</p>
          </div>
        ) : (
          <p className="quiz-results-empty-notice ui-small">No graded records mapped in this segment block.</p>
        )}

        {/* ================= LOWER CHUNKY CONTROLS COCKPIT BUTTON ================= */}
        <button type="button" className="quiz-results-return-trigger-btn ui-btn ui-btn--primary ui-btn--lg ui-btn--block" onClick={onReturn}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
