import React, { FC, useMemo, useRef } from 'react'
import { Modal } from 'vtex.modal-layout'
import { useCssHandles, applyModifiers } from 'vtex.css-handles'

import Zoomable, { ZoomMode } from './Zoomable'
import { imageUrl, computeImageDimensions } from '../utils/aspectRatioUtil'
import ProductImageContext, {
  State as ProductImageState,
} from './ProductImageContext'
import '../styles.css'

const DEFAULT_IMAGE_WIDTH = 610
const DEFAULT_IMAGE_HEIGHT = 610
const MAX_SIZE = 2048

interface Props {
  index: number
  src: string
  alt: string
  imageLabel?: string
  zoomMode: ZoomMode
  zoomFactor: number
  aspectRatio?: AspectRatio
  maxHeight?: number | string
  imageWidth?: number
  imageHeight?: number
  ModalZoomElement?: typeof Modal
  hideFirstImage?: boolean
}

type AspectRatio = string | number

const CSS_HANDLES = ['productImage', 'productImageTag', 'productImageLabel']

const ProductImage: FC<Props> = ({
  index,
  src,
  alt,
  imageLabel,
  zoomFactor = 2,
  maxHeight = 600,
  imageWidth = DEFAULT_IMAGE_WIDTH,
  imageHeight = DEFAULT_IMAGE_HEIGHT,
  ModalZoomElement,
  aspectRatio = 'auto',
  zoomMode = 'in-place-click',
  hideFirstImage = false,
}) => {
  const imageSizes = useMemo(
    () =>
      [...new Set([Math.round(imageWidth * 0.75), imageWidth, Math.round(imageWidth * 1.5)])].sort(
        (a, b) => a - b
      ),
    [imageWidth]
  )

  const { width: imgWidth, height: imgHeight } = useMemo(
    () => computeImageDimensions(imageWidth, imageHeight, aspectRatio),
    [imageWidth, imageHeight, aspectRatio]
  )

  const srcSet = useMemo(
    () =>
      imageSizes
        .map(size => `${imageUrl(src, size, MAX_SIZE, aspectRatio)} ${size}w`)
        .join(','),
    [src, aspectRatio, imageSizes]
  )

  const { handles } = useCssHandles(CSS_HANDLES)
  const imageRef = useRef(null)

  const imageContext: ProductImageState = useMemo(
    () => ({
      src,
      alt,
      imageWidth: imgWidth,
      imageHeight: imgHeight,
    }),
    [alt, src, imgWidth, imgHeight]
  )

  const productImageClassName = useMemo(() => {
    const baseClass = handles.productImage
    if (hideFirstImage && index === 0) {
      return `${baseClass} hideFirstImage`
    }
    return baseClass
  }, [handles.productImage, hideFirstImage, index])

  return (
    <ProductImageContext.Provider value={imageContext}>
      <div className={productImageClassName}>
        {imageLabel && (
          <div className={`tc ${handles.productImageLabel}`}>{imageLabel}</div>
        )}
        <Zoomable
          mode={zoomMode}
          factor={zoomFactor}
          ModalZoomElement={ModalZoomElement}
          zoomContent={
            // eslint-disable-next-line jsx-a11y/alt-text
            <img
              // This img element is just for zoom
              role="presentation"
              width={imgWidth * zoomFactor}
              height={imgHeight * zoomFactor}
              src={imageUrl(
                src,
                imageWidth * zoomFactor,
                MAX_SIZE,
                aspectRatio
              )}
              className={`${applyModifiers(handles.productImageTag, 'zoom')}`}
              style={{
                // Resets possible resizing done via CSS
                maxWidth: 'unset',
                width: `${zoomFactor * 100}%`,
                height: `${zoomFactor * 100}%`,
                objectFit: 'contain',
              }}
              // See comment regarding sizes below
              sizes="(max-width: 64.1rem) 100vw, 50vw"
            />
          }
        >
          <img
            ref={imageRef}
            width={imgWidth}
            height={imgHeight}
            className={`${applyModifiers(handles.productImageTag, 'main')}`}
            style={{
              width: '100%',
              height: '100%',
              maxHeight: maxHeight || 'unset',
              objectFit: 'contain',
            }}
            src={imageUrl(src, imageWidth, MAX_SIZE, aspectRatio)}
            srcSet={srcSet}
            alt={alt}
            title={alt}
            loading={index === 0 ? 'eager' : 'lazy'}
            {...(index === 0 && { fetchPriority: 'high' })}
            // WIP
            // The value of the "sizes" attribute means: if the window has at most 64.1rem of width,
            // the image will be of a width of 100vw. Otherwise, the
            // image will be 50vw wide.
            // This size is used for picking the best available size
            // given the ones from the srcset above.
            //
            // This is WIP because it is a guess: we are assuming
            // the image will be of a certain size, but it should be
            // probably be gotten from flex-layout or something.
            sizes="(max-width: 64.1rem) 100vw, 50vw"
          />
        </Zoomable>
      </div>
    </ProductImageContext.Provider>
  )
}

export default ProductImage
