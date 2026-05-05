import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Wrench, User, Phone } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "user" as "user" | "technician" });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: "" }));
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) errors.name = "Name must be at least 2 characters";
    if (form.name.trim().length > 50) errors.name = "Name must be less than 50 characters";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Please enter a valid email address";
    if (!form.password || form.password.length < 6) errors.password = "Password must be at least 6 characters";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    setFieldErrors({});

    try {
      const payload = form.role === "technician"
        ? { ...form, skills: selectedSkills }
        : form;
      const { pending } = await register(payload);
      if (pending) {
        toast.success("Registered! Awaiting admin approval.");
        navigate("/technician-pending");
      } else {
        toast.success(`Welcome, ${form.name}!`);
        navigate("/dashboard");
      }
    } catch {
      // error handled in store
    }
  };

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
      fieldErrors[field] ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
    }`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">TechDispatch</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center">Create Account</h1>
        <p className="text-gray-500 text-sm text-center mt-1 mb-5">Fill in your details to get started</p>

        {/* Role Toggle */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
          {(["user", "technician"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm((p) => ({ ...p, role: r }))}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer border-none ${
                form.role === r ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 bg-transparent"
              }`}
            >
              {r === "user" ? "I need a service" : "I'm a technician"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className={inputClass("name")} />
            </div>
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass("email")} />
            </div>
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="98xxxxxxxx" className={inputClass("phone")} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Min 6 characters"
                className={`${inputClass("password")} pr-10`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
          </div>

          {form.role === "technician" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Skills</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "plumbing", label: "Plumbing" },
                  { key: "electrical", label: "Electrical" },
                  { key: "hvac", label: "HVAC" },
                  { key: "appliance_repair", label: "Appliance Repair" },
                  { key: "carpentry", label: "Carpentry" },
                  { key: "painting", label: "Painting" },
                  { key: "cleaning", label: "Cleaning" },
                  { key: "general_maintenance", label: "General Maintenance" },
                ].map(({ key, label }) => {
                  const active = selectedSkills.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedSkills((prev) =>
                          active ? prev.filter((s) => s !== key) : [...prev, key]
                        )
                      }
                      className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-left cursor-pointer ${
                        active
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedSkills.length === 0 && (
                <p className="mt-1.5 text-xs text-gray-400">Select at least one skill so jobs can be matched to you.</p>
              )}
            </div>
          )}

          {form.role === "technician" && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
              Technician accounts require admin approval before you can log in.
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating account...
              </span>
            ) : form.role === "technician" ? "Register as Technician" : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline no-underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
