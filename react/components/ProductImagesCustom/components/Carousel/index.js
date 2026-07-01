/* eslint-disable react/prop-types */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { path } from 'ramda'
import { IconCaret } from 'vtex.store-icons'
import { withCssHandles } from 'vtex.css-handles'
import SwiperCore, { Navigation, Pagination } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

import Video, { getThumbUrl } from '../Video'
import ProductImage from '../ProductImage'
import ThumbnailSwiper from './ThumbnailSwiper'
import ImagePlaceholder from './ImagePlaceholder'
import {
  THUMBS_ORIENTATION,
  THUMBS_POSITION_HORIZONTAL,
  THUMBS_VISIBILITY,
} from '../../utils/enums'
import styles from './swiper.scoped.css'
import {
  getSlidesKey,
  joinSwiperClasses,
  sanitizeSwiperClass,
  THUMB_CAROUSEL_SPEED,
} from './swiperClassUtils'

import './swiper.global.css'
import './overrides.global.css'

const CARET_ICON_SIZE = 24
const CARET_CLASSNAME =
  'pv8 absolute top-50 translate--50y z-2 pointer c-action-primary'

SwiperCore.use([Navigation, Pagination])

const CSS_HANDLES = [
  'carouselContainer',
  'productImagesThumbsSwiperContainer',
  'productImagesThumbActive',
  'productImagesGallerySwiperContainer',
  'productImagesGallerySlide',
  'swiperCaret',
  'swiperCaretNext',
  'swiperCaretPrev',
]

const initialState = {
  thumbUrl: [],
  alt: [],
  activeIndex: 0,
}

class Carousel extends Component {
  state = {
    ...initialState,
    thumbSwiper: null,
    gallerySwiper: null,
  }

  isVideo = []
  _isMounted = false
  gallerySwiper = null
  thumbSwiper = null

  getGalleryActiveIndex(gallerySwiper = this.gallerySwiper) {
    const { slides = [] } = this.props

    if (!gallerySwiper || gallerySwiper.destroyed) {
      return 0
    }

    if (slides.length > 1 && gallerySwiper.params?.loop) {
      return gallerySwiper.realIndex
    }

    return gallerySwiper.activeIndex
  }

  syncThumbPosition = (speed = THUMB_CAROUSEL_SPEED) => {
    const activeIndex = this.getGalleryActiveIndex()

    if (!this.thumbSwiper || this.thumbSwiper.destroyed) {
      return
    }

    this.thumbSwiper.slideTo(activeIndex, speed)
  }

  setThumbSwiper = instance => {
    if (!instance || instance.destroyed) {
      return
    }

    this.thumbSwiper = instance

    if (this._isMounted) {
      this.setState({ thumbSwiper: instance }, () =>
        this.syncThumbPosition(0)
      )
    }
  }

  setGallerySwiper = instance => {
    if (!instance || instance.destroyed) {
      return
    }

    this.gallerySwiper = instance

    if (this._isMounted) {
      this.setState({ gallerySwiper: instance }, () =>
        this.syncThumbPosition(0)
      )
    }
  }

  setInitialVariablesState() {
    const slides = this.props.slides || []

    this.isVideo = []

    slides.forEach(async (slide, i) => {
      if (slide.type === 'video') {
        const thumbUrl = await getThumbUrl(slide.src, slide.thumbWidth)

        this.isVideo[i] = true
        this.setVideoThumb(i)(thumbUrl)
      } else {
        if (!window.navigator) {
          return
        }

        const image = new Image()

        image.src = slide.thumbUrl
      }
    })
  }

  componentDidMount() {
    this._isMounted = true
    this.setInitialVariablesState()

    const pendingState = {}

    if (this.thumbSwiper) {
      pendingState.thumbSwiper = this.thumbSwiper
    }

    if (this.gallerySwiper) {
      pendingState.gallerySwiper = this.gallerySwiper
    }

    if (Object.keys(pendingState).length > 0) {
      this.setState(pendingState, () => this.syncThumbPosition(0))
    }
  }

  componentWillUnmount() {
    this._isMounted = false
    this.gallerySwiper = null
    this.thumbSwiper = null
  }

  componentDidUpdate(prevProps) {
    const { activeIndex } = this.state
    const { isVideo } = this

    const paginationElement = path(
      ['pagination', 'el'],
      this.gallerySwiper
    )

    if (paginationElement) {
      paginationElement.hidden = isVideo[activeIndex]
    }

    if (prevProps.slides !== this.props.slides) {
      this.syncThumbPosition(0)
    }
  }

  handleSlideChange = () => {
    if (!this.gallerySwiper || this.gallerySwiper.destroyed) {
      return
    }

    const activeIndex = this.getGalleryActiveIndex(this.gallerySwiper)

    this.setState({ activeIndex, sliderChanged: true })
    this.syncThumbPosition(THUMB_CAROUSEL_SPEED)
  }

