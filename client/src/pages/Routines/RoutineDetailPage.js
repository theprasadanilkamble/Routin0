import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';
import CreateRoutineModal from '../../components/modals/CreateRoutineModal';

const RoutineDetailPage = () => {
  const { parentId, subId } = useParams();
  const navigate = useNavigate();
  const { parentRoutines } = useRoutines();
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [routineValues, setRoutineValues] = useState({});
  const [completedRoutines, setCompletedRoutines] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'completed'

  const parent = parentRoutines.find((p) => p.id === parentId);
  const subRoutine = parent?.subRoutines.find((sub) => sub.id === subId);
  const routines = subRoutine?.routines || [];

  useEffect(() => {
    // Initialize values for all routines
    const initialValues = {};
    routines.forEach((routine) => {
      if (routine.type === 'slider') {
        initialValues[routine.id] = routine.min || 0;
      } else if (routine.type === 'quantity') {
        initialValues[routine.id] = 0;
      } else {
        initialValues[routine.id] = false;
      }
    });
    setRoutineValues(initialValues);
  }, [routines]);

  const handleValueChange = (routineId, value) => {
    setRoutineValues((prev) => ({ ...prev, [routineId]: value }));
  };

  const handleComplete = (routineId) => {
    const routine = routines.find((r) => r.id === routineId);
    if (!routine) return;

    const value = routineValues[routineId];
    const isDone = 
      routine.type === 'yes_no' ? value === true :
      routine.type === 'quantity' ? value >= (routine.target || 0) :
      routine.type === 'slider' ? value >= (routine.min || 0) : false;

    if (isDone) {
      setCompletedRoutines((prev) => new Set([...prev, routineId]));
    } else {
      alert('Please complete the routine requirements first!');
    }
  };

  const handleSkip = (routineId) => {
    // Skip functionality - mark as skipped but don't complete
    setCompletedRoutines((prev) => {
      const newSet = new Set(prev);
      newSet.delete(routineId); // Remove from completed if it was there
      return newSet;
    });
  };

  const isRoutineCompleted = (routineId) => {
    return completedRoutines.has(routineId);
  };

  const isRoutineValid = (routine) => {
    const value = routineValues[routine.id];
    return routine.type === 'yes_no' ? value === true :
           routine.type === 'quantity' ? (value || 0) >= (routine.target || 0) :
           routine.type === 'slider' ? (value || 0) >= (routine.min || 0) : false;
  };

  // Filter routines based on selected filter
  const filteredRoutines = routines.filter((routine) => {
    if (filter === 'completed') return isRoutineCompleted(routine.id);
    if (filter === 'pending') return !isRoutineCompleted(routine.id);
    return true;
  });

  const completedCount = routines.filter((r) => isRoutineCompleted(r.id)).length;
  const progress = routines.length > 0 ? (completedCount / routines.length) * 100 : 0;

  if (!parent || !subRoutine) {
    return (
      <div className="page-shell">
        <p>Sub-routine not found.</p>
        <button className="nav-btn ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  if (routines.length === 0) {
    return (
      <div className="routine-detail-page">
        <button className="back-button" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to {parent.title}</span>
        </button>

        <div className="empty-routines">
          <i className="fas fa-inbox"></i>
          <h2>No routines yet</h2>
          <p>Create your first routine to get started</p>
          <button
            className="nav-btn"
            onClick={() => setShowCreateRoutine(true)}
          >
            <i className="fas fa-plus"></i>
            <span>Create Routine</span>
          </button>
        </div>

        {showCreateRoutine && (
          <CreateRoutineModal
            onClose={() => setShowCreateRoutine(false)}
            parentId={parentId}
            subId={subId}
          />
        )}
      </div>
    );
  }

  return (
    <div className="routine-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left"></i>
        <span>Back to {parent.title}</span>
      </button>

      <div className="routine-header">
        <div className="routine-header-top">
          <div>
            <h1>{subRoutine.title}</h1>
            <p className="routine-subtitle">
              {routines.length} routine{routines.length !== 1 ? 's' : ''} in this sub-routine
            </p>
          </div>
          <button
            className="nav-btn ghost create-routine-btn"
            onClick={() => setShowCreateRoutine(true)}
          >
            <i className="fas fa-plus"></i>
            <span>Create Routine</span>
          </button>
        </div>

        <div className="routine-progress-section">
          <div className="progress-info">
            <div className="progress-stats">
              <span className="stat-item">
                <i className="fas fa-check-circle"></i>
                {completedCount} Completed
              </span>
              <span className="stat-item">
                <i className="fas fa-clock"></i>
                {routines.length - completedCount} Pending
              </span>
            </div>
            <div className="progress-percentage">{Math.round(progress)}%</div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="routine-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({routines.length})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({routines.length - completedCount})
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      <div className="routines-list">
        {filteredRoutines.map((routine, idx) => {
          const isCompleted = isRoutineCompleted(routine.id);
          const isValid = isRoutineValid(routine);

          return (
            <div
              key={routine.id}
              className={`routine-item ${isCompleted ? 'completed' : ''}`}
            >
              <div className="routine-item-header">
                <div className="routine-item-number">
                  <span className="number-badge">{idx + 1}</span>
                  <div className="routine-item-info">
                    <div className="routine-meta">
                      <span className="routine-type-badge">
                        {routine.type?.replace('_', '-') || 'routine'}
                      </span>
                      {routine.category && (
                        <span className="routine-category">{routine.category}</span>
                      )}
                    </div>
                    <h3>{routine.title}</h3>
                    {routine.description && (
                      <p className="routine-description">{routine.description}</p>
                    )}
                  </div>
                </div>
                {isCompleted && (
                  <div className="completed-indicator">
                    <i className="fas fa-check-circle"></i>
                    <span>Completed</span>
                  </div>
                )}
              </div>

              <div className="routine-item-body">
                <div className="routine-input-container">
                  {routine.type === 'yes_no' && (
                    <div className="yes-no-input">
                      <button
                        className={`input-btn ${routineValues[routine.id] === true ? 'active' : ''}`}
                        onClick={() => handleValueChange(routine.id, true)}
                        disabled={isCompleted}
                      >
                        <i className="fas fa-check"></i>
                        <span>Done</span>
                      </button>
                      <button
                        className={`input-btn ${routineValues[routine.id] === false ? 'active' : ''}`}
                        onClick={() => handleValueChange(routine.id, false)}
                        disabled={isCompleted}
                      >
                        <i className="fas fa-times"></i>
                        <span>Not Done</span>
                      </button>
                    </div>
                  )}

                  {routine.type === 'quantity' && (
                    <div className="quantity-input">
                      <label>
                        Target: {routine.target} {routine.unit || ''}
                      </label>
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleValueChange(
                              routine.id,
                              Math.max(0, (routineValues[routine.id] || 0) - 1)
                            )
                          }
                          disabled={isCompleted}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <input
                          type="number"
                          value={routineValues[routine.id] || 0}
                          onChange={(e) =>
                            handleValueChange(routine.id, parseInt(e.target.value) || 0)
                          }
                          min={0}
                          max={routine.target * 2}
                          disabled={isCompleted}
                        />
                        <button
                          className="qty-btn"
                          onClick={() =>
                            handleValueChange(
                              routine.id,
                              (routineValues[routine.id] || 0) + 1
                            )
                          }
                          disabled={isCompleted}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      <div className="quantity-progress">
                        <div
                          className={`quantity-bar ${isValid ? 'complete' : ''}`}
                          style={{
                            width: `${Math.min(100, ((routineValues[routine.id] || 0) / routine.target) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className={`quantity-status ${isValid ? 'success' : ''}`}>
                        {(routineValues[routine.id] || 0) >= routine.target
                          ? '✓ Target reached!'
                          : `${routine.target - (routineValues[routine.id] || 0)} more needed`}
                      </p>
                    </div>
                  )}

                  {routine.type === 'slider' && (
                    <div className="slider-input">
                      <label>
                        Current: {routineValues[routine.id] || routine.min || 0} / {routine.max || 10}
                      </label>
                      <input
                        type="range"
                        min={routine.min || 0}
                        max={routine.max || 10}
                        value={routineValues[routine.id] || routine.min || 0}
                        onChange={(e) =>
                          handleValueChange(routine.id, parseInt(e.target.value))
                        }
                        className="slider"
                        disabled={isCompleted}
                      />
                      <div className="slider-labels">
                        <span>{routine.min || 0}</span>
                        <span>{routine.max || 10}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="routine-actions">
                  {!isCompleted && (
                    <>
                      <button
                        className="action-btn skip-btn"
                        onClick={() => handleSkip(routine.id)}
                      >
                        <i className="fas fa-times"></i>
                        <span>Skip</span>
                      </button>
                      <button
                        className={`action-btn complete-btn ${isValid ? 'enabled' : 'disabled'}`}
                        onClick={() => handleComplete(routine.id)}
                        disabled={!isValid}
                      >
                        <i className="fas fa-check"></i>
                        <span>Mark Complete</span>
                      </button>
                    </>
                  )}
                  {isCompleted && (
                    <button
                      className="action-btn undo-btn"
                      onClick={() => handleSkip(routine.id)}
                    >
                      <i className="fas fa-undo"></i>
                      <span>Mark Incomplete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoutines.length === 0 && (
        <div className="empty-filtered">
          <i className="fas fa-filter"></i>
          <p>No routines match this filter</p>
        </div>
      )}

      {showCreateRoutine && (
        <CreateRoutineModal
          onClose={() => setShowCreateRoutine(false)}
          parentId={parentId}
          subId={subId}
        />
      )}
    </div>
  );
};

export default RoutineDetailPage;
