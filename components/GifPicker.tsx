import React, { useState } from "react";

const TENOR_API_KEY = process.env.NEXT_PUBLIC_TENOR_API_KEY || "LIVDSRZULELA"; // Use your own key for production

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
}

const GifPicker: React.FC<GifPickerProps> = ({ onSelect }) => {
  const [search, setSearch] = useState("");
  interface GifResult {
    id: string;
    content_description?: string;
    media_formats?: {
      tinygif?: { url?: string };
      gif?: { url?: string };
    };
    media?: Array<{
      tinygif?: { url?: string };
      gif?: { url?: string };
    }>;
  }
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(
          search
        )}&key=${TENOR_API_KEY}&limit=12`
      );
      if (!res.ok) {
        const text = await res.text();
        setResults([]);
        setError(
          `Network error: ${res.status} ${res.statusText}. Response: ${text}`
        );
        console.error("Tenor fetch error:", res.status, res.statusText, text);
        return;
      }
      const data = await res.json();
      setResults(data.results || []);
      if (!data.results || data.results.length === 0)
        setError("No GIFs found.");
    } catch (err) {
      setResults([]);
      setError("Failed to fetch GIFs: " + err);
      console.error("Tenor fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 p-2 rounded shadow-lg w-80 z-50 text-gray-900">
      <div className="flex gap-2 mb-2 text-gray-900">
        <input
          type="text"
          className="border rounded px-2 py-1 flex-1 text-gray-900 bg-white"
          placeholder="Search GIFs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="bg-blue-500 text-white px-2 py-1 rounded"
          onClick={handleSearch}
        >
          Search
        </button>
      </div>
      {loading && <div className="text-center text-gray-700">Loading...</div>}
      {error && (
        <div className="text-center text-red-600 text-sm mb-2">{error}</div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {results.map((gif: GifResult) => (
          <img
            key={gif.id}
            src={
              gif.media_formats?.tinygif?.url ||
              (gif.media && gif.media[0]?.tinygif?.url) ||
              ""
            }
            alt={gif.content_description || "GIF"}
            className="w-full h-24 object-cover rounded cursor-pointer hover:opacity-80"
            onClick={() =>
              onSelect(
                gif.media_formats?.gif?.url ||
                  (gif.media && gif.media[0]?.gif?.url) ||
                  ""
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default GifPicker;
