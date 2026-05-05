import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = "Please provide a valid email";
    if (!password) errors.password = "Password is required";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      toast.success(`Welcome back, ${user?.name}!`);
      navigate(user?.role === "admin" ? "/admin" : user?.role === "technician" ? "/technician" : "/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      if (e?.response?.data?.message?.toLowerCase().includes("pending")) {
        toast.error("Your account is awaiting admin approval.");
      }
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
      hasError ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">TechDispatch</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Sign In</h1>
        <p className="text-gray-500 text-sm text-center mt-1 mb-6">Enter your credentials to access your account</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass(!!fieldErrors.email)}
              />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass(!!fieldErrors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-medium hover:underline no-underline">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
