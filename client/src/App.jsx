import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPageWrapper from './pages/AuthPageWrapper';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPageWrapper />} />
        <Route path="/register" element={<AuthPageWrapper />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
