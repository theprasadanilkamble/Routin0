// Gemini AI Insights Route
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const RoutineLog = require('../models/RoutineLog');
const Routine = require('../models/Routine');
const ParentRoutine = require('../models/ParentRoutine');
const { requireUser } = require('../middleware/requireUser');

// You must set GEMINI_API_KEY in your environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/insights', requireUser, async (req, res) => {
  try {
    const { mode } = req.body; // 'today' or 'all'
    const userId = req.user._id;
    let logs;
    if (mode === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      logs = await RoutineLog.find({ user: userId, dateKey: today });
    } else {
      logs = await RoutineLog.find({ user: userId });
    }
    if (!logs.length) return res.json({ insight: 'No activity data to analyze.' });

    // Optionally enrich logs with routine/parent titles
    const routines = await Routine.find({ _id: { $in: logs.map(l => l.routine) } });
    const parents = await ParentRoutine.find({ _id: { $in: routines.map(r => r.parent) } });
    const routineMap = Object.fromEntries(routines.map(r => [r._id.toString(), r]));
    const parentMap = Object.fromEntries(parents.map(p => [p._id.toString(), p]));

    // Prepare a summary for Gemini
    const summary = logs.map(l => {
      const r = routineMap[l.routine.toString()];
      const p = parentMap[r?.parent?.toString()];
      return `Routine: ${r?.title || ''} (Parent: ${p?.title || ''}) | Action: ${l.action} | Value: ${l.value ?? ''} | Date: ${l.dateKey}`;
    }).join('\n');

    const prompt = `Analyze the following routine completion data and provide insights. Format your response with clear sections using **bold** for headers.

User Routine Logs:
${summary}

Provide your response in this exact format:

**📊 Key Patterns & Trends**
- [Bullet point about completion rates, streaks, consistency]
- [Bullet point about patterns observed]

**💪 Strengths**
- [Area where user is doing well]
- [Another strong area]

**🎯 Areas to Improve**
- [Weakest routine or area]
- [Specific challenge noticed]

**✨ One Actionable Improvement**
[One specific, concrete suggestion to improve routine adherence. Make it motivating and practical.]

Keep it brief, motivating, and data-driven. Use bullet points. Be encouraging!`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ insight: text });
  } catch (err) {
    console.error('Gemini AI error:', err);
    res.status(500).json({ error: 'Failed to get AI insight.' });
  }
});

module.exports = router;
