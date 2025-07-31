document.addEventListener('DOMContentLoaded', function() {
  let products = {};
  let currentCategory = 'all';
  const isIndexPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

  // Animation utilities
  const animateElement = (element, animation, duration = 300) => {
    element.style.animation = `${animation} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    setTimeout(() => {
      element.style.animation = '';
    }, duration);
  };

  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 100);
    
    const closeBtn = notification.querySelector('.notification-close');
    const closeNotification = () => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeNotification);
    setTimeout(closeNotification, 5000);
  };

  const setLoadingState = (element, loading) => {
    if (loading) {
      element.classList.add('loading');
      element.style.pointerEvents = 'none';
    } else {
      element.classList.remove('loading');
      element.style.pointerEvents = '';
    }
  };

  const loadProductsWithAnimation = () => {
    const loadingElement = document.createElement('div');
    loadingElement.className = 'products-loading';
    loadingElement.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>جاري تحميل المنتجات...</p>
      </div>
    `;
    return loadingElement;
  };

  // Determine image orientation
  const getImageOrientation = (src, callback) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      callback(aspectRatio < 1 ? 'portrait' : 'landscape');
    };
    img.onerror = () => callback('landscape'); // Default to landscape on error
  };

  // Image carousel functionality
  const initializeCarousel = (card, images, siteId) => {
    let currentImageIndex = 0;
    const carousel = card.querySelector('.carousel');
    const carouselImg = card.querySelector('.carousel-img');
    const prevBtn = card.querySelector('.carousel-prev');
    const nextBtn = card.querySelector('.carousel-next');

    const updateCarousel = () => {
      carouselImg.src = images[currentImageIndex] || 'https://placehold.co/300x300/e9ecef/6c757d?text=لا+توجد+صورة';
      carouselImg.alt = `صورة ${currentImageIndex + 1}`;
      getImageOrientation(carouselImg.src, (orientation) => {
        carouselImg.classList.remove('animate-portrait', 'animate-landscape');
        carouselImg.classList.add(`animate-${orientation}`);
        carousel.style.height = orientation === 'portrait' ? '300px' : '280px';
      });
    };

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
      updateCarousel();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentImageIndex = (currentImageIndex + 1) % images.length;
      updateCarousel();
    });

    // Auto-scroll every 4 seconds
    setInterval(() => {
      currentImageIndex = (currentImageIndex + 1) % images.length;
      updateCarousel();
    }, 4000);

    // Initialize first image
    updateCarousel();

    // Image click to open modal
    carouselImg.addEventListener('click', (e) => {
      e.stopPropagation();
      openImageModal(images, currentImageIndex);
    });
  };

  // Modal carousel functionality
  const openImageModal = (images, initialIndex) => {
    const modal = document.getElementById('imageModal');
    const modalImg = modal.querySelector('.modal-img');
    const prevBtn = modal.querySelector('.modal-prev');
    const nextBtn = modal.querySelector('.modal-next');
    const closeBtn = modal.querySelector('.modal-close');
    let currentImageIndex = initialIndex;

    const updateModalImage = () => {
      modalImg.src = images[currentImageIndex] || 'https://placehold.co/300x300/e9ecef/6c757d?text=لا+توجد+صورة';
      modalImg.alt = `صورة ${currentImageIndex + 1}`;
    };

    updateModalImage();
    modal.classList.add('show');

    prevBtn.addEventListener('click', () => {
      currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
      updateModalImage();
    });

    nextBtn.addEventListener('click', () => {
      currentImageIndex = (currentImageIndex + 1) % images.length;
      updateModalImage();
    });

    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
      }
    });
  };

  if (isIndexPage) {
    const productsGrid = document.getElementById('productsGrid');
    const categoryNavContainer = document.querySelector('.category-nav-container');
    
    if (productsGrid) {
      const loadingElement = loadProductsWithAnimation();
      productsGrid.appendChild(loadingElement);
    }

    fetch('/static/products.json')
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch products.json: ${response.status}`);
        return response.json();
      })
      .then(data => {
        products = data;
        if (categoryNavContainer) {
          const allBtn = categoryNavContainer.querySelector('[data-category="all"]');
          allBtn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            currentCategory = 'all';
            displayProducts();
          });
          products.categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-btn';
            btn.dataset.category = category.categoryId;
            btn.textContent = category.name;
            btn.addEventListener('click', () => {
              document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              currentCategory = category.categoryId;
              displayProducts();
            });
            categoryNavContainer.appendChild(btn);
          });
        }
        displayProducts();
        showNotification('تم تحميل المنتجات بنجاح', 'success');
      })
      .catch(error => {
        console.error('Error loading products:', error);
        showNotification('خطأ في تحميل المنتجات. الرجاء المحاولة لاحقاً.', 'error');
        
        if (productsGrid) {
          productsGrid.innerHTML = `
            <div class="error-message">
              <i class="fas fa-exclamation-triangle"></i>
              <h3>خطأ في تحميل المنتجات</h3>
              <p>الرجاء المحاولة لاحقاً أو تحديث الصفحة</p>
              <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-redo me-2"></i>إعادة المحاولة
              </button>
            </div>
          `;
        }
      });
  }

  function displayProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = '';

    const formatPrice = (price) => {
      return price.toLocaleString('ar-DZ', { style: 'currency', currency: 'DZD' });
    };

    let displayCategories = currentCategory === 'all' 
      ? products.categories 
      : products.categories.filter(cat => cat.categoryId == currentCategory);

    displayCategories.forEach((category, catIndex) => {
      category.sites.forEach((site, siteIndex) => {
        if (!site.themeName || !site.priceAfterDiscount || !site.images || site.images.length === 0) {
          console.warn(`Site with ID ${site.siteId} in category ${category.categoryId} has missing or invalid data.`);
          return;
        }

        const discount = Math.round(((site.priceBeforeDiscount - site.priceAfterDiscount) / site.priceBeforeDiscount) * 100);
        const firstLine = category.description.split(/[\n\r]+/)[0];
        const shortDescription = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine;
        const validColors = site.colors.filter(color => color.startsWith('#'));

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        card.innerHTML = `
          <div class="product-card-image">
            <div class="browser-frame">
              <div class="browser-bar">
                <span class="browser-dot"></span>
                <span class="browser-dot"></span>
                <span class="browser-dot"></span>
              </div>
              <div class="carousel">
                <button class="carousel-prev"><i class="fas fa-chevron-right"></i></button>
                <img class="carousel-img" src="${site.images[0] || 'https://placehold.co/300x300/e9ecef/6c757d?text=لا+توجد+صورة'}" 
                     alt="${site.themeName}" 
                     loading="lazy">
                <button class="carousel-next"><i class="fas fa-chevron-left"></i></button>
              </div>
            </div>
            ${discount > 0 ? `<div class="product-badge">خصم ${discount}%</div>` : ''}
            <a href="${site.siteUrl}" class="website-preview-label" onclick="event.stopPropagation()">معاينة الموقع</a>
          </div>
          <div class="product-card-info">
            <h3>${site.themeName}</h3>
            <p class="product-description">${shortDescription}</p>
            <div class="product-card-price">
              <span class="current-price">${formatPrice(site.priceAfterDiscount)}</span>
              ${discount > 0 ? `<span class="old-price">${formatPrice(site.priceBeforeDiscount)}</span>` : ''}
            </div>
            <div class="product-specs">
              <div class="color-bar">
                ${validColors.map(color => `<div class="color-segment" style="background-color: ${color}; flex: 1;"></div>`).join('')}
              </div>
            </div>
            <button class="product-card-action" onclick="location.href='products.html?categoryId=${category.categoryId}&siteId=${site.siteId}'">
              <i class="fas fa-shopping-cart me-2"></i>اطلب الآن
            </button>
          </div>
        `;
        
        card.onclick = (e) => {
          if (!e.target.closest('.carousel-prev') && !e.target.closest('.carousel-next') && !e.target.closest('.website-preview-label')) {
            window.location.href = `products.html?categoryId=${category.categoryId}&siteId=${site.siteId}`;
          }
        };
        productsGrid.appendChild(card);

        // Initialize carousel
        initializeCarousel(card, site.images, site.siteId);

        setTimeout(() => {
          card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, (catIndex * category.sites.length + siteIndex) * 100);
      });
    });
  }

  // Enhanced mobile menu functionality
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function() {
      const isActive = nav.classList.toggle('active');
      menuToggle.innerHTML = isActive ? 
        '<i class="fas fa-times"></i>' : 
        '<i class="fas fa-bars"></i>';
      
      document.body.style.overflow = isActive ? 'hidden' : '';
      
      if (isActive) {
        const menuItems = nav.querySelectorAll('.nav-links a, .category-btn');
        menuItems.forEach((item, index) => {
          item.style.opacity = '0';
          item.style.transform = 'translateX(-20px)';
          setTimeout(() => {
            item.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
          }, index * 100);
        });
      }
    });

    nav.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuToggle.contains(e.target) && nav.classList.contains('active')) {
        nav.classList.remove('active');
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
      }
    });
  }

  const scrollToTopBtn = document.createElement('button');
  scrollToTopBtn.className = 'scroll-to-top';
  scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  scrollToTopBtn.setAttribute('aria-label', 'العودة للأعلى');
  document.body.appendChild(scrollToTopBtn);
  
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });

  console.log('Modern frontend loaded successfully ✨');
});