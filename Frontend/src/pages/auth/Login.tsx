import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearError = useAuthStore((state) => state.clearError);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      await login({ email, password });
      toast.success("Welcome back! Login successful.");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      console.error("Login failed", err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const credential = credentialResponse.credential;
      if (!credential) {
        toast.error("No Google credential received.");
        return;
      }
      setGoogleLoading(true);

      const res = await fetch("http://localhost:8001/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credential }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data?.accessToken) {
        const { accessToken, refreshToken, user } = data.data;
        useAuthStore
          .getState()
          .setAuthToken(accessToken, user, refreshToken);
        toast.success("Welcome! Google login successful.");
        navigate("/dashboard", { replace: true });
      } else {
        toast.error(data.message || "Google login failed. Please try again.");
      }
    } catch (err) {
      console.error("Google login error", err);
      toast.error("Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login was cancelled or failed.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <i className="fas fa-clock text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 text-sm">
            Sign in to your TimeTracker account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 placeholder:text-gray-400"
                placeholder="john.doe@company.com"
                required
              />
              <i className="fas fa-envelope absolute right-3 top-3.5 text-gray-400 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i
                  className={`fas ${
                    showPassword ? "fa-eye-slash" : "fa-eye"
                  } text-sm`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-200" />
          <span className="px-4 text-gray-500 text-sm font-medium">
            or continue with
          </span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <div className="flex justify-center">
          {googleLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 rounded-xl bg-gray-50">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-600 font-medium">
                Signing in with Google...
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_blue"
                size="large"
                text="signin_with"
                shape="pill"
              />
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200 hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
