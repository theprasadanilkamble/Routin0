// seedData.js - OPTION 1: Skip today completely OR keep only 10-15% completion for today
// Run with: node seedData.js

const mongoose = require('mongoose');
require('dotenv').config();

// Import your models (adjust paths as needed)
const User = require('./src/models/User');
const ParentRoutine = require('./src/models/ParentRoutine');
const SubRoutine = require('./src/models/SubRoutine');
const Routine = require('./src/models/Routine');
const RoutineLog = require('./src/models/RoutineLog');

// Your user ID from MongoDB
const USER_ID = '692077add9d4d29695c7c438';
const DAYS_BACK = 60; // Generate 60 days of history

// CHOOSE ONE:
const SKIP_TODAY_COMPLETELY = false; // Set to true to skip today entirely
const TODAY_COMPLETION_RATE = 0.10;  // If SKIP_TODAY_COMPLETELY = false, use 10% completion for today

// Helper: Format date as YYYY-MM-DD
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Get random integer between min and max
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper: Generate completion value based on routine type
function generateValue(type, inputConfig) {
  switch (type) {
    case 'yes_no':
      return null; // No value needed for yes/no
    case 'quantity':
      const target = inputConfig?.target || 10;
      return getRandomInt(Math.max(1, target - 3), target + 2);
    case 'slider':
      const min = inputConfig?.min || 1;
      const max = inputConfig?.max || 10;
      return getRandomInt(min, max);
    default:
      return null;
  }
}

// Helper: Decide if routine should be completed (weighted by day of week)
function shouldComplete(date, isToday = false) {
  // Special handling for today
  if (isToday) {
    return Math.random() < TODAY_COMPLETION_RATE;
  }
  
  // Normal logic for past days
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const baseRate = isWeekend ? 0.65 : 0.85;
  return Math.random() < baseRate;
}

// Helper: Get action based on completion decision
function getAction(willComplete) {
  if (!willComplete) {
    return Math.random() < 0.7 ? 'skip' : 'not_done';
  }
  return Math.random() < 0.9 ? 'done' : 'pass';
}

// Sample data
const sampleParentRoutines = [
  {
    title: 'Gym Workout',
    category: 'Fitness',
    description: 'Daily gym and exercise routines',
    streak: 0,
    completion: 0,
    history: []
  },
  {
    title: 'Study Time',
    category: 'Education',
    description: 'Learning and skill development',
    streak: 0,
    completion: 0,
    history: []
  },
  {
    title: 'Health & Wellness',
    category: 'Health',
    description: 'Daily health and wellness activities',
    streak: 0,
    completion: 0,
    history: []
  },
  {
    title: 'Work Tasks',
    category: 'Productivity',
    description: 'Professional development and work',
    streak: 0,
    completion: 0,
    history: []
  }
];

const sampleSubRoutines = {
  'Gym Workout': [
    { title: 'Chest & Triceps', category: 'Upper Body' },
    { title: 'Back & Biceps', category: 'Upper Body' },
    { title: 'Legs & Core', category: 'Lower Body' },
    { title: 'Cardio Session', category: 'Cardio' }
  ],
  'Study Time': [
    { title: 'Programming Practice', category: 'Technical' },
    { title: 'DSA Problems', category: 'Technical' },
    { title: 'System Design', category: 'Technical' }
  ],
  'Health & Wellness': [
    { title: 'Morning Routine', category: 'Daily' },
    { title: 'Evening Routine', category: 'Daily' },
    { title: 'Meditation & Yoga', category: 'Mindfulness' }
  ],
  'Work Tasks': [
    { title: 'Project Work', category: 'Development' },
    { title: 'Meetings & Calls', category: 'Communication' },
    { title: 'Learning & Research', category: 'Growth' }
  ]
};

