'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Heart, TrendingUp, Calendar } from 'lucide-react'
import GlassCard from '@/components/shared/GlassCard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { toast } from 'sonner'
import { useT } from '@/lib/i18n/useT'

const moodEmojis = [
  { value: 1, emoji: '😢', translationKey: 'moodTrackerPage.moodTerrible' },
  { value: 2, emoji: '😟', translationKey: 'moodTrackerPage.moodBad' },
  { value: 3, emoji: '😐', translationKey: 'moodTrackerPage.moodOkay' },
  { value: 4, emoji: '🙂', translationKey: 'moodTrackerPage.moodGood' },
  { value: 5, emoji: '😄', translationKey: 'moodTrackerPage.moodGreat' },
]

const weeklyMoodData = [
  { date: 'Mon', mood: 5, intensity: 7 },
  { date: 'Tue', mood: 6, intensity: 7 },
  { date: 'Wed', mood: 5, intensity: 6 },
  { date: 'Thu', mood: 7, intensity: 8 },
  { date: 'Fri', mood: 7, intensity: 8 },
  { date: 'Sat', mood: 8, intensity: 9 },
  { date: 'Sun', mood: 7, intensity: 8 },
]

const monthlyMoodData = [
  { week: 'Week 1', avg: 5.2 },
  { week: 'Week 2', avg: 5.8 },
  { week: 'Week 3', avg: 6.4 },
  { week: 'Week 4', avg: 6.9 },
]

export default function MoodTrackerPage() {
  const { t } = useT()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedMood) {
      toast.error(t('toast.selectMood'))
      return
    }

    setIsSubmitting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 800))
      toast.success(t('toast.moodLogged'))
      setSelectedMood(null)
      setIntensity(5)
      setNotes('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('sidebar.moodTracker')}</h1>
        <p className="text-muted-foreground">{t('moodTrackerPage.subtitle')}</p>
      </div>

      {/* Log Today's Mood */}
      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Heart size={24} className="text-primary" />
            <h2 className="text-2xl font-semibold text-foreground">{t('wellnessAssistant.welcomeHeading')}</h2>
          </div>

          {/* Mood Selection */}
          <div className="flex justify-between gap-2 sm:gap-4">
            {moodEmojis.map((mood) => (
              <motion.button
                key={mood.value}
                onClick={() => setSelectedMood(mood.value)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl transition-all ${
                  selectedMood === mood.value
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'border-2 border-transparent hover:bg-muted'
                }`}
              >
                <span className="text-4xl">{mood.emoji}</span>
                <span className="text-xs sm:text-sm font-medium text-foreground text-center hidden sm:block">
                  {t(mood.translationKey)}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Intensity Slider */}
          {selectedMood && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t('moodTrackerPage.intensityLevel')} <span className="text-primary font-bold">{intensity}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('moodTrackerPage.notesOptional')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('moodTrackerPage.notesPlaceholder')}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="glass-button w-full disabled:opacity-50"
              >
                {isSubmitting ? t('moodTrackerPage.logging') : t('moodTrackerPage.logMood')}
              </button>
            </motion.div>
          )}
        </div>
      </GlassCard>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('moodTrackerPage.weeklyTrend')}</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyMoodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e3d8" />
                <XAxis dataKey="date" stroke="#6b6b6b" />
                <YAxis domain={[0, 10]} stroke="#6b6b6b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="#8BA888"
                  strokeWidth={3}
                  dot={{ fill: '#D4AF37', r: 5 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Monthly Average */}
        <GlassCard>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t('moodTrackerPage.monthlyProgress')}</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyMoodData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e3d8" />
                <XAxis dataKey="week" stroke="#6b6b6b" />
                <YAxis domain={[0, 10]} stroke="#6b6b6b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="avg"
                  fill="#8BA888"
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('moodTrackerPage.averageMood')}</p>
            <p className="text-3xl font-bold text-primary">6.6/10</p>
            <p className="text-xs text-muted-foreground">{t('moodTrackerPage.steadilyImproving')}</p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('moodTrackerPage.bestDay')}</p>
            <p className="text-3xl font-bold text-primary">Saturday</p>
            <p className="text-xs text-muted-foreground">8/10</p>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('moodTrackerPage.currentStreak')}</p>
            <p className="text-3xl font-bold text-primary">7 days</p>
            <p className="text-xs text-muted-foreground">{t('moodTrackerPage.keepItUp')}</p>
          </div>
        </GlassCard>
      </div>
    </motion.div>
  )
}
