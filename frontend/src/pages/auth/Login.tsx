// src/pages/auth/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login: React.FC = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth(); // use AuthContext

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // call AuthContext login (this sets token, user, isAuthenticated)
      await login(form.email, form.password);
      // simple redirect; ProtectedRoute will guard it
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#181f32]">
      <form
        onSubmit={handleSubmit}
        className="bg-[#222939] p-10 rounded-xl shadow-md w-full max-w-md flex flex-col gap-6"
      >
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined bg-blue-600 text-white rounded-full p-2 mb-2">
            groups
          </span>
          <span className="font-bold text-lg text-white mb-1">Synergy</span>
        </div>

        <h2 className="text-white text-2xl font-black text-center mb-1">
          Log in to your account
        </h2>
        <p className="text-[#afb8c7] text-sm text-center mb-2">
          Welcome back! Please enter your details.
        </p>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <div>
          <label className="block mb-1 text-[#b0b8cb] text-xs font-semibold">
            Email Address
          </label>
          <input
            className="block w-full bg-[#181f32] text-white rounded-lg border border-[#25304d] focus:ring-blue-500 py-2 px-3 placeholder-[#586279] outline-none"
            type="email"
            name="email"
            placeholder="yourname@company.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-[#b0b8cb] text-xs font-semibold">
            Password
          </label>
          <input
            className="block w-full bg-[#181f32] text-white rounded-lg border border-[#25304d] focus:ring-blue-500 py-2 px-3 placeholder-[#586279] outline-none"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex justify-end">
          <span className="text-blue-500 text-xs hover:underline cursor-pointer">
            Forgot your password?
          </span>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg mt-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <div className="flex items-center my-3">
          <div className="flex-1 h-px bg-[#353d50]" />
          <span className="text-xs text-[#afb8c7] px-3">OR</span>
          <div className="flex-1 h-px bg-[#353d50]" />
        </div>

        <button
          type="button"
          className="w-full py-2 bg-[#262e3f] text-white font-semibold rounded-lg flex items-center justify-center gap-2 mb-2"
        >
          <span className="material-symbols-outlined">account_circle</span>
          Sign in with Google
        </button>

        <button
          type="button"
          className="w-full py-2 bg-[#262e3f] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">account_circle</span>
          Sign in with Microsoft
        </button>

        <div className="text-center text-[#afb8c7] text-xs mt-3">
          Don&apos;t have an account?{' '}
          <span
            onClick={() => navigate('/register')}
            className="text-blue-500 hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </div>
      </form>
    </div>
  );
};

export default Login;