  handleThumbClick = index => {
    const { slides = [] } = this.props

    if (!this.gallerySwiper || this.gallerySwiper.destroyed || index == null) {
      return
    }

    if (slides.length > 1 && this.gallerySwiper.slideToLoop) {
      this.gallerySwiper.slideToLoop(index, THUMB_CAROUSEL_SPEED)
    } else {
      this.gallerySwiper.slideTo(index, THUMB_CAROUSEL_SPEED)
    }

    this.setState({ activeIndex: index })
    this.syncThumbPosition(THUMB_CAROUSEL_SPEED)
  }

  setVideoThumb = i => (url, title) => {
    this.setState(prevState => {
      const thumbUrl = { ...prevState.thumbUrl }
      const alt = { ...prevState.alt }

      thumbUrl[i] = url
      alt[i] = title

      return { thumbUrl, alt }
    })
  }

  renderSlide = (slide, i) => {
    const {
      aspectRatio,
      maxHeight,
      imageWidth,
      imageHeight,
      zoomMode,
      zoomFactor,
      ModalZoomElement,
      zoomProps: legacyZoomProps,
      hideFirstImage,
      slides = [],
    } = this.props

    const { zoomType: legacyZoomType } = legacyZoomProps || {}
    const isZoomDisabled =
      legacyZoomType === 'no-zoom' || zoomMode === 'disabled'

    const firstImageIndex = slides.findIndex(s => s.type === 'image')
    const isFirstImage = hideFirstImage && slide.type === 'image' && i === firstImageIndex

    switch (slide.type) {
      case 'image':
        return (
          <ProductImage
            index={i}
            src={slide.url}
            alt={slide.alt}
            imageLabel={slide.imageLabel}
            maxHeight={maxHeight}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            zoomFactor={zoomFactor}
            aspectRatio={aspectRatio}
            ModalZoomElement={ModalZoomElement}
            zoomMode={isZoomDisabled ? 'disabled' : zoomMode}
            hideFirstImage={isFirstImage}
          />
        )

      case 'video':
        return i === this.state.activeIndex ? (
          <Video
            url={slide.src}
            setThumb={this.setVideoThumb(i)}
            playing={i === this.state.activeIndex}
            id={i}
          />
        ) : (
          <div />
        )

      default:
        return null
    }
  }

  get galleryParams() {
    const { slides = [], showPaginationDots = true } = this.props

    const params = {}

    const paginationClass = sanitizeSwiperClass(styles['swiper-pagination'])

    if (slides.length > 1 && showPaginationDots && paginationClass) {
      params.pagination = {
        el: `.${paginationClass}`,
        clickable: true,
        clickableClass: sanitizeSwiperClass(
          styles.swiperPaginationClickable,
          'swiper-pagination-clickable'
        ),
        bulletClass: sanitizeSwiperClass(
          styles.swiperBullet,
          'swiper-pagination-bullet'
        ),
        bulletActiveClass: sanitizeSwiperClass(
          styles['swiperBullet--active'],
          'swiper-pagination-bullet-active'
        ),
        renderBullet(_index, className) {
          return `<span class="${className} c-action-primary"></span>`
        },
      }
    }

    if (slides.length > 1) {
      params.navigation = {
        prevEl: '.swiper-caret-prev',
        nextEl: '.swiper-caret-next',
        disabledClass: joinSwiperClasses(
          'c-disabled',
          styles.carouselCursorDefault
        ),
      }
    }

    return params
  }

