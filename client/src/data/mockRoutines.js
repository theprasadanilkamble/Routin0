const generateId = () => Math.random().toString(36).substring(2, 9);

const makeHistory = () => {
  const today = new Date();
  return [...Array(7)].map((_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() - idx);
    const success = Math.random() > 0.3;
    return {
      id: generateId(),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      success,
    };
  });
};

export const mockParentRoutines = [
  {
    id: 'parent-1',
    title: 'Morning Mastery',
    category: 'Wellness',
    streak: 12,
    completion: 76,
    history: makeHistory(),
    subRoutines: [
      {
        id: 'sub-1',
        title: 'Mindful Start',
        category: 'Mindfulness',
        routines: [
          {
            id: 'routine-1',
            title: 'Meditation',
            description: '5 minutes of box breathing',
            type: 'yes_no',
          },
          {
            id: 'routine-2',
            title: 'Hydration',
            description: 'Drink 500ml water',
            type: 'quantity',
            target: 500,
            unit: 'ml',
          },
          {
            id: 'routine-3',
            title: 'Sun Salutations',
            description: 'Gentle yoga flow',
            type: 'slider',
            min: 0,
            max: 10,
          },
        ],
      },
      {
        id: 'sub-2',
        title: 'Energy Boost',
        category: 'Fitness',
        routines: [
          {
            id: 'routine-4',
            title: 'Push-ups',
            type: 'quantity',
            target: 20,
            unit: 'reps',
          },
        ],
      },
    ],
  },
  {
    id: 'parent-2',
    title: 'Deep Work Sprint',
    category: 'Productivity',
    streak: 5,
    completion: 58,
    history: makeHistory(),
    subRoutines: [
      {
        id: 'sub-3',
        title: 'Warm-up',
        category: 'Prep',
        routines: [
          {
            id: 'routine-5',
            title: 'Review tasks',
            type: 'yes_no',
          },
          {
            id: 'routine-6',
            title: 'Plan sprint',
            type: 'slider',
            min: 0,
            max: 5,
          },
        ],
      },
    ],
  },
];

export const dashboardWidgets = [
  {
    id: 'widget-1',
    label: 'Active Routines',
    value: 6,
    delta: '+2 this week',
  },
  {
    id: 'widget-2',
    label: 'Completion',
    value: '72%',
    delta: '4-day streak',
  },
  {
    id: 'widget-3',
    label: 'Focus Minutes',
    value: 145,
    delta: 'Today',
  },
];



