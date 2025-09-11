// src/components/QuizResults.jsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Label } from 'recharts';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import './QuizResults.css'; // Import the new CSS file

// Define modern, thematic colors
const CHART_COLORS = {
  correct: '#4CAF50', // A vibrant green
  incorrect: '#FF5733', // A warm, energetic red-orange
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

  // Only show confetti for a perfect score
  const showConfetti = score > 0 && score === totalQuestions && totalQuestions > 0;

  return (
    <div className="quiz-complete-container">
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.15} // Softer confetti fall
          colors={['#FFD700', '#FF4500', '#1E90FF', '#32CD32']} // Gold, OrangeRed, DodgerBlue, LimeGreen
        />
      )}

      <div className="quiz-complete-card modern-card-design">
        <h2 className="results-title">
          {showConfetti ? '🎉 Perfect Score! 🎉' : 'Quest Complete!'}
        </h2>
        <p className="results-summary">
          You answered <span className="score-highlight">{score}</span> out of{' '}
          <span className="total-highlight">{totalQuestions}</span> questions correctly.
        </p>

        {totalQuestions > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                  stroke="none" // Remove stroke for a cleaner look
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
                    className="chart-center-label"
                  />
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} ${name} answers`, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '10px',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: '20px', color: 'var(--text-color)' }}
                  payload={
                    data.map((item) => ({
                      id: item.name,
                      value: `${item.name} (${(item.value / totalQuestions * 100).toFixed(0)}%)`,
                      type: 'circle', // Use circle for a modern legend
                      color: item.name === 'Correct' ? CHART_COLORS.correct : CHART_COLORS.incorrect,
                    }))
                  }
                />
              </PieChart>
          </ResponsiveContainer>
          </div>
        ) : (
          <p className="no-questions-message">No graded questions were found in this quest.</p>
        )}

        <button className="complete-screen-button modern-button" onClick={onReturn}>
          Return to Trail
        </button>
      </div>
    </div>
  );
};

export default QuizResults;