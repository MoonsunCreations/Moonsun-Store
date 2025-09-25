// store.js - client-side e-commerce logic (static)
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart_v1') || '[]')
};

function saveCart(){ localStorage.setItem('cart_v1', JSON.stringify(state.cart)); updateCartUI(); }

function fetchProducts(){
  // products.json is loaded as file; fetch it
  fetch('products.json').then(r => r.json()).then(json => {
    state.products = json;
    renderPage();
    updateCartUI();
  }).catch(err => console.error('products load err', err));
}

function findProductById(id){ return state.products.find(p => p.id === id); }

function addToCart(id, qty=1){
  const p = findProductById(id);
  if(!p) return alert('Product not found');
  const item = state.cart.find(i => i.id === id);
  if(item){ item.qty += qty; } else { state.cart.push({id, qty}); }
  saveCart();
}

function removeFromCart(id){
  state.cart = state.cart.filter(i => i.id !== id);
  saveCart();
}

function changeQty(id, q){
  const item = state.cart.find(i=>i.id===id);
  if(!item) return;
  item.qty = Math.max(1, q);
  saveCart();
}

function cartTotal(){
  return state.cart.reduce((sum, it) => {
    const p = findProductById(it.id);
    return sum + (p ? p.price * it.qty : 0);
  }, 0);
}

function renderPage(){
  const path = location.pathname.split('/').pop();
  if(path === '' || path === 'index.html'){
    renderHome();
  } else if(path === 'shop.html'){
    renderShop();
  } else if(path === 'product.html'){
    renderProductDetail();
  }
}

function renderHome(){
  const el = document.getElementById('featured');
  if(!el) return;
  el.innerHTML = '';
  state.products.slice(0,6).forEach(p=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      <div>Rs ${p.price}</div>
      <div style="margin-top:8px">
        <a class="btn" href="product.html?id=${p.id}">View</a>
        <button class="btn" onclick="addToCart('${p.id}',1)">Add</button>
      </div>
    `;
    el.appendChild(card);
  });
}

function renderShop(){
  const el = document.getElementById('productsGrid');
  if(!el) return;
  el.innerHTML = '';
  state.products.forEach(p=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h4>${p.name}</h4>
      <p>${p.description}</p>
      <div>Rs ${p.price}</div>
      <div style="margin-top:8px">
        <a class="btn" href="product.html?id=${p.id}">View</a>
        <button class="btn" onclick="addToCart('${p.id}',1)">Add</button>
      </div>
    `;
    el.appendChild(card);
  });
}

function renderProductDetail(){
  const el = document.getElementById('productDetail');
  if(!el) return;
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const p = findProductById(id);
  if(!p){ el.innerHTML = '<p>Product not found</p>'; return; }
  el.innerHTML = `
    <div class="card" style="display:flex;gap:16px;align-items:flex-start">
      <img src="${p.image}" style="width:320px;height:320px;object-fit:cover"/>
      <div>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <h3>Rs ${p.price}</h3>
        <div style="margin-top:12px">
          <button class="btn" onclick="addToCart('${p.id}',1)">Add to cart</button>
          <button class="btn" onclick="buyNow('${p.id}')">Buy Now</button>
        </div>
      </div>
    </div>
  `;
}

function updateCartUI(){
  // update cart count
  const count = state.cart.reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('#cartCount').forEach(n=>n.textContent=count);
  // render cart modal items
  const itemsEl = document.getElementById('cartItems');
  if(itemsEl){
    itemsEl.innerHTML = '';
    state.cart.forEach(it=>{
      const p = findProductById(it.id);
      if(!p) return;
      const row = document.createElement('div');
      row.style.display='flex'; row.style.justifyContent='space-between'; row.style.marginBottom='8px';
      row.innerHTML = `
        <div>
          <strong>${p.name}</strong><br/><small>Rs ${p.price} x </small>
          <input style="width:48px" type="number" value="${it.qty}" onchange="changeQty('${it.id}', parseInt(this.value))"/>
        </div>
        <div>
          <div>Rs ${p.price * it.qty}</div>
          <button onclick="removeFromCart('${it.id}')" class="btn" style="margin-top:6px">Remove</button>
        </div>
      `;
      itemsEl.appendChild(row);
    });
    document.getElementById('cartTotal').textContent = cartTotal();
  }
  // update PayPal link (simple: PayPal.me)
  const paypal = document.getElementById('paypalLink');
  if(paypal){
    const total = cartTotal();
    // Replace 'YourPayPalName' with your PayPal.me username
    paypal.href = `https://www.paypal.me/YourPayPalName/${total}`;
    paypal.textContent = total > 0 ? `Pay Rs ${total} via PayPal` : 'Pay with PayPal';
  }
}

function toggleCart(open){
  const modal = document.getElementById('cartModal');
  if(!modal) return;
  modal.classList.toggle('hidden', !open);
  updateCartUI();
}

function buyNow(id){
  addToCart(id,1);
  toggleCart(true);
}

function checkoutViaWhatsApp(){
  if(state.cart.length === 0) return alert('Cart empty');
  const phone = '977XXXXXXXXX'; // replace with your number with country code (no +)
  let msg = `Hello, I want to order:\n`;
  state.cart.forEach(it=>{
    const p = findProductById(it.id);
    msg += `- ${p.name} x ${it.qty} = Rs ${p.price * it.qty}\n`;
  });
  msg += `Total: Rs ${cartTotal()}\nName: \nAddress: \nPayment method: `;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

// helper to run when document ready
document.addEventListener('click', (e)=>{
  const id = e.target.id;
  if(id === 'cartBtn'){ toggleCart(true); }
  if(id === 'closeCart'){ toggleCart(false); }
  if(id === 'checkoutWhatsapp'){ checkoutViaWhatsApp(); }
});

window.changeQty = changeQty;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.buyNow = buyNow;
window.checkoutViaWhatsApp = checkoutViaWhatsApp;

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('year') && (document.getElementById('year').textContent = new Date().getFullYear());
  fetchProducts();
  // attach modal buttons if present
  const cw = document.getElementById('checkoutWhatsapp');
  if(cw) cw.addEventListener('click', checkoutViaWhatsApp);
  document.querySelectorAll('#closeCart').forEach(b => b.addEventListener('click', ()=> toggleCart(false)));
});