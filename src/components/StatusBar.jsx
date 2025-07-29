import './StatusBar.css';

const StatusBar = ({ score, lives }) => {
  return (
    <div className="text-end px-3 mt-3">
      <span className="badge bg-success me-2">Score: {score}</span>
      <span>{'🧀'.repeat(lives)}</span>
    </div>
  );
};

export default StatusBar;
