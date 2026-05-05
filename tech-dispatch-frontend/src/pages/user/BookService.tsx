import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, MapPin, Loader2, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { SERVICE_TYPES } from "../../config/services";
import { jobService } from "../../services/jobService";
import { useJobStore } from "../../store/jobStore";

export default function BookService() {
  const navigate = useNavigate();
  const setActiveJob = useJobStore((s) => s.setActiveJob);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success("Location detected!");
      },
      () => {
        toast.error("Could not detect location. Please allow location access.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error("Please select a service type.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please describe the issue.");
      return;
    }
    if (!coords) {
      toast.error("Please detect your location first.");
      return;
    }

    setSubmitting(true);
    try {
      const job = await jobService.createJob({
        serviceType: selectedService,
        description: description.trim(),
        lat: coords.lat,
        lng: coords.lng,
        clientAddress: address.trim() || undefined,
      });
      setActiveJob(job.data);
      toast.success("Request submitted! Finding a technician…");
      navigate("/track");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Wrench size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TechDispatch</span>
          </Link>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Book a Service</h1>
          <p className="text-gray-500 mt-1">Select the type of service you need and we'll find the nearest technician.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Service type grid */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">1. Select Service Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICE_TYPES.map((s) => {
                const Icon = s.icon;
                const selected = selectedService === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSelectedService(s.key)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer text-center ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: s.bg }}
                    >
                      <Icon size={20} style={{ color: s.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">2. Describe the Issue</h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Water is leaking under the kitchen sink..."
              maxLength={500}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/500</p>
          </div>

          {/* Location */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">3. Your Location</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={detectLocation}
                disabled={locating}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} className="text-blue-500" />}
                {locating ? "Detecting location…" : coords ? "Location detected ✓" : "Detect my location"}
              </button>

              {coords && (
                <p className="text-xs text-gray-500">
                  GPS: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}

              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street address (optional)"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedService || !description.trim() || !coords}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Find a Technician
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
