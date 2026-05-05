import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, Loader2, Phone, RefreshCw, CheckCircle, XCircle, Star, WrenchIcon } from "lucide-react";
import toast from "react-hot-toast";
import { jobService } from "../../services/jobService";
import { useJobStore } from "../../store/jobStore";
import { useSocketEvent } from "../../hooks/useSocketEvents";
import { fromGeoJSON } from "../../utils/coords";
import ClientTrackingMap from "../../components/maps/ClientTrackingMap";
import { getServiceByKey } from "../../config/services";
import type { Job } from "../../types";

function useCountdown(expiresAt: string | undefined) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function JobTracker() {
  const navigate = useNavigate();
  const { activeJob, setActiveJob, setJobStatus, technicianLocation, setTechnicianLocation } = useJobStore();
  const [loading, setLoading] = useState(!activeJob);
  const [phase, setPhase] = useState<"searching" | "assigned" | "in_progress" | "completed" | "exhausted" | "expired" | "cancelled">(
    (activeJob?.status as "searching" | "assigned" | "in_progress" | "completed") || "searching"
  );
  const [assignedTech, setAssignedTech] = useState<{
    name: string; phone?: string; location?: [number, number];
  } | null>(null);
  const countdown = useCountdown(activeJob?.expiresAt);

  useEffect(() => {
    if (!activeJob) {
      setLoading(true);
      jobService.getCurrentJob()
        .then((res) => {
          if (res.data) {
            setActiveJob(res.data);
            setPhase(res.data.status as typeof phase);
            if (["assigned", "in_progress"].includes(res.data.status) && typeof res.data.technician === "object" && res.data.technician) {
              const tech = res.data.technician as { name?: string; phone?: string; location?: { coordinates: [number, number] } };
              if (tech.location) {
                const { lat, lng } = fromGeoJSON(tech.location.coordinates);
                setTechnicianLocation({ lat, lng });
              }
              setAssignedTech({ name: tech.name || "Technician", phone: tech.phone });
            }
          } else {
            navigate("/book");
          }
        })
        .catch(() => navigate("/book"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useSocketEvent("job:assigned", (data: { jobId: string; status: string; technician: { _id: string; name: string; phone?: string; location?: [number, number] } }) => {
    if (!activeJob || data.jobId !== activeJob._id.toString()) return;
    setPhase("assigned");
    setJobStatus("assigned");
    setAssignedTech({ name: data.technician.name, phone: data.technician.phone });
    if (data.technician.location) {
      const { lat, lng } = fromGeoJSON(data.technician.location);
      setTechnicianLocation({ lat, lng });
    }
    toast.success(`${data.technician.name} is on the way!`);
  }, [activeJob?._id]);

  useSocketEvent("tracking:technicianMoved", (data: { jobId: string; lat: number; lng: number }) => {
    if (!activeJob || data.jobId !== activeJob._id.toString()) return;
    setTechnicianLocation({ lat: data.lat, lng: data.lng });
  }, [activeJob?._id]);

  useSocketEvent("job:statusUpdate", (data: { jobId: string; status: string }) => {
    if (!activeJob || data.jobId !== activeJob._id.toString()) return;
    if (data.status === "in_progress") {
      setPhase("in_progress");
      setJobStatus("in_progress");
      toast.success("Technician has arrived and started work!");
    }
  }, [activeJob?._id]);

  useSocketEvent("job:completed", (data: { jobId: string }) => {
    if (!activeJob || data.jobId !== activeJob._id.toString()) return;
    setPhase("completed");
    setJobStatus("completed");
    toast.success("Job completed!");
  }, [activeJob?._id]);

  useSocketEvent("job:expired", (data: { jobId: string }) => {
    if (!activeJob || data.jobId !== activeJob._id.toString()) return;
    setPhase("expired");
    setJobStatus("expired");
    toast.error("Request expired — no technician accepted in time.");
  }, [activeJob?._id]);

  useSocketEvent("job:exhausted", (data: { jobId: string }) => {
    if (!activeJob || data.jobId !== activeJob._id.toString()) return;
    setPhase("exhausted");
    toast.error("No available technicians found nearby.");
  }, [activeJob?._id]);

  const handleCancel = async () => {
    if (!activeJob) return;
    try {
      await jobService.cancelJob(activeJob._id);
      setActiveJob(null);
      toast.success("Request cancelled.");
      navigate("/dashboard");
    } catch {
      toast.error("Could not cancel the request.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const service = activeJob ? getServiceByKey(activeJob.serviceType) : null;
  const jobForMap = activeJob as Job;

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
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">

        {/* Status card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Service</p>
              <p className="text-lg font-bold text-gray-900">{service?.label || activeJob?.serviceType}</p>
              <p className="text-sm text-gray-500 mt-1">{activeJob?.description}</p>
            </div>

            {phase === "searching" && (
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">Expires in</p>
                <p className="text-xl font-mono font-bold text-amber-500">{countdown}</p>
              </div>
            )}
          </div>
        </div>

        {/* Phase: Searching */}
        {phase === "searching" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 size={28} className="text-blue-600 animate-spin" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Finding a technician…</h2>
            <p className="text-sm text-gray-500 mb-6">
              We're contacting nearby technicians. This may take a minute.
            </p>
            <button
              onClick={handleCancel}
              className="px-5 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              Cancel request
            </button>
          </div>
        )}

        {/* Phase: Assigned — technician on the way */}
        {phase === "assigned" && assignedTech && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
              <CheckCircle size={28} className="text-green-600 shrink-0" />
              <div>
                <p className="font-bold text-green-800">{assignedTech.name} is on the way!</p>
                <p className="text-sm text-green-600">Your technician has accepted the job.</p>
              </div>
              {assignedTech.phone && (
                <a
                  href={`tel:${assignedTech.phone}`}
                  className="ml-auto flex items-center gap-1 px-3 py-2 bg-white border border-green-200 rounded-xl text-sm font-medium text-green-700 no-underline hover:bg-green-50"
                >
                  <Phone size={14} />
                  Call
                </a>
              )}
            </div>

            {activeJob && (
              <ClientTrackingMap job={jobForMap} technicianLocation={technicianLocation} jobStatus="assigned" />
            )}
          </div>
        )}

        {/* Phase: In Progress — technician working at client location */}
        {phase === "in_progress" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center gap-4">
              <WrenchIcon size={28} className="text-blue-600 shrink-0" />
              <div>
                <p className="font-bold text-blue-800">
                  {assignedTech ? `${assignedTech.name} is working on your issue` : "Technician is working on your issue"}
                </p>
                <p className="text-sm text-blue-600">Job is in progress at your location.</p>
              </div>
              {assignedTech?.phone && (
                <a
                  href={`tel:${assignedTech.phone}`}
                  className="ml-auto flex items-center gap-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-medium text-blue-700 no-underline hover:bg-blue-50"
                >
                  <Phone size={14} />
                  Call
                </a>
              )}
            </div>

            {activeJob && (
              <ClientTrackingMap job={jobForMap} technicianLocation={technicianLocation} jobStatus="in_progress" />
            )}
          </div>
        )}

        {/* Phase: Completed */}
        {phase === "completed" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Job Completed!</h2>
            <p className="text-sm text-gray-500 mb-6">
              {assignedTech ? `${assignedTech.name} has finished the job.` : "Your technician has finished the job."} How did it go?
            </p>
            {activeJob && (
              <Link
                to={`/rate/${activeJob._id}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors no-underline"
              >
                <Star size={16} />
                Rate & Review
              </Link>
            )}
            <button
              onClick={() => { setActiveJob(null); navigate("/dashboard"); }}
              className="block mx-auto mt-3 text-sm text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"
            >
              Back to dashboard
            </button>
          </div>
        )}

        {/* Phase: Expired / Exhausted */}
        {(phase === "expired" || phase === "exhausted") && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={28} className="text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {phase === "expired" ? "Request Expired" : "No Technicians Available"}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {phase === "expired"
                ? "No technician accepted your request in time."
                : "No approved technicians with the required skill are nearby right now."}
            </p>
            <button
              onClick={() => navigate("/book")}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer mx-auto"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
