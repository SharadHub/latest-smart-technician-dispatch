export const SERVICE_SKILL_MAP = {
  plumbing:            ["plumbing", "plumber"],
  electrical:          ["electrical", "electrician", "wiring"],
  hvac:                ["hvac", "heating", "cooling", "ventilation", "air_conditioning"],
  appliance_repair:    ["appliance_repair", "appliance", "refrigerator", "washing_machine"],
  carpentry:           ["carpentry", "carpenter", "woodwork"],
  painting:            ["painting", "painter"],
  cleaning:            ["cleaning", "cleaner", "housekeeping"],
  general_maintenance: ["general_maintenance", "general", "handyman", "maintenance"],
};

export const VALID_SKILLS = [...new Set(Object.values(SERVICE_SKILL_MAP).flat())];

export const getRequiredSkills = (serviceType) => {
  return SERVICE_SKILL_MAP[serviceType] || [];
};
