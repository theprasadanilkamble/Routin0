import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';

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
    }),
    [parentRoutines, loading, error, fetchHierarchy]
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