const sampleRoutines = {
  'Chest & Triceps': [
    { title: 'Bench Press', description: 'Flat barbell bench press', category: 'Strength', type: 'quantity', inputConfig: { target: 12, unit: 'reps' } },
    { title: 'Incline Dumbbell Press', description: 'Incline bench with dumbbells', category: 'Strength', type: 'quantity', inputConfig: { target: 10, unit: 'reps' } },
    { title: 'Chest Flys', description: 'Cable or dumbbell flys', category: 'Strength', type: 'yes_no', inputConfig: {} },
    { title: 'Tricep Dips', description: 'Bodyweight or weighted dips', category: 'Strength', type: 'quantity', inputConfig: { target: 15, unit: 'reps' } },
    { title: 'Tricep Extensions', description: 'Overhead or cable extensions', category: 'Strength', type: 'yes_no', inputConfig: {} }
  ],
  'Back & Biceps': [
    { title: 'Pull-ups', description: 'Wide grip pull-ups', category: 'Strength', type: 'quantity', inputConfig: { target: 8, unit: 'reps' } },
    { title: 'Barbell Rows', description: 'Bent over barbell rows', category: 'Strength', type: 'quantity', inputConfig: { target: 12, unit: 'reps' } },
    { title: 'Lat Pulldowns', description: 'Cable lat pulldowns', category: 'Strength', type: 'yes_no', inputConfig: {} },
    { title: 'Bicep Curls', description: 'Dumbbell or barbell curls', category: 'Strength', type: 'quantity', inputConfig: { target: 12, unit: 'reps' } },
    { title: 'Hammer Curls', description: 'Neutral grip dumbbell curls', category: 'Strength', type: 'quantity', inputConfig: { target: 10, unit: 'reps' } }
  ],
  'Legs & Core': [
    { title: 'Squats', description: 'Barbell back squats', category: 'Strength', type: 'quantity', inputConfig: { target: 15, unit: 'reps' } },
    { title: 'Leg Press', description: 'Machine leg press', category: 'Strength', type: 'quantity', inputConfig: { target: 20, unit: 'reps' } },
    { title: 'Lunges', description: 'Walking or stationary lunges', category: 'Strength', type: 'quantity', inputConfig: { target: 12, unit: 'reps per leg' } },
    { title: 'Planks', description: 'Core plank hold', category: 'Core', type: 'quantity', inputConfig: { target: 60, unit: 'seconds' } },
    { title: 'Russian Twists', description: 'Weighted core twists', category: 'Core', type: 'quantity', inputConfig: { target: 20, unit: 'reps' } }
  ],
  'Cardio Session': [
    { title: 'Running', description: 'Treadmill or outdoor run', category: 'Cardio', type: 'quantity', inputConfig: { target: 30, unit: 'minutes' } },
    { title: 'Jump Rope', description: 'Cardio with jump rope', category: 'Cardio', type: 'quantity', inputConfig: { target: 5, unit: 'minutes' } },
    { title: 'Burpees', description: 'High intensity burpees', category: 'Cardio', type: 'quantity', inputConfig: { target: 20, unit: 'reps' } },
    { title: 'Mountain Climbers', description: 'Core and cardio exercise', category: 'Cardio', type: 'quantity', inputConfig: { target: 30, unit: 'reps' } }
  ],
  'Programming Practice': [
    { title: 'LeetCode Problems', description: 'Solve coding challenges', category: 'Coding', type: 'quantity', inputConfig: { target: 3, unit: 'problems' } },
    { title: 'Build Side Project', description: 'Work on personal projects', category: 'Development', type: 'quantity', inputConfig: { target: 2, unit: 'hours' } },
    { title: 'Code Review', description: 'Review and refactor code', category: 'Quality', type: 'yes_no', inputConfig: {} },
    { title: 'Documentation', description: 'Write technical docs', category: 'Documentation', type: 'yes_no', inputConfig: {} }
  ],
  'DSA Problems': [
    { title: 'Array Problems', description: 'Practice array algorithms', category: 'DSA', type: 'quantity', inputConfig: { target: 2, unit: 'problems' } },
    { title: 'Tree Problems', description: 'Binary trees and BST', category: 'DSA', type: 'quantity', inputConfig: { target: 2, unit: 'problems' } },
    { title: 'Graph Problems', description: 'Graph algorithms practice', category: 'DSA', type: 'quantity', inputConfig: { target: 1, unit: 'problems' } },
    { title: 'Dynamic Programming', description: 'DP problem solving', category: 'DSA', type: 'quantity', inputConfig: { target: 1, unit: 'problems' } }
  ],
  'System Design': [
    { title: 'Read System Design', description: 'Study architecture patterns', category: 'Learning', type: 'quantity', inputConfig: { target: 1, unit: 'hours' } },
    { title: 'Design Practice', description: 'Practice system design problems', category: 'Practice', type: 'yes_no', inputConfig: {} },
    { title: 'Watch Tech Talks', description: 'Learn from industry experts', category: 'Learning', type: 'yes_no', inputConfig: {} }
  ],
  'Morning Routine': [
    { title: 'Wake Up Early', description: 'Wake up at target time', category: 'Habit', type: 'yes_no', inputConfig: {} },
    { title: 'Drink Water', description: 'Hydrate first thing', category: 'Health', type: 'quantity', inputConfig: { target: 500, unit: 'ml' } },
    { title: 'Stretch', description: 'Morning stretching routine', category: 'Wellness', type: 'quantity', inputConfig: { target: 10, unit: 'minutes' } },
    { title: 'Healthy Breakfast', description: 'Nutritious breakfast', category: 'Nutrition', type: 'yes_no', inputConfig: {} }
  ],
  'Evening Routine': [
    { title: 'Review Day', description: 'Reflect on the day', category: 'Reflection', type: 'yes_no', inputConfig: {} },
    { title: 'Plan Tomorrow', description: 'Set goals for next day', category: 'Planning', type: 'yes_no', inputConfig: {} },
    { title: 'Read Before Bed', description: 'Evening reading', category: 'Learning', type: 'quantity', inputConfig: { target: 30, unit: 'minutes' } },
    { title: 'Sleep On Time', description: 'Get to bed early', category: 'Health', type: 'yes_no', inputConfig: {} }
  ],
  'Meditation & Yoga': [
    { title: 'Meditation', description: 'Mindfulness meditation', category: 'Mindfulness', type: 'quantity', inputConfig: { target: 15, unit: 'minutes' } },
    { title: 'Yoga Session', description: 'Yoga practice', category: 'Wellness', type: 'quantity', inputConfig: { target: 30, unit: 'minutes' } },
    { title: 'Breathing Exercises', description: 'Pranayama practice', category: 'Wellness', type: 'quantity', inputConfig: { target: 10, unit: 'minutes' } },
    { title: 'Gratitude Journal', description: 'Write gratitude entries', category: 'Mindfulness', type: 'yes_no', inputConfig: {} }
  ],
  'Project Work': [
    { title: 'Feature Development', description: 'Build new features', category: 'Development', type: 'quantity', inputConfig: { target: 4, unit: 'hours' } },
    { title: 'Bug Fixes', description: 'Fix reported bugs', category: 'Maintenance', type: 'quantity', inputConfig: { target: 2, unit: 'bugs' } },
    { title: 'Testing', description: 'Write and run tests', category: 'Quality', type: 'yes_no', inputConfig: {} },
    { title: 'Code Deployment', description: 'Deploy to production', category: 'DevOps', type: 'yes_no', inputConfig: {} }
  ],
  'Meetings & Calls': [
    { title: 'Stand-up Meeting', description: 'Daily team sync', category: 'Communication', type: 'yes_no', inputConfig: {} },
    { title: 'Client Calls', description: 'Client communication', category: 'Communication', type: 'quantity', inputConfig: { target: 2, unit: 'calls' } },
    { title: 'Team Collaboration', description: 'Work with team members', category: 'Teamwork', type: 'yes_no', inputConfig: {} }
  ],
  'Learning & Research': [
    { title: 'Learn New Tech', description: 'Study new technologies', category: 'Learning', type: 'quantity', inputConfig: { target: 1, unit: 'hours' } },
    { title: 'Read Articles', description: 'Technical blog posts', category: 'Learning', type: 'quantity', inputConfig: { target: 3, unit: 'articles' } },
    { title: 'Online Course', description: 'Complete course modules', category: 'Education', type: 'yes_no', inputConfig: {} }
  ]
};

