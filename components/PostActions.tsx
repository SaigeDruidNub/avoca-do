"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";

interface PostActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isOwner: boolean;
}

export default function PostActions({
  onEdit,
  onDelete,
  isOwner,
}: PostActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Don't render if user is not the owner
  if (!isOwner) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label="Post actions"
      >
        <FaEllipsisV />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <FaEdit className="text-blue-500" />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
            >
              <FaTrash className="text-red-500" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
