import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Register: React.FC = () => {
  const [form, setForm] = useState({
  name: '', email: '', password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <span className="material-symbols-outlined bg-blue-600 text-white rounded-full p-2 mb-2">groups</span>
          <span className="font-bold text-lg text-white mb-1">Synergy</span>
        </div>
        <h2 className="text-white text-2xl font-black text-center mb-1">Create your account</h2>
        <p className="text-[#afb8c7] text-sm text-center mb-2">Sign up and start your journey.</p>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}

        <input
          className="block w-full bg-[#181f32] text-white rounded-lg border border-[#25304d] focus:ring-blue-500 py-2 px-3 placeholder-[#586279] outline-none"
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="block w-full bg-[#181f32] text-white rounded-lg border border-[#25304d] focus:ring-blue-500 py-2 px-3 placeholder-[#586279] outline-none"
          type="email"
          name="email"
          placeholder="yourname@company.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="block w-full bg-[#181f32] text-white rounded-lg border border-[#25304d] focus:ring-blue-500 py-2 px-3 placeholder-[#586279] outline-none"
          type="password"
          name="password"
          placeholder="Create a password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg mt-2 transition"
          disabled={loading}
        >
          {loading ? "Registering..." : "Sign Up"}
        </button>
        <div className="text-center text-[#afb8c7] text-xs mt-3">
          Already have an account?{" "}
          <span onClick={() => navigate('/login')} className="text-blue-500 hover:underline cursor-pointer">
            Log in
          </span>
        </div>
      </form>
    </div>
  );
};

export default Register;