  render() {
    const {
      aspectRatio,
      maxHeight,
      imageWidth,
      imageHeight,
      placeholder,
      position,
      handles,
      slides = [],
      thumbnailMaxHeight,
      thumbnailAspectRatio,
      thumbnailsOrientation,
      zoomProps: { zoomType } = { zoomType: 'in-page' },
      showPaginationDots = true,
      showNavigationArrows = true,
      thumbnailVisibility,
      displayThumbnailsArrows = false,
    } = this.props

    const hasSlides = slides && slides.length > 0
    const slidesKey = getSlidesKey(slides)
    const hasThumbs = slides && slides.length >= 1
    const thumbsVisible =
      thumbnailVisibility === THUMBS_VISIBILITY.VISIBLE && hasThumbs

    const isThumbsVertical =
      thumbnailsOrientation === THUMBS_ORIENTATION.VERTICAL

    const galleryCursor = {
      'in-page': styles.carouselGaleryCursor,
      'no-zoom': '',
    }

    const imageClasses = classNames(
      'w-100 border-box',
      galleryCursor[hasSlides ? zoomType : 'no-zoom'],
      {
        'ml-20-ns w-80-ns pl5-ns':
          isThumbsVertical &&
          position === THUMBS_POSITION_HORIZONTAL.LEFT &&
          ((hasThumbs && thumbnailVisibility === THUMBS_VISIBILITY.VISIBLE) ||
            !hasSlides),
        'mr-20-ns w-80-ns pr5-ns':
          isThumbsVertical &&
          position === THUMBS_POSITION_HORIZONTAL.RIGHT &&
          ((hasThumbs && thumbnailVisibility === THUMBS_VISIBILITY.VISIBLE) ||
            !hasSlides),
      }
    )

    if (!hasSlides) {
      return (
        <div className={imageClasses}>
          {placeholder ? (
            <ProductImage
              src={placeholder}
              alt="Product image placeholder"
              maxHeight={maxHeight}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              aspectRatio={aspectRatio}
              zoomMode="disabled"
            />
          ) : (
            <ImagePlaceholder />
          )}
        </div>
      )
    }

    const containerClasses = classNames(
      handles.carouselContainer,
      'relative overflow-hidden w-100',
      {
        'flex-ns justify-end-ns':
          isThumbsVertical &&
          position === THUMBS_POSITION_HORIZONTAL.LEFT &&
          hasThumbs &&
          thumbnailVisibility === THUMBS_VISIBILITY.VISIBLE,
        'flex-ns justify-start-ns':
          isThumbsVertical &&
          position === THUMBS_POSITION_HORIZONTAL.RIGHT &&
          hasThumbs &&
          thumbnailVisibility === THUMBS_VISIBILITY.VISIBLE,
      }
    )

    const thumbnailSwiper = (
      <ThumbnailSwiper
        key={`thumbs-${slidesKey}`}
        slidesKey={slidesKey}
        onSwiper={this.setThumbSwiper}
        activeIndex={this.state.activeIndex}
        thumbActiveClass={handles.productImagesThumbActive}
        onThumbClick={this.handleThumbClick}
        isThumbsVertical={isThumbsVertical}
        thumbnailAspectRatio={thumbnailAspectRatio}
        thumbnailMaxHeight={thumbnailMaxHeight}
        thumbUrls={this.state.thumbUrl}
        displayThumbnailsArrows={displayThumbnailsArrows}
        slides={slides}
        position={position}
      />
    )

    return (
      <div className={containerClasses} aria-hidden="true">
        {isThumbsVertical && thumbsVisible && thumbnailSwiper}
        <div className={imageClasses}>
          <Swiper
            key={`gallery-${slidesKey}`}
            onSwiper={this.setGallerySwiper}
            className={handles.productImagesGallerySwiperContainer}
            threshold={10}
            speed={THUMB_CAROUSEL_SPEED}
            resistanceRatio={slides.length > 1 ? 0.85 : 0}
            onSlideChange={this.handleSlideChange}
            updateOnWindowResize
            loop={slides.length > 1}
            loopedSlides={slides.length >= 3 ? 3 : slides.length}
            {...this.galleryParams}
          >
            {slides.map((slide, i) => (
              <SwiperSlide
                key={`${slidesKey}-${i}`}
                className={`${handles.productImagesGallerySlide} swiper-slide center-all`}
              >
                {this.renderSlide(slide, i)}
              </SwiperSlide>
            ))}

            <div
              key="pagination"
              className={classNames(styles['swiper-pagination'], {
                dn: slides.length === 1 || !showPaginationDots,
              })}
            />

            <div
              className={classNames({
                dn: slides.length === 1 || !showNavigationArrows,
              })}
            >
              <span
                key="caret-next"
                className={`swiper-caret-next pl7 pr2 right-0 ${CARET_CLASSNAME} ${handles.swiperCaret} ${handles.swiperCaretNext}`}
              >
                <IconCaret
                  orientation="right"
                  size={CARET_ICON_SIZE}
                  className={styles.carouselIconCaretRight}
                />
              </span>
              <span
                key="caret-prev"
                className={`swiper-caret-prev pr7 pl2 left-0 ${CARET_CLASSNAME} ${handles.swiperCaret} ${handles.swiperCaretPrev}`}
              >
                <IconCaret
                  orientation="left"
                  size={CARET_ICON_SIZE}
                  className={styles.carouselIconCaretLeft}
                />
              </span>
            </div>
          </Swiper>

          {!isThumbsVertical && thumbsVisible && (
            <div className="relative z-2">{thumbnailSwiper}</div>
          )}
        </div>
      </div>
    )
  }
}

Carousel.propTypes = {
  slides: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string,
      url: PropTypes.string,
      alt: PropTypes.string,
      thumbUrl: PropTypes.string,
      bestUrlIndex: PropTypes.number,
    })
  ),
  ModalZoomElement: PropTypes.any,
  displayThumbnailsArrows: PropTypes.bool,
  thumbnailVisibility: PropTypes.oneOf([
    THUMBS_VISIBILITY.VISIBLE,
    THUMBS_VISIBILITY.HIDDEN,
  ]),
  hideFirstImage: PropTypes.bool,
}

export default withCssHandles(CSS_HANDLES)(Carousel)
