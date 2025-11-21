import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchAllAnalytics } from '../../lib/api';

const AllReportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await fetchAllAnalytics(user);
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
          <p>Loading complete report...</p>
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
          <h2>No activities yet</h2>
          <p>Start marking your routines to see your complete progress here!</p>
        </div>
      </div>
    );
  }

  const { summary, byCategory, byParent, byDate, logs } = data;
  const completionRate = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;
  const daysActive = Object.keys(byDate).length;
  const avgPerDay = daysActive > 0 ? Math.round(summary.total / daysActive) : 0;

  const dateEntries = Object.entries(byDate)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .slice(0, 30);

  return (
    <div className="report-page">
      <button className="back-button" onClick={() => navigate('/')}>
        <i className="fas fa-arrow-left"></i>
        <span>Back to Home</span>
      </button>

      <div className="report-header-section">
        <div>
          <h1>Complete Report</h1>
          <p className="report-subtitle">
            {summary.startDate && `Since ${new Date(summary.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            {summary.startDate && ' • '}
            {daysActive} active day{daysActive !== 1 ? 's' : ''}
          </p>
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
        <div className="summary-stat">
          <div className="summary-value">{daysActive}</div>
          <div className="summary-label">Active Days</div>
        </div>
        <div className="summary-stat">
          <div className="summary-value">{avgPerDay}</div>
          <div className="summary-label">Avg per Day</div>
        </div>
      </div>

      {dateEntries.length > 0 && (
        <div className="report-section">
          <h3>Last 30 Days Activity</h3>
          <div className="daily-chart">
            {dateEntries.map(([date, stats]) => {
              const maxTotal = Math.max(...dateEntries.map(([, s]) => s.total), 1);
              const height = (stats.total / maxTotal) * 100;
              const doneHeight = stats.total > 0 ? (stats.done / stats.total) * height : 0;
              const dateObj = new Date(date);
              const dayLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <div key={date} className="daily-bar-item">
                  <div className="daily-bar-container">
                    <div className="daily-bar-wrapper">
                      <div
                        className="daily-bar done-bar"
                        style={{ height: `${doneHeight}%` }}
                        title={`${stats.done} done`}
                      />
                      <div
                        className="daily-bar other-bar"
                        style={{ height: `${height - doneHeight}%`, marginTop: `${doneHeight}%` }}
                        title={`${stats.total - stats.done} other`}
                      />
                    </div>
                  </div>
                  <div className="daily-bar-label">{dayLabel}</div>
                  <div className="daily-bar-value">{stats.total}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Object.keys(byParent).length > 0 && (
        <div className="report-section">
          <h3>By Parent Routine</h3>
          <div className="parent-breakdown">
            {Object.entries(byParent)
              .sort(([, a], [, b]) => b.total - a.total)
              .map(([parentTitle, stats]) => {
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
              .map(([category, count]) => {
                const percentage = Math.round((count / summary.total) * 100);
                return (
                  <div key={category} className="category-stat-item">
                    <div className="category-stat-info">
                      <span className="category-name">{category}</span>
                      <span className="category-percentage">{percentage}%</span>
                    </div>
                    <div className="category-stat-bar">
                      <div
                        className="category-stat-fill"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="category-count">{count} activities</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllReportPage;

