// Curated wellness videos shown on the public Resources page under the
// "Videos" tab. These are embedded/linked from YouTube (publicly
// available videos from well-known wellness channels) — no video
// files are hosted by us, and nothing here touches the PDF/worksheet
// resource library, its API, or the admin dashboard.
//
// Stored as a plain array for now so it's trivial to swap for an
// API/database-backed list later (e.g. GET /api/videos) without
// changing anything in app/resources/page.tsx beyond the data source.

export type VideoCategory =
  | 'Meditation'
  | 'Mindfulness'
  | 'Stress Relief'
  | 'Anxiety'
  | 'Positive Thinking'
  | 'Emotional Healing'
  | 'Breathing Exercises'
  | 'Self Love'
  | 'Mental Wellness'
  | 'Yoga for Mental Health'

export interface WellnessVideo {
  id: string
  youtubeId: string
  title: string
  description: string
  duration: string
  category: VideoCategory
  channel: string
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  'Meditation',
  'Mindfulness',
  'Stress Relief',
  'Anxiety',
  'Positive Thinking',
  'Emotional Healing',
  'Breathing Exercises',
  'Self Love',
  'Mental Wellness',
  'Yoga for Mental Health',
]

export const WELLNESS_VIDEOS: WellnessVideo[] = [
  {
    id: 'v1',
    youtubeId: 'PsKEgrx0Xwc',
    title: 'Isha Kriya: A Guided Meditation',
    description:
      'A simple, powerful guided meditation created by Sadhguru to bring clarity, health, and inner peace — no prior experience needed.',
    duration: '13 min',
    category: 'Meditation',
    channel: 'Sadhguru',
  },
  {
    id: 'v2',
    youtubeId: 'iN6g2mr0p3Q',
    title: 'Meditation: Changing Perspective',
    description:
      'A short animated guide on accepting that the mind wanders during meditation, and learning to work with that instead of against it.',
    duration: '3 min',
    category: 'Mindfulness',
    channel: 'Headspace',
  },
  {
    id: 'v3',
    youtubeId: 'RcGyVTAoXEU',
    title: 'How to Make Stress Your Friend',
    description:
      'Psychologist Kelly McGonigal explains how changing your mindset about stress can change the way your body responds to it.',
    duration: '14 min',
    category: 'Stress Relief',
    channel: 'TED',
  },
  {
    id: 'v4',
    youtubeId: 'LVxKF5SuVC4',
    title: 'How to Deal with Anxiety',
    description:
      'Psychiatrist Dr. K breaks down what anxiety actually is and shares practical ways to work through it day to day.',
    duration: '13 min',
    category: 'Anxiety',
    channel: 'HealthyGamerGG',
  },
  {
    id: 'v5',
    youtubeId: '-Y--OqStOPw',
    title: 'Meditation for Positive Thinking',
    description:
      'A guided meditation by Gurudev Sri Sri Ravi Shankar focused on cultivating a positive, resilient outlook on life.',
    duration: '10 min',
    category: 'Positive Thinking',
    channel: 'The Art of Living',
  },
  {
    id: 'v6',
    youtubeId: 'X4Qm9cGRub0',
    title: 'The Power of Vulnerability',
    description:
      'Brené Brown shares her research on shame and courage, and why embracing vulnerability leads to deeper connection and healing.',
    duration: '20 min',
    category: 'Emotional Healing',
    channel: 'TED',
  },
  {
    id: 'v7',
    youtubeId: 'NOuWnZjbrgI',
    title: 'What Is Sudarshan Kriya?',
    description:
      'An introduction to Sudarshan Kriya, a rhythmic breathing technique used to release stress and restore energy and focus.',
    duration: '5 min',
    category: 'Breathing Exercises',
    channel: 'The Art of Living',
  },
  {
    id: 'v8',
    youtubeId: 'BWP3NSDpF6U',
    title: '8 Things You Need to Know About Self-Love',
    description:
      'A friendly, practical rundown of what self-love really means and small daily habits that help you build more of it.',
    duration: '5 min',
    category: 'Self Love',
    channel: 'Psych2Go',
  },
  {
    id: 'v9',
    youtubeId: '-eBUcBfkVCo',
    title: 'Depression, the Secret We Share',
    description:
      'Writer Andrew Solomon shares his own experience with depression and what it means to build a meaningful life alongside it.',
    duration: '29 min',
    category: 'Mental Wellness',
    channel: 'TED',
  },
  {
    id: 'v10',
    youtubeId: 'hJbRpHZr_d0',
    title: 'Yoga for Anxiety and Stress',
    description:
      'A gentle practice of breathwork and movement designed to help release tension and ease feelings of stress and anxiety.',
    duration: '27 min',
    category: 'Yoga for Mental Health',
    channel: 'Yoga With Adriene',
  },
]

export const VIDEO_CATEGORY_BADGE_COLOR: Record<VideoCategory, string> = {
  Meditation: 'bg-secondary dark:bg-secondary/40 text-foreground',
  Mindfulness: 'bg-primary/10 dark:bg-primary/20 text-foreground',
  'Stress Relief': 'bg-accent/10 dark:bg-accent/20 text-foreground',
  Anxiety: 'bg-muted dark:bg-muted/40 text-foreground',
  'Positive Thinking': 'bg-secondary dark:bg-secondary/40 text-foreground',
  'Emotional Healing': 'bg-primary/10 dark:bg-primary/20 text-foreground',
  'Breathing Exercises': 'bg-accent/10 dark:bg-accent/20 text-foreground',
  'Self Love': 'bg-muted dark:bg-muted/40 text-foreground',
  'Mental Wellness': 'bg-secondary dark:bg-secondary/40 text-foreground',
  'Yoga for Mental Health': 'bg-primary/10 dark:bg-primary/20 text-foreground',
}

// Case-insensitive match against title, description, category, and
// channel — mirrors matchesResourceSearch in categories.ts so search
// behaves consistently across both tabs.
export function matchesVideoSearch(video: WellnessVideo, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase()
  if (!q) return true
  return (
    video.title.toLowerCase().includes(q) ||
    video.description.toLowerCase().includes(q) ||
    video.category.toLowerCase().includes(q) ||
    video.channel.toLowerCase().includes(q)
  )
}

export function youtubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
}

export function youtubeWatchUrl(youtubeId: string): string {
  return `https://www.youtube.com/watch?v=${youtubeId}`
}
