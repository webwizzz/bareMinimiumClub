/**
 * Product Media Gallery with Main Image and Thumbnail Carousel
 * Handles navigation and image switching for the main_with_thumbnails layout
 */

class ProductMediaGalleryMainThumbnails {
  constructor(container) {
    this.container = container;
    this.mainImageContainer = container.querySelector('.main-image-container');
    this.thumbnailCarousel = container.querySelector('.thumbnail-carousel');
    this.thumbnailWrapper = container.querySelector('.thumbnail-carousel-wrapper');
    this.thumbnailItems = container.querySelectorAll('.thumbnail-item');
    this.prevBtn = container.querySelector('.thumbnail-nav-btn--prev');
    this.nextBtn = container.querySelector('.thumbnail-nav-btn--next');
    this.hiddenMedia = container.querySelector('.hidden-media');
    
    this.currentIndex = 0;
    this.thumbnailsPerView = parseInt(getComputedStyle(container).getPropertyValue('--thumbnails-per-view')) || 3;
    this.thumbnailSize = parseInt(getComputedStyle(container).getPropertyValue('--thumbnail-size')) || 100;
    this.thumbnailGap = parseInt(getComputedStyle(container).getPropertyValue('--thumbnail-gap')) || 10;
    
    this.init();
  }

  init() {
    this.setupThumbnailNavigation();
    this.setupMainImageSwitching();
    this.setupScrollListener();
    this.updateNavigationState();
    this.setThumbnailContainerAttributes();
    
    // Handle window resize
    window.addEventListener('resize', () => {
      this.updateThumbnailsPerView();
      this.updateNavigationState();
    });
  }

  setupThumbnailNavigation() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.scrollThumbnails('prev'));
    }
    
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.scrollThumbnails('next'));
    }
  }

  setupScrollListener() {
    if (this.thumbnailWrapper) {
      this.thumbnailWrapper.addEventListener('scroll', () => {
        this.updateNavigationState();
      });
    }
  }

  setupMainImageSwitching() {
    this.thumbnailItems.forEach((item, index) => {
      const button = item.querySelector('.thumbnail-btn');
      if (button) {
        button.addEventListener('click', () => this.switchMainImage(index));
      }
    });
  }

  switchMainImage(index) {
    if (index === this.currentIndex) return;

    // Update active thumbnail
    this.thumbnailItems[this.currentIndex]?.classList.remove('active');
    this.thumbnailItems[index]?.classList.add('active');

    // Switch main image
    const newMediaElement = this.hiddenMedia.querySelector(`[data-media-index="${index}"]`);
    if (newMediaElement && this.mainImageContainer) {
      const mainImageContent = this.mainImageContainer.querySelector('.product-media-container');
      const newContent = newMediaElement.cloneNode(true);
      
      // Preserve zoom button if it exists
      const existingZoomButton = mainImageContent.querySelector('.product-media-container__zoom-button');
      
      // Replace the media content but keep the container structure
      const mediaContent = mainImageContent.querySelector('.product-media-constraint-wrapper, .product-media');
      if (mediaContent) {
        const newMediaContent = newContent.querySelector('.product-media-constraint-wrapper, .product-media');
        if (newMediaContent) {
          mediaContent.replaceWith(newMediaContent);
        }
      }

      // Update zoom button target if it exists
      if (existingZoomButton) {
        const onClickAttr = existingZoomButton.getAttribute('on:click');
        if (onClickAttr) {
          const newOnClick = onClickAttr.replace(/\/open\/\d+/, `/open/${index}`);
          existingZoomButton.setAttribute('on:click', newOnClick);
        }
        existingZoomButton.setAttribute('data-current-index', index);
      }
    }

    this.currentIndex = index;
    
    // Ensure the selected thumbnail is visible
    this.ensureThumbnailVisible(index);
  }

  scrollThumbnails(direction) {
    const containerWidth = this.thumbnailWrapper.offsetWidth;
    const scrollAmount = containerWidth * 0.8; // Scroll 80% of visible width
    
    if (direction === 'next') {
      this.thumbnailWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    } else {
      this.thumbnailWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  }

  ensureThumbnailVisible(index) {
    const thumbnail = this.thumbnailItems[index];
    if (!thumbnail) return;
    
    const containerRect = this.thumbnailWrapper.getBoundingClientRect();
    const thumbnailRect = thumbnail.getBoundingClientRect();
    
    if (thumbnailRect.left < containerRect.left) {
      // Thumbnail is to the left of visible area
      this.thumbnailWrapper.scrollBy({ 
        left: thumbnailRect.left - containerRect.left - 10, 
        behavior: 'smooth' 
      });
    } else if (thumbnailRect.right > containerRect.right) {
      // Thumbnail is to the right of visible area
      this.thumbnailWrapper.scrollBy({ 
        left: thumbnailRect.right - containerRect.right + 10, 
        behavior: 'smooth' 
      });
    }
  }

  updateNavigationState() {
    if (!this.prevBtn || !this.nextBtn) return;
    
    const scrollLeft = this.thumbnailWrapper.scrollLeft;
    const maxScroll = this.thumbnailWrapper.scrollWidth - this.thumbnailWrapper.clientWidth;
    
    this.prevBtn.disabled = scrollLeft <= 0;
    this.nextBtn.disabled = scrollLeft >= maxScroll - 1;
  }

  setThumbnailContainerAttributes() {
    const carouselContainer = this.container.querySelector('.thumbnail-carousel-container');
    if (carouselContainer) {
      carouselContainer.setAttribute('data-items-count', this.thumbnailItems.length);
    }
  }

  updateThumbnailsPerView() {
    const containerWidth = this.thumbnailWrapper.offsetWidth;
    const itemWidth = this.thumbnailSize + this.thumbnailGap;
    this.thumbnailsPerView = Math.floor(containerWidth / itemWidth);
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  const galleries = document.querySelectorAll('.product-media-gallery--main-with-thumbnails');
  galleries.forEach(gallery => new ProductMediaGalleryMainThumbnails(gallery));
});

// Re-initialize if content is dynamically loaded (for AJAX cart, quickview, etc.)
if (window.theme && window.theme.initProductMediaGallery) {
  const originalInit = window.theme.initProductMediaGallery;
  window.theme.initProductMediaGallery = function(container) {
    originalInit.call(this, container);
    const galleries = container.querySelectorAll('.product-media-gallery--main-with-thumbnails');
    galleries.forEach(gallery => new ProductMediaGalleryMainThumbnails(gallery));
  };
} else if (!window.theme) {
  window.theme = {};
}

window.theme.initProductMediaGalleryMainThumbnails = (container) => {
  const galleries = container.querySelectorAll('.product-media-gallery--main-with-thumbnails');
  galleries.forEach(gallery => new ProductMediaGalleryMainThumbnails(gallery));
};