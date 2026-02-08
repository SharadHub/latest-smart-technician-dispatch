import {
  Wrench,
  Zap,
  Wind,
  Tv,
  Hammer,
  Paintbrush,
  SprayCan,
  Settings,
} from "lucide-react";
import type { ElementType } from "react";

export interface ServiceType {
  key: string;
  label: string;
  icon: ElementType;
  color: string;
  bg: string;
  description: string;
}

export const SERVICE_TYPES: ServiceType[] = [
  {
    key: "plumbing",
    label: "Plumbing",
    icon: Wrench,
    color: "#2563eb",
    bg: "#dbeafe",
    description: "Fix leaks, pipes, faucets & drainage issues",
  },
  {
    key: "electrical",
    label: "Electrical",
    icon: Zap,
    color: "#f59e0b",
    bg: "#fef3c7",
    description: "Wiring, outlets, switches & electrical repairs",
  },
  {
    key: "hvac",
    label: "HVAC",
    icon: Wind,
    color: "#0891b2",
    bg: "#cffafe",
    description: "Heating, ventilation & air conditioning",
  },
  {
    key: "appliance_repair",
    label: "Appliance Repair",
    icon: Tv,
    color: "#7c3aed",
    bg: "#ede9fe",
    description: "Repair washing machines, fridges & appliances",
  },
  {
    key: "carpentry",
    label: "Carpentry",
    icon: Hammer,
    color: "#b45309",
    bg: "#fef3c7",
    description: "Furniture, doors, windows & woodwork",
  },
  {
    key: "painting",
    label: "Painting",
    icon: Paintbrush,
    color: "#db2777",
    bg: "#fce7f3",
    description: "Interior & exterior painting services",
  },
  {
    key: "cleaning",
    label: "Cleaning",
    icon: SprayCan,
    color: "#059669",
    bg: "#d1fae5",
    description: "Deep cleaning, sanitization & housekeeping",
  },
  {
    key: "general_maintenance",
    label: "General Maintenance",
    icon: Settings,
    color: "#64748b",
    bg: "#f1f5f9",
    description: "General repairs & maintenance tasks",
  },
];

export const getServiceByKey = (key: string): ServiceType | undefined =>
  SERVICE_TYPES.find((s) => s.key === key);
