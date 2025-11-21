import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoutines } from '../../context/RoutinesContext';
import CreateRoutineModal from '../../components/modals/CreateRoutineModal';

const RoutineDetailPage = () => {
  const { parentId, subId } = useParams();
  const navigate = useNavigate();
  const { parentRoutines } = useRoutines();
  const [showCreateRoutine, setShowCreateRoutine] = useState(false);
  const [cardStack, setCardStack] = useState([]);
  const [markedRoutines, setMarkedRoutines] = useState([]);
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date().toDateString();
  });

  const parent = parentRoutines.find((p) => p.id === parentId);
  const subRoutine = parent?.subRoutines.find((sub) => sub.id === subId);
  const routines = subRoutine?.routines || [];

  // Filter out marked routines from all routines
  const filterMarkedRoutines = (allRoutines, marked) => {
    const markedIds = new Set(marked.map(m => m.routine.id));
    return allRoutines.filter(r => !markedIds.has(r.id));
  };

  // Initialize card stack and check if reset is needed
  useEffect(() => {
    if (!routines.length) return;
    
    const today = new Date().toDateString();
    
    // Check if date changed - reset everything
    if (currentDate !== today) {
      setCurrentDate(today);
      setMarkedRoutines([]);
      // Initialize with all routines (no marked ones on new day)
      setCardStack([...routines]);
    } else {
      // Load from localStorage if available
      const savedData = localStorage.getItem(`routines-${subId}-${today}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          if (parsed.date === today) {
            // Only use saved data if it's from today
            const marked = parsed.markedRoutines || [];
            // Only keep marked routines that still exist
            const existingRoutineIds = new Set(routines.map(r => r.id));
            const validMarked = marked.filter(m => existingRoutineIds.has(m.routine.id));
            
            setMarkedRoutines(validMarked);
            
            // Filter marked routines from all routines to get initial stack
            const filteredRoutines = filterMarkedRoutines(routines, validMarked);
            
            // If we have a saved stack, use it (but filter marked ones)
            if (parsed.cardStack && parsed.cardStack.length > 0) {
              // Filter to ensure no marked routines are in stack and only existing routines
              const validStack = parsed.cardStack.filter(r => 
                existingRoutineIds.has(r.id) && !validMarked.find(m => m.routine.id === r.id)
              );
              
              // Merge with any new routines not in stack
              const stackIds = new Set(validStack.map(r => r.id));
              const newRoutines = filteredRoutines.filter(r => !stackIds.has(r.id));
              
              setCardStack([...validStack, ...newRoutines]);
            } else {
              // No saved stack, use filtered routines
              setCardStack(filteredRoutines);
            }
          } else {
            // Date mismatch - reset
            setCardStack([...routines]);
            setMarkedRoutines([]);
          }
        } catch (e) {
          // If parsing fails, initialize fresh
          setCardStack([...routines]);
          setMarkedRoutines([]);
        }
      } else {
        // First time today - initialize with all routines
        setCardStack([...routines]);
        setMarkedRoutines([]);
      }
    }
  }, [routines, subId, currentDate]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (!subId || !routines.length) return;
    
    // Only save if we have actual changes
    if (cardStack.length >= 0 || markedRoutines.length >= 0) {
      // Filter marked routines from cardStack to ensure consistency
      const markedIds = new Set(markedRoutines.map(m => m.routine.id));
      const filteredStack = cardStack.filter(r => !markedIds.has(r.id));
      
      const data = {
        cardStack: filteredStack,
        markedRoutines,
        date: currentDate,
      };
      localStorage.setItem(`routines-${subId}-${currentDate}`, JSON.stringify(data));
      
      // Also log to text file format (save to localStorage as text log)
      logRoutineAction(data);
    }
  }, [cardStack, markedRoutines, subId, currentDate]);

  const logRoutineAction = (data) => {
    const timestamp = new Date().toISOString();
    const logEntry = `
[${timestamp}] Routine Session Log
Parent: ${parent?.title || 'Unknown'}
Sub-Routine: ${subRoutine?.title || 'Unknown'}
Total Routines: ${routines.length}
Remaining Cards: ${data.cardStack.length}
Marked Routines: ${data.markedRoutines.length}
Marked Details: ${JSON.stringify(data.markedRoutines.map(m => ({
  routine: m.routine.title,
  action: m.action,
  time: m.timestamp
})), null, 2)}
---
`;
    
    // Get existing logs
    const existingLogs = localStorage.getItem(`routine-logs-${subId}`) || '';
    const newLogs = existingLogs + logEntry;
    
    // Store logs (truncate if too long to avoid localStorage limits)
    const maxLength = 50000; // ~50KB
    const logsToStore = newLogs.length > maxLength 
      ? newLogs.slice(-maxLength) 
      : newLogs;
    
    localStorage.setItem(`routine-logs-${subId}`, logsToStore);
  };

  const handleAction = (action) => {
    if (cardStack.length === 0) return;

    const currentCard = cardStack[0];
    const timestamp = new Date().toISOString();

    if (action === 'pass') {
      // Move card to back of stack
      setCardStack((prev) => {
        const newStack = [...prev.slice(1), prev[0]];
        return newStack;
      });
    } else {
      // Move to marked section (not done, skip, done)
      setMarkedRoutines((prev) => [
        ...prev,
        {
          routine: currentCard,
          action,
          timestamp,
        },
      ]);

      // Remove from stack
      setCardStack((prev) => prev.slice(1));
    }
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
            <span>Create Routine</span>
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
            cardStack.slice(0, Math.min(3, cardStack.length)).map((routine, idx) => {
              const isTop = idx === 0;
              const totalStacked = Math.min(3, cardStack.length);

              return (
                <div
                  key={routine.id}
                  className={`routine-card ${isTop ? 'top-card' : 'stacked-card'}`}
                  style={{
                    zIndex: totalStacked - idx,
                    transform: isTop
                      ? ''
                      : `scale(${1 - idx * 0.08}) translateY(${idx * 20}px) translateX(${idx * 5}px)`,
                    opacity: isTop ? 1 : 0.8 - idx * 0.2,
                    pointerEvents: isTop ? 'auto' : 'none',
                  }}
                >
                  <div className="routine-card-header">
                    <span className="routine-card-number">
                      {totalRoutines - remainingCards + idx + 1} / {totalRoutines}
                    </span>
                    {routine.category && (
                      <span className="routine-card-category">{routine.category}</span>
                    )}
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
            })
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
    </div>
  );
};

export default RoutineDetailPage;
