import React, { Fragment, useMemo, useRef, useEffect, useCallback } from 'react'
import classNames from 'classnames'
import { useCssHandles, applyModifiers } from 'vtex.css-handles'
import { Swiper, SwiperSlide } from 'swiper/react'
import { IconCaret } from 'vtex.store-icons'

import { THUMBS_POSITION_HORIZONTAL } from '../../utils/enums'
import { imageUrl, computeImageDimensions } from '../../utils/aspectRatioUtil'
import styles from '../../styles.css'
import swiperStyles from './swiper.scoped.css'
import { joinSwiperClasses, syncThumbSlideActiveClass, THUMB_CAROUSEL_SPEED } from './swiperClassUtils'

const THUMB_SIZE = 150
const THUMB_MAX_SIZE = 256

const CSS_HANDLES = [
  'figure',
  'thumbImg',
  'thumbVid',
  'productImagesThumb',
  'carouselThumbBorder',
  'carouselGaleryThumbs',
  'productImagesThumbCaret',
]

const Thumbnail = props => {
  const { alt, isVideo, thumbUrl, handles, aspectRatio = 'auto' } = props
  const { width: thumbWidth, height: thumbHeight } = computeImageDimensions(
    THUMB_SIZE,
    THUMB_SIZE,
    aspectRatio
  )

  return (
    <>
      <figure
        className={`${applyModifiers(handles.figure, isVideo ? 'video' : '')}`}
        itemProp="associatedMedia"
        itemScope
        itemType="http://schema.org/ImageObject"
      >
        <img
          width={thumbWidth}
          height={thumbHeight}
          className={`${applyModifiers(
            handles.thumbImg,
            isVideo ? 'video' : ''
          )} w-100 h-auto db`}
          itemProp="thumbnail"
          alt={alt}
          src={imageUrl(thumbUrl, THUMB_SIZE, THUMB_MAX_SIZE, aspectRatio)}
        />
      </figure>
      <div
        className={`absolute absolute--fill b--solid b--muted-2 bw0 pointer-events-none ${handles.carouselThumbBorder}`}
      />
    </>
  )
}

const getNavigationConfig = () => ({
  prevEl: '.swiper-thumbnails-caret-prev',
  nextEl: '.swiper-thumbnails-caret-next',
  disabledClass: joinSwiperClasses(
    'c-disabled',
    'o-0',
    'pointer-events-none',
    swiperStyles.carouselCursorDefault
  ),
  hiddenClass: 'dn',
})

