> ⚠️ **Attention:** This project is still under development!

# ProductImagesCustom

The `product-images` block renders an image or video configured in the SKU settings. This is a **standalone** version of the ProductImages component, customized with additional features.

> 📢 **Note:** This is a standalone app (`{appVendor}.product-images-custom`) and does not require the `vtex.store-components` dependency directly.

![image](https://cdn.jsdelivr.net/gh/vtexdocs/dev-portal-content@main/images/vtex-store-components-productimages-0.png)

## Configuration

1. Import the `{appVendor}.product-images-custom` app to your theme dependencies in the `manifest.json` file:

```json
  "dependencies": {
    "{appVendor}.product-images-custom": "0.x"
  }
```

2. Add the `product-images` block to any child of the `store.product` template (Product Details Page template). For example:

```json
  "store.product": {
    "children": [
      "flex-layout.row#product"
    ]
  },
  "flex-layout.row#product": {
    "children": [
      "product-images"
    ]
  }
```

3. Declare the `product-images` block using the props stated in the [Props](#props) table. Example:

```json
  "product-images": {
    "props": {
      "displayThumbnailsArrows": true,
      "hideFirstImage": false
    }
  }
```

## Props

| Prop name                 | Type                                     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default value    |
| ------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `aspectRatio`             | `string`                                 | Sets the image aspect ratio, determining whether it should be square, portrait, landscape, etc. Follow the [common aspect ratio notation](https://en.wikipedia.org/wiki/Aspect_ratio_(image)), represented by two numbers separated by a colon, such as `1:1` for square, `3:4` for portrait, or `1920:1080` for widescreen.                                                                                                                                            | `"auto"`         |
| `blockClass`              | `string`                                 | Serves as the block's unique identifier for customization.                                                                                                                                                                                                                                                                                                                                                                          | -                |
| `contentOrder`            | `'videos-first'` &#124; `'images-first'` | Controls the order in which the images and videos are displayed.                                                                                                                                                                                                                                                                                                                                                                                                                                | `'images-first'` |
| `contentType`             | `enum`                                   | Controls the type of content that will be displayed in the block. Possible values are `images`, `videos`, or `all`.                                                                                                                                                                                                                                                                                                                                                                            | `all`            |
| `displayMode`             | `enum`                                   | Defines how the product media should be displayed. Possible values are `carousel` (displays the product images and videos in a carousel), `list` (displays only the product images inline, with no extra markup), and `first-image` (displays only the first image available). **The `list` and `first-image` values don't display product videos and are only compatible with the `maxHeight`, `hiddenImages`, `zoomFactor`, `aspectRatio`,`ModalZoomElement`, and `zoomMode` props**. | `carousel`       |
| `displayThumbnailsArrows` | `boolean`                                | Displays navigation arrows on the thumbnail media. **Note:** Navigation arrows are only shown when there are 3 or more slides. With 1-2 slides, navigation is automatically disabled to prevent synchronization issues.                                                                                                                                                                                                                                                                                                                                                          | `false`          |
| `hideFirstImage`          | `boolean`                                | Hides the first product image when set to `true`. This prop is available in the Site Editor and can be configured via `blocks.json`. Works with all display modes (`carousel`, `list`, and `first-image`).                                                                                                                                                                                                                        | `false`          |
| `hiddenImages`            | `string` or `string[]`                                 | Hides images with labels that match the values listed in this prop. Intended to be used with the `product-summary-sku-selector` block or SKU Selector. When using SKU Selector to display color variation images (like a green swatch to represent a green SKU), you can hide these images from the main carousel by setting the image label in the catalog to match this prop value. **Note:** This prop works in conjunction with the Enhanced SKU Selector integration - if both are used, images matching either the prop values or the context labels will be hidden. To learn more, see the [SKU Selector](https://developers.vtex.com/docs/apps/vtex.store-components/skuselector) documentation.                                                                                                                                                                                                                      | `skuvariation`   |
| `maxHeight`               | `number`                                 | Maximum height for individual product images (in pixels).                                                                                                                                                                                                                                                                                                                                                                                                                                       | `600`            |
| `ModalZoom`               | `block`                                  | Opens a modal to zoom in on the product image. This prop value must match the name of the block that triggers the modal containing the product image for zooming (for example, `modal-layout` from [Modal layout](https://developers.vtex.com/docs/apps/vtex.modal-layout) app). The `ModalZoom` prop will only work if the `zoomMode` prop is set as `open-modal`. To learn more, see the [Advanced configuration section](#advanced-configuration).                 | `undefined`      |
| `placeholder`             | `string`                                 | Sets the URL for a placeholder image to be displayed when no product image or video is available.                                                                                                                                                                                                                                                                                                                                                                                         | `undefined`      |
| `position`                | `enum`                                   | Sets the position of the thumbnails (`left` or `right`). Only used when `thumbnailsOrientation` is `vertical`.                                                                                                                                                                                                                                                                                                                                                                                   | `left`           |
| `showNavigationArrows`    | `boolean`                                | Defines if the navigation arrows should be displayed.                                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`           |
| `showPaginationDots`       | `boolean`                                | Defines if the pagination dots should be displayed.                                                                                                                                                                                                                                                                                                                                                                                                                                             | `true`           |
| `showImageLabel`          | `boolean`                                | Controls if the image label text should be rendered above each image.                                                                                                                                                                                                                                                                                                                                                                                                                           | `true`           |
| `thumbnailVisibility`     | `visible` or `hidden`                    | Defines if the thumbnails should be displayed in `carousel` displayMode.                                                                                                                                                                                                                                                                                                                                                                                                                        | `visible`        |
| `thumbnailAspectRatio`    | `string`                                 | Sets the aspect ratio of the thumbnail image. For more information about aspect ratio, check out the `aspectRatio` prop.                                                                                                                                                                                                                                                                                                                                                                         | `"auto"`         |
| `thumbnailMaxHeight`      | `number`                                 | Maximum height of the thumbnail image (in pixels).                                                                                                                                                                                                                                                                                                                                                                                                                                              | `150`            |
| `thumbnailsOrientation`   | `enum`                                   | Sets the orientation of the thumbnails. It can be `vertical` or `horizontal`.                                                                                                                                                                                                                                                                                                                                                                                                                | `vertical`       |
| `zoomFactor`              | `number`                                 | Sets how much the zoom increases the image size (for example, `2` will make the zoomed-in image twice as large).                                                                                                                                                                                                                                                                                                                                                                                         | `2`              |
| `zoomMode`                | `enum`                                   | Sets the image zoom behavior. Possible values are `disabled` (zoom is disabled), `in-place-click` (zoom is triggered when the image is clicked), `in-place-hover` (zoom is triggered when the image is hovered on), and `open-modal` (image is zoomed using a modal).                                                                                                                                                                                                                       | `in-place-click` |

## Features

### Hide First Image

The `hideFirstImage` prop allows you to hide the first product image. This feature is useful when you want to display only secondary images or when the first image should be hidden for specific design requirements.

**Usage:**

```json
  "product-images": {
    "props": {
      "hideFirstImage": true
    }
  }
```

This prop is also available in the Site Editor, where you can toggle it on/off directly from the interface.

**Behavior:**
- When `hideFirstImage` is `true`, the first image is hidden using CSS (`display: none`)
- Works with all display modes: `carousel`, `list`, and `first-image`
- In `first-image` mode, if `hideFirstImage` is `true`, the component returns `null` (nothing is rendered)
- The first image is determined by the order in the slides array, even if videos appear before images

### Custom CSS Class

When `hideFirstImage` is set to `true`, the component applies the `hideFirstImage` CSS class to the first image container. You can customize this behavior by overriding the class in your theme:

```css
.hideFirstImage {
  display: none;
}
```

### Carousel Behavior

The carousel component includes several optimized behaviors for better user experience:

#### Infinite Loop
- The main carousel has infinite loop enabled when there are 2 or more slides
- Thumbnails carousel has loop disabled to maintain proper synchronization with the main carousel
- This ensures smooth navigation while keeping both carousels in sync

#### Thumbnails Display
- **Always shows 3 visual spaces:** The thumbnail carousel always displays 3 visual spaces (occupied or empty), each taking exactly 1/3 of the available space
- **1 slide:** 1 thumbnail in the center space, 2 empty spaces
- **2 slides:** 2 thumbnails centered, 1 empty space
- **3+ slides:** 3 thumbnails visible, horizontal scroll to see more
- **Single image support:** Thumbnails are rendered even when there's only 1 image

#### Navigation Behavior
- **Thumbnail arrows:** Navigation arrows on thumbnails are only shown when there are 3 or more slides (if `displayThumbnailsArrows` is `true`)
- **Desktop drag:** Drag functionality (mouse drag) is disabled on desktop when there are 2 or fewer slides to prevent unexpected behavior
- **Mobile drag:** Drag is always enabled on mobile devices for touch navigation

#### SKU Variation Integration
When using the VTEX SKU Selector to choose product color/variation:
- The carousel automatically updates to show images from the selected SKU variation
- The carousel resets to the first image (index 0) when the SKU variation changes
- Both the main carousel and thumbnails remain synchronized on the first image
- This provides a consistent experience when switching between product variations

#### Enhanced SKU Selector Integration
This component integrates with the `sunhouse.enhanced-sku-selector` app to automatically hide images based on SKU selection.

**How it works:**
- When a SKU is selected in the Enhanced SKU Selector, it collects the `imageLabel` values from the images used in the selector
- These labels are exposed via the `SKUImageLabelsContext`
- The Product Images Custom component reads from this context and automatically filters out images with matching labels
- This ensures that images used in the SKU selector (like color swatches) don't appear in the main product image carousel

**Requirements:**
- The `sunhouse.enhanced-sku-selector` app must be installed and configured in your store
- The `SKUImageLabelsProvider` must be present in the component tree (typically provided by the Enhanced SKU Selector)
- Both components should be on the same page (Product Details Page)

**Compatibility:**
- The integration works alongside the existing `hiddenImages` prop
- If both are used, images matching either the prop values or the context labels will be hidden
- If the Enhanced SKU Selector is not present, the component continues to work normally using only the `hiddenImages` prop

**Example:**
```json
{
  "store.product": {
    "children": [
      "flex-layout.row#product"
    ]
  },
  "flex-layout.row#product": {
    "children": [
      "product-images",
      "enhanced-sku-selector"
    ]
  },
  "product-images": {
    "props": {
      "hiddenImages": "skuvariation"
    }
  }
}
```

**Example CSS for thumbnail spacing (optional):**

If you need to ensure each thumbnail takes exactly 1/3 of the space, you can add this CSS to your theme:

```css
.carouselGaleryThumbs .swiper-slide {
  width: calc((100% - 20px) / 3) !important;
  flex-shrink: 0;
  flex-grow: 0;
}
```

## Advanced configuration

In this section, you'll learn how to use modal zoom, a property that allows you to open a popup displaying a product image for zooming. To use this feature, configure the `product-images` block by setting the `zoomMode` and `ModalZoom` props to `open-modal` and `modal-layout`, respectively.

When configured as explained, the `zoomMode` prop allows the image to trigger a modal for zooming. Additionally, the `ModalZoom` prop will render the block defined as its value. In this case, the `modal-layout` is required. This allows you to configure a modal containing the product image for zooming.

Once both props are correctly configured, you must declare the `modal-layout` block and the `product-images.high-quality-image` block as its child.

The `modal-layout` block renders the modal component and triggers the image zoom in a popup box. The `product-images.high-quality-image` block, in turn, is a *special* block used exclusively to render the `product-image` block inside the modal.

Example:

```jsonc
{
  "product-images.high-quality-image": {
    "props": {
      "zoomMode": "in-place-click",
      "zoomFactor": 2
    }
  },
  "modal-layout#product-zoom": {
    "children": [
      "flex-layout.row#product-name",
      "product-images.high-quality-image"
    ]
  },
  "product-images": {
    "props": {
      "ModalZoom": "modal-layout#product-zoom",
      "zoomMode": "open-modal",
      "aspectRatio": {
        "desktop": "auto",
        "phone": "16:9"
      }
    }
  }
}
```

The `product-images.high-quality-image` block must be declared as a child of `modal-layout`. You can also declare other blocks exported by the [Modal Layout app](https://developers.vtex.com/docs/apps/vtex.modal-layout) as children.

The following table shows the props allowed by `product-images.high-quality-image`:

| Prop name     | Type       | Description                                                                                                                                                                                                                                                                                                                                                | Default value |
| ------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| `aspectRatio` | `string`   | Sets the image aspect ratio, determining whether it should be square, portrait, landscape, etc. Follow the [common aspect ratio notation](https://en.wikipedia.org/wiki/Aspect_ratio_(image)), represented by two numbers separated by a colon, such as `1:1` for square, `3:4` for portrait, or `1920:1080` for widescreen. | `auto`        |
| `defaultSize` | `number`   | Image default size (in `px`).                                                                                                                                                                                                                                                                                                                              | `1200`        |
| `imageSizes`  | `[number]` | Image sizes (in `px`) to be used in the image [`srcset` HTML attribute](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images). If no value is defined for this prop, the `srcset` will use the original image size.                                                                                            | `undefined`   |
| `maxSize`     | `number`   | Image maximum size (in `px`) for rendering, regardless of screen size. This prop only works if you also declare the `imageSizes` prop.                                                                                                                                                                                                | `4096`        |
| `zoomFactor`  | `number`   | Sets how much the zoom increases the image size (for example, `2` will make the zoomed-in image twice as large).                                                                                                                                                                                                                                                | `2`           |
| `zoomMode`    | `enum`     | Sets the zoom behavior for the `product-images.high-quality-image` block. Possible values are `disabled` (no zoom), `in-place-click` (zoom on click), and `in-place-hover` (zoom on hover). Unlike the `store-images` prop, this one doesn't accept the `open-modal` value.   | `disabled`    |

## Customization

To apply CSS customizations to this and other blocks, see the guide [Using CSS handles for store customization](https://developers.vtex.com/docs/guides/vtex-io-documentation-using-css-handles-for-store-customization).

### CSS Handles

| CSS Handle                                        |
| -------------------------------------------------- |
| `carouselContainer`                                |
| `carouselCursorDefault`                            |
| `carouselGaleryCursor`                             |
| `carouselGaleryThumbs`                             |
| `carouselIconCaretLeft`                            |
| `carouselIconCaretRight`                           |
| `carouselImagePlaceholder`                         |
| `carouselInconCaretRight`                          |
| `carouselThumbBorder`                              |
| `figure`                                           |
| `figure--video`                                    |
| `highQualityContainer`                             |
| `image`                                            |
| `imgZoom`                                          |
| `productImagesContainer` (`content` is deprecated) |
| `productImagesContainer--carousel`                 |
| `productImagesContainer--list`                     |
| `productImagesGallerySlide`                        |
| `productImagesGallerySwiperContainer`              |
| `productImagesThumb`                               |
| `productImagesThumbActive`                         |
| `productImagesThumbCaret`                          |
| `productImagesThumbsSwiperContainer`               |
| `productImageTag--main`                            |
| `productImageTag--zoom`                            |
| `productImageTag`                                  |
| `productImageLabel`                                |
| `productVideo`                                     |
| `swiper-pagination`                                |
| `swiperBullet--active`                             |
| `swiperBullet`                                     |
| `swiperCaret`                                      |
| `swiperCaretNext`                                  |
| `swiperCaretPrev`                                  |
| `thumbImg`                                         |
| `thumbImg--video`                                  |
| `video`                                            |
| `videoContainer`                                   |

