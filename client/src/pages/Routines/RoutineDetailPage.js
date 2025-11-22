import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';
import CreateRoutineModal from '../../components/modals/CreateRoutineModal';

const RoutineDetailPage = () => {
  const { parentId, subId } = useParams();
  const navigate = useNavigate();
  const {
    parentRoutines,
    markRoutine,
    fetchDailyLogs,
    updateRoutine,
    deleteRoutine,
    loading: routinesLoading,
    error: routinesError,
  } = useRoutines();
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [deletingRoutine, setDeletingRoutine] = useState(null);
  const [cardStack, setCardStack] = useState([]);
  const [markedRoutines, setMarkedRoutines] = useState([]);
  const [stateLoading, setStateLoading] = useState(true);
  const [stateError, setStateError] = useState(null);

  const parent = parentRoutines.find((p) => p.id === parentId);
  const subRoutine = parent?.subRoutines.find((sub) => sub.id === subId);
  const routines = subRoutine?.routines || [];

  // Fetch daily logs from backend to determine which routines were already marked
  useEffect(() => {
    if (!subRoutine || !subId) {
      setCardStack(routines);
      setMarkedRoutines([]);
      setStateLoading(false);
      return;
    }

    let isMounted = true;

    const loadState = async () => {
      setStateLoading(true);
      try {
        // Explicitly pass today's date to ensure we only get today's logs
        const today = new Date().toISOString().slice(0, 10);
        const data = await fetchDailyLogs(today);
        const logs = data?.logs || [];

        // Filter logs for this sub-routine (handle both populated object and ID string)
        const relevantLogs = logs.filter((log) => {
          const logSubId = log.subRoutine?._id || log.subRoutine || '';
          return String(logSubId) === String(subId);
        });

        // Keep only newest log per routine for this sub-routine
        const latestByRoutine = new Map();
        relevantLogs.forEach((log) => {
          const routineId = log.routine?._id || log.routine || '';
          const routineIdStr = String(routineId);
          // Only keep the latest log per routine (logs are already sorted by timestamp desc)
          if (!latestByRoutine.has(routineIdStr)) {
            latestByRoutine.set(routineIdStr, log);
          }
        });

        const routineMap = new Map(routines.map((routine) => [String(routine.id), routine]));
        const entries = Array.from(latestByRoutine.entries())
          .map(([routineId, log]) => {
            const routine = routineMap.get(routineId);
            if (!routine) {
              return null;
            }
            return {
              routine,
              action: log.action,
              timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
            };
          })
          .filter(Boolean);

        if (isMounted) {
          setMarkedRoutines(entries);
          const markedIds = new Set(entries.map((entry) => String(entry.routine.id)));
          setCardStack(routines.filter((routine) => !markedIds.has(String(routine.id))));
          setStateError(null);
        }
      } catch (err) {
        console.error('Error loading daily state:', err);
        if (isMounted) {
          setStateError('Failed to load routine state');
          setCardStack(routines);
        }
      } finally {
        if (isMounted) {
          setStateLoading(false);
        }
      }
    };

    loadState();
    return () => {
      isMounted = false;
    };
  }, [fetchDailyLogs, routines, subId, subRoutine]);

  const handleAction = async (action) => {
    if (cardStack.length === 0) return;

    const currentCard = cardStack[0];
    const timestamp = new Date().toISOString();

    if (action === 'pass') {
      setCardStack((prev) => {
        const newStack = [...prev.slice(1), prev[0]];
        return newStack;
      });
      return;
    }

    try {
      await markRoutine(currentCard.id, { action });
    } catch (err) {
      console.error(err);
    }

    setMarkedRoutines((prev) => [
      ...prev,
      {
        routine: currentCard,
        action,
        timestamp,
      },
    ]);

    setCardStack((prev) => prev.slice(1));
  };

  const handleEditMarked = (index) => {
    setMarkedRoutines((prev) => {
      const entry = prev[index];
      if (!entry) return prev;
      const updated = prev.filter((_, idx) => idx !== index);

      setCardStack((stackPrev) => {
        const cleanedStack = stackPrev.filter((card) => card.id !== entry.routine.id);
        return [entry.routine, ...cleanedStack];
      });

      return updated;
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'not_done':
        return 'fas fa-times';
      case 'skip':
        return 'fas fa-ban';
      case 'pass':
        return 'fas fa-forward';
      case 'done':
        return 'fas fa-check';
      default:
        return 'fas fa-circle';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'not_done':
        return '#dc2626';
      case 'skip':
        return '#f59e0b';
      case 'pass':
        return '#3b82f6';
      case 'done':
        return '#16a34a';
      default:
        return '#666';
    }
  };

  if (routinesLoading) {
    return (
      <div className="page-shell">
        <p>Loading routines…</p>
      </div>
    );
  }

  if (routinesError) {
    return (
      <div className="page-shell">
        <p>Failed to load routines: {routinesError}</p>
        <button className="nav-btn ghost" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

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

  // Calculate actual progress (marked routines out of total)
  const totalRoutines = routines.length;
  const markedCount = markedRoutines.length;
  const remainingCards = cardStack.length;
  const progress = totalRoutines > 0 
    ? (markedCount / totalRoutines) * 100 
    : 0;

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
              {remainingCards} remaining • {markedCount} marked
            </p>
          </div>
          <button
            className="nav-btn ghost create-routine-btn"
            onClick={() => setShowCreateRoutine(true)}
          >
            <i className="fas fa-plus"></i>
            <span>Add Card</span>
          </button>
        </div>

        <div className="routine-progress-section">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {markedCount} / {totalRoutines} marked
          </span>
        </div>

        {stateLoading && <p className="state-message">Syncing today&rsquo;s progress…</p>}
        {stateError && <p className="state-error-text">{stateError}</p>}
      </div>

      <div className="routine-card-container">
        {/* Marked Section (Right Corner) */}
        <div className="marked-section">
          <div className="marked-header">
            <i className="fas fa-bookmark"></i>
            <span>Marked ({markedRoutines.length})</span>
          </div>
          <div className="marked-list">
            {markedRoutines.length === 0 ? (
              <div className="marked-empty">
                <i className="fas fa-inbox"></i>
                <p>No marked routines</p>
              </div>
            ) : (
              markedRoutines.map((item, idx) => (
                <div
                  key={`${item.routine.id}-${idx}`}
                  className="marked-item"
                  style={{ borderColor: getActionColor(item.action) }}
                  onClick={() => handleEditMarked(idx)}
                >
                  <div className="marked-item-icon" style={{ color: getActionColor(item.action) }}>
                    <i className={getActionIcon(item.action)}></i>
                  </div>
                  <div className="marked-item-info">
                    <p className="marked-item-title">{item.routine.title}</p>
                    <span className="marked-item-action">{item.action.replace('_', ' ')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card Stack */}
        <div className="routine-stack-container">
          {cardStack.length === 0 ? (
            <div className="all-cards-complete">
              <i className="fas fa-check-circle"></i>
              <h2>All routines completed!</h2>
              <p>Great job! Come back tomorrow for a fresh set of routines.</p>
            </div>
          ) : (
            <>
              {cardStack.slice(0, Math.min(3, cardStack.length)).map((routine, idx) => {
                const isTop = idx === 0;
                const totalStacked = Math.min(3, cardStack.length);

                // base transform centers card
                const baseTransform = 'translate(-50%, -90%)';
                const scale = 1 - idx * 0.07;
                const translateY = idx * 18;
                const translateX = idx * 4;
                const extraTransform = isTop
                  ? ''
                  : ` translate(${translateX}px, ${translateY}px) scale(${scale})`;

                return (
                  <div
                    key={routine.id}
                    className={`routine-card ${isTop ? 'top-card' : 'stacked-card'}`}
                    style={{
                      zIndex: totalStacked - idx,
                      transform: `${baseTransform}${extraTransform}`,
                      opacity: isTop ? 1 : 0.85 - idx * 0.25,
                      pointerEvents: isTop ? 'auto' : 'none',
                      boxShadow: isTop
                        ? '0 25px 60px rgba(0,0,0,0.35)'
                        : `0 ${10 + idx * 6}px ${25 + idx * 10}px rgba(0,0,0,${0.25 - idx * 0.07})`,
                    }}
                  >
                    <div className="routine-card-header">
                      <span className="routine-card-number">
                        {totalRoutines - remainingCards + idx + 1} / {totalRoutines}
                      </span>
                      <div className="routine-card-header-right">
                        {routine.category && (
                          <span className="routine-card-category">{routine.category}</span>
                        )}
                        {isTop && (
                          <div className="routine-card-menu">
                            <button
                              className="routine-card-menu-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRoutine(routine);
                              }}
                              title="Edit"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="routine-card-menu-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingRoutine(routine);
                              }}
                              title="Delete"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="routine-card-content">
                      <h2>{routine.title}</h2>
                      {routine.description && (
                        <p className="routine-card-description">{routine.description}</p>
                      )}
                    </div>

                    {isTop && (
                      <div className="routine-card-actions">
                        <button
                          className="card-action-btn not-done-btn"
                          onClick={() => handleAction('not_done')}
                          title="Not Done"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                        <button
                          className="card-action-btn skip-btn"
                          onClick={() => handleAction('skip')}
                          title="Skip"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                        <button
                          className="card-action-btn pass-btn"
                          onClick={() => handleAction('pass')}
                          title="Pass"
                        >
                          <i className="fas fa-forward"></i>
                        </button>
                        <button
                          className="card-action-btn done-btn"
                          onClick={() => handleAction('done')}
                          title="Done"
                        >
                          <i className="fas fa-check"></i>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {cardStack.length > 1 && (
                <div className="stack-indicators">
                  {cardStack
                    .slice(1, Math.min(5, cardStack.length))
                    .map((card, idx) => (
                      <div
                        key={`${card.id}-indicator`}
                        className="stack-indicator"
                        style={{ opacity: 0.6 - idx * 0.1 }}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showCreateRoutine && (
        <CreateRoutineModal
          onClose={() => setShowCreateRoutine(false)}
          parentId={parentId}
          subId={subId}
        />
      )}

      {editingRoutine && (
        <CreateRoutineModal
          routine={editingRoutine}
          parentId={parentId}
          subId={subId}
          onClose={() => setEditingRoutine(null)}
        />
      )}

      {deletingRoutine && (
        <div className="modal-overlay" onClick={() => setDeletingRoutine(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Routine</h2>
              <button className="modal-close" onClick={() => setDeletingRoutine(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-form">
              <p>
                Are you sure you want to delete <strong>{deletingRoutine.title}</strong>? This
                action cannot be undone.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDeletingRoutine(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#dc2626' }}
                  onClick={async () => {
                    try {
                      await deleteRoutine(parentId, subId, deletingRoutine.id);
                      setDeletingRoutine(null);
                      // Remove from card stack if it's there
                      setCardStack((prev) => prev.filter((r) => r.id !== deletingRoutine.id));
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

export default RoutineDetailPage;