const ThumbnailSwiper = props => {
  const { handles } = useCssHandles(CSS_HANDLES)

  const {
    isThumbsVertical,
    slides,
    thumbUrls,
    position,
    thumbnailAspectRatio,
    thumbnailMaxHeight,
    displayThumbnailsArrows,
    activeIndex,
    thumbActiveClass,
    onThumbClick,
    slidesKey,
    onSwiper,
    ...swiperProps
  } = props

  const thumbSwiperRef = useRef(null)

  const handleSwiper = useCallback(
    instance => {
      thumbSwiperRef.current = instance

      if (onSwiper) {
        onSwiper(instance)
      }

      syncThumbSlideActiveClass(instance, activeIndex, thumbActiveClass)
    },
    [onSwiper, activeIndex, thumbActiveClass]
  )

  useEffect(() => {
    const swiper = thumbSwiperRef.current

    if (!swiper || swiper.destroyed) {
      return undefined
    }

    const applyActiveClass = () => {
      syncThumbSlideActiveClass(swiper, activeIndex, thumbActiveClass)
    }

    applyActiveClass()
    swiper.on('update', applyActiveClass)
    swiper.on('slideChange', applyActiveClass)
    swiper.on('transitionEnd', applyActiveClass)

    return () => {
      if (!swiper.destroyed) {
        swiper.off('update', applyActiveClass)
        swiper.off('slideChange', applyActiveClass)
        swiper.off('transitionEnd', applyActiveClass)
      }
    }
  }, [activeIndex, thumbActiveClass, slidesKey, slides.length])

  const hasThumbs = slides.length >= 1 // Mudança: >= 1 ao invés de > 1
  const slidesCount = slides.length || 1

  // Desabilitar navegação quando há menos de 3 slides
  const shouldShowNavigation = slidesCount >= 3 && displayThumbnailsArrows

  const thumbClassName = classNames(
    `${handles.carouselGaleryThumbs} dn h-auto`,
    {
      'db-ns': hasThumbs && slides.length >= 1, // Garantir que há pelo menos 1 slide
      mt3: !isThumbsVertical,
      'w-20 bottom-0 top-0 absolute': isThumbsVertical,
      'left-0':
        isThumbsVertical && position === THUMBS_POSITION_HORIZONTAL.LEFT,
      'right-0':
        isThumbsVertical && position === THUMBS_POSITION_HORIZONTAL.RIGHT,
    }
  )

  const itemContainerClassName = classNames(
    handles.productImagesThumb,
    'mb5 pointer',
    {
      'w-20': !isThumbsVertical,
      'w-100': isThumbsVertical,
    }
  )

  const arrows = useMemo(() => {
    // if (!displayThumbnailsArrows) {
    //   return null
    // }
    // Não mostrar setas quando há menos de 3 slides
    if (!displayThumbnailsArrows || slidesCount < 3) {
      return null
    }

    const thumbCaretSize = 24
    const thumbCaretClassName = `${handles.productImagesThumbCaret} absolute z-2 pointer c-action-primary flex pv2`
    const thumbCaretStyle = { transition: 'opacity 0.2s' }

    const nextBtnClassName = classNames(
      'swiper-thumbnails-caret-next',
      thumbCaretClassName,
      {
        [`bottom-0 pt7 left-0 justify-center w-100 ${styles.gradientBaseBottom}`]:
          isThumbsVertical,
        [`right-0 top-0 items-center h-100 pl6 ${styles.gradientBaseRight}`]:
          !isThumbsVertical,
      }
    )

    const prevBtnClassName = classNames(
      'swiper-thumbnails-caret-prev top-0 left-0',
      thumbCaretClassName,
      isThumbsVertical && `pb7 justify-center w-100 ${styles.gradientBaseTop}`,
      !isThumbsVertical && `items-center h-100 pr6 ${styles.gradientBaseLeft}`
    )

    return (
      <Fragment key="navigation-arrows">
        <span className={nextBtnClassName} style={thumbCaretStyle}>
          <IconCaret
            orientation={isThumbsVertical ? 'down' : 'right'}
            size={thumbCaretSize}
          />
        </span>
        <span className={prevBtnClassName} style={thumbCaretStyle}>
          <IconCaret
            orientation={isThumbsVertical ? 'up' : 'left'}
            size={thumbCaretSize}
          />
        </span>
      </Fragment>
    )
  }, [
    displayThumbnailsArrows,
    handles.productImagesThumbCaret,
    isThumbsVertical,
    slidesCount, // Adicionar slidesCount como dependência
  ])

  return (
    <div className={thumbClassName} data-testid="thumbnail-swiper">
      <Swiper
        onSwiper={handleSwiper}
        className={`h-100 ${handles.productImagesThumbsSwiperContainer}`}
        speed={THUMB_CAROUSEL_SPEED}
        slideToClickedSlide
        onTap={swiper => {
          const index = swiper.clickedIndex

          if (index != null && index >= 0 && onThumbClick) {
            onThumbClick(index)
          }
        }}
        onClick={swiper => {
          const index = swiper.clickedIndex

          if (index != null && index >= 0 && onThumbClick) {
            onThumbClick(index)
          }
        }}
        //
        // slidesPerView={slides.length >= 3 ? 3 : "auto"}
        slidesPerView={3} // Sempre 3 espaços visuais
        // spaceBetween={10}
        spaceBetween={24} // Mudança: de 10 para 24
        // spaceBetween={slides.length >= 3 ? 10 : 0} // Sem espaçamento quando há menos de 3
        //
        touchRatio={1}
        threshold={8}
        // navigation={navigationConfig}
        navigation={shouldShowNavigation ? getNavigationConfig() : false}
        slidesPerGroup={1}
        // Manter o loop desativado das thumbnails para evitar problemas de sincronização
        // START
        loop={false}
        // simulateTouch={!shouldDisableDrag} // Desabilitar apenas drag (mouse) quando há 2 slides no desktop
        // allowTouchMove={!shouldDisableDrag} // Desabilitar movimento via touch quando há 2 slides no desktop
        
        simulateTouch={true}
        allowTouchMove={true}
        freeMode={false}
        mousewheel={false}
        zoom={false}
        watchSlidesVisibility
        watchSlidesProgress
        preloadImages
        updateOnWindowResize
        direction={isThumbsVertical ? 'vertical' : 'horizontal'}
        centeredSlides={slides.length < 2}
        centeredSlidesBounds={false}
        {...swiperProps}
      >
        {slides.map((slide, i) => {
          return (
            <SwiperSlide
              key={`${slidesKey}-${i}-${slide.alt || i}`}
              className={itemContainerClassName}
              onClick={() => {
                if (onThumbClick) {
                  onThumbClick(i)
                }
              }}
              style={{
                aspectRatio: isThumbsVertical ? undefined : '405 / 241', // Aspect ratio 405:241
                // height: isThumbsVertical ? 'auto' : '115px',
                height: isThumbsVertical ? 'auto' : undefined, // Remover altura fixa, deixar aspect-ratio calcular
                maxHeight: thumbnailMaxHeight || 'unset',
                position: 'relative',
                // width: thumbWidth, // Adicionar largura quando há menos de 3 slides
                // minWidth: thumbWidth, // Garantir largura mínima
              }}
            >
              <Thumbnail
                isVideo={slide.type === 'video'}
                index={i}
                handles={handles}
                alt={slide.alt}
                thumbUrl={slide.thumbUrl || thumbUrls[i]}
                // aspectRatio={thumbnailAspectRatio}
                aspectRatio={thumbnailAspectRatio || '405:241'} // Garantir fallback
              />
            </SwiperSlide>
          )
        })}
        {arrows}
      </Swiper>
    </div>
  )
}

export default ThumbnailSwiper
