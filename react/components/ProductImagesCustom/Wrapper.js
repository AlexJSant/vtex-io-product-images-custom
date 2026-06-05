import React, { useMemo } from 'react'
import { defineMessages } from 'react-intl'
import useProduct from 'vtex.product-context/useProduct'
import { useResponsiveValues } from 'vtex.responsive-values'
import { path, pick } from 'ramda'

import ProductImagesCustom from './index'
import generateImageConfig from './utils/generateImageConfig'
import { THUMBS_ORIENTATION, THUMBS_POSITION_HORIZONTAL } from './utils/enums'

const schemaMessages = defineMessages({
  title: { id: 'admin/editor.product-images.title' },
  description: { id: 'admin/editor.product-images.description' },
  zoomOptionsTitle: { id: 'admin/editor.product-images.zoomOptions.title' },
  zoomTypeTitle: { id: 'admin/editor.product-images.zoomType.title' },
  gallery: { id: 'admin/editor.product-images.gallery' },
  inPage: { id: 'admin/editor.product-images.in-page' },
  noZoom: { id: 'admin/editor.product-images.no-zoom' },
  bgOpacityTitle: { id: 'admin/editor.product-images.bgopacity.title' },
  hideFirstImageTitle: {
    id: 'admin/editor.product-images.hideFirstImage.title',
  },
  hideFirstImageDescription: {
    id: 'admin/editor.product-images.hideFirstImage.description',
  },
  thumbnailsOrientationTitle: {
    id: 'admin/editor.product-images.thumbnailsOrientation.title',
  },
  vertical: { id: 'admin/editor.product-images.vertical' },
  horizontal: { id: 'admin/editor.product-images.horizontal' },
  positionTitle: { id: 'admin/editor.product-images.position.title' },
  positionDescription: {
    id: 'admin/editor.product-images.position.description',
  },
  left: { id: 'admin/editor.product-images.left' },
  right: { id: 'admin/editor.product-images.right' },
  displayThumbnailsArrowsTitle: {
    id: 'admin/editor.product-images.displayThumbnailsArrows.title',
  },
  imageWidthTitle: { id: 'admin/editor.product-images.imageWidth.title' },
  imageWidthDescription: {
    id: 'admin/editor.product-images.imageWidth.description',
  },
  imageHeightTitle: { id: 'admin/editor.product-images.imageHeight.title' },
  imageHeightDescription: {
    id: 'admin/editor.product-images.imageHeight.description',
  },
})

const ProductImagesCustomWrapper = props => {
  const valuesFromContext = useProduct() || {}
  const {
    aspectRatio,
    maxHeight,
    imageWidth,
    imageHeight,
    showNavigationArrows,
    showPaginationDots,
    contentOrder,
    placeholder,
  } = useResponsiveValues(
    pick(
      [
        'aspectRatio',
        'maxHeight',
        'imageWidth',
        'imageHeight',
        'showNavigationArrows',
        'showPaginationDots',
        'contentOrder',
        'placeholder',
      ],
      props
    )
  )

  const { selectedItem, skuSelector, product } = valuesFromContext

  const images = useMemo(() => {
    if (props.images != null) {
      return props.images
    }

    let imagePaths

    // if there's a image sku defined
    if (
      product &&
      product.items &&
      skuSelector &&
      skuSelector.selectedImageVariationSKU
    ) {
      const skuItem = product.items.find(
        sku => sku.itemId === skuSelector.selectedImageVariationSKU
      )

      if (skuItem) {
        imagePaths = skuItem.images
      }
    }

    if (!imagePaths && selectedItem) {
      imagePaths = selectedItem.images
    }

    return (imagePaths || []).map(generateImageConfig)
  }, [props.images, product, skuSelector, selectedItem])

  const videos = useMemo(
    () =>
      props.videos != null
        ? props.videos
        : path(['videos'], selectedItem) || [],
    [props.videos, selectedItem]
  )

  return (
    <ProductImagesCustom
      images={images}
      videos={videos}
      hiddenImages={props.hiddenImages}
      placeholder={placeholder}
      // thumbnailPosition is a legacy prop from product-details
      position={props.position || props.thumbnailPosition}
      displayThumbnailsArrows={props.displayThumbnailsArrows}
      thumbnailsOrientation={props.thumbnailsOrientation}
      zoomMode={props.zoomMode}
      zoomFactor={props.zoomFactor}
      aspectRatio={aspectRatio}
      maxHeight={maxHeight}
      imageWidth={imageWidth}
      imageHeight={imageHeight}
      thumbnailAspectRatio={props.thumbnailAspectRatio}
      thumbnailMaxHeight={props.thumbnailMaxHeight}
      showNavigationArrows={showNavigationArrows}
      showPaginationDots={showPaginationDots}
      thumbnailVisibility={props.thumbnailVisibility}
      contentOrder={contentOrder}
      ModalZoomElement={props.ModalZoom}
      contentType={props.contentType}
      showImageLabel={props.showImageLabel}
      hideFirstImage={props.hideFirstImage}
      // Deprecated
      zoomProps={props.zoomProps}
      displayMode={props.displayMode}
    />
  )
}

