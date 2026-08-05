import { useState, useEffect } from 'react';
import auth from '../services/auth';
import './AuthPage.css';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  role: 'Patient',
  dob: '',
  gender: '',
  departmentId: '',
  specialization: '',
  qualification: '',
  consultationFee: '',
  shiftStart: '',
  shiftEnd: '',
  loginRole: 'User',
  loginDoctorId: '',
  loginAdminId: '',
};

function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState([]);
  const [assignedId, setAssignedId] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentFetchError, setDepartmentFetchError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetState = () => {
    setForm(initialForm);
    setMessage('');
    setError('');
    setErrorDetails([]);
    setProfile(null);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetState();
  };

  const fetchDepartments = async () => {
    if (departments.length > 0) {
      return;
    }

    try {
      const response = await auth.getDepartments();
      setDepartments(response.data?.data?.departments || []);
      setDepartmentFetchError('');
    } catch (fetchError) {
      setDepartmentFetchError(
        fetchError?.response?.data?.message || 'Unable to load departments.'
      );
    }
  };

  useEffect(() => {
    if (mode === 'register' && form.role === 'Doctor') {
      fetchDepartments();
    }
  }, [mode, form.role]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setErrorDetails([]);
    setMessage('');
    setProfile(null);

    try {
      const payload = {
        email: form.email,
        password: form.password,
      };

          if (mode === 'register') {
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }

        payload.name = form.name;
        payload.phone = form.phone;
        payload.role = form.role;
        payload.dob = form.dob;
        payload.gender = form.gender;
        payload.departmentId = form.departmentId;
        payload.specialization = form.specialization;
        payload.qualification = form.qualification;
        payload.consultationFee = form.consultationFee;
        payload.shiftStart = form.shiftStart;
        payload.shiftEnd = form.shiftEnd;
      }

      if (mode === 'login') {
        if (form.loginRole === 'Doctor') {
          if (!form.loginDoctorId) {
            setError('Doctor ID is required for doctor login.');
            setLoading(false);
            return;
          }
          payload.doctorId = form.loginDoctorId;
        }
        if (form.loginRole === 'Admin') {
          if (!form.loginAdminId) {
            setError('Admin ID is required for admin login.');
            setLoading(false);
            return;
          }
          payload.adminId = form.loginAdminId;
        }
      }

      const response = await (mode === 'register'
        ? auth.register(payload)
        : auth.login(payload));

      const successMessage = response?.data?.message || `${mode === 'register' ? 'Registered' : 'Logged in'} successfully.`;
      const authToken = response?.data?.token || '';

      setMessage(successMessage);
      setToken(authToken);
      setAssignedId('');

      if (mode === 'register') {
        if (form.role === 'Doctor') {
          setAssignedId(`Doctor ID assigned after signup: ${response.data?.data?.user?.doctorId || ''}`);
        }
      }

      if (mode === 'login' && authToken) {
        const profileResponse = await auth.getProfile(authToken);
        setProfile(profileResponse.data.user || profileResponse.data);
      }
    } catch (submitError) {
      const apiMessage = submitError?.response?.data?.message;
      const apiErrors = submitError?.response?.data?.errors || [];
      setError(apiMessage || 'Unable to complete request. Please try again.');
      setErrorDetails(apiErrors);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchProfile = async () => {
    if (!token) {
      setError('No auth token available. Please log in first.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await auth.getProfile(token);
      setProfile(response.data.user || response.data);
      setMessage('Profile fetched successfully.');
    } catch (profileError) {
      const apiMessage = profileError?.response?.data?.message;
      setError(apiMessage || 'Unable to fetch profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-heading">MediNova Access</h1>
        <p className="auth-subtitle">Sign in or create an account with a modern healthcare access experience.</p>
        <div className="toggle-row">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={mode === 'login' ? 'active-button' : 'toggle-button'}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={mode === 'register' ? 'active-button' : 'toggle-button'}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <label className="auth-label">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="Your full name"
                />
              </label>

              <label className="auth-label">
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="auth-input"
                  placeholder="10-digit phone number"
                />
              </label>

              <label className="auth-label">
                Role
                <select name="role" value={form.role} onChange={handleChange} className="auth-input">
                  <option value="Patient">Patient</option>
                  <option value="Doctor">Doctor</option>
                </select>
              </label>

              {form.role === 'Patient' && (
                <>
                  <label className="auth-label">
                    Date of Birth
                    <input
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                      className="auth-input"
                    />
                  </label>
                  <label className="auth-label">
                    Gender
                    <select name="gender" value={form.gender} onChange={handleChange} className="auth-input">
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>
                </>
              )}

              {form.role === 'Doctor' && (
                <>
                  <label className="auth-label">
                    Department
                    <select
                      name="departmentId"
                      value={form.departmentId}
                      onChange={handleChange}
                      className="auth-input"
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option key={department._id} value={department._id}>
                          {department.departmentName}
                        </option>
                      ))}
                    </select>
                    <span className="field-hint">
                      {departments.length > 0
                        ? 'Choose your department from the list.'
                        : departmentFetchError || 'Loading departments...'}
                    </span>
                  </label>
                  <label className="auth-label">
                    Specialization
                    <input
                      name="specialization"
                      value={form.specialization}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="e.g. Cardiology"
                    />
                  </label>
                  <label className="auth-label">
                    Qualification
                    <input
                      name="qualification"
                      value={form.qualification}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="e.g. MBBS"
                    />
                  </label>
                  <label className="auth-label">
                    Consultation Fee
                    <input
                      name="consultationFee"
                      value={form.consultationFee}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="e.g. 500"
                      type="number"
                    />
                  </label>
                  <label className="auth-label">
                    Shift Start
                    <input
                      name="shiftStart"
                      value={form.shiftStart}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="e.g. 09:00"
                    />
                  </label>
                  <label className="auth-label">
                    Shift End
                    <input
                      name="shiftEnd"
                      value={form.shiftEnd}
                      onChange={handleChange}
                      className="auth-input"
                      placeholder="e.g. 17:00"
                    />
                  </label>
                </>
              )}
            </>
          )}

          <label className="auth-label">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="auth-input"
              placeholder="name@example.com"
              required
            />
          </label>

          <label className="auth-label">
            Password
            <div className="password-wrapper">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="Enter a secure password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="toggle-password-button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 9.5a3 3 0 0 0-4.5-2.6" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 14.5a3 3 0 0 0 4.5 2.6" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 2l20 20" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <label className="auth-label">
              Confirm Password
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={handleChange}
                className="auth-input"
                placeholder="Re-enter your password"
                required
              />
            </label>
          )}

          {mode === 'login' && (
            <>
              <label className="auth-label">
                Role
                <select name="loginRole" value={form.loginRole} onChange={handleChange} className="auth-input">
                  <option value="User">Patient / User</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Admin">Admin</option>
                </select>
              </label>

              {form.loginRole === 'Doctor' && (
                <label className="auth-label">
                  Doctor ID
                  <input
                    name="loginDoctorId"
                    value={form.loginDoctorId}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="Enter assigned doctor ID (e.g. car_001)"
                  />
                  <span className="field-hint">
                    Doctors should enter their assigned ID after signup. Email and password are still required.
                  </span>
                </label>
              )}

              {form.loginRole === 'Admin' && (
                <label className="auth-label">
                  Admin ID
                  <input
                    name="loginAdminId"
                    value={form.loginAdminId}
                    onChange={handleChange}
                    className="auth-input"
                    placeholder="ADM_001"
                  />
                </label>
              )}
            </>
          )}

          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Processing…' : mode === 'register' ? 'Create account' : 'Log in'}
          </button>
        </form>

        {token && mode === 'login' && (
          <button type="button" onClick={handleFetchProfile} className="secondary-button" disabled={loading}>
            Fetch protected profile
          </button>
        )}

        {message && <div className="success">{message}</div>}
        {assignedId && <div className="info">{assignedId}</div>}
        {error && <div className="error">{error}</div>}
        {errorDetails.length > 0 && (
          <ul className="error-list">
            {errorDetails.map((detail) => (
              <li key={detail.field}>{`${detail.field}: ${detail.message}`}</li>
            ))}
          </ul>
        )}

        {profile && (
          <div className="profile-box">
            <h2 className="profile-title">Profile</h2>
            <pre className="profile-json">{JSON.stringify(profile, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5fafd',
    padding: '2rem',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: '2rem',
    borderRadius: 16,
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.08)',
    background: '#ffffff',
  },
  heading: {
    margin: 0,
    marginBottom: '1rem',
    fontSize: '1.8rem',
    color: '#102a43',
  },
  toggleRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  toggleButton: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    background: '#f8fafc',
    color: '#334155',
    cursor: 'pointer',
  },
  activeButton: {
    flex: 1,
    padding: '0.75rem 1rem',
    border: '1px solid #0f172a',
    borderRadius: 10,
    background: '#0f172a',
    color: '#ffffff',
    cursor: 'pointer',
  },
  form: {
    display: 'grid',
    gap: '1rem',
  },
  label: {
    display: 'grid',
    gap: '0.5rem',
    fontSize: '0.95rem',
    color: '#334155',
  },
  passwordWrapper: {
    position: 'relative',
    display: 'grid',
  },
  input: {
    width: '100%',
    padding: '1rem 1.1rem',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.35)',
    background: 'rgba(248, 250, 252, 0.96)',
    fontSize: '1rem',
    color: '#0f172a',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  },
  togglePasswordButton: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '0.55rem 0.75rem',
    borderRadius: 9999,
    border: 'none',
    background: 'rgba(15, 23, 42, 0.08)',
    color: '#0f172a',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  fieldHint: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  errorList: {
    marginTop: '0.75rem',
    paddingLeft: '1.2rem',
    color: '#991b1b',
  },
  submitButton: {
    width: '100%',
    padding: '1rem 1.1rem',
    borderRadius: 16,
    border: 'none',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    color: '#ffffff',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 18px 40px rgba(59, 130, 246, 0.22)',
  },
  secondaryButton: {
    width: '100%',
    marginTop: '0.75rem',
    padding: '0.95rem 1rem',
    borderRadius: 16,
    border: '1px solid rgba(15, 23, 42, 0.12)',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  success: {
    marginTop: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: 12,
    background: '#e0f2fe',
    color: '#0c4a6e',
  },
  error: {
    marginTop: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: 12,
    background: '#fee2e2',
    color: '#991b1b',
  },
  info: {
    marginTop: '1rem',
    padding: '0.85rem 1rem',
    borderRadius: 12,
    background: '#eaf8ff',
    color: '#14532d',
  },
  profileBox: {
    marginTop: '1.25rem',
    padding: '1rem',
    borderRadius: 16,
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: '#f8fafc',
  },
  profileTitle: {
    margin: 0,
    marginBottom: '0.75rem',
    fontSize: '1rem',
    color: '#0f172a',
  },
  profileJson: {
    margin: 0,
    fontSize: '0.85rem',
    lineHeight: 1.6,
    color: '#334155',
    whiteSpace: 'pre-wrap',
  },
};

export default AuthPage;
