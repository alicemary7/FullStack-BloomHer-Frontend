// Usage: Manages the shopping cart, including fetching items, updating quantities, and navigating to checkout.

const CART_API_URL = `${window.API_BASE_URL}/cart`;

const cartItemsContainer = document.querySelector(".cart-items");

const subtotalEl = document.getElementById("subtotal");
const totalEl = document.getElementById("total");
const itemCountEl = document.getElementById("itemCount");
const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("access_token");

function calculatePriceBySize(basePrice, size) {
  let multiplier = 1.0;
  if (size === "Small") multiplier = 0.9;
  else if (size === "Regular") multiplier = 1.0;
  else if (size === "Large") multiplier = 1.1;
  else if (size === "XL") multiplier = 1.2;
  return Math.round(basePrice * multiplier);
}

if (!userId) {
  document.getElementById("emptyCart").style.display = "block";
  document.getElementById("cartContent").style.display = "none";
}

async function fetchCartItems() {
  if (!userId) return;
  try {
    const response = await fetch(`${CART_API_URL}/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const cartItems = await response.json();
    renderCartItems(cartItems);
  } catch (error) {
  }
}

function renderCartItems(cartItems) {
  cartItemsContainer.innerHTML = "";
  if (cartItems.length === 0) {
    document.getElementById("emptyCart").style.display = "block";
    document.getElementById("cartContent").style.display = "none";
    return;
  }

  document.getElementById("emptyCart").style.display = "none";
  document.getElementById("cartContent").style.display = "block";

  let subtotal = 0;
  let totalItems = 0;

  cartItems.forEach((item) => {
    const product = item.product;
    const itemSize = item.size || "Regular";
    const pricePerItem = calculatePriceBySize(product.price, itemSize);

    const itemTotal = pricePerItem * item.quantity;
    subtotal += itemTotal;
    totalItems += item.quantity;

    const cartItemEl = document.createElement("div");
    cartItemEl.classList.add("cart-item");
    cartItemEl.innerHTML = `
      <div class="item-image">
          <img src="${product.image_url}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
      </div>
      <div class="item-details">
        <div class="item-name">${product.name}</div>
        <div class="item-size">${item.size || "Regular"}</div>
      </div>
      <div class="item-actions">
        <div class="item-price">₹<span class="item-price-value">${pricePerItem}</span></div>
        <div class="quantity-control" style="display: flex; gap: 10px; align-items: center;">
             <button onclick="updateQuantity(${product.id}, ${item.quantity - 1})" 
                     style="padding: 2px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px;">-</button>
             <span class="qty-display">${item.quantity}</span>
             <button onclick="updateQuantity(${product.id}, ${item.quantity + 1})" 
                     style="padding: 2px 8px; border: 1px solid #ccc; background: #fff; cursor: pointer; border-radius: 4px;">+</button>
        </div>
        <button class="remove-btn" onclick="removeCartItem(${product.id})">Remove</button>
      </div>
    `;
    cartItemsContainer.appendChild(cartItemEl);
  });

  subtotalEl.innerText = subtotal;
  const shippingEl = document.getElementById("shipping");
  if (shippingEl) shippingEl.innerText = "FREE";
  totalEl.innerText = subtotal;
  itemCountEl.innerText = totalItems;
}

async function updateQuantity(productId, newQty) {
  if (newQty < 1) {
    await removeCartItem(productId, false);
    return;
  }
  if (newQty >= 99) newQty = 98;

  try {
    const response = await fetch(
      `${CART_API_URL}/item/${productId}?quantity=${newQty}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (response.ok) await fetchCartItems();
  } catch (err) {
  }
}

async function removeCartItem(productId, askConfirmation = true) {
  if (askConfirmation && !(await window.customConfirm("Remove this item?"))) return;

  try {
    const response = await fetch(`${CART_API_URL}/item/${productId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      await fetchCartItems();
      window.showToast("Item removed from cart", "success");
    } else {
      window.showToast("Failed to remove item.", "error");
    }
  } catch (error) {
  }
}

function proceedToCheckout() {
  const subtotalAmount = parseFloat(subtotalEl.innerText) || 0;
  localStorage.setItem("checkoutMode", "cart");
  localStorage.setItem("cartTotal", subtotalAmount);
  localStorage.removeItem("selectedProduct");
  window.location.href = "./address.html";
}

fetchCartItems();

