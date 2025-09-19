import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person } from '@mui/icons-material';
import { loginApi, registerApi, saveToken } from '../services/api';

const Auth = ({ onSubmit }) => {
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [login, setLogin] = useState({ email: '', password: '' });
  const [signup, setSignup] = useState({ name: '', email: '', password: '' });

  const validateEmail = (value) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);
  const minPass = (value) => (value || '').length >= 6;

  const handleLogin = async () => {
    setError('');
    if (!validateEmail(login.email)) { setError('Enter a valid email.'); return; }
    if (!minPass(login.password)) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const data = await loginApi({ email: login.email, password: login.password });
      if (data.token) saveToken(data.token);
      if (onSubmit) await onSubmit({ mode: 'login', payload: login, response: data });
      setError('');
    } catch (e) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    if (!signup.name.trim()) { setError('Name is required.'); return; }
    if (!validateEmail(signup.email)) { setError('Enter a valid email.'); return; }
    if (!minPass(signup.password)) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const data = await registerApi({ name: signup.name, email: signup.email, password: signup.password });
      if (data.token) saveToken(data.token);
      if (onSubmit) await onSubmit({ mode: 'signup', payload: signup, response: data });
      setError('');
    } catch (e) {
      setError(e?.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
      <Paper sx={{ width: 420, bgcolor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
        {loading && <LinearProgress sx={{ borderTopLeftRadius: 4, borderTopRightRadius: 4 }} />}
        <Box sx={{ px: 3, pt: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Welcome</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to continue or create a new account.
          </Typography>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" centered>
          <Tab label="Login" />
          <Tab label="Sign Up" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {tab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
                fullWidth
                disabled={loading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button variant="contained" disabled={loading} onClick={handleLogin} sx={{ bgcolor: '#00bcd4' }}>
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Sign In'}
              </Button>
            </Box>
          )}

          {tab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Full Name"
                value={signup.name}
                onChange={(e) => setSignup({ ...signup, name: e.target.value })}
                fullWidth
                disabled={loading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
              />
              <TextField
                label="Email"
                type="email"
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })}
                fullWidth
                disabled={loading}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
              />
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })}
                helperText="At least 6 characters"
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button variant="contained" disabled={loading} onClick={handleSignup} sx={{ bgcolor: '#00bcd4' }}>
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create Account'}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Auth;


