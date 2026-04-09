import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wrench,
  ArrowLeft,
  User,
  Phone,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get("role") === "technician" ? "technician" : "user";

  const { register, isLoading: loading, error, clearError } = useAuthStore();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: defaultRole as "user" | "technician",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Name validation
    if (!form.name.trim()) {
      errors.name = "Full name is required";
    } else if (form.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    } else if (form.name.trim().length > 50) {
      errors.name = "Name must be less than 50 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(form.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!form.password) {
      errors.password = "Password is required";
    } else if (form.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    // Phone validation (optional but must be valid if provided)
    if (form.phone.trim()) {
      const phoneRegex = /^(?:\+?977[- \s]?)?(?:98|97|96)\d{8}$/;
      if (!phoneRegex.test(form.phone)) {
        errors.phone = "Please enter a valid Nepali phone number (e.g., 98xxxxxxxx)";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }
    
    try {
      await register(form);
      if (form.role === "technician") {
        toast.success("Registered! Awaiting admin approval.");
        navigate("/technician");
      } else {
        toast.success(`Welcome, ${form.name}!`);
        navigate("/dashboard");
      }
    } catch {
      // error set in store
    }
  };

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
          <h2 className="text-4xl font-bold text-white leading-tight">
            {form.role === "technician"
              ? "Join as a Pro"
              : "Get Started Today"}
          </h2>
          <p className="mt-4 text-blue-100 text-lg leading-relaxed">
            {form.role === "technician"
              ? "Register as a technician to receive job requests in your area. Get verified and start earning."
              : "Create an account to book verified professionals for all your home service needs."}
          </p>
        </div>
        <div className="relative text-blue-200 text-sm">
          &copy; {new Date().getFullYear()} TechDispatch
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 no-underline"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <h1 className="text-2xl font-bold text-dark">Create Account</h1>
          <p className="mt-2 text-gray-500">
            Fill in your details to get started
          </p>

          {/* Role Toggle */}
          <div className="mt-5 flex bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: "user" }))}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer border-none ${
                form.role === "user"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 bg-transparent"
              }`}
            >
              I need a service
            </button>
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: "technician" }))}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all cursor-pointer border-none ${
                form.role === "technician"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 bg-transparent"
              }`}
            >
              I&apos;m a technician
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    formErrors.name ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {formErrors.name && (
                <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    formErrors.email ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+977 98XXXXXXXX"
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    formErrors.phone ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
              </div>
              {formErrors.phone && (
                <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  className={`w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    formErrors.password ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent p-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
              )}
            </div>

            {form.role === "technician" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-amber-50 border border-amber-100 rounded-lg"
              >
                <p className="text-sm text-amber-700">
                  <strong>Note:</strong> Technician accounts require admin
                  approval before you can receive job requests.
                </p>
              </motion.div>
            )}

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
                  Creating account...
                </span>
              ) : form.role === "technician" ? (
                "Register as Technician"
              ) : (
                "Create Account"
              )}
            </motion.button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline no-underline"
            >
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
