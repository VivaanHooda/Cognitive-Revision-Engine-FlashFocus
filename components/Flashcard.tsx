'use client';

import React from "react";

interface FlashcardProps {
  front: string;
  back: string;
  isFlipped: boolean;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  front,
  back,
  isFlipped,
}) => {
  return (
    <div className="group w-full max-w-4xl [perspective:1000px] cursor-default">
      <div
        className={`relative w-full transition-transform duration-500 transform-style-3d shadow-xl rounded-2xl ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front Face */}
        <div
          className={`
            ${isFlipped ? "absolute top-0 left-0 h-full w-full" : "relative"} 
            min-h-[20rem] bg-white rounded-2xl p-8 flex flex-col items-center justify-center backface-hidden border border-gray-100
          `}
        >
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Question
          </span>
          <h2 className="text-2xl font-bold text-gray-800 text-justify leading-relaxed whitespace-pre-wrap break-words w-full">
            {front}
          </h2>
        </div>

        {/* Back Face */}
        <div
          className={`
            ${!isFlipped ? "absolute top-0 left-0 h-full w-full" : "relative"} 
            min-h-[20rem] bg-indigo-50 rounded-2xl p-8 flex flex-col items-center justify-center backface-hidden rotate-y-180 border border-indigo-100
          `}
        >
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">
            Answer
          </span>
          <h2 className="text-xl font-bold text-justify text-indigo-900 leading-relaxed whitespace-pre-wrap break-words w-full">
            {back}
          </h2>
        </div>
      </div>
    </div>
  );
};
