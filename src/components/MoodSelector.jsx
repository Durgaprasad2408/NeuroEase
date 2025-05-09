import { useState } from 'react'

const moods = [
  { emoji: '😊', label: 'Happy', value: 'happy' },
  { emoji: '😌', label: 'Calm', value: 'calm' },
  { emoji: '😐', label: 'Neutral', value: 'neutral' },
  { emoji: '😔', label: 'Sad', value: 'sad' },
  { emoji: '😣', label: 'Anxious', value: 'anxious' },
]

export default function MoodSelector({ onSelect, selectedMood }) {
  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {moods.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onSelect(mood.value)}
          className={`mood-button ${
            selectedMood === mood.value
              ? 'bg-primary-100 dark:bg-primary-900'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="ml-2 text-sm">{mood.label}</span>
        </button>
      ))}
    </div>
  )
}