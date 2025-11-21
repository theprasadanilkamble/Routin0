import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';
import CreateSubRoutineModal from '../../components/modals/CreateSubRoutineModal';

const SubRoutinePage = () => {
  const { parentId } = useParams();
  const navigate = useNavigate();
  const { parentRoutines, loading, error, updateSubRoutine, deleteSubRoutine } = useRoutines();
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [deletingSub, setDeletingSub] = useState(null);

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
        <button className="nav-btn ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  const parent = parentRoutines.find((p) => p.id === parentId);

  if (!parent) {
    return (
      <div className="page-shell">
        <p>Parent routine not found.</p>
        <button className="nav-btn ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="subroutine-page">
      <button className="back-button" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
        <span>Back to Home</span>
      </button>

      <section className="page-heading">
        <div>
          <p className="eyebrow">{parent.category}</p>
          <h1>{parent.title}</h1>
          <p className="subtitle">
            {parent.subRoutines.length} sub-routine
            {parent.subRoutines.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </section>

      <div className="tile-grid">
        <article
          className="tile create-tile"
          onClick={() => setShowCreateSub(true)}
        >
          <div className="create-tile-icon">
            <i className="fas fa-plus"></i>
          </div>
          <h3>Create Sub-Routine</h3>
          <p>Add a new sub-routine to this parent routine</p>
        </article>

        {parent.subRoutines.map((sub) => (
          <div key={sub.id} className="tile routine-tile-wrapper">
            <Link
              to={`/routines/${parent.id}/${sub.id}`}
              className="tile routine-tile"
            >
              <div className="tile-header">
                <span className="badge">{sub.category}</span>
                <span className="routine-count">
                  {sub.routines.length} routine{sub.routines.length !== 1 ? 's' : ''}
                </span>
              </div>
              <h3>{sub.title}</h3>
              {sub.routines.length > 0 && (
                <p className="routine-preview">
                  {sub.routines.slice(0, 2).map((r) => r.title).join(', ')}
                  {sub.routines.length > 2 && '...'}
                </p>
              )}
            </Link>
            <div className="tile-actions">
              <button
                className="tile-action-btn edit-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditingSub(sub);
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
                  setDeletingSub(sub);
                }}
                title="Delete"
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateSub && (
        <CreateSubRoutineModal
          onClose={() => setShowCreateSub(false)}
          parentRoutines={[parent]}
        />
      )}

      {editingSub && (
        <CreateSubRoutineModal
          subRoutine={editingSub}
          parentRoutines={[parent]}
          onClose={() => setEditingSub(null)}
        />
      )}

      {deletingSub && (
        <div className="modal-overlay" onClick={() => setDeletingSub(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Sub-Routine</h2>
              <button className="modal-close" onClick={() => setDeletingSub(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-form">
              <p>
                Are you sure you want to delete <strong>{deletingSub.title}</strong>? This will
                also delete all routines under it. This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeletingSub(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#dc2626' }}
                  onClick={async () => {
                    try {
                      await deleteSubRoutine(parentId, deletingSub.id);
                      setDeletingSub(null);
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

export default SubRoutinePage;
