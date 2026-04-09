import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useForm, validators } from "../../hooks/useForm";
import { Mail, Lock, Eye, EyeOff, Wrench, ArrowLeft, Check } from "lucide-react";
import toast from "react-hot-toast";

interface LoginForm extends Record<string, unknown> {
  email: string;
  password: string;
}

const validateLogin = (values: LoginForm) => {
  const errors: Record<string, string> = {};
  errors.email = validators.email(values.email);
  errors.password = validators.password(values.password);
  return Object.fromEntries(Object.entries(errors).filter(([, v]) => v));
};

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading: loading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const { values, errors: formErrors, setValue, handleSubmit } = useForm<LoginForm>({
    initialValues: { email: "", password: "" },
    validate: validateLogin,
    onSubmit: async (values) => {
      clearError();
      try {
        await login(values.email, values.password);
        const user = useAuthStore.getState().user;
        toast.success(`Welcome back, ${user?.name}!`);
        navigate(user?.role === "admin" ? "/admin" : user?.role === "technician" ? "/technician" : "/dashboard");
      } catch {
        // error set in store
      }
    },
  });

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
      hasError ? "border-red-300 bg-red-50" : "border-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/20 rounded-full" />
        </div>
        <div className="relative">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Wrench size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TechDispatch</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight">Welcome back!</h2>
          <p className="mt-4 text-blue-100 text-lg leading-relaxed">
            Sign in to manage your bookings, track service requests, and connect with verified professionals.
          </p>
        </div>
        <div className="relative text-blue-200 text-sm">&copy; {new Date().getFullYear()} TechDispatch</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-8 no-underline">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Wrench size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-dark">Tech<span className="text-primary">Dispatch</span></span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-dark">Sign In</h1>
          <p className="mt-2 text-gray-500">Enter your credentials to access your account</p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => setValue("email", e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass(!!formErrors.email)}
                />
              </div>
              {formErrors.email && <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => setValue("password", e.target.value)}
                  placeholder="••••••••"
                  className={inputClass(!!formErrors.password)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent p-0">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.password && <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>}
            </div>

            <div className="flex items-center">
              <button type="button" onClick={() => setRememberMe(!rememberMe)} className={`flex items-center gap-2 text-sm text-gray-600 cursor-pointer border-none bg-transparent p-0 ${rememberMe ? "text-primary" : ""}`}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? "bg-primary border-primary" : "border-gray-300 bg-white"}`}>
                  {rememberMe && <Check size={14} className="text-white" />}
                </div>
                Remember me on this device
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-primary font-medium hover:underline no-underline">Create Account</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
