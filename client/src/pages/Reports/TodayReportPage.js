import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchTodayAnalytics } from '../../lib/api';

const TodayReportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchTodayAnalytics(user);
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="page-shell">
        <div className="report-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading today's report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="report-error">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error loading report</h3>
          <p>{error}</p>
          <button className="nav-btn" onClick={() => navigate('/')}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.logs.length === 0) {
    return (
      <div className="report-page">
        <button className="back-button" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i>
          <span>Back to Home</span>
        </button>

        <div className="report-empty">
          <i className="fas fa-inbox"></i>
          <h2>No activities today</h2>
          <p>Start marking your routines to see your progress here!</p>
        </div>
      </div>
    );
  }

  const { summary, byCategory, byParent, logs } = data;
  const completionRate = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  return (
    <div className="report-page">
      <button className="back-button" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
        <span>Back to Home</span>
      </button>

      <div className="report-header-section">
        <div>
          <h1>Today's Report</h1>
          <p className="report-date">{new Date(data.dateKey).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="report-summary">
        <div className="summary-stat">
          <div className="summary-value">{summary.total}</div>
          <div className="summary-label">Total Activities</div>
        </div>
        <div className="summary-stat success">
          <div className="summary-value">{summary.done}</div>
          <div className="summary-label">Completed</div>
        </div>
        <div className="summary-stat warning">
          <div className="summary-value">{summary.notDone}</div>
          <div className="summary-label">Not Done</div>
        </div>
        <div className="summary-stat info">
          <div className="summary-value">{completionRate}%</div>
          <div className="summary-label">Completion Rate</div>
        </div>
      </div>

      {Object.keys(byParent).length > 0 && (
        <div className="report-section">
          <h3>By Parent Routine</h3>
          <div className="parent-breakdown">
            {Object.entries(byParent).map(([parentTitle, stats]) => {
              const parentRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
              return (
                <div key={parentTitle} className="parent-stat-card">
                  <div className="parent-stat-header">
                    <h4>{parentTitle}</h4>
                    <span className="parent-stat-rate">{parentRate}%</span>
                  </div>
                  <div className="parent-stat-details">
                    <span className="stat-badge done">{stats.done} Done</span>
                    <span className="stat-badge not-done">{stats.notDone} Not Done</span>
                    <span className="stat-badge skipped">{stats.skipped} Skipped</span>
                    <span className="stat-badge total">{stats.total} Total</span>
                  </div>
                  <div className="parent-stat-progress">
                    <div
                      className="parent-stat-progress-bar"
                      style={{ width: `${parentRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(byCategory).length > 0 && (
        <div className="report-section">
          <h3>By Category</h3>
          <div className="category-breakdown">
            {Object.entries(byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category} className="category-stat-item">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="report-section">
        <h3>Activity Timeline</h3>
        <div className="activity-timeline">
          {logs.map((log, idx) => {
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const actionColors = {
              done: '#16a34a',
              not_done: '#dc2626',
              skip: '#f59e0b',
              pass: '#3b82f6',
            };
            const actionLabels = {
              done: 'Done',
              not_done: 'Not Done',
              skip: 'Skipped',
              pass: 'Passed',
            };

            return (
              <div key={idx} className="activity-timeline-item">
                <div className="timeline-time">{time}</div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-routine">{log.routine?.title || 'Unknown Routine'}</span>
                    <span
                      className="timeline-action"
                      style={{ color: actionColors[log.action] || '#666' }}
                    >
                      {actionLabels[log.action] || log.action}
                    </span>
                  </div>
                  <div className="timeline-meta">
                    <span className="timeline-parent">{log.parent?.title || 'Unknown'}</span>
                    <span className="timeline-separator">•</span>
                    <span className="timeline-sub">{log.subRoutine?.title || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TodayReportPage;

