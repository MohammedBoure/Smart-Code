window.adminOrdersFrontend = {
  showOrders: () => {
    const ordersSection = document.getElementById('ordersSection');
    if (ordersSection) {
      ordersSection.classList.remove('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
    }
  },
  updateOrderStats: async (orders) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'تم التوصيل').length;
    const processingOrders = orders.filter(o => o.status === 'قيد المعالجة').length;
    const deliveringOrders = orders.filter(o => o.status === 'تم الشحن').length;

    const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === today.toDateString()).length;
    const yesterdayOrders = orders.filter(o => new Date(o.created_at).toDateString() === yesterday.toDateString()).length;
    const weekOrders = orders.filter(o => new Date(o.created_at) >= lastWeek).length;
    const lastWeekOrders = orders.filter(o => new Date(o.created_at) >= new Date(lastWeek.getTime() - 7 * 24 * 60 * 60 * 1000) && new Date(o.created_at) < lastWeek).length;
    const monthOrders = orders.filter(o => new Date(o.created_at) >= lastMonth).length;
    const lastMonthOrders = orders.filter(o => new Date(o.created_at) >= new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000) && new Date(o.created_at) < lastMonth).length;

    const calcDiff = (current, previous) => previous === 0 ? 'غير متاح' : ((current - previous) / previous * 100).toFixed(1) + '%';

    const totalOrdersEl = document.getElementById('totalOrders');
    const completedOrdersEl = document.getElementById('completedOrders');
    const processingOrdersEl = document.getElementById('processingOrders');
    const deliveringOrdersEl = document.getElementById('deliveringOrders');
    const paginationInfoEl = document.getElementById('paginationInfo');
    const clientIdEl = document.getElementById('clientId');

    if (totalOrdersEl) totalOrdersEl.innerHTML = `${totalOrders} <span class="fs-6" data-bs-toggle="tooltip" title="اليوم: ${todayOrders} (${calcDiff(todayOrders, yesterdayOrders)}), الأسبوع: ${weekOrders} (${calcDiff(weekOrders, lastWeekOrders)}), الشهر: ${monthOrders} (${calcDiff(monthOrders, lastMonthOrders)})">ℹ</span>`;
    if (completedOrdersEl) completedOrdersEl.textContent = completedOrders;
    if (processingOrdersEl) processingOrdersEl.textContent = processingOrders;
    if (deliveringOrdersEl) deliveringOrdersEl.textContent = deliveringOrders;
    if (paginationInfoEl) {
      const currentPage = window.adminOrdersFrontend.currentPage || 1;
      const ordersPerPage = window.adminOrdersFrontend.ordersPerPage || 10;
      paginationInfoEl.textContent = `عرض ${(currentPage - 1) * ordersPerPage + 1}-${Math.min(currentPage * ordersPerPage, totalOrders)} من ${totalOrders} طلبات`;
    }

    if (clientIdEl && window.adminOrdersBackend && window.adminOrdersBackend.getClientId) {
      const clientId = await window.adminOrdersBackend.getClientId();
      if (clientId) {
        clientIdEl.innerHTML = `
          <span>${clientId}</span>
          <button class="copy-client-id-btn" title="نسخ معرف البائع" onclick="window.adminOrdersFrontend.copyClientId('${clientId}')">
            <i class="fa fa-copy"></i>
          </button>
        `;
      } else {
        clientIdEl.innerHTML = '<span class="text-white">غير متوفر</span>';
      }
    }

    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));
  },
  copyClientId: (clientId) => {
    navigator.clipboard.writeText(clientId)
      .then(() => {
        window.adminOrdersFrontend.showSuccess('تم نسخ معرف البائع بنجاح!');
      })
      .catch(err => {
        console.error('خطأ في نسخ معرف البائع:', err);
        window.adminOrdersFrontend.showError('فشل نسخ معرف البائع.');
      });
  },
  displayOrders: (orders, products, states) => {
    window.adminOrdersFrontend.allOrders = orders;
    const ordersTable = document.getElementById('ordersTable');
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (!ordersTable || !loadingSpinner) return;
    ordersTable.innerHTML = '';
    loadingSpinner.classList.add('d-none');
    if (orders.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td colspan="11" class="text-center">لا توجد طلبات متاحة</td>
      `;
      ordersTable.appendChild(row);
      return;
    }

    const currentPage = window.adminOrdersFrontend.currentPage || 1;
    const ordersPerPage = window.adminOrdersFrontend.ordersPerPage || 10;
    const paginatedOrders = window.adminOrdersBackend.getPaginatedOrders(orders, currentPage, ordersPerPage);
    paginatedOrders.forEach(order => {
      const product = products[order.product_id] || { name: order.product_id, images: [] };
      const state = states.find(s => s.id === order.state_id) || { name: order.state_id };
      const options = Array.isArray(order.order_options) ? order.order_options : [];

      // تحسين التحقق من صيغة اللون
      const isHexColor = (value) => {
        if (typeof value !== 'string') return false;
        return /^#([0-9A-F]{6}|[0-9A-F]{8})$/i.test(value.trim()); // دعم #RRGGBB و #RRGGBBAA
      };

      // عرض الخيارات مع دعم الألوان
      const optionsDisplay = options.slice(0, 3).map(opt => {
        if (!opt || !opt.option_type || !opt.option_value) return ''; // تجنب الأخطاء إذا كانت البيانات غير صحيحة
        if (isHexColor(opt.option_value)) {
          return `${opt.option_type}: <span style="display: inline-block; width: 20px; height: 20px; background-color: ${opt.option_value}; vertical-align: middle; border: 1px solid #ccc; margin-right: 5px;" title="${opt.option_value}"></span>`;
        }
        return `${opt.option_type}: ${opt.option_value}`;
      }).filter(Boolean).join(', ') || '-';

      // تسجيل لتصحيح الأخطاء
      console.log(`Order ID: ${order.id}, Options:`, options, `Options Display: ${optionsDisplay}`);

      const statusIcons = {
        'قيد المعالجة': '<i class="fas fa-spinner text-primary me-1"></i>',
        'تم الشحن': '<i class="fas fa-truck text-info me-1"></i>',
        'تم التوصيل': '<i class="fas fa-check-circle text-success me-1"></i>',
        'ملغى': '<i class="fas fa-times-circle text-danger me-1"></i>'
      };

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${order.customer_name || 'غير متوفر'}</td>
        <td>
          <img src="${product.images[0] || 'https://via.placeholder.com/40'}" class="product-img me-2" alt="${product.name}">
          ${product.name}
        </td>
        <td class="text-center">${order.quantity}</td>
        <td>${state.name}</td>
        <td>${order.city}</td>
        <td><a href="tel:${order.phone}" class="text-decoration-none">${order.phone}</a></td>
        <td>${order.delivery_method === 'home' ? '<i class="fas fa-home me-1"></i>توصيل إلى المنزل' : '<i class="fas fa-building me-1"></i>توصيل إلى المكتب'}</td>
        <td class="status-column">
          <select class="form-select form-select-sm status-select" onchange="window.adminOrdersBackend.updateOrderStatus('${order.id}', this.value)">
            <option value="قيد المعالجة" ${order.status === 'قيد المعالجة' ? 'selected' : ''}>
              ${statusIcons['قيد المعالجة']} قيد المعالجة
            </option>
            <option value="تم الشحن" ${order.status === 'تم الشحن' ? 'selected' : ''}>
              ${statusIcons['تم الشحن']} تم الشحن
            </option>
            <option value="تم التوصيل" ${order.status === 'تم التوصيل' ? 'selected' : ''}>
              ${statusIcons['تم التوصيل']} تم التوصيل
            </option>
            <option value="ملغى" ${order.status === 'ملغى' ? 'selected' : ''}>
              ${statusIcons['ملغى']} ملغى
            </option>
          </select>
        </td>
        <td>${new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</td>
        <td style="direction: ltr; text-align: left;">${optionsDisplay}</td> <!-- عمود الخيارات باتجاه LTR -->
        <td>
          <div class="d-flex flex-row gap-1 action-buttons">
            <button onclick="window.adminOrdersBackend.deleteOrder('${order.id}')" 
              class="btn btn-danger btn-sm btn-action">
              <i class="fas fa-trash-alt me-1"></i>حذف
            </button>
            <button onclick="window.adminOrdersBackend.showOrderDetails('${order.id}')" 
              class="btn btn-info btn-sm btn-action">
              <i class="fas fa-info-circle me-1"></i>تفاصيل
            </button>
            <a href="tel:${order.phone}" class="btn btn-success btn-sm btn-action">
              <i class="fas fa-phone me-1"></i>اتصال
            </a>
          </div>
        </td>
      `;
      ordersTable.appendChild(row);
    });

    // باقي الكود للصفحات (pagination) يبقى كما هو
    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const pagination = document.querySelector('.pagination');
    if (pagination) {
      pagination.innerHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" id="prevPage">السابق</a>
        </li>
      `;
      for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${currentPage === i ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
          </li>
        `;
      }
      pagination.innerHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" id="nextPage">التالي</a>
        </li>
      `;
      document.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          window.adminOrdersFrontend.currentPage = parseInt(e.target.dataset.page);
          window.adminOrdersFrontend.displayOrders(window.adminOrdersFrontend.allOrders, products, states);
        });
      });
      document.getElementById('prevPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.adminOrdersFrontend.currentPage > 1) {
          window.adminOrdersFrontend.currentPage--;
          window.adminOrdersFrontend.displayOrders(window.adminOrdersFrontend.allOrders, products, states);
        }
      });
      document.getElementById('nextPage').addEventListener('click', (e) => {
        e.preventDefault();
        if (window.adminOrdersFrontend.currentPage < totalPages) {
          window.adminOrdersFrontend.currentPage++;
          window.adminOrdersFrontend.displayOrders(window.adminOrdersFrontend.allOrders, products, states);
        }
      });
    }
  },
  showError: (message) => {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '1050';
    toast.innerHTML = `
      <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header bg-danger text-white">
          <strong class="me-auto">خطأ</strong>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="إغلاق"></button>
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
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="إغلاق"></button>
        </div>
        <div class="toast-body">${message}</div>
      </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast.querySelector('.toast'));
    bsToast.show();
    setTimeout(() => toast.remove(), 5000);
  },
  currentPage: 1,
  ordersPerPage: 10,
  allOrders: []
};

