// Usage: Processes orders, manages payment methods, and handles the transition from cart to order placement.

const ORDER_API_URL = `${window.API_BASE_URL}/orders`;
const PAYMENT_API_URL = `${window.API_BASE_URL}/payments`;

const placeOrderBtn = document.querySelector(".place-order-btn");
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

const productNameEl = document.getElementById("product-name");
const productSizeEl = document.getElementById("product-size");
const productPriceEl = document.getElementById("product-price");
const productQuantityEl = document.getElementById("product-quantity");
const orderSubtotalEl = document.getElementById("order-subtotal");
const orderShippingEl = document.getElementById("order-shipping");
const orderTotalEl = document.getElementById("order-total");

const orderItemsList = document.getElementById("order-items-list");
let selectedProduct = null;

async function init() {
  const checkoutMode = localStorage.getItem("checkoutMode");
  const storedProduct = localStorage.getItem("selectedProduct");

  if (checkoutMode === "cart") {
    await renderCartSummary();
  } else if (storedProduct) {
    selectedProduct = JSON.parse(storedProduct);
    renderOrderSummary();
  } else {
    productNameEl.textContent = "No items selected";
  }

  setupPaymentToggle();
}

function setupPaymentToggle() {
  const paymentInputs = document.querySelectorAll('input[name="payment"]');
  const cardDetails = document.getElementById("cardDetails");

  paymentInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      if (e.target.value === "card") {
        cardDetails.classList.add("active");
      } else {
        cardDetails.classList.remove("active");
      }
    });
  });
}

async function renderCartSummary() {
  if (!userId) return;

  try {
    const res = await fetch(`${window.API_BASE_URL}/cart/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await res.json();

    if (items.length === 0) {
      window.showToast(
        "Your cart is empty! Redirecting to cart page...",
        "info",
      );
      setTimeout(() => {
        window.location.href = "./card.html";
      }, 2000);
      return;
    }

    orderItemsList.innerHTML = "";
    let subtotal = 0;

    items.forEach((item) => {
      const product = item.product;
      const itemSize = item.size || "Regular";
      const pricePerItem = calculatePriceBySize(product.price, itemSize);

      const itemTotal = pricePerItem * item.quantity;
      subtotal += itemTotal;

      const itemRow = document.createElement("div");
      itemRow.classList.add("item-row");
      itemRow.style.marginBottom = "15px";
      itemRow.innerHTML = `
        <div>
          <div style="font-weight: 600;">${product.name}</div>
          <div style="font-size: 0.9rem; color: #666">${item.size || "Regular"}</div>
          <div style="font-size: 0.8rem; color: #888">Qty: ${item.quantity}</div>
        </div>
        <div style="font-weight: 600;">₹${itemTotal}</div>
      `;
      orderItemsList.appendChild(itemRow);
    });

    const total = subtotal;
    if (orderSubtotalEl) orderSubtotalEl.textContent = `₹${subtotal}`;
    if (orderShippingEl) orderShippingEl.textContent = "FREE";
    orderTotalEl.textContent = `₹${total}`;
  } catch (err) {
    productNameEl.textContent = "Error loading order items";
  }
}

function renderOrderSummary() {
  if (!selectedProduct) return;

  productNameEl.textContent = selectedProduct.name;
  productSizeEl.textContent = selectedProduct.selectedSize || "Regular";
  productPriceEl.textContent = `₹${selectedProduct.price * selectedProduct.quantity}`;
  if (productQuantityEl)
    productQuantityEl.textContent = `Qty: ${selectedProduct.quantity}`;

  const subtotal = selectedProduct.price * selectedProduct.quantity;
  const total = subtotal;

  if (orderSubtotalEl) orderSubtotalEl.textContent = `₹${subtotal}`;
  if (orderShippingEl) orderShippingEl.textContent = "FREE";
  orderTotalEl.textContent = `₹${total}`;
}

placeOrderBtn.addEventListener("click", async () => {
  if (!validateForm()) return;
  if (!userId) {
    window.showToast("Please login to complete your order.", "error");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
    return;
  }

  const checkoutMode = localStorage.getItem("checkoutMode");
  if (checkoutMode === "cart") {
    await createCartOrder();
  } else {
    await createOrder();
  }
});

function validateForm() {
  const fields = ["name", "email", "phone", "address", "city", "state", "zip"];
  for (let f of fields) {
    if (!document.getElementById(f).value.trim()) {
      window.showToast(`Please enter your ${f}`, "error");
      return false;
    }
  }

  const paymentMethodInput = document.querySelector(
    'input[name="payment"]:checked',
  );
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "card";

  if (paymentMethod === "card") {
    const cardFields = ["cardNumber", "expiry", "cvv", "cardName"];
    for (let f of cardFields) {
      const el = document.getElementById(f);
      if (!el || !el.value.trim()) {
        window.showToast(
          `Please enter your ${f.replace(/([A-Z])/g, " $1").toLowerCase()} `,
          "error",
        );
        return false;
      }
    }
  }
  return true;
}

async function createOrder() {
  try {
    const response = await fetch(`${ORDER_API_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: selectedProduct.id,
        quantity: selectedProduct.quantity,
        size: selectedProduct.selectedSize || "Regular",
        email: document.getElementById("email").value,
        phone_number: document.getElementById("phone").value,
        shipping_address: `${document.getElementById("address").value}, ${document.getElementById("city").value}, ${document.getElementById("state").value} ${document.getElementById("zip").value}`,
      }),
    });

    if (!response.ok) throw new Error("Order creation failed");
    const order = await response.json();
    await processPayment(order.id);
  } catch (error) {
    window.showToast("Failed to place order. " + error.message, "error");
  }
}

async function createCartOrder() {
  try {
    const res = await fetch(`${window.API_BASE_URL}/cart/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const items = await res.json();

    if (items.length === 0) {
      window.showToast("Your cart is empty!", "info");
      return;
    }

    const orderPromises = items.map((item) => {
      return fetch(`${ORDER_API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size || "Regular",
          email: document.getElementById("email").value,
          phone_number: document.getElementById("phone").value,
          shipping_address: `${document.getElementById("address").value}, ${document.getElementById("city").value}, ${document.getElementById("state").value} ${document.getElementById("zip").value}`,
        }),
      }).then((r) => r.json());
    });
    const orders = await Promise.all(orderPromises);

    for (const order of orders) {
      await processPayment(order.id, true);
    }

    const orderIds = orders.map((o) => o.id).join(",");
    window.showToast("Order placed successfully! ", "success");
    localStorage.removeItem("selectedProduct");
    localStorage.removeItem("checkoutMode");
    localStorage.removeItem("cartTotal");
    window.location.href = `./tracking.html?order_id=${orderIds}`;
  } catch (err) {
    window.showToast("Error processing cart order: " + err.message, "error");
  }
}

async function processPayment(orderId, silent = false) {
  const paymentMethodInput = document.querySelector(
    'input[name="payment"]:checked',
  );
  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "card";

  try {
    const res = await fetch(`${PAYMENT_API_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        payment_method: paymentMethod,
      }),
    });

    if (!res.ok) throw new Error("Payment failed");

    if (!silent) {
      window.showToast("Order placed successfully! ", "success");
      localStorage.removeItem("selectedProduct");
      localStorage.removeItem("checkoutMode");
      localStorage.removeItem("cartTotal");
      window.location.href = `./tracking.html?order_id=${orderId}`;
    }
  } catch (err) {
    if (!silent) window.showToast("Payment processing failed.", "error");
  }
}

init();
