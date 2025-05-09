import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import MoodSelector from './MoodSelector'
import MoodInsights from './MoodInsights'
import JournalTable from './JournalTable'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'

const greetings = [
  "Welcome back! Ready to reflect on your day?",
  "Take a moment to pause and check in with yourself.",
  "Your journey of self-discovery continues here.",
  "A new day brings new opportunities for growth.",
  "Your mental well-being matters. How are you today?",
  "Time to focus on you. How's your day going?",
  "Welcome to your safe space for reflection.",
  "Let's take a mindful moment together.",
]

export default function Journal({ user }) {
  const [entry, setEntry] = useState('')
  const [moodBefore, setMoodBefore] = useState(null)
  const [moodAfter, setMoodAfter] = useState(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [entries, setEntries] = useState([])
  const [showMoodAfter, setShowMoodAfter] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recognition, setRecognition] = useState(null)
  const [saveTimeout, setSaveTimeout] = useState(null)
  const [greeting, setGreeting] = useState('')
  const [meditation, setMeditation] = useState('')
  const [loadingMeditation, setLoadingMeditation] = useState(false)

  useEffect(() => {
    // Select a random greeting when component mounts
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)]
    setGreeting(randomGreeting)
  }, [])

  useEffect(() => {
    if (moodBefore) {
      fetchMeditation(moodBefore)
    }
  }, [moodBefore])

  const fetchMeditation = async (mood) => {
    try {
      setLoadingMeditation(true)
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-features`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'meditation', mood }),
        }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch meditation guidance')
      }
      const data = await response.json()
      if (!data.guidance) {
        throw new Error('No meditation guidance received')
      }
      setMeditation(data.guidance)
    } catch (error) {
      console.error('Error fetching meditation guidance:', error)
      setMeditation('Unable to load meditation guidance at this time.')
    } finally {
      setLoadingMeditation(false)
    }
  }

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setEntry(prevEntry => prevEntry + (prevEntry ? ' ' : '') + transcript)
        
        if (!showMoodAfter && entry.length > 50) {
          setShowMoodAfter(true)
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      setRecognition(recognition)
    }
  }, [])

  useEffect(() => {
    fetchEntries()
  }, [user.id])

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    if (entry && moodBefore) {
      setSaving(true)
      const timeout = setTimeout(async () => {
        try {
          const { error } = await supabase
            .from('journal_entries')
            .upsert({
              user_id: user.id,
              content: entry,
              mood_before: moodBefore,
              mood_after: moodAfter,
              updated_at: new Date().toISOString(),
            })
          if (error) throw error
          setLastSaved(new Date())
          fetchEntries()
        } catch (error) {
          console.error('Error saving entry:', error)
        } finally {
          setSaving(false)
        }
      }, 5000)

      setSaveTimeout(timeout)
    }

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [entry, moodBefore, moodAfter, user.id])

  const handleContentChange = (e) => {
    setEntry(e.target.value)
    if (!showMoodAfter && e.target.value.length > 50) {
      setShowMoodAfter(true)
    }
  }

  const handleMoodBeforeSelect = (mood) => {
    setMoodBefore(mood)
    setEntry('')
  }

  const handleMoodAfterSelect = (mood) => {
    setMoodAfter(mood)
  }

  const toggleRecording = () => {
    if (!recognition) {
      alert('Speech recognition is not supported in your browser')
      return
    }

    if (isRecording) {
      recognition.stop()
      setIsRecording(false)
    } else {
      recognition.start()
      setIsRecording(true)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 ">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md ">
        <p className="text-lg italic text-gray-600 dark:text-gray-300 text-center mb-2">
          {greeting}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          How are you feeling right now?
        </h2>
        <MoodSelector onSelect={handleMoodBeforeSelect} selectedMood={moodBefore} />
      </div>

      {moodBefore && (
        <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-primary-700 dark:text-primary-300 mb-4">
            Personalized Meditation & Guidance
          </h3>
          {loadingMeditation ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">
                {meditation}
              </p>
            </div>
          )}
        </div>
      )}

      {moodBefore && (
        <div className="space-y-4">
          <div className="mb-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div>
              {saving ? (
                <span>Saving...</span>
              ) : (
                lastSaved && (
                  <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>
                )
              )}
            </div>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ease-in-out ${
                isRecording
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {isRecording ? (
                <>
                  <StopIcon className="w-5 h-5" />
                  <span>Stop Recording</span>
                </>
              ) : (
                <>
                  <MicrophoneIcon className="w-5 h-5" />
                  <span>Start Recording</span>
                </>
              )}
            </button>
          </div>
          <textarea
            className="journal-editor"
            placeholder="Start writing your thoughts... or click the microphone to use speech-to-text"
            value={entry}
            onChange={handleContentChange}
            autoFocus
          />
        </div>
      )}

      {showMoodAfter && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            How are you feeling after writing?
          </h2>
          <MoodSelector onSelect={handleMoodAfterSelect} selectedMood={moodAfter} />
        </div>
      )}

      {entries.length > 0 && (
        <>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Your Mood Insights
            </h2>
            <MoodInsights entries={entries} />
          </div>
          <JournalTable entries={entries} />
        </>
      )}
    </div>
  )
}