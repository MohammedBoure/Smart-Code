import { SUPABASE_URL, SUPABASE_KEY, CLIENT_ID } from '../config.js';

document.addEventListener('DOMContentLoaded', function() {
  if (!window.supabase) {
    console.error('مكتبة Supabase لم يتم تحميلها.');
    if (window.adminLogin && window.adminLogin.showError) {
      window.adminLogin.showError('فشل تحميل مكتبة Supabase. تحقق من اتصالك بالإنترنت.');
    }
    return;
  }

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  let products = {};
  let states = [];

  async function loadProducts() {
    try {
      const response = await fetch('static/products.json');
      if (!response.ok) throw new Error(`فشل جلب المنتجات: ${response.status}`);
      products = await response.json();
    } catch (error) {
      console.error('خطأ في تحميل المنتجات:', error);
      if (window.adminLogin && window.adminLogin.showError) {
        window.adminLogin.showError('خطأ في تحميل قائمة المنتجات.');
      }
    }
  }

  async function loadStates() {
    try {
      const response = await fetch('static/algeria_municipalities_first_five_states.json');
      if (!response.ok) throw new Error(`فشل جلب الولايات: ${response.status}`);
      const data = await response.json();
      states = data.states;
    } catch (error) {
      console.error('خطأ في تحميل الولايات:', error);
      if (window.adminLogin && window.adminLogin.showError) {
        window.adminLogin.showError('خطأ في تحميل قائمة الولايات.');
      }
    }
  }

  window.adminOrdersBackend = {
    getClientId: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('لا يوجد مستخدم مسجل دخوله.');
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('لا يوجد مستخدم مسجل دخوله.');
          }
          return null;
        }

        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (clientError || !client) {
          console.error('خطأ في جلب client_id:', clientError);
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب بيانات البائع.');
          }
          return null;
        }

        return client.id;
      } catch (error) {
        console.error('خطأ غير متوقع في جلب client_id:', error);
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ غير متوقع في جلب بيانات البائع.');
        }
        return null;
      }
    },
    
    loadInitialData: async () => {
      await Promise.all([loadStates(), loadProducts()]);
    },
    checkAuth: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
      } catch (error) {
        console.error('خطأ التحقق من المصادقة:', error);
        return false;
      }
    },
    login: async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل تسجيل الدخول: تحقق من بريدك الإلكتروني وكلمة المرور.');
          }
          console.error('خطأ تسجيل الدخول:', error.message);
          return false;
        }
        window.adminLogin.saveCredentials(email, password);
        await window.adminOrdersBackend.loadInitialData();
        await window.adminOrdersBackend.fetchOrders();
        if (window.adminOrdersFrontend && window.adminOrdersFrontend.showOrders) {
          window.adminOrdersFrontend.showOrders();
        }
        return true;
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ غير متوقع أثناء تسجيل الدخول.');
        }
        console.error('خطأ تسجيل الدخول:', error);
        return false;
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
        window.adminLogin.clearCredentials();
        window.adminLogin.showLogin();
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ أثناء تسجيل الخروج.');
        }
        console.error('خطأ تسجيل الخروج:', error);
      }
    },
    fetchOrders: async () => {
      try {
        document.getElementById('loadingSpinner').classList.remove('d-none');
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب بيانات البائع.');
          }
          console.error('خطأ العميل:', clientError);
          return;
        }
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*, order_options(*)')
          .eq('client_id', client.id)
          .order('created_at', { ascending: false });
        if (ordersError) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب الطلبات.');
          }
          console.error('خطأ الطلبات:', ordersError);
          return;
        }
        window.adminOrdersFrontend.displayOrders(orders, products, states);
        window.adminOrdersFrontend.updateOrderStats(orders);
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ في جلب الطلبات.');
        }
        console.error('خطأ جلب الطلبات:', error);
      } finally {
        document.getElementById('loadingSpinner').classList.add('d-none');
      }
    },
    filterOrders: async (startDate, endDate, status) => {
      try {
        document.getElementById('loadingSpinner').classList.remove('d-none');
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب بيانات البائع.');
          }
          console.error('خطأ العميل:', clientError);
          return;
        }
        let query = supabase.from('orders').select('*, order_options(*)').eq('client_id', client.id);
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
        }
        if (status) {
          query = query.eq('status', status);
        }
        const { data: orders, error: ordersError } = await query;
        if (ordersError) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل تصفية الطلبات.');
          }
          console.error('خطأ الطلبات:', ordersError);
          return;
        }
        window.adminOrdersFrontend.displayOrders(orders, products, states);
        window.adminOrdersFrontend.updateOrderStats(orders);
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ في تصفية الطلبات.');
        }
        console.error('خطأ تصفية الطلبات:', error);
      } finally {
        document.getElementById('loadingSpinner').classList.add('d-none');
      }
    },
    getPaginatedOrders: (orders, page, perPage) => {
      const start = (page - 1) * perPage;
      const end = start + perPage;
      return orders.slice(start, end);
    },
    updateOrderStatus: async (orderId, status) => {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId);
        if (error) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل تحديث حالة الطلب.');
          }
          console.error('خطأ تحديث حالة الطلب:', error);
          return;
        }
        window.adminOrdersFrontend.showSuccess('تم تحديث حالة الطلب بنجاح!');
        await window.adminOrdersBackend.fetchOrders();
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ في تحديث حالة الطلب.');
        }
        console.error('خطأ تحديث حالة الطلب:', error);
      }
    },
    deleteOrder: async (orderId) => {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
        if (error) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل حذف الطلب.');
          }
          console.error('خطأ حذف الطلب:', error);
          return;
        }
        window.adminOrdersFrontend.showSuccess('تم حذف الطلب بنجاح!');
        await window.adminOrdersBackend.fetchOrders();
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ في حذف الطلب.');
        }
        console.error('خطأ حذف الطلب:', error);
      }
    },
    showOrderDetails: async (orderId) => {
      try {
        const { data: order, error } = await supabase
          .from('orders')
          .select('*, order_options(*), clients(name)')
          .eq('id', orderId)
          .single();
        if (error) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب تفاصيل الطلب.');
          }
          console.error('خطأ تفاصيل الطلب:', error);
          return;
        }
        const options = order.order_options || [];
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = `orderDetailsModal${orderId}`;
        modal.innerHTML = `
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">تفاصيل الطلب #${order.id}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
              </div>
              <div class="modal-body">
                <p><strong>رقم الطلب:</strong> ${order.id}</p>
                <p><strong>اسم العميل:</strong> ${order.customer_name || 'غير متوفر'}</p>
                <p><strong>المنتج:</strong> ${products[order.product_id]?.name || order.product_id}</p>
                <p><strong>الكمية:</strong> ${order.quantity}</p>
                <p><strong>الولاية:</strong> ${states.find(s => s.id === order.state_id)?.name || order.state_id}</p>
                <p><strong>المدينة:</strong> ${order.city}</p>
                <p><strong>رقم الهاتف:</strong> <a href="tel:${order.phone}">${order.phone}</a></p>
                <p><strong>طريقة التوصيل:</strong> ${order.delivery_method === 'home' ? 'توصيل إلى المنزل' : 'توصيل إلى المكتب'}</p>
                <p><strong>الحالة:</strong> ${order.status}</p>
                <p><strong>تاريخ الطلب:</strong> ${new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <h6>خيارات الطلب:</h6>
                <ul>
                  ${options.length > 0 
                    ? options.slice(0, 3).map(opt => `<li>${opt.option_type}: ${opt.option_value}</li>`).join('')
                    : '<li>لا توجد خيارات متاحة</li>'}
                </ul>
              </div>
              <div class="modal-footer">
                <a href="tel:${order.phone}" class="btn btn-success me-2">
                  <i class="fas fa-phone me-1"></i>الاتصال بالعميل
                </a>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ في جلب تفاصيل الطلب.');
        }
        console.error('خطأ تفاصيل الطلب:', error);
      }
    },
    exportOrders: async (startDate, endDate, status) => {
      try {
        document.getElementById('loadingSpinner').classList.remove('d-none');
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب بيانات البائع.');
          }
          console.error('خطأ العميل:', clientError);
          return;
        }
        let query = supabase.from('orders').select('*, order_options(*)').eq('client_id', client.id);
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        if (endDate) {
          query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
        }
        if (status) {
          query = query.eq('status', status);
        }
        const { data: orders, error: ordersError } = await query;
        if (ordersError) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('فشل جلب الطلبات للتصدير.');
          }
          console.error('خطأ الطلبات:', ordersError);
          return;
        }
        if (!orders || orders.length === 0) {
          if (window.adminLogin && window.adminLogin.showError) {
            window.adminLogin.showError('لا توجد طلبات للتصدير.');
          }
          return;
        }
        const csv = [
          '"رقم الطلب","اسم العميل","المنتج","الكمية","الولاية","المدينة","رقم الهاتف","طريقة التوصيل","الحالة","تاريخ الطلب","خيارات الطلب"',
          ...orders.map(order => {
            const product = products[order.product_id] || { name: order.product_id };
            const state = states.find(s => s.id === order.state_id) || { name: order.state_id };
            const options = (order.order_options || []).slice(0, 3).map(opt => `${opt.option_type}: ${opt.option_value}`).join('; ');
            return `"${order.id}","${order.customer_name || 'غير متوفر'}","${product.name}","${order.quantity}","${state.name}","${order.city}","${order.phone}","${order.delivery_method === 'home' ? 'توصيل إلى المنزل' : 'توصيل إلى المكتب'}","${order.status}","${new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}","${options}"`;
          })
        ].join('\n');
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `الطلبات_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        window.adminOrdersFrontend.showSuccess('تم تصدير الطلبات بنجاح!');
      } catch (error) {
        if (window.adminLogin && window.adminLogin.showError) {
          window.adminLogin.showError('خطأ في تصدير الطلبات.');
        }
        console.error('خطأ تصدير الطلبات:', error);
      } finally {
        document.getElementById('loadingSpinner').classList.add('d-none');
      }
    }
  };
});