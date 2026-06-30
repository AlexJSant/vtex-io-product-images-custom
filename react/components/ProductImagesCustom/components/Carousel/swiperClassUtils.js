export const sanitizeSwiperClass = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

export const joinSwiperClasses = (...parts) =>
  parts
    .filter(part => typeof part === 'string' && part.trim())
    .join(' ')

export const getSlidesKey = slides =>
  (slides || [])
    .map((slide, index) =>
      slide.url ||
      slide.src ||
      slide.thumbUrl ||
      `${slide.type || 'slide'}-${index}`
    )
    .join('|')
