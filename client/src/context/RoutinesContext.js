import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch, updateParentRoutine, deleteParentRoutine, updateSubRoutine, deleteSubRoutine, updateRoutine, deleteRoutine } from '../lib/api';

const RoutinesContext = createContext(null);

const attachId = (doc) => {
  if (!doc) return doc;
  return {
    ...doc,
    id: doc.id || doc._id,
  };
};

const normalizeRoutine = (routine) => attachId(routine);

const normalizeSubRoutine = (sub) => ({
  ...attachId(sub),
  routines: (sub?.routines || []).map(normalizeRoutine),
});

const normalizeHierarchy = (parents = []) =>
  parents.map((parent) => {
    const normalizedParent = attachId(parent);
    return {
      ...normalizedParent,
      subRoutines: (parent.subRoutines || []).map(normalizeSubRoutine),
    };
  });

export const RoutinesProvider = ({ children }) => {
  const { user } = useAuth();
  const [parentRoutines, setParentRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHierarchy = useCallback(async () => {
    if (!user) {
      setParentRoutines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch(user, '/api/routines');
      setParentRoutines(normalizeHierarchy(data.parents || []));
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const addParentRoutine = async (payload) => {
    const created = await apiFetch(user, '/api/routines/parents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const normalized = { ...attachId(created), subRoutines: [] };
    setParentRoutines((prev) => [normalized, ...prev]);
    return normalized;
  };

  const addSubRoutine = async (parentId, payload) => {
    const created = await apiFetch(user, `/api/routines/parents/${parentId}/sub-routines`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const normalized = { ...attachId(created), routines: [] };

    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: [normalized, ...(parent.subRoutines || [])],
            }
          : parent
      )
    );
    return normalized;
  };

  const addRoutine = async (_parentId, subId, payload) => {
    const created = await apiFetch(user, `/api/routines/sub-routines/${subId}/routines`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const normalized = normalizeRoutine(created);

    setParentRoutines((prev) =>
      prev.map((parent) => ({
        ...parent,
        subRoutines: parent.subRoutines?.map((sub) =>
          sub.id === subId
            ? {
                ...sub,
                routines: [normalized, ...(sub.routines || [])],
              }
            : sub
        ),
      }))
    );

    return normalized;
  };

  const markRoutine = async (routineId, payload) => {
    return apiFetch(user, `/api/routines/${routineId}/mark`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  };

  const fetchDailyLogs = async (date) => {
    return apiFetch(user, `/api/routines/logs/daily${date ? `?date=${date}` : ''}`);
  };

  const updateParent = async (parentId, payload) => {
    const updated = await updateParentRoutine(user, parentId, payload);
    const normalized = { ...attachId(updated), subRoutines: parentRoutines.find(p => p.id === parentId)?.subRoutines || [] };
    setParentRoutines((prev) =>
      prev.map((p) => (p.id === parentId ? normalized : p))
    );
    return normalized;
  };

  const removeParent = async (parentId) => {
    await deleteParentRoutine(user, parentId);
    setParentRoutines((prev) => prev.filter((p) => p.id !== parentId));
  };

  const updateSub = async (parentId, subId, payload) => {
    const updated = await updateSubRoutine(user, subId, payload);
    const normalized = { ...attachId(updated), routines: parentRoutines.find(p => p.id === parentId)?.subRoutines?.find(s => s.id === subId)?.routines || [] };
    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: parent.subRoutines?.map((sub) =>
                sub.id === subId ? normalized : sub
              ),
            }
          : parent
      )
    );
    return normalized;
  };

  const removeSub = async (parentId, subId) => {
    await deleteSubRoutine(user, subId);
    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: parent.subRoutines?.filter((sub) => sub.id !== subId),
            }
          : parent
      )
    );
  };

  const updateRoutineItem = async (parentId, subId, routineId, payload) => {
    const updated = await updateRoutine(user, routineId, payload);
    const normalized = normalizeRoutine(updated);
    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: parent.subRoutines?.map((sub) =>
                sub.id === subId
                  ? {
                      ...sub,
                      routines: sub.routines?.map((r) =>
                        r.id === routineId ? normalized : r
                      ),
                    }
                  : sub
              ),
            }
          : parent
      )
    );
    return normalized;
  };

  const removeRoutineItem = async (parentId, subId, routineId) => {
    await deleteRoutine(user, routineId);
    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: parent.subRoutines?.map((sub) =>
                sub.id === subId
                  ? {
                      ...sub,
                      routines: sub.routines?.filter((r) => r.id !== routineId),
                    }
                  : sub
              ),
            }
          : parent
      )
    );
  };

  const value = useMemo(
    () => ({
      parentRoutines,
      loading,
      error,
      refresh: fetchHierarchy,
      addParentRoutine,
      addSubRoutine,
      addRoutine,
      markRoutine,
      fetchDailyLogs,
      updateParentRoutine: updateParent,
      deleteParentRoutine: removeParent,
      updateSubRoutine: updateSub,
      deleteSubRoutine: removeSub,
      updateRoutine: updateRoutineItem,
      deleteRoutine: removeRoutineItem,
    }),
    [parentRoutines, loading, error, fetchHierarchy, user]
  );

  return (
    <RoutinesContext.Provider value={value}>
      {children}
    </RoutinesContext.Provider>
  );
};

export const useRoutines = () => {
  const ctx = useContext(RoutinesContext);
  if (!ctx) {
    throw new Error('useRoutines must be used within RoutinesProvider');
  }
  return ctx;
};



