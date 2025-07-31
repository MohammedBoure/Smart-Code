document.addEventListener('DOMContentLoaded', function() {
  const loginSection = document.getElementById('loginSection');
  const pricesSection = document.getElementById('pricesSection');
  const loginForm = document.getElementById('loginForm');
  const deliveryPriceForm = document.getElementById('deliveryPriceForm');
  const editPriceForm = document.getElementById('editPriceForm');
  const productSelect = document.getElementById('productSelect');
  const productSearch = document.getElementById('productSearch');
  const statesCheckboxes = document.getElementById('statesCheckboxes');
  const stateFilter = document.getElementById('stateFilter');
  const productFilter = document.getElementById('productFilter');
  const deliveryPricesTable = document.getElementById('deliveryPricesTable');
  const logoutBtn = document.getElementById('logoutBtn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const floatingBtn = document.getElementById('floatingRefresh');
  const editPriceModal = new bootstrap.Modal(document.getElementById('editPriceModal'));

  let products = {};
  let states = [];
  let allPrices = [];
  const pricesPerPage = 10;

  window.adminDeliveryPricesFrontend = {
    currentPage: 1,
    showLogin: () => {
      loginSection.classList.remove('d-none');
      pricesSection.classList.add('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
      if (loadingSpinner) loadingSpinner.classList.add('d-none');
    },
    showPrices: () => {
      loginSection.classList.add('d-none');
      pricesSection.classList.remove('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
      if (loadingSpinner) loadingSpinner.classList.add('d-none');
    },
    displayDeliveryPrices: (prices, products, states) => {
      allPrices = prices;
      deliveryPricesTable.innerHTML = '';
      let filteredPrices = prices;
      if (stateFilter.value) {
        filteredPrices = filteredPrices.filter(p => p.state_id === parseInt(stateFilter.value));
      }
      if (productFilter.value) {
        filteredPrices = filteredPrices.filter(p => p.product_id === productFilter.value);
      }
      const paginatedPrices = filteredPrices.slice((window.adminDeliveryPricesFrontend.currentPage - 1) * pricesPerPage, window.adminDeliveryPricesFrontend.currentPage * pricesPerPage);

      if (paginatedPrices.length === 0) {
        deliveryPricesTable.innerHTML = '<tr><td colspan="5" class="text-center">لا توجد أسعار توصيل متاحة</td></tr>';
        return;
      }

      paginatedPrices.forEach(price => {
        const product = products[price.product_id] || { name: price.product_id, images: [] };
        const stateName = states.find(s => s.id === price.state_id)?.name || price.state_id;
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><img src="${product.images[0] || 'https://via.placeholder.com/40'}" class="product-img me-2" alt="${product.name}">${product.name}</td>
          <td>${stateName}</td>
          <td>${price.price_to_office} دج</td>
          <td>${price.price_to_home} دج</td>
          <td>
            <div class="d-flex flex-row gap-1 action-buttons">
              <button onclick="window.adminDeliveryPricesFrontend.openEditModal('${price.id}', '${price.product_id}', '${price.state_id}', ${price.price_to_office}, ${price.price_to_home})" 
                class="btn btn-warning btn-sm btn-action">
                <i class="fas fa-edit me-1"></i>تعديل
              </button>
              <button onclick="window.adminDeliveryPricesBackend.deleteDeliveryPrice('${price.id}')" 
                class="btn btn-danger btn-sm btn-action">
                <i class="fas fa-trash-alt me-1"></i>حذف
              </button>
            </div>
          </td>
        `;
        deliveryPricesTable.appendChild(row);
      });

      const totalPages = Math.ceil(filteredPrices.length / pricesPerPage);
      const pagination = document.querySelector('.pagination');
      pagination.innerHTML = `
        <li class="page-item ${window.adminDeliveryPricesFrontend.currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" id="prevPage">السابق</a>
        </li>
      `;
      for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${window.adminDeliveryPricesFrontend.currentPage === i ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
          </li>
        `;
      }
      pagination.innerHTML += `
        <li class="page-item ${window.adminDeliveryPricesFrontend.currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" id="nextPage">التالي</a>
        </li>
      `;
      document.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.adminDeliveryPricesFrontend.currentPage = parseInt(e.target.dataset.page);
          window.adminDeliveryPricesFrontend.displayDeliveryPrices(allPrices, products, states);
        });
      });
      document.getElementById('prevPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.adminDeliveryPricesFrontend.currentPage > 1) {
          window.adminDeliveryPricesFrontend.currentPage--;
          window.adminDeliveryPricesFrontend.displayDeliveryPrices(allPrices, products, states);
        }
      });
      document.getElementById('nextPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.adminDeliveryPricesFrontend.currentPage < totalPages) {
          window.adminDeliveryPricesFrontend.currentPage++;
          window.adminDeliveryPricesFrontend.displayDeliveryPrices(allPrices, products, states);
        }
      });

      // Update product filter options
      const uniqueProductIds = [...new Set(prices.map(p => p.product_id))];
      productFilter.innerHTML = '<option value="">جميع المنتجات</option>';
      uniqueProductIds.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = products[id]?.name || id;
        productFilter.appendChild(option);
      });
    },
    openEditModal: (priceId, productId, stateId, priceToOffice, priceToHome) => {
      document.getElementById('editPriceId').value = priceId;
      document.getElementById('editProductId').value = productId;
      document.getElementById('editProductSelect').value = products[productId]?.name || productId;
      document.getElementById('editStateId').value = stateId;
      document.getElementById('editStateSelect').value = states.find(s => s.id === stateId)?.name || stateId;
      document.getElementById('editPriceToOffice').value = priceToOffice;
      document.getElementById('editPriceToHome').value = priceToHome;
      editPriceModal.show();
    },
    getLoginCredentials: () => ({
      email: document.getElementById('email')?.value.trim() || '',
      password: document.getElementById('password')?.value.trim() || ''
    }),
    getDeliveryPriceData: () => {
      const selectedStates = Array.from(statesCheckboxes.querySelectorAll('input:checked')).map(input => parseInt(input.value));
      return {
        product_id: productSelect.value,
        state_ids: selectedStates,
        price_to_office: parseFloat(document.getElementById('priceToOffice').value),
        price_to_home: parseFloat(document.getElementById('priceToHome').value)
      };
    },
    getEditPriceData: () => ({
      id: document.getElementById('editPriceId').value,
      product_id: document.getElementById('editProductId').value,
      state_id: parseInt(document.getElementById('editStateId').value),
      price_to_office: parseFloat(document.getElementById('editPriceToOffice').value),
      price_to_home: parseFloat(document.getElementById('editPriceToHome').value)
    }),
    saveCredentials: (email, password) => {
      localStorage.setItem('adminEmail', email);
      localStorage.setItem('adminPassword', password);
    },
    getSavedCredentials: () => ({
      email: localStorage.getItem('adminEmail') || '',
      password: localStorage.getItem('adminPassword') || ''
    }),
    clearCredentials: () => {
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminPassword');
    },
    showError: (message) => {
      const toast = document.createElement('div');
      toast.className = 'position-fixed bottom-0 end-0 p-3';
      toast.style.zIndex = '1050';
      toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header bg-danger text-white">
            <strong class="me-auto">خطأ</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">${message}</div>
        </div>
      `;
      document.body.appendChild(toast);
      const bsToast = new bootstrap.Toast(toast.querySelector('.toast'));
      bsToast.show();
      setTimeout(() => toast.remove(), 5000);
    },
    showSuccess: (message) => {
      const toast = document.createElement('div');
      toast.className = 'position-fixed bottom-0 end-0 p-3';
      toast.style.zIndex = '1050';
      toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header bg-success text-white">
            <strong class="me-auto">نجاح</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">${message}</div>
        </div>
      `;
      document.body.appendChild(toast);
      const bsToast = new bootstrap.Toast(toast.querySelector('.toast'));
      bsToast.show();
      setTimeout(() => toast.remove(), 5000);
    },
    getProducts: () => products,
    getStates: () => states
  };

  // Load products
  fetch('static/products.json')
    .then(response => {
      if (!response.ok) throw new Error(`فشل في جلب المنتجات: ${response.status}`);
      return response.json();
    })
    .then(data => {
      products = data;
      productSelect.innerHTML = '<option value="">اختر المنتج...</option>';
      Object.keys(products).forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = products[id].name;
        productSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('خطأ في تحميل المنتجات:', error);
      productSelect.innerHTML = '<option value="">خطأ في تحميل المنتجات</option>';
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تحميل قائمة المنتجات');
    });

  // Load states
  fetch('static/algeria_municipalities_first_five_states.json')
    .then(response => {
      if (!response.ok) throw new Error(`فشل في جلب الولايات: ${response.status}`);
      return response.json();
    })
    .then(data => {
      states = data.states;
      statesCheckboxes.innerHTML = '';
      stateFilter.innerHTML = '<option value="">جميع الولايات</option>';
      states.forEach(state => {
        const div = document.createElement('div');
        div.className = 'form-check';
        div.innerHTML = `
          <input class="form-check-input state-checkbox" type="checkbox" value="${state.id}" id="state-${state.id}">
          <label class="form-check-label" for="state-${state.id}">
            ${state.name}
          </label>
        `;
        statesCheckboxes.appendChild(div);
        const option = document.createElement('option');
        option.value = state.id;
        option.textContent = state.name;
        stateFilter.appendChild(option);
      });
    })
    .catch(error => {
      console.error('خطأ في تحميل الولايات:', error);
      statesCheckboxes.innerHTML = '<div class="text-danger">خطأ في تحميل قائمة الولايات</div>';
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تحميل قائمة الولايات');
    });

  // Product search with priority for assigned products
  productSearch.addEventListener('input', () => {
    const searchTerm = productSearch.value.toLowerCase();
    const assignedProductIds = [...new Set(allPrices.map(p => p.product_id))];
    productSelect.innerHTML = '<option value="">اختر المنتج...</option>';
    const filteredProducts = Object.keys(products).filter(id => products[id].name.toLowerCase().includes(searchTerm));
    const sortedProducts = [
      ...filteredProducts.filter(id => assignedProductIds.includes(id)),
      ...filteredProducts.filter(id => !assignedProductIds.includes(id))
    ];
    sortedProducts.forEach(id => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = products[id].name;
      productSelect.appendChild(option);
    });
  });

  // Filters
  [stateFilter, productFilter].forEach(filter => {
    filter.addEventListener('change', () => {
      window.adminDeliveryPricesFrontend.currentPage = 1;
      window.adminDeliveryPricesFrontend.displayDeliveryPrices(allPrices, products, states);
    });
  });

  // Form validation
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      e.stopPropagation();
      loginForm.classList.add('was-validated');
      return;
    }
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    const { email, password } = window.adminDeliveryPricesFrontend.getLoginCredentials();
    try {
      const success = await window.adminDeliveryPricesBackend.login(email, password);
      if (success) {
        window.adminDeliveryPricesFrontend.showPrices();
      }
    } catch (error) {
      window.adminDeliveryPricesFrontend.showError('فشل تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور.');
      console.error('Login Error:', error);
    }
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  });

  deliveryPriceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!deliveryPriceForm.checkValidity()) {
      e.stopPropagation();
      deliveryPriceForm.classList.add('was-validated');
      return;
    }
    const data = window.adminDeliveryPricesFrontend.getDeliveryPriceData();
    if (data.state_ids.length === 0) {
      const statesCheckboxGroup = statesCheckboxes.closest('.state-checkboxes');
      statesCheckboxGroup.style.borderColor = '#dc3545';
      statesCheckboxGroup.insertAdjacentHTML('afterend', '<div class="invalid-feedback d-block">يرجى اختيار ولاية واحدة على الأقل</div>');
      return;
    }
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    try {
      await window.adminDeliveryPricesBackend.setDeliveryPrices(data);
      window.adminDeliveryPricesFrontend.showSuccess('تم تعيين أسعار التوصيل بنجاح!');
      deliveryPriceForm.reset();
      statesCheckboxes.querySelectorAll('input').forEach(input => input.checked = false);
    } catch (error) {
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تعيين أسعار التوصيل.');
      console.error('Set Delivery Prices Error:', error);
    }
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  });

  editPriceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editPriceForm.checkValidity()) {
      e.stopPropagation();
      editPriceForm.classList.add('was-validated');
      return;
    }
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    try {
      const data = window.adminDeliveryPricesFrontend.getEditPriceData();
      await window.adminDeliveryPricesBackend.updateDeliveryPrice(data);
      window.adminDeliveryPricesFrontend.showSuccess('تم تعديل سعر التوصيل بنجاح!');
      editPriceModal.hide();
      editPriceForm.reset();
    } catch (error) {
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تعديل سعر التوصيل.');
      console.error('Edit Delivery Price Error:', error);
    }
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  });

  logoutBtn.addEventListener('click', () => {
    window.adminDeliveryPricesBackend.logout();
  });

  floatingBtn.addEventListener('click', () => {
    location.reload();
  });

  // Reset form validation
  ['email', 'password'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', () => {
        loginForm.classList.remove('was-validated');
      });
    }
  });

  ['productSelect', 'priceToOffice', 'priceToHome'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', () => {
        deliveryPriceForm.classList.remove('was-validated');
      });
    }
  });

  ['editPriceToOffice', 'editPriceToHome'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', () => {
        editPriceForm.classList.remove('was-validated');
      });
    }
  });

  statesCheckboxes.addEventListener('change', (e) => {
    if (e.target.classList.contains('state-checkbox')) {
      const statesCheckboxGroup = statesCheckboxes.closest('.state-checkboxes');
      statesCheckboxGroup.style.borderColor = '';
      const invalidFeedback = statesCheckboxGroup.nextElementSibling;
      if (invalidFeedback && invalidFeedback.classList.contains('invalid-feedback')) {
        invalidFeedback.remove();
      }
    }
  });

  // Observer for floating button
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !pricesSection.classList.contains('d-none')) {
        floatingBtn.classList.remove('d-none');
      } else {
        floatingBtn.classList.add('d-none');
      }
    });
  });
  observer.observe(pricesSection);

  // Initial authentication check
  async function initialize() {
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    try {
      const isAuthenticated = await window.adminDeliveryPricesBackend.checkAuth();
      if (isAuthenticated) {
        window.adminDeliveryPricesFrontend.showPrices();
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
      } else {
        window.adminDeliveryPricesFrontend.showLogin();
      }
    } catch (error) {
      console.error('Initialization Error:', error);
      window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تهيئة النظام.');
      window.adminDeliveryPricesFrontend.showLogin();
    }
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  }

  initialize();
});