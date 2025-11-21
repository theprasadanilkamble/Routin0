import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';
import CreateParentRoutineModal from '../../components/modals/CreateParentRoutineModal';

const HomePage = () => {
  const { parentRoutines, loading, error, updateParentRoutine, deleteParentRoutine } = useRoutines();
  const [showCreateParent, setShowCreateParent] = useState(false);
  const [editingParent, setEditingParent] = useState(null);
  const [deletingParent, setDeletingParent] = useState(null);

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading routines…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <p>Failed to load routines: {error}</p>
      </div>
    );
  }

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
        <div className="dashboard-container">
          <div className="dashboard-actions">
            <Link to="/reports/today" className="report-btn today-btn">
              <i className="fas fa-calendar-day"></i>
              <span>Today Report</span>
            </Link>
            <Link to="/reports/all" className="report-btn all-btn">
              <i className="fas fa-chart-line"></i>
              <span>All Report</span>
            </Link>
          </div>

          <div className="dashboard-stats-panel">
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
          </div>
        </div>
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
            <div key={parent.id} className="tile routine-tile-wrapper">
              <Link
                to={`/sub-routines/${parent.id}`}
                className="tile routine-tile"
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
              <div className="tile-actions">
                <button
                  className="tile-action-btn edit-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingParent(parent);
                  }}
                  title="Edit"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="tile-action-btn delete-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeletingParent(parent);
                  }}
                  title="Delete"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {showCreateParent && (
        <CreateParentRoutineModal
          onClose={() => setShowCreateParent(false)}
        />
      )}

      {editingParent && (
        <CreateParentRoutineModal
          parent={editingParent}
          onClose={() => setEditingParent(null)}
        />
      )}

      {deletingParent && (
        <div className="modal-overlay" onClick={() => setDeletingParent(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Parent Routine</h2>
              <button className="modal-close" onClick={() => setDeletingParent(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-form">
              <p>
                Are you sure you want to delete <strong>{deletingParent.title}</strong>? This will
                also delete all sub-routines and routines under it. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeletingParent(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#dc2626' }}
                  onClick={async () => {
                    try {
                      await deleteParentRoutine(deletingParent.id);
                      setDeletingParent(null);
                    } catch (err) {
                      alert('Failed to delete: ' + err.message);
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
