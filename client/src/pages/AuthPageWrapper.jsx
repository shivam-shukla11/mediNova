import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

function AuthPageWrapper() {
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

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
    setAssignedId('');
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
      const authToken = response?.data?.data?.token || '';

      setMessage(successMessage);
      setToken(authToken);
      setAssignedId('');

      if (mode === 'register') {
        if (form.role === 'Doctor') {
          setAssignedId(`Doctor ID assigned after signup: ${response.data?.data?.user?.doctorId || ''}`);
        }
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else if (mode === 'login' && authToken) {
        navigate('/landing');
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
            onClick={() => {
              navigate('/login');
              resetState();
            }}
            className={mode === 'login' ? 'active-button' : 'toggle-button'}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              navigate('/register');
              resetState();
            }}
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
                {showPassword ? 'Hide' : 'Show'}
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

export default AuthPageWrapper;
