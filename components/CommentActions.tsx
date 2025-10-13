"use client";
import React, { useState, useRef, useEffect } from "react";
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";

interface CommentActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isOwner: boolean;
}

export default function CommentActions({
  onEdit,
  onDelete,
  isOwner,
}: CommentActionsProps) {
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
        className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none text-xs"
        aria-label="Comment actions"
      >
        <FaEllipsisV size={10} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-1">
            <button
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <FaEdit className="text-blue-500" size={10} />
              Edit
            </button>
            <button
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1 text-xs text-red-600 hover:bg-gray-100 w-full text-left"
            >
              <FaTrash className="text-red-500" size={10} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
