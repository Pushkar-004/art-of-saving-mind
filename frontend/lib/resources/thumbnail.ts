/**
 * Converts supported video-page URLs into direct image URLs for resource
 * thumbnails. Other URLs are returned unchanged so normal image links keep
 * using the existing resource storage/API shape.
 */
export function getResourceThumbnailUrl(thumbnailUrl: string | null | undefined): string | null {
  if (!thumbnailUrl) return null

  try {
    const url = new URL(thumbnailUrl)
    const host = url.hostname.replace(/^www\./, '').toLowerCase()
    let videoId: string | null = null

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? null
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      videoId = url.searchParams.get('v')
        ?? url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1]
        ?? null
    }

    return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : thumbnailUrl
  } catch {
    return thumbnailUrl
  }
}
