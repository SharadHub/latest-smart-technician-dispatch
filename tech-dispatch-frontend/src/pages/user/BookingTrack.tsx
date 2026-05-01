import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import LocationMap from "../../components/LocationMap";
import { bookingService } from "../../services";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { ArrowLeft, Phone, Navigation, Clock, MapPin } from "lucide-react";

interface Booking {
  _id: string;
  status: string;
  serviceType: string;
  userId: { _id: string; name: string; email: string; location?: { lat: number; lng: number } };
  technicianId?: { _id: string; name: string; phone?: string; location?: { coordinates: [number, number] } };
  userLocation?: [number, number];
}

export default function BookingTrack() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [techLocation, setTechLocation] = useState<[number, number] | undefined>();
  const [routePath, setRoutePath] = useState<[number, number][] | undefined>();
  const [routeWaypoints, setRouteWaypoints] = useState<{ name: string; lat: number; lng: number }[] | undefined>();
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchBooking();
    const interval = setInterval(fetchBooking, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await bookingService.getBooking(id!);
      const bookingData = response.data;
      setBooking(bookingData);

      if (bookingData.technicianId?.location?.coordinates) {
        const [lng, lat] = bookingData.technicianId.location.coordinates;
        setTechLocation([lat, lng]);
      }

      if (bookingData.technicianId?.location?.coordinates &&
          (bookingData.userLocation || bookingData.userId?.location)) {
        fetchRoute();
      }
    } catch {
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoute = async () => {
    try {
      const routeData = await bookingService.getRoute(id!);
      if (routeData.path)       setRoutePath(routeData.path);
      if (routeData.waypoints)  setRouteWaypoints(routeData.waypoints);
      if (routeData.distance)   setDistance(routeData.distance);
      if (routeData.etaMinutes) setEta(routeData.etaMinutes);
    } catch {
      // Silent fail — map still works without the Dijkstra path
    }
  };

  const userLocation: [number, number] | null = booking?.userLocation
    ? [booking.userLocation[1], booking.userLocation[0]]
    : booking?.userId?.location
      ? [booking.userId.location.lat, booking.userId.location.lng]
      : null;

  const isTechnician = user?.role === "technician";
  const isUser = user?.role === "user";

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!booking || !userLocation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-500">Booking not found or location unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-dark">Live Tracking</h1>
            <p className="text-sm text-gray-500">
              {booking.serviceType} • {booking.status}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <LocationMap
                userLocation={userLocation}
                techLocation={techLocation}
                path={routePath}
                waypoints={routeWaypoints}
                height="500px"
              />
            </motion.div>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-5 border border-gray-100"
            >
              <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-blue-500" />
                Customer
              </h3>
              <p className="text-sm text-gray-600">{booking.userId.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
              </p>
            </motion.div>

            {/* Technician Info */}
            {booking.technicianId && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-5 border border-gray-100"
              >
                <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                  <Navigation size={18} className="text-green-500" />
                  Technician
                </h3>
                <p className="text-sm text-gray-600">{booking.technicianId.name}</p>
                {techLocation && (
                  <p className="text-xs text-gray-400 mt-1">
                    {techLocation[0].toFixed(4)}, {techLocation[1].toFixed(4)}
                  </p>
                )}

                {/* Distance & ETA */}
                {distance && eta && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>{distance.toFixed(1)} km</strong> away
                    </p>
                    <p className="text-xs text-green-600">
                      ETA: ~{eta} minutes
                    </p>
                  </div>
                )}

                {/* Contact Button for Users */}
                {isUser && booking.technicianId?.phone && (
                  <a
                    href={`tel:${booking.technicianId.phone}`}
                    className="mt-3 w-full py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 no-underline"
                  >
                    <Phone size={16} />
                    Call Technician
                  </a>
                )}
              </motion.div>
            )}

            {/* Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-5 border border-gray-100"
            >
              <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
                <Clock size={18} className="text-orange-500" />
                Status
              </h3>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    booking.status === "accepted"
                      ? "bg-green-500"
                      : booking.status === "requested"
                        ? "bg-yellow-500"
                        : "bg-gray-500"
                  }`}
                />
                <span className="text-sm text-gray-600 capitalize">{booking.status}</span>
              </div>
            </motion.div>

            {/* Action for Technician */}
            {isTechnician && booking.status === "accepted" && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => navigate(`/technician/jobs`)}
                className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                View Job Details
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
