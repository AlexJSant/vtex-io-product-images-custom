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

export const THUMB_CAROUSEL_SPEED = 300

const getClassTokens = value =>
  sanitizeSwiperClass(value, 'swiper-slide-thumb-active')
    .split(/\s+/)
    .filter(Boolean)

export const syncThumbSlideActiveClass = (
  swiper,
  activeIndex,
  thumbActiveClass
) => {
  if (!swiper || swiper.destroyed || !swiper.slides?.length) {
    return
  }

  const activeClasses = getClassTokens(thumbActiveClass)

  swiper.slides.forEach((slideEl, index) => {
    const isActive = index === activeIndex

    activeClasses.forEach(className => {
      slideEl.classList.toggle(className, isActive)
    })
  })
}
