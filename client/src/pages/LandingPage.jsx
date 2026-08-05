import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">Welcome to MediNova</h1>
        <p className="auth-subtitle">
          This is your future landing page. For now, it serves as a styled entry point while
          preserving the authentication experience.
        </p>
        <div className="toggle-row">
          <button type="button" className="active-button" onClick={() => navigate('/login')}>
            Go to login
          </button>
          <button type="button" className="toggle-button" onClick={() => navigate('/register')}>
            Signup again
          </button>
        </div>
        <div className="info" style={{ marginTop: '1.5rem' }}>
          MediNova is ready for the next page. This welcome panel is the starting point for
          your future app shell.
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
