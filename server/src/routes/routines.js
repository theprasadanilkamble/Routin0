const express = require('express');
const ParentRoutine = require('../models/ParentRoutine');
const SubRoutine = require('../models/SubRoutine');
const Routine = require('../models/Routine');
const RoutineLog = require('../models/RoutineLog');

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const serializeHierarchy = async (parents, subs, routines, userId) => {
  const subsByParent = subs.reduce((acc, sub) => {
    acc[sub.parent.toString()] = acc[sub.parent.toString()] || [];
    acc[sub.parent.toString()].push(sub);
    return acc;
  }, {});

  const routinesBySub = routines.reduce((acc, routine) => {
    acc[routine.subRoutine.toString()] = acc[routine.subRoutine.toString()] || [];
    acc[routine.subRoutine.toString()].push(routine);
    return acc;
  }, {});

  // Calculate completion for each parent based on routine logs
  // Get all routine IDs grouped by parent
  const routinesByParent = {};
  routines.forEach((routine) => {
    const parentId = routine.parent.toString();
    if (!routinesByParent[parentId]) {
      routinesByParent[parentId] = [];
    }
    routinesByParent[parentId].push(routine._id);
  });

  // Calculate completion for each parent
  const completionMap = {};
  
  for (const [parentId, routineIds] of Object.entries(routinesByParent)) {
    const logs = await RoutineLog.find({
      user: userId,
      routine: { $in: routineIds },
    }).lean();

    if (logs.length > 0) {
      const doneCount = logs.filter((log) => log.action === 'done').length;
      const completion = Math.round((doneCount / logs.length) * 100);
      completionMap[parentId] = completion;
    } else {
      completionMap[parentId] = 0;
    }
  }

  return parents.map((parent) => {
    const parentId = parent._id.toString();
    const subList = (subsByParent[parentId] || []).map((sub) => {
      const subId = sub._id.toString();
      return {
        ...sub,
        routines: routinesBySub[subId] || [],
      };
    });

    // Calculate total routines under this parent
    const totalRoutines = subList.reduce((sum, sub) => sum + sub.routines.length, 0);
    const completion = completionMap[parentId] || 0;

    return {
      ...parent,
      subRoutines: subList,
      completion,
      totalRoutines,
    };
  });
};

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const [parents, subs, routines] = await Promise.all([
      ParentRoutine.find({ user: userId }).lean(),
      SubRoutine.find({ user: userId }).lean(),
      Routine.find({ user: userId }).lean(),
    ]);

    const serialized = await serializeHierarchy(parents, subs, routines, userId);

    res.json({
      parents: serialized,
    });
  })
);

