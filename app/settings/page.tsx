"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [customInterests, setCustomInterests] = useState<
    Record<string, string>
  >({});
  const [showOtherInputs, setShowOtherInputs] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    async function fetchInterests() {
      const res = await fetch("/api/user/interests");
      if (res.ok) {
        const data = await res.json();

        const allInterests = Array.isArray(data.interests)
          ? data.interests
          : [];
        setSelected(allInterests);

        // Handle custom interests
        if (data.customInterests && Array.isArray(data.customInterests)) {
          const customInterestsMap: Record<string, string> = {};
          const showOtherMap: Record<string, boolean> = {};

          // Group custom interests by category
          const groupedCustomInterests: Record<string, string[]> = {};

          data.customInterests.forEach(
            (custom: { category: string; customInterest: string }) => {
              if (!groupedCustomInterests[custom.category]) {
                groupedCustomInterests[custom.category] = [];
              }
              groupedCustomInterests[custom.category].push(
                custom.customInterest
              );

              // Add custom interest to selected if not already there
              const customInterestKey = `${custom.category} - Other: ${custom.customInterest}`;
              if (!allInterests.includes(customInterestKey)) {
                allInterests.push(customInterestKey);
              }
            }
          );

          // Convert grouped interests back to comma-separated strings for display
          Object.entries(groupedCustomInterests).forEach(
            ([category, interests]) => {
              customInterestsMap[category] = interests.join(", ");
              showOtherMap[category] = true;
            }
          );

          setCustomInterests(customInterestsMap);
          setShowOtherInputs(showOtherMap);
          setSelected(allInterests);
        }
      }
    }
    if (session?.user?.email) fetchInterests();
  }, [session?.user?.email]);

  const interestsCategories = {
    "Sports & Fitness": [
      "Football",
      "Basketball",
      "Soccer",
      "Tennis",
      "Swimming",
      "Running",
      "Cycling",
      "Yoga",
      "Gym Training",
      "Martial Arts",
      "Rock Climbing",
      "Hiking",
    ],
    "Creative Arts": [
      "Music",
      "Art",
      "Photography",
      "Writing",
      "Dancing",
      "Theater",
      "Drawing",
      "Painting",
      "Sculpture",
      "Crafts",
      "Fashion Design",
      "Film Making",
      "Pottery",
      "Sewing",
      "Calligraphy",
      "Graphic Design",
      "Fiber Arts",
    ],
    "Technology & Science": [
      "Programming",
      "Web Development",
      "AI/Machine Learning",
      "Robotics",
      "Gaming",
      "Physics",
      "Chemistry",
      "Biology",
      "Astronomy",
      "Mathematics",
      "Engineering",
      "Data Science",
    ],
    "Hobbies & Lifestyle": [
      "Reading",
      "Cooking",
      "Gardening",
      "DIY Projects",
      "Collecting",
      "Board Games",
      "Puzzles",
      "Knitting/Crocheting",
      "Woodworking",
      "Pottery",
      "Jewelry Making",
      "Model Building",
    ],
    "Entertainment & Media": [
      "Movies",
      "TV Shows",
      "Anime",
      "Comics",
      "Podcasts",
      "Stand-up Comedy",
      "Concerts",
      "Festivals",
      "Streaming",
      "Video Games",
      "Books",
      "Magazines",
    ],
    "Travel & Culture": [
      "International Travel",
      "Local Exploration",
      "Cultural Events",
      "Languages",
      "History",
      "Museums",
      "Architecture",
      "Food Tourism",
      "Adventure Travel",
      "Backpacking",
      "Road Trips",
      "Cultural Exchange",
    ],
    "Spirituality & Wellness": [
      "Meditation",
      "Mindfulness",
      "Christianity",
      "Buddhism",
      "Islam",
      "Judaism",
      "Hinduism",
      "Spirituality",
      "Wellness",
      "Mental Health",
      "Self-improvement",
      "Philosophy",
      "Druidry",
      "Paganism",
    ],
    "Social & Community": [
      "Volunteering",
      "Community Service",
      "Politics",
      "Social Justice",
      "Environmental Causes",
      "Animal Welfare",
      "Networking",
      "Public Speaking",
      "Leadership",
      "Mentoring",
      "Team Sports",
      "Group Activities",
      "Solidarity Economy",
    ],
    "Business & Finance": [
      "Investing",
      "Entrepreneurship",
      "Real Estate",
      "Personal Finance",
      "Business Development",
      "Marketing",
      "Sales",
      "Consulting",
      "Economics",
      "Stock Trading",
      "Cryptocurrency",
      "Career Development",
      "Cooperatives",
    ],
    "Family & Relationships": [
      "Parenting",
      "Family Activities",
      "Child Development",
      "Education",
      "Relationship Building",
      "Dating",
      "Marriage",
      "Family Planning",
      "Grandparenting",
      "Pets",
      "Home Management",
      "Life Coaching",
    ],
  };

  const handleChange = (interest: string) => {
    setSelected((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleOtherToggle = (category: string) => {
    setShowOtherInputs((prev) => {
      const newState = !prev[category];

      if (!newState) {
        // If unchecking "Other", remove the custom interest
        setSelected((prevSelected) =>
          prevSelected.filter((i) => !i.startsWith(`${category} - Other:`))
        );
        setCustomInterests((prevCustom) => ({
          ...prevCustom,
          [category]: "",
        }));
      }

      return {
        ...prev,
        [category]: newState,
      };
    });
  };

  const handleCustomInterestChange = (category: string, value: string) => {
    setCustomInterests((prev) => ({
      ...prev,
      [category]: value,
    }));

    // Update selected interests with the custom values (split by comma)
    const otherPrefix = `${category} - Other:`;
    setSelected((prev) => {
      const filtered = prev.filter((i) => !i.startsWith(otherPrefix));
      if (value.trim()) {
        // Split by comma and create separate entries for each custom interest
        const customInterests = value
          .split(",")
          .map((interest) => interest.trim())
          .filter((interest) => interest.length > 0)
          .map((interest) => `${otherPrefix} ${interest}`);
        return [...filtered, ...customInterests];
      }
      return filtered;
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Separate standard interests from custom interests
      const standardInterests = selected.filter(
        (interest) => !interest.includes(" - Other:")
      );
      const customInterestsData = selected
        .filter((interest) => interest.includes(" - Other:"))
        .map((interest) => {
          const [categoryPart, customValue] = interest.split(" - Other: ");
          return {
            category: categoryPart,
            customInterest: customValue,
          };
        });

      const payload = {
        interests: standardInterests,
        customInterests: customInterestsData,
      };

      const res = await fetch("/api/user/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage("Interests updated!");
        // Refresh the data to verify it was saved
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorData = await res.json();
        setMessage(
          `Failed to update interests: ${errorData.error || "Unknown error"}`
        );
      }
    } catch (error) {
      setMessage("Failed to update interests.");
    }
    setSaving(false);
  };

  return (
    <main className="flex min-h-screen flex-col bg-primary">
      {/* Header with logo and user image */}
      <header className="w-full flex justify-between items-center p-4 bg-primary shadow-sm">
        {/* Logo on the left */}
        <div className="flex items-center">
          <Link href="/dashboard">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
        </div>
        {/* Dashboard link and user image on the right */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-foreground hover:underline"
          >
            Dashboard
          </Link>
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="User avatar"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full border border-gray-300 shadow"
            />
          )}
        </div>
      </header>
      {/* Main settings content */}
      <section className="flex flex-1 flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Settings</h1>
        <p className="text-lg text-foreground mb-6">
          Select your interests to personalize your experience.
        </p>
        <div className="w-full max-w-4xl bg-primary-dark rounded-lg shadow p-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold mb-4 text-secondary">
            Select your interests
          </h2>
          <form className="flex flex-col gap-3" onSubmit={handleSave}>
            {Object.entries(interestsCategories).map(
              ([category, interests]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-medium text-secondary mb-3 border-b border-gray-300 pb-2">
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                    {interests.map((interest: string) => (
                      <label
                        key={interest}
                        className="flex items-center gap-2 text-secondary text-sm"
                      >
                        <input
                          type="checkbox"
                          name="interests"
                          value={interest}
                          checked={selected.includes(interest)}
                          onChange={() => handleChange(interest)}
                          className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span>{interest}</span>
                      </label>
                    ))}
                    {/* Other option */}
                    <div className="col-span-full mt-2">
                      <label className="flex items-center gap-2 text-secondary text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={showOtherInputs[category] || false}
                          onChange={() => handleOtherToggle(category)}
                          className="form-checkbox h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                        />
                        <span>Other (please specify)</span>
                      </label>
                      {showOtherInputs[category] && (
                        <div className="mt-2 ml-6">
                          <input
                            type="text"
                            placeholder={`Enter custom ${category.toLowerCase()} interests (separate multiple with commas)`}
                            value={customInterests[category] || ""}
                            onChange={(e) =>
                              handleCustomInterestChange(
                                category,
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-secondary"
                          />
                          <p className="text-xs text-secondary mt-1">
                            Separate multiple interests with commas (e.g.,
                            "Interest 1, Interest 2, Interest 3"). Popular
                            custom interests may be added to the official list
                            in future updates.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Interests"}
            </button>

            {message && (
              <div className="text-sm mt-2 text-secondary">{message}</div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