ProductImagesCustomWrapper.getSchema = ({ zoomProps: { zoomType } = {} }) => ({
  title: 'admin/editor.product-images.title',
  description: 'admin/editor.product-images.description',
  type: 'object',
  properties: {
    zoomProps: {
      title: 'admin/editor.product-images.zoomOptions.title',
      type: 'object',
      properties: {
        zoomType: {
          title: 'admin/editor.product-images.zoomType.title',
          type: 'string',
          enum: ['gallery', 'in-page', 'no-zoom'],
          enumNames: [
            'admin/editor.product-images.gallery',
            'admin/editor.product-images.in-page',
            'admin/editor.product-images.no-zoom',
          ],
          widget: {
            'ui:options': {
              inline: false,
            },
            'ui:widget': 'radio',
          },
          default: 'no-zoom',
        },
        ...(zoomType === 'gallery' && {
          bgOpacity: {
            title: 'admin/editor.product-images.bgopacity.title',
            type: 'number',
            minimum: 0.0,
            maximum: 1.0,
            multipleOf: 0.01,
            default: 0.8,
          },
        }),
      },
    },
    hideFirstImage: {
      title: 'admin/editor.product-images.hideFirstImage.title',
      description: 'admin/editor.product-images.hideFirstImage.description',
      type: 'boolean',
      default: false,
    },
    thumbnailsOrientation: {
      title: 'admin/editor.product-images.thumbnailsOrientation.title',
      type: 'string',
      enum: [THUMBS_ORIENTATION.VERTICAL, THUMBS_ORIENTATION.HORIZONTAL],
      enumNames: [
        'admin/editor.product-images.vertical',
        'admin/editor.product-images.horizontal',
      ],
      widget: {
        'ui:options': {
          inline: false,
        },
        'ui:widget': 'radio',
      },
      default: THUMBS_ORIENTATION.VERTICAL,
      isLayout: true,
    },
    position: {
      title: 'admin/editor.product-images.position.title',
      description: 'admin/editor.product-images.position.description',
      type: 'string',
      enum: [THUMBS_POSITION_HORIZONTAL.LEFT, THUMBS_POSITION_HORIZONTAL.RIGHT],
      enumNames: [
        'admin/editor.product-images.left',
        'admin/editor.product-images.right',
      ],
      widget: {
        'ui:options': {
          inline: false,
        },
        'ui:widget': 'radio',
      },
      default: THUMBS_POSITION_HORIZONTAL.LEFT,
      isLayout: true,
    },
    displayThumbnailsArrows: {
      title: 'admin/editor.product-images.displayThumbnailsArrows.title',
      type: 'boolean',
      default: false,
      isLayout: true,
    },
    imageWidth: {
      title: 'admin/editor.product-images.imageWidth.title',
      description: 'admin/editor.product-images.imageWidth.description',
      type: 'number',
      default: 610,
    },
    imageHeight: {
      title: 'admin/editor.product-images.imageHeight.title',
      description: 'admin/editor.product-images.imageHeight.description',
      type: 'number',
      default: 610,
    },
  },
})

export { schemaMessages }
export default ProductImagesCustomWrapper
