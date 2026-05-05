import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, Phone, MapPin, Loader2, Navigation, PlayCircle, CheckCircle2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { jobService } from "../../services/jobService";
import { useJobStore } from "../../store/jobStore";
import { useSocketStore } from "../../store/socketStore";
import { fromGeoJSON } from "../../utils/coords";
import TechnicianNavigationMap from "../../components/maps/TechnicianNavigationMap";
import { getServiceByKey } from "../../config/services";
import type { Job, User } from "../../types";

export default function ActiveJob() {
  const navigate = useNavigate();
  const socket = useSocketStore((s) => s.socket);
  const {
    activeJob, setActiveJob,
    clientLocation, setClientLocation,
    setTechnicianLocation, technicianLocation,
    myTechnicianId,
  } = useJobStore();

  const [loading, setLoading] = useState(!activeJob);
  const [myLocation, setMyLocation] = useState(technicianLocation);
  const [jobStatus, setJobStatus] = useState<string>(activeJob?.status ?? "assigned");
  const [actionPending, setActionPending] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Load job if not already in store
  useEffect(() => {
    if (!activeJob) {
      setLoading(true);
      jobService.getTechnicianCurrentJob()
        .then((res) => {
          if (res.data) {
            setActiveJob(res.data as Job);
            setJobStatus(res.data.status);
            setClientLocation(fromGeoJSON(res.data.clientLocation.coordinates));
          } else {
            toast.error("No active job found.");
            navigate("/technician");
          }
        })
        .catch(() => navigate("/technician"))
        .finally(() => setLoading(false));
    } else {
      setClientLocation(fromGeoJSON(activeJob.clientLocation.coordinates));
      setJobStatus(activeJob.status);
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Watch GPS and push live location updates
  useEffect(() => {
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(loc);
        setTechnicianLocation(loc);
        if (socket) {
          socket.emit("technician:updateLocation", { lat: loc.lat, lng: loc.lng });
        }
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [socket, myTechnicianId, setTechnicianLocation]);

  // Listen for server confirmation of status transitions
  useEffect(() => {
    if (!socket) return;

    const onStatusUpdate = (data: { jobId: string; status: string }) => {
      if (activeJob && data.jobId === activeJob._id) {
        setJobStatus(data.status);
        setActionPending(false);
      }
    };

    const onCompleted = (data: { jobId: string }) => {
      if (activeJob && data.jobId === activeJob._id) {
        setJobStatus("completed");
        setActionPending(false);
        toast.success("Job marked as complete!");
        // Stop GPS watch
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        setTimeout(() => {
          setActiveJob(null);
          navigate("/technician");
        }, 2000);
      }
    };

    const onFailed = (data: { reason: string }) => {
      toast.error(data.reason || "Action failed");
      setActionPending(false);
    };

    socket.on("job:statusUpdate", onStatusUpdate);
    socket.on("job:completed", onCompleted);
    socket.on("job:actionFailed", onFailed);

    return () => {
      socket.off("job:statusUpdate", onStatusUpdate);
      socket.off("job:completed", onCompleted);
      socket.off("job:actionFailed", onFailed);
    };
  }, [socket, activeJob, setActiveJob, navigate]);

  const handleStartJob = () => {
    if (!socket || !activeJob) return;
    setActionPending(true);
    socket.emit("technician:startJob", { jobId: activeJob._id });
  };

  const handleCompleteJob = () => {
    if (!socket || !activeJob) return;
    if (!confirm("Mark this job as complete?")) return;
    setActionPending(true);
    socket.emit("technician:completeJob", { jobId: activeJob._id });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const job = activeJob;
  if (!job) return null;

  const clientUser = typeof job.user === "object" ? (job.user as User) : null;
  const service = getServiceByKey(job.serviceType);

  const statusBanner = {
    assigned:    { bg: "bg-blue-600",  text: "Navigate to Client",     icon: Navigation },
    en_route:    { bg: "bg-blue-600",  text: "En Route to Client",     icon: Navigation },
    in_progress: { bg: "bg-green-600", text: "Job In Progress",        icon: PlayCircle },
    completed:   { bg: "bg-gray-600",  text: "Job Completed",          icon: CheckCircle },
  }[jobStatus] ?? { bg: "bg-blue-600", text: "Active Job", icon: Navigation };

  const StatusIcon = statusBanner.icon;

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
          <Link to="/technician" className="text-sm text-gray-500 hover:text-gray-900">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Status banner */}
        <div className={`flex items-center gap-3 p-4 ${statusBanner.bg} text-white rounded-2xl`}>
          <StatusIcon size={20} />
          <div>
            <p className="font-bold">{statusBanner.text}</p>
            <p className="text-sm opacity-80">{service?.label || job.serviceType}</p>
          </div>
        </div>

        {/* Map — always visible until completed */}
        {jobStatus !== "completed" && (
          myLocation && clientLocation ? (
            <TechnicianNavigationMap
              technicianLocation={myLocation}
              clientLocation={clientLocation}
            />
          ) : (
            <div className="h-64 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 text-sm">
              <Loader2 size={20} className="animate-spin mr-2" />
              Acquiring GPS…
            </div>
          )
        )}

        {/* Job lifecycle actions */}
        {jobStatus === "assigned" && (
          <button
            onClick={handleStartJob}
            disabled={actionPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer text-base"
          >
            {actionPending ? (
              <><Loader2 size={18} className="animate-spin" />Starting…</>
            ) : (
              <><PlayCircle size={20} />Start Job — I've Arrived</>
            )}
          </button>
        )}

        {jobStatus === "in_progress" && (
          <button
            onClick={handleCompleteJob}
            disabled={actionPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer text-base"
          >
            {actionPending ? (
              <><Loader2 size={18} className="animate-spin" />Completing…</>
            ) : (
              <><CheckCircle2 size={20} />Mark Job as Complete</>
            )}
          </button>
        )}

        {jobStatus === "completed" && (
          <div className="flex flex-col items-center gap-3 py-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <p className="font-bold text-gray-900 text-lg">Job completed!</p>
            <p className="text-sm text-gray-500">Redirecting to dashboard…</p>
          </div>
        )}

        {/* Client info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">Client Details</h2>

          {clientUser && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {clientUser.name?.charAt(0).toUpperCase() || "C"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{clientUser.name}</p>
                <p className="text-xs text-gray-400 truncate">{clientUser.email}</p>
              </div>
              {clientUser.phone && (
                <a
                  href={`tel:${clientUser.phone}`}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl no-underline hover:bg-blue-700 shrink-0"
                >
                  <Phone size={14} />
                  Call
                </a>
              )}
            </div>
          )}

          {job.clientAddress && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Address</p>
                <p className="text-sm text-gray-700">{job.clientAddress}</p>
              </div>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-400 mb-1">Issue</p>
            <p className="text-sm text-gray-700">{job.description}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
