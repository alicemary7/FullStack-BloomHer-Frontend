// Usage: Provides a comprehensive order history and status tracking for the current user.

const ORDER_API_URL = `${window.API_BASE_URL}/orders`;
const token = localStorage.getItem("access_token");
const userId = localStorage.getItem("user_id");

const trackingContent = document.getElementById("tracking-content");

async function init() {
  if (!token || !userId) {
    window.location.href = "./login.html";
    return;
  }

  try {
    const response = await fetch(`${ORDER_API_URL}/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Could not fetch orders.");

    const orders = await response.json();
    trackingContent.style.display = "block";
    renderOrders(orders);

  } catch (err) {
    window.showToast(err.message || "Error loading orders", "error");
  }
}

function renderOrders(orders) {
  trackingContent.innerHTML = "";

  if (!orders || orders.length === 0) {
    trackingContent.innerHTML = `
      <div class="section" style="text-align: center; padding: 40px;">
        <div class="section-title">No Orders Yet</div>
        <p>You haven't placed any orders with us yet. Start shopping to see your history here!</p>
        <a href="./product.html" class="btn-support" style="margin-top: 20px;">Browse Products</a>
      </div>
    `;
    return;
  }

  orders.sort((a, b) => b.id - a.id);

  orders.forEach((order) => {
    const dateRaw = order.order_date;
    const dateFormatted = (dateRaw.includes("T") ? dateRaw : dateRaw.replace(" ", "T")) + (dateRaw.endsWith("Z") ? "" : "Z");
    const orderDate = new Date(dateFormatted).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });


    const price = order.product?.price || 0;
    const total = order.total_amount || (price * order.quantity);
    const status = (order.status || "processing").toLowerCase();

    const orderCard = document.createElement("div");
    orderCard.className = "section";
    orderCard.style.marginBottom = "30px";
    orderCard.style.border = "1px solid #ddd";

    let stepInfo = getStepInfo(status);

    orderCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        <div>
          <div style="font-weight: bold; font-size: 1.1rem; color: var(--primary);">Order #${order.id}</div>
          <div style="font-size: 0.85rem; color: #666;">Placed on ${orderDate}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: ${status === "cancelled" ? "#c23b5a" : "var(--secondary)"}; text-transform: uppercase; font-size: 0.9rem;">
            ${status}
          </div>
          <div style="font-size: 1.2rem; font-weight: bold; margin-top: 5px;">₹${total}</div>
        </div>
      </div>

      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
        <img src="${order.product?.image_url}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;">
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 1rem;">${order.product?.name || "Product info unavailable"}</div>
          <div style="font-size: 0.9rem; color: #666;">Size: ${order.size || "Regular"} | Qty: ${order.quantity}</div>
          <div style="font-size: 0.85rem; color: #888; margin-top: 4px;">Shipping to: ${order.shipping_address || "Address on profile"}</div>
        </div>
      </div>

      ${status !== "cancelled" ? `
        <div class="tracking-progress" style="margin: 20px 0 10px 0; height: 40px;">
          <div class="progress-line" style="width: ${stepInfo.progress}%; height: 4px; top: 18px;"></div>
          <div class="tracking-step ${stepInfo.step >= 1 ? "active" : ""}" style="width: 33%;">
            <div class="step-circle ${stepInfo.step >= 1 ? "active" : ""}" style="width: 30px; height: 30px; font-size: 0.8rem;">1</div>
            <div class="step-label" style="font-size: 0.75rem;">Processing</div>
          </div>
          <div class="tracking-step ${stepInfo.step >= 2 ? "active" : ""}" style="width: 33%;">
            <div class="step-circle ${stepInfo.step >= 2 ? "active" : ""}" style="width: 30px; height: 30px; font-size: 0.8rem;">2</div>
            <div class="step-label" style="font-size: 0.75rem;">Shipped</div>
          </div>
          <div class="tracking-step ${stepInfo.step >= 3 ? "active" : ""}" style="width: 33%;">
            <div class="step-circle ${stepInfo.step >= 3 ? "active" : ""}" style="width: 30px; height: 30px; font-size: 0.8rem;">3</div>
            <div class="step-label" style="font-size: 0.75rem;">Delivered</div>
          </div>
        </div>
      ` : `
        <div style="background: #fff5f5; padding: 10px; border-radius: 4px; color: #c23b5a; font-size: 0.9rem; text-align: center;">
          This order was cancelled and is no longer being processed.
        </div>
      `}
    `;

    trackingContent.appendChild(orderCard);
  });
}

function getStepInfo(status) {
  if (["processing", "pending", "paid"].includes(status)) return { step: 1, progress: 15 };
  if (status === "shipped") return { step: 2, progress: 50 };
  if (status === "delivered") return { step: 3, progress: 100 };
  return { step: 0, progress: 0 };
}

init();
