// Usage: Provides order tracking functionality and status visualization.

const ORDER_API_URL = `${window.API_BASE_URL}/orders`;
const token = localStorage.getItem("access_token");

const orderIdInput = document.getElementById("order-id-input");
const searchBtn = document.getElementById("search-btn");
const trackingContent = document.getElementById("tracking-content");
const displayOrderId = document.getElementById("display-order-id");
const trackingItemsListEl = document.getElementById("tracking-items-list");
const orderSubtotalEl = document.getElementById("order-subtotal");
const orderTotalEl = document.getElementById("order-total");
const trackingStatusEl = document.getElementById("tracking-status");
const deliveryDateEl = document.getElementById("delivery-date");
const orderShippingEl = document.getElementById("order-shipping");
const trackingTitleEl = document.getElementById("tracking-title");

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");
const progressLine = document.getElementById("progress-line");

let animationInterval = null;

function animateProgressBar(targetWidth) {
  if (animationInterval) cancelAnimationFrame(animationInterval);
  const startWidth = parseFloat(progressLine.style.width) || 0;
  const endurance = 800;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / endurance, 1);
    const currentWidth = startWidth + (targetWidth - startWidth) * progress;
    progressLine.style.width = currentWidth + "%";
    if (progress < 1) animationInterval = requestAnimationFrame(step);
  }
  animationInterval = requestAnimationFrame(step);
}

function init() {
  if (!token) {
    window.location.href = "./login.html";
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const orderIdParam = urlParams.get("order_id");

  if (orderIdParam) {
    orderIdInput.value = orderIdParam;
    handleSearch();
  }
}

async function handleSearch() {
  const orderIds = orderIdInput.value.trim();
  if (!orderIds) {
    window.showToast("Please enter an Order ID", "error");
    return;
  }

  searchBtn.textContent = "Searching...";
  searchBtn.disabled = true;

  try {
    const ids = orderIds.split(",").map((id) => id.trim());
    const promises = ids.map((id) =>
      fetch(`${ORDER_API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        if (!res.ok) throw new Error(`Order #${id} not found`);
        return res.json();
      }),
    );

    const orders = await Promise.all(promises);

    trackingContent.style.display = "block";

    const date = new Date(orders[0].order_date || Date.now());
    const orderDateStr = date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    displayOrderId.innerHTML =
      (ids.length > 1
        ? `Order IDs: #${ids.join(", #")}`
        : `Order ID: #${ids[0]}`) +
      `<br><small style="color: #666; font-weight: normal;">Ordered on: ${orderDateStr}</small>`;

    renderOrdersSummary(orders);

    trackingContent.scrollIntoView({ behavior: "smooth" });
    window.showToast(err.message || "Error tracking order", "error");
    trackingContent.style.display = "none";
  } finally {
    searchBtn.textContent = "Track";
    searchBtn.disabled = false;
  }
}

function renderOrdersSummary(orders) {
  trackingItemsListEl.innerHTML = "";
  let subtotal = 0;
  let totalAmount = 0;

  orders.forEach((order) => {
    const itemSubtotal = (order.product?.price || 0) * order.quantity;
    subtotal += itemSubtotal;
    totalAmount += order.total_amount;

    const itemEl = document.createElement("div");
    itemEl.className = "order-summary";
    itemEl.style.padding = "10px 0";
    itemEl.innerHTML = `
      <div>
        <div style="font-weight: 600; color: var(--primary);">${order.product?.name || "Product info unavailable"}</div>
        <div style="font-size: 0.85rem; color: #666;">Size: ${order.size || "Regular"} | Qty: ${order.quantity}</div>
      </div>
      <div style="font-weight: 600;">₹${itemSubtotal}</div>
    `;
    trackingItemsListEl.appendChild(itemEl);
  });

  const shipping = Math.max(0, totalAmount - subtotal);
  orderSubtotalEl.textContent = subtotal.toFixed(2);
  orderShippingEl.textContent =
    shipping < 0.01 ? "FREE" : `₹${shipping.toFixed(2)}`;
  orderTotalEl.textContent = totalAmount.toFixed(2);

  updateTrackingUI(orders[0].status);

  const date = new Date(orders[0].order_date || Date.now());
  date.setDate(date.getDate() + 5);
  deliveryDateEl.textContent = date.toDateString();
}

function updateTrackingUI(status) {
  const steps = [step1, step2, step3];
  steps.forEach((s) => {
    s.classList.remove("active");
    s.parentElement.classList.remove("active");
  });

  const currentStatus = (status || "processing").toLowerCase();

  if (["processing", "pending", "paid"].includes(currentStatus)) {
    step1.classList.add("active");
    trackingStatusEl.textContent = "Your order is being processed.";
    trackingTitleEl.textContent = "Order Confirmed!";
    animateProgressBar(15);
  }
  else if (currentStatus === "shipped") {
    step1.classList.add("active");
    step2.classList.add("active");
    trackingStatusEl.textContent = "Your order has been shipped!";
    trackingTitleEl.textContent = "On its Way!";
    animateProgressBar(50);
  }
  else if (currentStatus === "delivered") {
    steps.forEach((s) => s.classList.add("active"));
    trackingStatusEl.textContent = "Your order has been delivered!";
    trackingTitleEl.textContent = "Order Delivered!";
    animateProgressBar(100);
  }
  else if (currentStatus === "cancelled") {
    trackingStatusEl.textContent = "This order has been cancelled.";
    trackingStatusEl.style.color = "#c23b5a";
    trackingTitleEl.textContent = "Order Cancelled";
    animateProgressBar(0);
  }
}

searchBtn.addEventListener("click", handleSearch);
orderIdInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSearch();
});

init();