router.post(
  '/parents',
  asyncHandler(async (req, res) => {
    const { title, category, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const parent = await ParentRoutine.create({
      user: req.user._id,
      title,
      category,
      description,
    });

    res.status(201).json(parent);
  })
);

router.post(
  '/parents/:parentId/sub-routines',
  asyncHandler(async (req, res) => {
    const { title, category } = req.body;
    const { parentId } = req.params;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const parent = await ParentRoutine.findOne({ _id: parentId, user: req.user._id });
    if (!parent) {
      return res.status(404).json({ message: 'Parent routine not found' });
    }

    const subRoutine = await SubRoutine.create({
      user: req.user._id,
      parent: parent._id,
      title,
      category,
    });

    res.status(201).json(subRoutine);
  })
);

router.post(
  '/sub-routines/:subId/routines',
  asyncHandler(async (req, res) => {
    const { subId } = req.params;
    const { title, description, category, type, inputConfig } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const subRoutine = await SubRoutine.findOne({ _id: subId, user: req.user._id });
    if (!subRoutine) {
      return res.status(404).json({ message: 'Sub-routine not found' });
    }

    const routine = await Routine.create({
      user: req.user._id,
      parent: subRoutine.parent,
      subRoutine: subRoutine._id,
      title,
      description,
      category,
      type,
      inputConfig,
    });

    res.status(201).json(routine);
  })
);

router.post(
  '/:routineId/mark',
  asyncHandler(async (req, res) => {
    const { routineId } = req.params;
    const { action, value } = req.body;

    if (!['not_done', 'skip', 'pass', 'done'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const routine = await Routine.findOne({ _id: routineId, user: req.user._id });

    if (!routine) {
      return res.status(404).json({ message: 'Routine not found' });
    }

    const dateKey = new Date().toISOString().slice(0, 10);

    const logEntry = await RoutineLog.create({
      user: req.user._id,
      parent: routine.parent,
      subRoutine: routine.subRoutine,
      routine: routine._id,
      action,
      value,
      dateKey,
    });

    res.status(201).json(logEntry);
  })
);

router.get(
  '/logs/daily',
  asyncHandler(async (req, res) => {
    const dateKey = req.query.date || new Date().toISOString().slice(0, 10);
    const logs = await RoutineLog.find({ user: req.user._id, dateKey })
      .populate('parent', 'title category')
      .populate('subRoutine', 'title category')
      .populate('routine', 'title category description')
      .sort({ timestamp: -1 })
      .lean();

    res.json({ dateKey, logs });
  })
);

router.get(
  '/logs/all',
  asyncHandler(async (req, res) => {
    const logs = await RoutineLog.find({ user: req.user._id })
      .populate('parent', 'title category')
      .populate('subRoutine', 'title category')
      .populate('routine', 'title category description')
      .sort({ timestamp: -1 })
      .lean();

    res.json({ logs });
  })
);

router.get(
  '/logs/analytics/today',
  asyncHandler(async (req, res) => {
    const dateKey = new Date().toISOString().slice(0, 10);
    const logs = await RoutineLog.find({ user: req.user._id, dateKey })
      .populate('parent', 'title category')
      .populate('subRoutine', 'title category')
      .populate('routine', 'title category description')
      .sort({ timestamp: -1 })
      .lean();

    const total = logs.length;
    const done = logs.filter((l) => l.action === 'done').length;
    const notDone = logs.filter((l) => l.action === 'not_done').length;
    const skipped = logs.filter((l) => l.action === 'skip').length;
    const passed = logs.filter((l) => l.action === 'pass').length;

    const byCategory = logs.reduce((acc, log) => {
      const cat = log.routine?.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const byParent = logs.reduce((acc, log) => {
      const parentTitle = log.parent?.title || 'Unknown';
      if (!acc[parentTitle]) {
        acc[parentTitle] = { total: 0, done: 0, notDone: 0, skipped: 0 };
      }
      acc[parentTitle].total++;
      if (log.action === 'done') acc[parentTitle].done++;
      if (log.action === 'not_done') acc[parentTitle].notDone++;
      if (log.action === 'skip') acc[parentTitle].skipped++;
      return acc;
    }, {});

    res.json({
      dateKey,
      summary: { total, done, notDone, skipped, passed },
      byCategory,
      byParent,
      logs,
    });
  })
);

router.get(
  '/logs/analytics/all',
  asyncHandler(async (req, res) => {
    const logs = await RoutineLog.find({ user: req.user._id })
      .populate('parent', 'title category')
      .populate('subRoutine', 'title category')
      .populate('routine', 'title category description')
      .sort({ timestamp: -1 })
      .lean();

    const total = logs.length;
    const done = logs.filter((l) => l.action === 'done').length;
    const notDone = logs.filter((l) => l.action === 'not_done').length;
    const skipped = logs.filter((l) => l.action === 'skip').length;
    const passed = logs.filter((l) => l.action === 'pass').length;

    const byCategory = logs.reduce((acc, log) => {
      const cat = log.routine?.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const byParent = logs.reduce((acc, log) => {
      const parentTitle = log.parent?.title || 'Unknown';
      if (!acc[parentTitle]) {
        acc[parentTitle] = { total: 0, done: 0, notDone: 0, skipped: 0 };
      }
      acc[parentTitle].total++;
      if (log.action === 'done') acc[parentTitle].done++;
      if (log.action === 'not_done') acc[parentTitle].notDone++;
      if (log.action === 'skip') acc[parentTitle].skipped++;
      return acc;
    }, {});

    const byDate = logs.reduce((acc, log) => {
      const date = log.dateKey || new Date(log.timestamp).toISOString().slice(0, 10);
      if (!acc[date]) {
        acc[date] = { total: 0, done: 0 };
      }
      acc[date].total++;
      if (log.action === 'done') acc[date].done++;
      return acc;
    }, {});

    const firstLog = logs[logs.length - 1];
    const startDate = firstLog ? new Date(firstLog.timestamp).toISOString().slice(0, 10) : null;

    res.json({
      summary: { total, done, notDone, skipped, passed, startDate },
      byCategory,
      byParent,
      byDate,
      logs,
    });
  })
);

module.exports = router;