document.addEventListener('DOMContentLoaded', function() {
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const statusFilter = document.getElementById('statusFilter');
  const exportBtn = document.getElementById('exportBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshBtnFloating = document.getElementById('refreshBtnFloating');
  const logoutBtn = document.getElementById('logoutBtn');
  const ordersSection = document.getElementById('ordersSection');
  const floatingBtn = document.getElementById('floatingRefresh');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (window.adminOrdersBackend && window.adminOrdersBackend.logout) {
        window.adminOrdersBackend.logout();
      } else {
        window.adminOrdersFrontend.showError('خطأ في تحميل النظام. تأكد من تحميل جميع الموارد.');
      }
    });
  }

  [startDate, endDate, statusFilter].forEach(element => {
    if (element) {
      element.addEventListener('change', () => {
        const start = startDate?.value || '';
        const end = endDate?.value || '';
        const status = statusFilter?.value || '';
        if (window.adminOrdersBackend && window.adminOrdersBackend.filterOrders) {
          window.adminOrdersFrontend.currentPage = 1;
          window.adminOrdersBackend.filterOrders(start, end, status);
        } else {
          window.adminOrdersFrontend.showError('خطأ في تحميل النظام. تأكد من تحميل جميع الموارد.');
        }
      });
    }
  });

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      location.reload();
    });
  }

  if (refreshBtnFloating) {
    refreshBtnFloating.addEventListener('click', () => {
      location.reload();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (window.adminOrdersBackend && window.adminOrdersBackend.exportOrders) {
        const start = startDate?.value || '';
        const end = endDate?.value || '';
        const status = statusFilter?.value || '';
        window.adminOrdersBackend.exportOrders(start, end, status);
      } else {
        window.adminOrdersFrontend.showError('خطأ في تحميل النظام. تأكد من تحميل جميع الموارد.');
      }
    });
  }

  if (floatingBtn && ordersSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !ordersSection.classList.contains('d-none')) {
          floatingBtn.classList.remove('d-none');
        } else {
          floatingBtn.classList.add('d-none');
        }
      });
    });
    observer.observe(ordersSection);
  }
});