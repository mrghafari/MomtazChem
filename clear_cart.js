// Clear cart from browser localStorage
localStorage.removeItem('momtazchem_user_cart');
localStorage.removeItem('momtazchem_guest_cart');
sessionStorage.removeItem('momtazchem_guest_cart');
console.log('✅ Cart cleared from browser storage');
