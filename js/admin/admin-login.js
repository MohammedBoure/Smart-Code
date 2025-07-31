document.addEventListener('DOMContentLoaded', function() {
  // Dynamically inject loading spinner HTML
  const loadingSpinnerHtml = `
    <div id="loadingSpinner" class="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">جارٍ التحميل...</span>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', loadingSpinnerHtml);

  // Dynamically inject login section HTML
  const loginSectionHtml = `
    <div id="loginSection" class="d-flex align-items-center justify-content-center min-vh-100 d-none">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-5 col-lg-4 col-sm-10">
            <div class="card login-card shadow-lg border-0">
              <div class="card-body p-4 p-sm-5">
                <div class="text-center mb-4">
                  <div class="bg-primary bg-gradient rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 80px; height: 80px;">
                    <i class="fas fa-user-shield fa-2x text-white"></i>
                  </div>
                  <h3 class="card-title fw-bold text-primary">تسجيل دخول الأدمن</h3>
                  <p class="text-muted">أدخل بياناتك للوصول إلى لوحة التحكم</p>
                </div>
                <form id="loginForm" novalidate>
                  <div class="mb-3">
                    <label for="email" class="form-label fw-semibold">
                      <i class="fas fa-envelope me-2 text-muted"></i>البريد الإلكتروني
                    </label>
                    <input type="email" class="form-control form-control-lg" id="email" placeholder="admin@example.com" required>
                    <div class="invalid-feedback">يرجى إدخال بريد إلكتروني صحيح</div>
                  </div>
                  <div class="mb-4">
                    <label for="password" class="form-label fw-semibold">
                      <i class="fas fa-lock me-2 text-muted"></i>كلمة المرور
                    </label>
                    <input type="password" class="form-control form-control-lg" id="password" placeholder="••••••••" required>
                    <div class="invalid-feedback">يرجى إدخال كلمة المرور</div>
                  </div>
                  <div class="d-grid">
                    <button type="submit" class="btn btn-gradient btn-lg fw-semibold">
                      <i class="fas fa-sign-in-alt me-2"></i>تسجيل الدخول
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('afterbegin', loginSectionHtml);

  const loginSection = document.getElementById('loginSection');
  const loginForm = document.getElementById('loginForm');
  const loadingSpinner = document.getElementById('loadingSpinner');

  window.adminLogin = {
    showLogin: () => {
      loginSection.classList.remove('d-none');
      const ordersSection = document.getElementById('ordersSection');
      if (ordersSection) ordersSection.classList.add('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
      if (loadingSpinner) loadingSpinner.classList.add('d-none');
    },
    hideLogin: () => {
      loginSection.classList.add('d-none');
      const ordersSection = document.getElementById('ordersSection');
      if (ordersSection) ordersSection.classList.remove('d-none');
      document.body.style.backgroundColor = '#f8f9fa';
      if (loadingSpinner) loadingSpinner.classList.add('d-none');
    },
    getLoginCredentials: () => ({
      email: document.getElementById('email')?.value.trim() || '',
      password: document.getElementById('password')?.value.trim() || ''
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
    }
  };

  if (loginForm) {
    loginForm.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
      }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!loginForm.checkValidity()) {
        e.stopPropagation();
        loginForm.classList.add('was-validated');
        return;
      }
      if (loadingSpinner) loadingSpinner.classList.remove('d-none');
      const { email, password } = window.adminLogin.getLoginCredentials();
      if (window.adminOrdersBackend && window.adminOrdersBackend.login) {
        try {
          const success = await window.adminOrdersBackend.login(email, password);
          if (success) {
            window.adminLogin.hideLogin();
          }
        } catch (error) {
          window.adminLogin.showError('فشل تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور.');
          console.error('Login Error:', error);
        }
      } else {
        window.adminLogin.showError('خطأ في تحميل النظام. تأكد من تحميل جميع الموارد.');
      }
      if (loadingSpinner) loadingSpinner.classList.add('d-none');
    });

    ['email', 'password'].forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('input', () => {
          loginForm.classList.remove('was-validated');
        });
      }
    });
  }

  // Initial authentication check with loading spinner
  async function initialize() {
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    if (window.adminOrdersBackend && window.adminOrdersBackend.checkAuth) {
      try {
        const isAuthenticated = await window.adminOrdersBackend.checkAuth();
        if (isAuthenticated) {
          window.adminLogin.hideLogin();
          await window.adminOrdersBackend.loadInitialData();
          await window.adminOrdersBackend.fetchOrders();
          if (window.adminOrdersFrontend && window.adminOrdersFrontend.showOrders) {
            window.adminOrdersFrontend.showOrders();
          }
        } else {
          window.adminLogin.showLogin();
        }
      } catch (error) {
        console.error('Initialization Error:', error);
        window.adminLogin.showError('حدث خطأ أثناء تهيئة النظام.');
        window.adminLogin.showLogin();
      }
    } else {
      console.error('adminOrdersBackend not loaded.');
      window.adminLogin.showError('خطأ في تحميل النظام. تأكد من تحميل جميع الموارد.');
      window.adminLogin.showLogin();
    }
    if (loadingSpinner) loadingSpinner.classList.add('d-none');
  }

  initialize();
});