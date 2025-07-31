import { SUPABASE_URL, SUPABASE_KEY, CLIENT_ID } from '../config.js';

document.addEventListener('DOMContentLoaded', function() {
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  window.adminDeliveryPricesBackend = {
    checkAuth: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    },
    login: async (email, password) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          window.adminDeliveryPricesFrontend.showError('فشل تسجيل الدخول: تحقق من البريد الإلكتروني وكلمة المرور.');
          console.error('Login Error:', error);
          return false;
        }
        window.adminDeliveryPricesFrontend.saveCredentials(email, password);
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
        return true;
      } catch (error) {
        window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تسجيل الدخول.');
        console.error('Login Error:', error);
        return false;
      }
    },
    logout: async () => {
      try {
        await supabase.auth.signOut();
        window.adminDeliveryPricesFrontend.clearCredentials();
        window.adminDeliveryPricesFrontend.showLogin();
      } catch (error) {
        window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تسجيل الخروج.');
        console.error('Logout Error:', error);
      }
    },
    setDeliveryPrices: async ({ product_id, state_ids, price_to_office, price_to_home }) => {
      try {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          window.adminDeliveryPricesFrontend.showError('فشل في جلب بيانات البائع.');
          console.error('Client Error:', clientError);
          return;
        }

        const priceData = state_ids.map(state_id => ({
          client_id: client.id,
          product_id,
          state_id,
          price_to_office,
          price_to_home
        }));

        const { error } = await supabase
          .from('delivery_prices')
          .insert(priceData);

        if (error) {
          window.adminDeliveryPricesFrontend.showError('فشل في تعيين أسعار التوصيل.');
          console.error('Set Delivery Prices Error:', error);
          return;
        }

        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
      } catch (error) {
        window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تعيين أسعار التوصيل.');
        console.error('Set Delivery Prices Error:', error);
      }
    },
    updateDeliveryPrice: async ({ id, price_to_office, price_to_home }) => {
      try {
        const { error } = await supabase
          .from('delivery_prices')
          .update({ price_to_office, price_to_home })
          .eq('id', id);
        if (error) {
          window.adminDeliveryPricesFrontend.showError('فشل في تعديل سعر التوصيل.');
          console.error('Update Delivery Price Error:', error);
          return;
        }
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
      } catch (error) {
        window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء تعديل سعر التوصيل.');
        console.error('Update Delivery Price Error:', error);
      }
    },
    fetchDeliveryPrices: async () => {
      try {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user.id)
          .single();
        if (clientError || !client) {
          window.adminDeliveryPricesFrontend.showError('فشل في جلب بيانات البائع.');
          console.error('Client Error:', clientError);
          return;
        }
        const { data: prices, error: pricesError } = await supabase
          .from('delivery_prices')
          .select('*')
          .eq('client_id', client.id);
        if (pricesError) {
          window.adminDeliveryPricesFrontend.showError('فشل في جلب أسعار التوصيل.');
          console.error('Delivery Prices Error:', pricesError);
          return;
        }
        window.adminDeliveryPricesFrontend.displayDeliveryPrices(prices, window.adminDeliveryPricesFrontend.getProducts(), window.adminDeliveryPricesFrontend.getStates());
      } catch (error) {
        window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء جلب أسعار التوصيل.');
        console.error('Fetch Delivery Prices Error:', error);
      }
    },
    deleteDeliveryPrice: async (priceId) => {
      try {
        const { error } = await supabase
          .from('delivery_prices')
          .delete()
          .eq('id', priceId);
        if (error) {
          window.adminDeliveryPricesFrontend.showError('فشل في حذف سعر التوصيل.');
          console.error('Delete Delivery Price Error:', error);
          return;
        }
        window.adminDeliveryPricesFrontend.showSuccess('تم حذف سعر التوصيل بنجاح!');
        await window.adminDeliveryPricesBackend.fetchDeliveryPrices();
      } catch (error) {
        window.adminDeliveryPricesFrontend.showError('حدث خطأ أثناء حذف سعر التوصيل.');
        console.error('Delete Delivery Price Error:', error);
      }
    }
  };
});