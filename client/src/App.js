import './App.css';
import LoginPage from './pages/Login/LoginPage';
import { useAuth } from './context/AuthContext';
import RoutinesApp from './pages/Home/home';

function App() {
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return (
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

      <div className='container'>
        <RoutinesApp/>
      </div>
    </div>
  )
}

export default App;
