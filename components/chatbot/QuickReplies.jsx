import React, { useState } from 'react';

const options = [
  "Best crops for my region",
  "How to optimize my loan usage",
  "Budget allocation for farming",
  "Recommend affordable fertilizers",
  "Low investment high return crops",
  "Weather-based crop suggestions",
  "Which farming tools to buy",
  "Loan repayment advice",
  "Organic farming on a budget",
  "Best irrigation solutions"
];

export default function QuickReplies({ onSend, isCompact = false }) {
  // Add state to track whether to show all options
  const [showAll, setShowAll] = useState(false);
  
  // If in compact mode and showAll is false, show fewer options
  const visibleOptions = (isCompact && !showAll) ? options.slice(0, 5) : options;
  
  return (
    <div className={`bg-gray-100 p-2 rounded-lg flex flex-wrap gap-2 mb-2 ${isCompact && !showAll ? 'max-h-20 overflow-y-auto' : ''} ${showAll ? 'max-h-48 overflow-y-auto' : ''}`}>
      {!isCompact && <h3 className="w-full text-sm font-medium mb-1 text-gray-700">Ask me about:</h3>}
      {isCompact && showAll && <h3 className="w-full text-xs font-medium mb-1 text-gray-700">Popular questions:</h3>}
      {visibleOptions.map((opt, idx) => (
        <button
          key={idx}
          className={`text-xs bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-full whitespace-nowrap ${isCompact ? 'text-xs' : ''}`}
          onClick={() => onSend(opt)}
        >
          {opt}
        </button>
      ))}
      {isCompact && !showAll && visibleOptions.length < options.length && (
        <button
          className="text-xs bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full whitespace-nowrap font-medium"
          onClick={() => setShowAll(true)}
        >
          More options...
        </button>
      )}
      {isCompact && showAll && (
        <button
          className="text-xs bg-green-100 hover:bg-green-200 px-3 py-1 rounded-full whitespace-nowrap font-medium ml-auto mt-1"
          onClick={() => setShowAll(false)}
        >
          Show less
        </button>
      )}
    </div>
  );
}