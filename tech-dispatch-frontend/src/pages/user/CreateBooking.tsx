import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { SERVICE_TYPES, getServiceByKey } from "../../config/services";
import Navbar from "../../components/layout/Navbar";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { MapPin, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

export default function CreateBooking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("service") || "";

  const [selectedService, setSelectedService] = useState(preselected);
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation([pos.coords.longitude, pos.coords.latitude]);
        setLoadingLocation(false);
        toast.success("Location captured!");
      },
      () => {
        setLoadingLocation(false);
        toast.error("Failed to get location");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }
    if (!location) {
      toast.error("Please share your location");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/bookings", {
        serviceType: selectedService,
        userLocation: location,
      });
      toast.success("Booking created! Finding technicians...");
      navigate("/my-bookings");
    } catch {
      toast.error("Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  const selected = getServiceByKey(selectedService);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 cursor-pointer border-none bg-transparent p-0"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-dark">Book a Service</h1>
          <p className="text-gray-500 mt-1">
            Select a service type and share your location
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              What do you need help with?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICE_TYPES.map((service) => (
                <motion.button
                  key={service.key}
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedService(service.key)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-white text-center ${
                    selectedService === service.key
                      ? "border-primary shadow-md shadow-primary/10"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: service.bg }}
                  >
                    <service.icon
                      size={20}
                      style={{ color: service.color }}
                    />
                  </div>
                  <span className="text-xs font-medium text-dark">
                    {service.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Location
            </label>
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              {location ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-dark">
                      Location Captured
                    </p>
                    <p className="text-xs text-gray-400">
                      {location[1].toFixed(4)}, {location[0].toFixed(4)}
                    </p>
                  </div>
                </div>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGetLocation}
                  disabled={loadingLocation}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:border-primary hover:text-primary transition-all cursor-pointer bg-transparent disabled:opacity-50"
                >
                  {loadingLocation ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <MapPin size={18} />
                      Share Your Location
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>

          {/* Summary */}
          {selected && location && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/10 rounded-xl p-5"
            >
              <h3 className="text-sm font-semibold text-dark mb-2">
                Booking Summary
              </h3>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selected.bg }}
                >
                  <selected.icon
                    size={20}
                    style={{ color: selected.color }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark">
                    {selected.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selected.description}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={submitting || !selectedService || !location}
            className="w-full py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors cursor-pointer border-none text-sm disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Creating booking...
              </span>
            ) : (
              "Book Now"
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
