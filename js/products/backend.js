import { SUPABASE_URL, SUPABASE_KEY, CLIENT_ID } from '../config.js';

document.addEventListener('DOMContentLoaded', function () {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  window.backend = {
    submitOrder: async () => {
      const selectedProduct = window.frontend?.getSelectedProduct();
      if (!selectedProduct) {
        alert('يرجى الانتظار حتى يتم تحميل المنتج بالكامل.');
        return false;
      }

      window.frontend.disableSubmitButton(true);

      const { customerName, phone, domainName, color } = window.frontend.getFormData();

      if (!customerName) {
        alert('اسم الزبون مطلوب.');
        window.frontend.disableSubmitButton(false);
        return false;
      }

      const phoneRegex = /^(05|06|07)\d{8}$/;
      if (!phoneRegex.test(phone)) {
        alert('رقم الهاتف غير صالح. يجب أن يبدأ بـ 05, 06, أو 07 ويتكون من 10 أرقام.');
        window.frontend.disableSubmitButton(false);
        return false;
      }

      try {
        const orderId = crypto.randomUUID();
        const productId = selectedProduct.productId;

        // 👇 إدخال الطلب بقيم أساسية وبعض القيم الافتراضية
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: orderId,
            client_id: CLIENT_ID,
            customer_name: customerName.trim(),
            product_id: productId,
            quantity: 1, // قيمة افتراضية
            state_id: 1, // قيمة افتراضية
            city: '1',   // قيمة افتراضية
            address: '1', // قيمة افتراضية
            phone: phone.trim(),
            delivery_method: 'office', 
            status: 'قيد المعالجة',
            created_at: new Date().toISOString()
          });

        if (orderError) {
          alert('فشل في إرسال الطلب. يرجى المحاولة لاحقًا.');
          console.error('Supabase Order Error:', orderError.message);
          window.frontend.disableSubmitButton(false);
          return false;
        }

        // 👇 خيارات إضافية حسب نوع المنتج (موقع)
        const optionInserts = [];

        if (domainName) {
          optionInserts.push({
            order_id: orderId,
            option_type: 'domain_name',
            option_value: domainName.trim()
          });
        }

        if (color) {
          optionInserts.push({
            order_id: orderId,
            option_type: 'color',
            option_value: color.trim()
          });
        }

        if (optionInserts.length > 0) {
          const { error: optionsError } = await supabase
            .from('order_options')
            .insert(optionInserts);

          if (optionsError) {
            alert('تم إرسال الطلب، لكن فشل في حفظ بعض التفاصيل.');
            console.error('Supabase Options Error:', optionsError.message);
          }
        }

        alert('تم إرسال الطلب بنجاح! سنتواصل معك قريباً.');
        window.frontend.resetForm();
        window.frontend.disableSubmitButton(false);
        return true;
      } catch (error) {
        alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقًا.');
        console.error('Submission Error:', error.message);
        window.frontend.disableSubmitButton(false);
        return false;
      }
    }
  };

  if (window.location.pathname.includes('products.html') || window.location.pathname.endsWith('/')) {
    const form = document.getElementById('orderForm');
    form?.addEventListener('submit', async function (e) {
      e.preventDefault();
      await window.backend.submitOrder();
    });
  }
});
