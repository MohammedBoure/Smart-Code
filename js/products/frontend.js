document.addEventListener('DOMContentLoaded', function() {
  let selectedProduct = null;
  let categories = [];

  // Toggle mobile menu
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
      const isOpen = nav.classList.contains('active');
      menuToggle.innerHTML = `<i class="fas fa-${isOpen ? 'times' : 'bars'}"></i>`;
    });
  }

  function showNotification(message, type = 'info') {
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
  }

  function checkFormValidity() {
    const customerName = document.getElementById('customer_name')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const submitBtn = document.getElementById('submitBtn');
    const isValid = customerName && phone && /^05|06|07\d{8}$/.test(phone);

    if (submitBtn) {
      submitBtn.disabled = !isValid;
      submitBtn.classList.toggle('btn-primary', isValid);
      submitBtn.classList.toggle('btn-secondary', !isValid);
    }
  }

  function copyToClipboard(text, field) {
    navigator.clipboard.writeText(text).then(() => {
      showNotification(`تم نسخ ${field} بنجاح`, 'success');
    }).catch(() => {
      showNotification(`فشل في نسخ ${field}`, 'error');
    });
  }

  window.frontend = {
    getSelectedProduct: () => selectedProduct,
    getFormData: () => ({
      customerName: document.getElementById('customer_name')?.value.trim(),
      phone: document.getElementById('phone')?.value.trim(),
      themeName: selectedProduct?.themeName,
      colors: selectedProduct?.colors
    }),
    resetForm: () => {
      const form = document.getElementById('orderForm');
      if (form) {
        form.reset();
      }
      checkFormValidity();
      showNotification('تم إعادة تعيين النموذج بنجاح', 'success');
    },
    disableSubmitButton: (disable) => {
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) {
        submitBtn.disabled = disable;
        submitBtn.innerHTML = disable ? 
          '<i class="fas fa-spinner fa-spin me-2"></i>جاري الإرسال...' : 
          '<i class="fas fa-paper-plane me-2"></i>إرسال الطلب';
      }
    },
    showNotification
  };

  function loadProductFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = parseInt(urlParams.get('categoryId'));
    const siteId = parseInt(urlParams.get('siteId'));

    if (categoryId && siteId) {
      const category = categories.find(cat => cat.categoryId === categoryId);
      if (category) {
        const site = category.sites.find(s => s.siteId === siteId);
        if (site) {
          selectedProduct = {
            productId: `${categoryId}-${siteId}`,
            categoryName: category.name,
            description: category.description,
            themeName: site.themeName,
            colors: site.colors,
            priceAfterDiscount: site.priceAfterDiscount,
            priceBeforeDiscount: site.priceBeforeDiscount,
            images: site.images,
            siteUrl: site.siteUrl,
            dashboardUrl: site.dashboardUrl,
            loginEmail: site.loginEmail,
            loginPassword: site.loginPassword
          };

          // Update UI
          document.getElementById('productName').textContent = category.name;
          document.getElementById('productDescription').textContent = category.description;
          document.getElementById('themeName').textContent = site.themeName;
          
          // Render colors as color bar
          const colorsContainer = document.getElementById('colors');
          colorsContainer.innerHTML = site.colors
            .filter(color => color.startsWith('#'))
            .map(color => `<div class="color-segment" style="background-color: ${color};"></div>`)
            .join('');

          document.getElementById('productPrice').innerHTML = `
            <span class="current-price">${site.priceAfterDiscount.toLocaleString('ar-DZ', { style: 'currency', currency: 'DZD' })}</span>
            ${site.priceBeforeDiscount ? `<span class="old-price">${site.priceBeforeDiscount.toLocaleString('ar-DZ', { style: 'currency', currency: 'DZD' })}</span>` : ''}
          `;
          document.getElementById('siteUrl').href = site.siteUrl;
          document.getElementById('dashboardUrl').href = site.dashboardUrl;
          document.getElementById('loginEmail').textContent = site.loginEmail;
          document.getElementById('loginPassword').textContent = site.loginPassword;
          setupCarousel(selectedProduct.images);
          checkFormValidity();

          // Setup copy buttons
          document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              const targetId = btn.dataset.target;
              const text = document.getElementById(targetId).textContent;
              const field = targetId === 'loginEmail' ? 'البريد الإلكتروني' : 'كلمة المرور';
              copyToClipboard(text, field);
            });
          });
        } else {
          showNotification('الموقع غير موجود', 'error');
        }
      } else {
        showNotification('الفئة غير موجودة', 'error');
      }
    } else {
      showNotification('معلومات الموقع غير كاملة', 'error');
    }
  }

  function setupCarousel(images) {
    const carouselImages = document.getElementById('carouselImages');
    const thumbnailsContainer = document.getElementById('carouselThumbnails');
    if (!carouselImages || !thumbnailsContainer) return;

    carouselImages.innerHTML = '';
    thumbnailsContainer.innerHTML = '';

    if (!images || images.length === 0) {
      carouselImages.innerHTML = '<div class="no-image-placeholder">لا توجد صور متاحة</div>';
      return;
    }

    // Populate carousel slides
    images.forEach((imgSrc, index) => {
      const img = document.createElement('img');
      img.src = imgSrc || 'https://placehold.co/300x300/e9ecef/6c757d?text=لا+توجد+صورة';
      img.className = 'carousel-img';
      img.alt = `صورة ${index + 1}`;
      img.loading = 'lazy';
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => openImageModal(images, index));
      carouselImages.appendChild(img);

      // Populate thumbnails
      const thumbnail = document.createElement('img');
      thumbnail.src = imgSrc;
      thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
      thumbnail.alt = `صورة مصغرة ${index + 1}`;
      thumbnail.addEventListener('click', () => {
        carouselImages.querySelectorAll('.carousel-img').forEach((img, i) => {
          img.style.display = i === index ? 'block' : 'none';
        });
        thumbnailsContainer.querySelectorAll('.thumbnail').forEach(img => img.classList.remove('active'));
        thumbnail.classList.add('active');
      });
      thumbnailsContainer.appendChild(thumbnail);
    });

    // Initialize first image
    carouselImages.querySelectorAll('.carousel-img').forEach((img, i) => {
      img.style.display = i === 0 ? 'block' : 'none';
    });

    // Carousel navigation
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let currentIndex = 0;

    function updateCarousel() {
      carouselImages.querySelectorAll('.carousel-img').forEach((img, i) => {
        img.style.display = i === currentIndex ? 'block' : 'none';
      });
      thumbnailsContainer.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === currentIndex);
      });
    }

    prevBtn.addEventListener('click', () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      updateCarousel();
    });

    nextBtn.addEventListener('click', () => {
      currentIndex = (currentIndex + 1) % images.length;
      updateCarousel();
    });

    // Auto-scroll every 4 seconds
    setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      updateCarousel();
    }, 4000);
  }

  function openImageModal(images, initialIndex) {
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
  }

  // Load products from JSON file
  fetch('/static/products.json')
    .then(response => {
      if (!response.ok) throw new Error(`فشل في تحميل products.json: ${response.status}`);
      return response.json();
    })
    .then(data => {
      categories = data.categories;
      if (window.location.pathname.includes('products.html')) {
        loadProductFromURL();
      }
      showNotification('تم تحميل بيانات المواقع بنجاح', 'success');
    })
    .catch(error => {
      console.error('خطأ في تحميل بيانات المواقع:', error);
      showNotification('خطأ في تحميل بيانات المواقع. الرجاء المحاولة لاحقاً.', 'error');
      document.getElementById('productName').textContent = 'خطأ في تحميل الموقع';
    });

  // Initialize
  if (window.location.pathname.includes('products.html')) {
    const form = document.getElementById('orderForm');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await window.backend.submitOrder();
    });

    document.querySelectorAll('#customer_name, #phone').forEach(input => {
      input.addEventListener('input', checkFormValidity);
      input.addEventListener('blur', checkFormValidity);
    });
  }
});