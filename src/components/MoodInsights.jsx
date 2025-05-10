import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const moodValues = {
  happy: 5,
  calm: 4,
  neutral: 3,
  sad: 2,
  anxious: 1,
}

export default function MoodInsights({ entries }) {
  // Create a copy and reverse it to maintain the original array
  const chronologicalEntries = [...entries].reverse()
  
  const data = {
    labels: chronologicalEntries.map((entry) =>
      new Date(entry.created_at).toLocaleDateString()
    ),
    datasets: [
      {
        label: 'Mood Before',
        data: chronologicalEntries.map((entry) => moodValues[entry.mood_before] || 0),
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.5)',
      },
      {
        label: 'Mood After',
        data: chronologicalEntries.map((entry) => moodValues[entry.mood_after] || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(243, 244, 246)',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Mood Changes Over Time',
        color: 'rgb(243, 244, 246)',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: 'rgb(243, 244, 246)',
        bodyColor: 'rgb(243, 244, 246)',
        callbacks: {
          label: function(context) {
            const entry = chronologicalEntries[context.dataIndex];
            const mood = context.dataset.label === 'Mood Before' ? entry.mood_before : entry.mood_after;
            const time = new Date(entry.created_at).toLocaleTimeString();
            return `${context.dataset.label}: ${mood} (${time})`;
          }
        }
      }
    },
    scales: {
      y: {
        min: 0,
        max: 5,
        grid: {
          color: 'rgba(243, 244, 246, 0.1)'
        },
        ticks: {
          stepSize: 1,
          color: 'rgb(243, 244, 246)',
          callback: (value) =>
            Object.entries(moodValues).find(([, v]) => v === value)?.[0] || '',
        },
      },
      x: {
        grid: {
          color: 'rgba(243, 244, 246, 0.1)'
        },
        ticks: {
          color: 'rgb(243, 244, 246)',
          maxRotation: 45,
          minRotation: 45
        }
      }
    },
  }

  return (
    <div className="w-full p-4 bg-black dark:bg-gray-900 rounded-lg shadow">
      <div className="h-[400px]">
        <Line options={options} data={data} />
      </div>
    </div>
  )
}