import { createContext, useContext, useMemo, useState } from 'react';
import { mockParentRoutines } from '../data/mockRoutines';

const RoutinesContext = createContext(null);

export const RoutinesProvider = ({ children }) => {
  const [parentRoutines, setParentRoutines] = useState(mockParentRoutines);

  const addParentRoutine = (routine) => {
    const makeHistory = () => {
      const today = new Date();
      return [...Array(7)].map((_, idx) => {
        const date = new Date(today);
        date.setDate(today.getDate() - idx);
        const success = Math.random() > 0.3;
        return {
          id: `hist-${Date.now()}-${idx}`,
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          success,
        };
      });
    };

    setParentRoutines((prev) => [
      {
        id: `parent-${Date.now()}`,
        history: makeHistory(),
        completion: 0,
        streak: 0,
        subRoutines: [],
        ...routine,
      },
      ...prev,
    ]);
  };

  const addSubRoutine = (parentId, subRoutine) => {
    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: [
                {
                  id: `sub-${Date.now()}`,
                  routines: [],
                  ...subRoutine,
                },
                ...parent.subRoutines,
              ],
            }
          : parent
      )
    );
  };

  const addRoutine = (parentId, subId, routine) => {
    setParentRoutines((prev) =>
      prev.map((parent) =>
        parent.id === parentId
          ? {
              ...parent,
              subRoutines: parent.subRoutines.map((sub) =>
                sub.id === subId
                  ? {
                      ...sub,
                      routines: [
                        {
                          id: `routine-${Date.now()}`,
                          ...routine,
                        },
                        ...sub.routines,
                      ],
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
      addParentRoutine,
      addSubRoutine,
      addRoutine,
    }),
    [parentRoutines]
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



