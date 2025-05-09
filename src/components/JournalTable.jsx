import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function JournalTable({ entries }) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (entries.length > 0) {
      fetchProfile(entries[0].user_id)
    }
  }, [entries])

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const calculateAge = (dateOfBirth) => {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const chronologicalEntries = [...entries].sort((a, b) =>
    new Date(a.created_at) - new Date(b.created_at)
  )

  const getFinalMoods = () => {
    const finalMoods = {}
    for (let i = 0; i < chronologicalEntries.length - 1; i++) {
      const currentEntry = chronologicalEntries[i]
      const nextEntry = chronologicalEntries[i + 1]
      finalMoods[currentEntry.id] = nextEntry.mood_before
    }
    if (chronologicalEntries.length > 0) {
      const lastEntry = chronologicalEntries[chronologicalEntries.length - 1]
      finalMoods[lastEntry.id] = lastEntry.mood_after
    }
    return finalMoods
  }

  const finalMoods = getFinalMoods()

  const sortedEntries = [...entries].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    return sortDirection === 'desc'
      ? bValue.localeCompare(aValue)
      : aValue.localeCompare(bValue)
  })

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    let currentY = 10

    // Profile data without the title, "Field" and "Value" headings, and "Member Since" row
    if (profile) {
      const profileData = [
        ['Full Name', profile.full_name],
        ['Gender', profile.gender],
        ['Date of Birth', `${new Date(profile.date_of_birth).toLocaleDateString()} (Age: ${calculateAge(profile.date_of_birth)} years)`]
      ]

      doc.autoTable({
        startY: currentY,
        body: profileData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
          1: { cellWidth: 120 }
        }
      })

      currentY = doc.previousAutoTable.finalY + 10
    }

    // Add "Journal History" heading
    doc.setFontSize(12)
    doc.text('Journal History', 14, currentY)
    currentY += 5

    // Journal entries table
    const tableData = sortedEntries.map(entry => [
      new Date(entry.created_at).toLocaleString(),
      entry.mood_before,
      entry.content,
      finalMoods[entry.id] || 'N/A'
    ])

    doc.autoTable({
      startY: currentY,
      head: [['Date & Time', 'Initial Mood', 'Journal Entry', 'Final Mood']],
      body: tableData,
      styles: { overflow: 'linebreak', fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 30 },
        2: { cellWidth: 80 },
        3: { cellWidth: 30 }
      }
    })

    doc.save('journal-entries.pdf')
  }

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {profile && (
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              User Profile
            </h3>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Full Name
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {profile.full_name}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Gender
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {profile.gender}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date of Birth
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {new Date(profile.date_of_birth).toLocaleDateString()} (Age: {calculateAge(profile.date_of_birth)} years)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Journal History
        </h3>
        <button
          onClick={exportToPDF}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Export to PDF
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Date & Time
                {sortField === 'created_at' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                onClick={() => handleSort('mood_before')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Initial Mood
                {sortField === 'mood_before' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Journal Entry
              </th>
              <th
                onClick={() => handleSort('mood_after')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Final Mood
                {sortField === 'mood_after' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {new Date(entry.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {entry.mood_before}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  <div className="max-h-20 overflow-y-auto">
                    {entry.content}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {finalMoods[entry.id] || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
