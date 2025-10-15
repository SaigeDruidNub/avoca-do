import React, { useState } from "react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  return (
    <Picker
      data={data}
      onEmojiSelect={(emoji: { native: string }) => onSelect(emoji.native)}
      theme="light"
      previewPosition="none"
      skinTonePosition="none"
      style={{ position: "absolute", zIndex: 1000 }}
    />
  );
};

export default EmojiPicker;