// Main seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log(`⚙️  Configuration: ${SKIP_TODAY_COMPLETELY ? 'Skipping today completely' : `Today completion rate: ${TODAY_COMPLETION_RATE * 100}%`}`);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data for this user
    console.log('🗑️  Clearing old data...');
    await ParentRoutine.deleteMany({ user: USER_ID });
    await SubRoutine.deleteMany({ user: USER_ID });
    await Routine.deleteMany({ user: USER_ID });
    await RoutineLog.deleteMany({ user: USER_ID });
    console.log('✅ Old data cleared');

    // Create parent routines
    console.log('📝 Creating parent routines...');
    const parentRoutineMap = {};
    
    for (const parentData of sampleParentRoutines) {
      const parent = await ParentRoutine.create({
        user: USER_ID,
        ...parentData
      });
      parentRoutineMap[parentData.title] = parent;
      console.log(`   ✓ Created: ${parentData.title}`);
    }

    // Create sub-routines
    console.log('📝 Creating sub-routines...');
    const subRoutineMap = {};
    
    for (const [parentTitle, subRoutinesData] of Object.entries(sampleSubRoutines)) {
      const parent = parentRoutineMap[parentTitle];
      subRoutineMap[parentTitle] = {};
      
      for (const subData of subRoutinesData) {
        const sub = await SubRoutine.create({
          user: USER_ID,
          parent: parent._id,
          ...subData
        });
        subRoutineMap[parentTitle][subData.title] = sub;
        console.log(`   ✓ Created: ${subData.title} (under ${parentTitle})`);
      }
    }

    // Create routines
    console.log('📝 Creating routines...');
    const allRoutines = [];
    
    for (const [parentTitle, subs] of Object.entries(subRoutineMap)) {
      const parent = parentRoutineMap[parentTitle];
      
      for (const [subTitle, sub] of Object.entries(subs)) {
        const routinesData = sampleRoutines[subTitle] || [];
        
        for (const routineData of routinesData) {
          const routine = await Routine.create({
            user: USER_ID,
            parent: parent._id,
            subRoutine: sub._id,
            ...routineData
          });
          allRoutines.push(routine);
          console.log(`   ✓ Created: ${routineData.title}`);
        }
      }
    }

    // Generate completion history (RoutineLogs)
    console.log('📊 Generating completion history...');
    const today = new Date();
    let totalLogs = 0;
    
    for (let daysAgo = DAYS_BACK; daysAgo >= 0; daysAgo--) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateKey = formatDateKey(date);
      const isToday = daysAgo === 0;
      
      // Skip today if configured
      if (SKIP_TODAY_COMPLETELY && isToday) {
        console.log(`   ⏭️  Skipped today (${dateKey})`);
        continue;
      }
      
      for (const routine of allRoutines) {
        const willComplete = shouldComplete(date, isToday);
        const action = getAction(willComplete);
        
        // Skip some days randomly for realism (but less for today if we're keeping it)
        const skipChance = isToday ? 0.05 : 0.15;
        if (Math.random() < skipChance) continue;
        
        const value = (action === 'done' && routine.type !== 'yes_no') 
          ? generateValue(routine.type, routine.inputConfig) 
          : null;
        
        await RoutineLog.create({
          user: USER_ID,
          parent: routine.parent,
          subRoutine: routine.subRoutine,
          routine: routine._id,
          action,
          value,
          dateKey,
          timestamp: date
        });
        
        totalLogs++;
      }
      
      if (daysAgo % 10 === 0) {
        console.log(`   ✓ Generated logs for ${DAYS_BACK - daysAgo + 1}/${DAYS_BACK + 1} days`);
      }
    }

    console.log(`✅ Generated ${totalLogs} routine logs`);
    
    // Summary
    console.log('\n🎉 Seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Parent Routines: ${Object.keys(parentRoutineMap).length}`);
    console.log(`   - Sub-Routines: ${Object.values(subRoutineMap).flatMap(v => Object.keys(v)).length}`);
    console.log(`   - Routines: ${allRoutines.length}`);
    console.log(`   - Routine Logs: ${totalLogs}`);
    console.log(`   - Days of History: ${SKIP_TODAY_COMPLETELY ? DAYS_BACK : DAYS_BACK + 1}`);
    console.log(`   - Today's Status: ${SKIP_TODAY_COMPLETELY ? 'No logs (clean slate)' : `~${TODAY_COMPLETION_RATE * 100}% completion rate`}`);
    console.log(`   - User ID: ${USER_ID}`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seed
seedDatabase();