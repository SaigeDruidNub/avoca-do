"use client";
import React, { useState, useEffect, useRef } from "react";
import ProfileImage from "@/app/profile/[id]/ProfileImage";

interface User {
  _id: string;
  name: string;
  email?: string;
  image?: string;
}

interface UserSearchProps {
  onUserSelect?: (user: User) => void;
  placeholder?: string;
  className?: string;
  showResults?: boolean;
}

const UserSearch: React.FC<UserSearchProps> = ({
  onUserSelect,
  placeholder = "Search users by name...",
  className = "",
  showResults = true,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search function
  const searchUsers = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/user/search?q=${encodeURIComponent(searchQuery)}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const users = await response.json();
      setResults(users);
      setShowDropdown(true);
    } catch (err) {
      setError("Failed to search users");
      setResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce search
    debounceRef.current = setTimeout(() => {
      searchUsers(value);
    }, 300);
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setQuery(user.name);
    setShowDropdown(false);
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  // Clear search
  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setError("");
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 bg-primary-dark border border-secondary rounded-lg text-primary placeholder-primary focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-white rounded-full"></div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}

      {/* Results dropdown */}
      {showResults && showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-primary-dark border border-secondary rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user._id}
              onClick={() => handleUserSelect(user)}
              className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-primary-dark transition-colors duration-150 text-left"
            >
              <ProfileImage
                src={user.image}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white truncate">
                  {user.name}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults &&
        showDropdown &&
        results.length === 0 &&
        query.trim().length >= 2 &&
        !loading && (
          <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
            <div className="px-4 py-3 text-gray-400 text-center">
              No users found matching &quot;{query}&quot;
            </div>
          </div>
        )}
    </div>
  );
};

export default UserSearch;
