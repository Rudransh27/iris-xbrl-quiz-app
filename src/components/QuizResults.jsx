// src/components/QuizResults.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Define modern, thematic colors
// You can customize these to match your application's design system
const CHART_COLORS = {
  correct: '#00C49F', // A calming green
  incorrect: '#FFBB28', // A warm, soft orange/yellow
  // Consider using CSS variables if you have a robust theming system:
  // correct: 'var(--correct-color, #00C49F)',
  // incorrect: 'var(--incorrect-color, #FFBB28)',
};

const QuizResults = ({ score, totalQuestions, onReturn }) => {
  const { width, height } = useWindowSize();

  const correctAnswers = score;
  const incorrectAnswers = totalQuestions - score;
  const percentageCorrect = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // Data for the pie chart
  const data = [
    { name: 'Correct', value: correctAnswers },
    { name: 'Incorrect', value: incorrectAnswers },
  ];

  // Only show confetti for a perfect score (or adjust as desired)
  const showConfetti = score > 0 && score === totalQuestions && totalQuestions > 0;

  // Custom label for the center of the donut chart
  const renderCustomizedLabel = ({ cx, cy }) => {
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '24px', fontWeight: 'bold', fill: 'var(--text-color, #333)' }}>
        {`${percentageCorrect.toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="quiz-complete-container">
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

      <div className="quiz-complete-card">
        <h2>🎉 Quest Complete!</h2>
        <p className="results-summary">
          You answered {score} out of {totalQuestions} questions correctly.
        </p>

        {totalQuestions > 0 ? ( // Only render chart if there are questions
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70} // Make it a donut chart
                outerRadius={100} // Outer radius
                fill="#8884d8"
                dataKey="value"
                // No individual slice labels, using custom central label instead
                // labelLine={false}
                // label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                animationBegin={0}
                animationDuration={800} // Subtle animation on load
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Correct' ? CHART_COLORS.correct : CHART_COLORS.incorrect}
                    // Add subtle hover effect (optional, requires additional state/handler for more complex effects)
                    style={{ transition: 'all 0.3s ease-out' }}
                  />
                ))}
                {/* Central Label for Percentage */}
                <Label
                  value={`${percentageCorrect.toFixed(0)}%`}
                  position="center"
                  fill="var(--text-color)" // Use text color from your theme
                  style={{
                    fontSize: '2rem', // Larger font for the central percentage
                    fontWeight: 'bold',
                    fontFamily: 'inherit'
                  }}
                />
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} ${name} answers`, name]} /> {/* Formatted tooltip */}
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ paddingTop: '20px' }} // Space below chart
                payload={
                  data.map((item, index) => ({
                    id: item.name,
                    value: `${item.name} (${(item.value / totalQuestions * 100).toFixed(0)}%)`,
                    type: 'square',
                    color: item.name === 'Correct' ? CHART_COLORS.correct : CHART_COLORS.incorrect,
                  }))
                }
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="no-questions-message">No graded questions were found in this quest.</p>
        )}

        <button className="complete-screen-button" onClick={onReturn}>
          Return to Trail
        </button>
      </div>
    </div>
  );
};

export default QuizResults;