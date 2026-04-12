import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import KNNRecommendation from "../utils/knnRecommendation.js";

const testRecommendations = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const knn = new KNNRecommendation(5);

    // Test 1: Recommendations by location (Kathmandu)
    console.log("\n=== Test 1: Recommendations for Kathmandu ===");
    const kathmanduLocation = { lat: 27.7172, lng: 85.3240 };
    const kathmanduRecommendations = await knn.getRecommendations(
      kathmanduLocation,
      ["Electrician", "Plumber"],
      { maxDistance: 20 }
    );

    console.log(`Found ${kathmanduRecommendations.length} recommendations:`);
    kathmanduRecommendations.forEach((tech, index) => {
      console.log(`${index + 1}. ${tech.name} - Score: ${tech.recommendationScore}`);
      console.log(`   Skills: ${tech.skills.join(", ")}`);
      console.log(`   Distance: ${tech.distance.toFixed(2)} km`);
      console.log(`   Rating: ${tech.rating}/5`);
      console.log(`   Location: ${tech.user.location.city}`);
      console.log("");
    });

    // Test 2: Recommendations by city name
    console.log("\n=== Test 2: Recommendations for Pokhara ===");
    const pokharaRecommendations = await knn.getRecommendationsByCity(
      "Pokhara",
      ["Carpenter"],
      {}
    );

    console.log(`Found ${pokharaRecommendations.length} recommendations:`);
    pokharaRecommendations.forEach((tech, index) => {
      console.log(`${index + 1}. ${tech.name} - Score: ${tech.recommendationScore}`);
      console.log(`   Skills: ${tech.skills.join(", ")}`);
      console.log(`   Distance: ${tech.distance.toFixed(2)} km`);
      console.log(`   Rating: ${tech.rating}/5`);
      console.log("");
    });

    // Test 3: Diverse recommendations
    console.log("\n=== Test 3: Diverse Recommendations for Lalitpur ===");
    const diverseRecommendations = await knn.getDiverseRecommendations(
      { lat: 27.6529, lng: 85.3247 },
      ["Electrician", "Plumber", "Carpenter", "AC Repair"],
      { maxDistance: 15 }
    );

    console.log(`Found ${diverseRecommendations.length} diverse recommendations:`);
    diverseRecommendations.forEach((tech, index) => {
      console.log(`${index + 1}. ${tech.name} - Score: ${tech.recommendationScore}`);
      console.log(`   Primary Skill: ${tech.skills[0]}`);
      console.log(`   All Skills: ${tech.skills.join(", ")}`);
      console.log(`   Distance: ${tech.distance.toFixed(2)} km`);
      console.log(`   Rating: ${tech.rating}/5`);
      console.log("");
    });

    // Test 4: Edge case - No skills specified
    console.log("\n=== Test 4: Recommendations without skill filter ===");
    const noSkillsRecommendations = await knn.getRecommendations(
      { lat: 27.7172, lng: 85.3240 },
      [],
      { maxDistance: 10 }
    );

    console.log(`Found ${noSkillsRecommendations.length} recommendations:`);
    noSkillsRecommendations.slice(0, 3).forEach((tech, index) => {
      console.log(`${index + 1}. ${tech.name} - Score: ${tech.recommendationScore}`);
      console.log(`   Skills: ${tech.skills.join(", ")}`);
      console.log(`   Rating: ${tech.rating}/5`);
      console.log("");
    });

    // Test 5: Performance test with larger k
    console.log("\n=== Test 5: Performance test with k=10 ===");
    knn.k = 10;
    const startTime = Date.now();
    const largeRecommendations = await knn.getRecommendations(
      { lat: 27.7172, lng: 85.3240 },
      ["Electrician"],
      { maxDistance: 50 }
    );
    const endTime = Date.now();

    console.log(`Found ${largeRecommendations.length} recommendations in ${endTime - startTime}ms`);
    console.log(`Average distance: ${(largeRecommendations.reduce((sum, tech) => sum + tech.distance, 0) / largeRecommendations.length).toFixed(2)} km`);
    console.log(`Average rating: ${(largeRecommendations.reduce((sum, tech) => sum + tech.rating, 0) / largeRecommendations.length).toFixed(2)}/5`);

    console.log("\n=== All tests completed successfully! ===");

  } catch (error) {
    console.error("Error testing recommendations:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run the test
testRecommendations();
