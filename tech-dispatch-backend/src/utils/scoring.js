/**
 * Skill matching utilities for KNN algorithm
 */

// Related skills mapping for fuzzy matching
const RELATED_SKILLS = {
  plumbing: ["pipe fitting", "water heater", "drain cleaning", "leak repair"],
  electrical: ["wiring", "circuit", "lighting", "outlet installation"],
  hvac: ["ac repair", "heating", "cooling", "ventilation"],
  carpentry: ["woodwork", "furniture", "cabinet", "door repair"],
};

/**
 * Calculate skill match score using Jaccard-like similarity
 * @param {string} serviceType - Requested service
 * @param {string[]} techSkills - Technician's skills array
 * @returns {number} Score between 0 and 1
 */
export const calculateSkillMatch = (serviceType, techSkills) => {
  if (!techSkills?.length || !serviceType) return 0;

  const service = serviceType.toLowerCase();
  const skills = techSkills.map((s) => s.toLowerCase());

  // Direct match
  if (skills.includes(service)) return 1;

  // Partial match
  const partialMatches = skills.filter(
    (skill) => service.includes(skill) || skill.includes(service)
  );
  if (partialMatches.length > 0) return 0.7;

  // Related skills
  const related = RELATED_SKILLS[service];
  if (related) {
    const hasRelated = skills.some((skill) =>
      related.some((r) => skill.includes(r) || r.includes(skill))
    );
    if (hasRelated) return 0.4;
  }

  return 0;
};

/**
 * Calculate rating score (normalize 0-5 to 0-1)
 * @param {number} ratingAvg - Average rating (0-5)
 * @returns {number} Score between 0 and 1
 */
export const calculateRatingScore = (ratingAvg) => (ratingAvg || 0) / 5;
