import React, { useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useCssHandles } from 'vtex.css-handles'

import Carousel from './components/Carousel'
import ProductImage from './components/ProductImage'
import {
  THUMBS_ORIENTATION,
  THUMBS_POSITION_HORIZONTAL,
  THUMBS_VISIBILITY,
  DEFAULT_EXCLUDE_IMAGE_WITH,
  DISPLAY_MODE,
} from './utils/enums'

// Optional integration with enhanced-sku-selector
// This integration is completely optional and will gracefully degrade if not available
// We don't declare the dependency in manifest.json to avoid build errors
// Instead, we try to access the module at runtime using multiple approaches

const CSS_HANDLES = ['content', 'productImagesContainer']

const ProductImagesCustom = ({
  position,
  displayThumbnailsArrows,
  hiddenImages,
  placeholder,
  images: allImages,
  videos: allVideos,
  thumbnailsOrientation,
  aspectRatio,
  maxHeight,
  thumbnailAspectRatio,
  thumbnailMaxHeight,
  showNavigationArrows,
  showPaginationDots,
  showImageLabel = false,
  thumbnailVisibility,
  contentOrder = 'images-first',
  zoomMode,
  zoomFactor,
  ModalZoomElement,
  contentType = 'all',
  hideFirstImage = false,
  // Deprecated
  zoomProps,
  displayMode,
}) => {
  // Try to load the hook dynamically at runtime
  // We use useState and useEffect to load it asynchronously
  // Using Function constructor to avoid webpack trying to resolve the module at build time
  const [useSKUImageLabelsHook, setUseSKUImageLabelsHook] = useState(null)
  const [hookLoadAttempted, setHookLoadAttempted] = useState(false)

  useEffect(() => {
    if (hookLoadAttempted) return
    
    setHookLoadAttempted(true)
    
    // Try to load the hook using Function constructor
    // This prevents webpack from analyzing the require() call statically
    const loadHook = () => {
      if (typeof require === 'undefined') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ProductImagesCustom] require not available')
        }
        return
      }
      
      try {
        // Use Function constructor to create a require that webpack won't analyze
        // This prevents webpack from trying to resolve the module at build time
        // eslint-disable-next-line no-new-func
        const dynamicRequire = new Function('req', 'path', 'return req(path)')
        const modulePath = 'sunhouse.enhanced-sku-selector/react/contexts'
        const contexts = dynamicRequire(require, modulePath)
        const hook = contexts?.useSKUImageLabels
        
        if (hook && typeof hook === 'function') {
          setUseSKUImageLabelsHook(() => hook)
          if (process.env.NODE_ENV === 'development') {
            console.log('[ProductImagesCustom] ✅ Hook useSKUImageLabels loaded successfully')
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[ProductImagesCustom] Hook not found in module')
          }
        }
      } catch (error) {
        // Module not available - this is expected when enhanced-sku-selector is not linked
        if (process.env.NODE_ENV === 'development') {
          console.log('[ProductImagesCustom] Hook not available (enhanced-sku-selector may not be linked):', error.message)
        }
      }
    }
    
    loadHook()
  }, [hookLoadAttempted])
  
  // Create a safe hook wrapper that always returns a Set
  // This allows us to call it unconditionally (React hooks rules)
  const useSafeSKUImageLabels = () => {
    if (!useSKUImageLabelsHook || typeof useSKUImageLabelsHook !== 'function') {
      return { hiddenImageLabels: new Set() }
    }
    
    try {
      return useSKUImageLabelsHook() || { hiddenImageLabels: new Set() }
    } catch (error) {
      // Provider not present - return empty Set
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[ProductImagesCustom] Contexto não encontrado, continuando sem ocultar imagens:', error.message)
      }
      return { hiddenImageLabels: new Set() }
    }
  }
  
  // Call the hook unconditionally at component level (React hooks rules)
  const context = useSafeSKUImageLabels()
  const hiddenImageLabelsFromContext = context?.hiddenImageLabels || new Set()
  
  // DEBUG: Log context labels
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const labelsArray = Array.from(hiddenImageLabelsFromContext)
    if (labelsArray.length > 0) {
      console.log('[ProductImagesCustom] Labels ocultos recebidos:', labelsArray)
      console.log('[ProductImagesCustom] Total de labels no contexto:', labelsArray.length)
    } else if (!useSKUImageLabelsHook) {
      console.log('[ProductImagesCustom] Hook não disponível, continuando sem ocultar imagens do contexto')
    }
  }

  // Normalize hiddenImages prop to array
  const normalizedHiddenImages = useMemo(() => {
    if (!hiddenImages) return []
    return Array.isArray(hiddenImages) ? hiddenImages : [hiddenImages]
  }, [hiddenImages])

  // Convert context Set to sorted array for dependency tracking
  // Create a stable string representation for useMemo dependency
  const contextLabelsKey = Array.from(hiddenImageLabelsFromContext).sort().join(',')

  // Merge hiddenImages prop with context labels
  const allHiddenLabels = useMemo(() => {
    const labels = new Set()
    
    // Add labels from prop (split comma-separated strings and trim)
    if (normalizedHiddenImages) {
      normalizedHiddenImages.forEach(label => {
        if (typeof label === 'string') {
          label.split(',').forEach(l => {
            const trimmed = l.trim()
            if (trimmed) labels.add(trimmed)
          })
        }
      })
    }
    
    // Add labels from context
    hiddenImageLabelsFromContext.forEach(label => labels.add(label))
    
    // DEBUG: Log merged labels
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[ProductImagesCustom] All hidden labels (merged):', {
        fromProp: normalizedHiddenImages,
        fromContext: Array.from(hiddenImageLabelsFromContext),
        merged: Array.from(labels),
        totalCount: labels.size
      })
    }
    
    return labels
  }, [normalizedHiddenImages, contextLabelsKey])

  // Create regex patterns for prop-based filtering (backward compatibility)
  const excludeImageRegexes = useMemo(
    () =>
      normalizedHiddenImages &&
      normalizedHiddenImages.map(text => new RegExp(text, 'i')),
    [normalizedHiddenImages]
  )

  const { handles, withModifiers } = useCssHandles(CSS_HANDLES)
  const productImagesContainerClass = withModifiers(
    'productImagesContainer',
    displayMode
  )

  const images = useMemo(() => {
    const shouldIncludeImages = contentType !== 'videos'

    // DEBUG: Log all images before filtering
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[ProductImagesCustom] Images before filtering:', {
        totalImages: allImages.length,
        imagesWithLabels: allImages.map(img => ({
          label: img.imageLabel,
          url: img.imageUrls ? img.imageUrls[0] : img.imageUrl
        }))
      })
    }

    const filtered = shouldIncludeImages
      ? allImages
          .filter(image => {
            // If image has no label, always show it
            if (!image.imageLabel) {
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.log('[ProductImagesCustom] Image without label - showing:', image.imageUrls ? image.imageUrls[0] : image.imageUrl)
              }
              return true
            }

            // Check if label is in the merged hidden labels set (exact match)
            if (allHiddenLabels.has(image.imageLabel)) {
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.log('[ProductImagesCustom] Image HIDDEN (exact match):', {
                  label: image.imageLabel,
                  url: image.imageUrls ? image.imageUrls[0] : image.imageUrl
                })
              }
              return false
            }

            // Check regex patterns for backward compatibility with hiddenImages prop
            if (
              excludeImageRegexes &&
              excludeImageRegexes.some(regex => regex.test(image.imageLabel))
            ) {
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
                console.log('[ProductImagesCustom] Image HIDDEN (regex match):', {
                  label: image.imageLabel,
                  url: image.imageUrls ? image.imageUrls[0] : image.imageUrl
                })
              }
              return false
            }

            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.log('[ProductImagesCustom] Image SHOWN:', {
                label: image.imageLabel,
                url: image.imageUrls ? image.imageUrls[0] : image.imageUrl
              })
            }
            return true
          })
          .map(image => ({
            type: 'image',
            url: image.imageUrls ? image.imageUrls[0] : image.imageUrl,
            alt: image.imageLabel,
            thumbUrl: image.thumbnailUrl || image.imageUrl,
            ...(showImageLabel && { imageLabel: image.imageLabel }),
          }))
      : []

    // DEBUG: Log filtered images
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[ProductImagesCustom] Images after filtering:', {
        totalBefore: allImages.length,
        totalAfter: filtered.length,
        hiddenCount: allImages.length - filtered.length
      })
    }

    return filtered
  }, [
    allImages,
    contentType,
    allHiddenLabels,
    excludeImageRegexes,
    showImageLabel,
  ])

  const videos = useMemo(() => {
    const shouldIncludeVideos = contentType !== 'images'

    return shouldIncludeVideos
      ? allVideos.map(video => ({
          type: 'video',
          src: video.videoUrl,
          thumbWidth: 300,
        }))
      : []
  }, [allVideos, contentType])

  const showVideosFirst = contentOrder === 'videos-first'

  const slides = useMemo(() => {
    return showVideosFirst ? [...videos, ...images] : [...images, ...videos]
  }, [showVideosFirst, videos, images])

  const { zoomType: legacyZoomType } = zoomProps || {}
  const isZoomDisabled = legacyZoomType === 'no-zoom' || zoomMode === 'disabled'

  const containerClass = `${productImagesContainerClass} ${handles.content} w-100`

  if (displayMode === DISPLAY_MODE.LIST) {
    return (
      <div className={containerClass}>
        {images.map(({ url, alt, imageLabel }, index) => (
          <ProductImage
            key={index}
            index={index}
            src={url}
            alt={alt}
            imageLabel={imageLabel}
            maxHeight={maxHeight}
            zoomFactor={zoomFactor}
            aspectRatio={aspectRatio}
            ModalZoomElement={ModalZoomElement}
            zoomMode={isZoomDisabled ? 'disabled' : zoomMode}
            hideFirstImage={hideFirstImage && index === 0}
          />
        ))}
      </div>
    )
  }

  if (displayMode === DISPLAY_MODE.FIRST_IMAGE && images?.length) {
    const { url, alt, imageLabel } = images?.[0] ?? {}

    if (hideFirstImage) {
      return null
    }

    return (
      <div className={containerClass}>
        <ProductImage
          index={0}
          src={url}
          alt={alt}
          imageLabel={imageLabel}
          maxHeight={maxHeight}
          zoomFactor={zoomFactor}
          aspectRatio={aspectRatio}
          ModalZoomElement={ModalZoomElement}
          zoomMode={isZoomDisabled ? 'disabled' : zoomMode}
          hideFirstImage={false}
        />
      </div>
    )
  }

  return (
    <div className={containerClass}>
      <Carousel
        slides={slides}
        placeholder={placeholder}
        position={position}
        zoomMode={zoomMode}
        maxHeight={maxHeight}
        zoomFactor={zoomFactor}
        aspectRatio={aspectRatio}
        ModalZoomElement={ModalZoomElement}
        thumbnailMaxHeight={thumbnailMaxHeight}
        showPaginationDots={showPaginationDots}
        thumbnailAspectRatio={thumbnailAspectRatio}
        showNavigationArrows={showNavigationArrows}
        thumbnailsOrientation={thumbnailsOrientation}
        displayThumbnailsArrows={displayThumbnailsArrows}
        thumbnailVisibility={thumbnailVisibility}
        hideFirstImage={hideFirstImage}
        // Deprecated
        zoomProps={zoomProps}
      />
    </div>
  )
}

