import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';
import CreateParentRoutineModal from '../../components/modals/CreateParentRoutineModal';

const HomePage = () => {
  const { parentRoutines } = useRoutines();
  const [showCreateParent, setShowCreateParent] = useState(false);

  // Calculate dashboard stats from routines
  const allHistory = parentRoutines.flatMap((parent) => parent.history || []);
  const recentHistory = allHistory.slice(0, 7).reverse();

  const totalRoutines = parentRoutines.reduce(
    (sum, parent) =>
      sum + parent.subRoutines.reduce((s, sub) => s + sub.routines.length, 0),
    0
  );

  const avgCompletion = parentRoutines.length
    ? Math.round(
        parentRoutines.reduce((sum, p) => sum + (p.completion || 0), 0) /
          parentRoutines.length
      )
    : 0;

  const longestStreak = parentRoutines.length
    ? Math.max(...parentRoutines.map((p) => p.streak || 0))
    : 0;

  return (
    <div className="home-page">
      <section className="dashboard-section">
        <div className="dashboard-header">
          <h2>Your Progress</h2>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-value">{totalRoutines}</div>
            <div className="stat-label">Total Routines</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgCompletion}%</div>
            <div className="stat-label">Avg Completion</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{longestStreak}</div>
            <div className="stat-label">Longest Streak</div>
          </div>
        </div>

        {/* <div className="dashboard-history">
          <h3>Past 7 Days</h3>
          <div className="history-bar-chart">
            {recentHistory.map((day, idx) => (
              <div key={idx} className="history-bar-item">
                <div
                  className={`history-bar ${day.success ? 'success' : 'missed'}`}
                  style={{ height: day.success ? '80%' : '30%' }}
                />
                <span className="history-label">{day.label}</span>
              </div>
            ))}
          </div>
        </div> */}
      </section>

      <section className="routines-section">
        <div className="section-header">
          <h2>Parent Routines</h2>
        </div>

        <div className="tile-grid">
          <article
            className="tile create-tile"
            onClick={() => setShowCreateParent(true)}
          >
            <div className="create-tile-icon">
              <i className="fas fa-plus"></i>
            </div>
            <h3>Create Parent Routine</h3>
            <p>Add a new parent routine to get started</p>
          </article>

          {parentRoutines.map((parent) => (
            <Link
              to={`/sub-routines/${parent.id}`}
              className="tile routine-tile"
              key={parent.id}
            >
              <div className="tile-header">
                <span className="badge">{parent.category}</span>
                <span className="routine-count">
                  {parent.subRoutines.length} sub-routine
                  {parent.subRoutines.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h3>{parent.title}</h3>
              <div className="tile-footer">
                <div className="streak-badge">
                  <i className="fas fa-fire"></i>
                  <span>{parent.streak} day streak</span>
                </div>
                <div className="completion-badge">
                  <span>{parent.completion}% complete</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {showCreateParent && (
        <CreateParentRoutineModal
          onClose={() => setShowCreateParent(false)}
        />
      )}
    </div>
  );
};

export default HomePage;
