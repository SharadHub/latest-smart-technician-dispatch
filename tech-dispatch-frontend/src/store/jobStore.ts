import { create } from "zustand";
import type { Job, LocationCoords } from "../types";

interface JobState {
  activeJob: Job | null;
  jobStatus: string | null;
  technicianLocation: LocationCoords | null;
  clientLocation: LocationCoords | null;
  myTechnicianId: string | null; // the logged-in technician's Technician._id
  setActiveJob: (job: Job | null) => void;
  setJobStatus: (status: string) => void;
  setTechnicianLocation: (loc: LocationCoords) => void;
  setClientLocation: (loc: LocationCoords) => void;
  setMyTechnicianId: (id: string) => void;
  clearJob: () => void;
}

export const useJobStore = create<JobState>()((set) => ({
  activeJob: null,
  jobStatus: null,
  technicianLocation: null,
  clientLocation: null,
  myTechnicianId: null,

  setActiveJob: (job) => set({ activeJob: job, jobStatus: job?.status ?? null }),
  setJobStatus: (status) => set({ jobStatus: status }),
  setTechnicianLocation: (loc) => set({ technicianLocation: loc }),
  setClientLocation: (loc) => set({ clientLocation: loc }),
  setMyTechnicianId: (id) => set({ myTechnicianId: id }),
  clearJob: () => set({ activeJob: null, jobStatus: null, technicianLocation: null, clientLocation: null }),
}));