ProductImagesCustom.propTypes = {
  /** The position of the thumbs */
  position: PropTypes.oneOf([
    THUMBS_POSITION_HORIZONTAL.LEFT,
    THUMBS_POSITION_HORIZONTAL.RIGHT,
  ]),
  ModalZoomElement: PropTypes.any,
  thumbnailsOrientation: PropTypes.oneOf([
    THUMBS_ORIENTATION.VERTICAL,
    THUMBS_ORIENTATION.HORIZONTAL,
  ]),
  /** This is a necessary prop if you're using SKUSelector to display color images
   * (like a image with only green to represent an SKU of something green) and you
   * want to not display this image in the ProductImagesCustom component, to do this you
   * just have to upload the image in the catalog with the value of this prop inside the imageText property */
  hiddenImages: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  placeholder: PropTypes.string,
  /** Array of images to be passed for the Thumbnail Slider component as a props */
  images: PropTypes.arrayOf(
    PropTypes.shape({
      /** URL of the image */
      imageUrls: PropTypes.arrayOf(PropTypes.string.isRequired),
      /** Size thresholds used to choose each image */
      thresholds: PropTypes.arrayOf(PropTypes.number),
      /** URL of the image thumbnail */
      thumbnailUrl: PropTypes.string,
      /** Text that describes the image */
      imageText: PropTypes.string,
    })
  ),
  videos: PropTypes.arrayOf(
    PropTypes.shape({
      videoUrl: PropTypes.string,
    })
  ),
  zoomProps: PropTypes.shape({
    zoomType: PropTypes.string,
  }),
  displayThumbnailsArrows: PropTypes.bool,
  aspectRatio: PropTypes.string,
  maxHeight: PropTypes.number,
  thumbnailAspectRatio: PropTypes.string,
  thumbnailMaxHeight: PropTypes.number,
  showNavigationArrows: PropTypes.bool,
  showPaginationDots: PropTypes.bool,
  showImageLabel: PropTypes.bool,
  thumbnailVisibility: PropTypes.oneOf([
    THUMBS_VISIBILITY.VISIBLE,
    THUMBS_VISIBILITY.HIDDEN,
  ]),
  contentOrder: PropTypes.oneOf(['images-first', 'videos-first']),
  zoomMode: PropTypes.oneOf([
    'disabled',
    'open-modal',
    'in-place-click',
    'in-place-hover',
  ]),
  zoomFactor: PropTypes.number,
  contentType: PropTypes.oneOf(['all', 'images', 'videos']),
  displayMode: PropTypes.oneOf([
    DISPLAY_MODE.CAROUSEL,
    DISPLAY_MODE.LIST,
    DISPLAY_MODE.FIRST_IMAGE,
  ]),
  hideFirstImage: PropTypes.bool,
}

ProductImagesCustom.defaultProps = {
  images: [],
  position: THUMBS_POSITION_HORIZONTAL.LEFT,
  zoomProps: { zoomType: 'in-page' },
  thumbnailsOrientation: THUMBS_ORIENTATION.VERTICAL,
  displayThumbnailsArrows: false,
  thumbnailVisibility: THUMBS_VISIBILITY.VISIBLE,
  hiddenImages: DEFAULT_EXCLUDE_IMAGE_WITH,
  displayMode: DISPLAY_MODE.CAROUSEL,
}

export default ProductImagesCustom
