import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/Login/LoginPage';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/Home/home';
import SubRoutinePage from './pages/SubRoutine/SubRoutinePage';
import RoutineDetailPage from './pages/Routines/RoutineDetailPage';
import TodayReportPage from './pages/Reports/TodayReportPage';
import AllReportPage from './pages/Reports/AllReportPage';
import { RoutinesProvider } from './context/RoutinesContext';

function App() {
  const { user, logout } = useAuth();

  if (user === undefined) {
    return (
      <div className="loading-shell">
        <div className="loading-spinner" />
        <p>Loading your workspace…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <RoutinesProvider>
      <BrowserRouter>
        <div className="routino-main-app">
          <header className="main-app-header">
            <div className="app-logo">
              <i className="fas fa-infinity logo-icon"></i>
              <span className="logo-text">Routino</span>
            </div>
            <button className="nav-btn" onClick={logout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </header>

          <div className="container">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/sub-routines/:parentId"
                element={<SubRoutinePage />}
              />
              <Route
                path="/routines/:parentId/:subId"
                element={<RoutineDetailPage />}
              />
              <Route path="/reports/today" element={<TodayReportPage />} />
              <Route path="/reports/all" element={<AllReportPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </RoutinesProvider>
  );
}

export default App;

