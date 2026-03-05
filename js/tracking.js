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
    const orderDateObj = new Date(dateFormatted);
    const orderDateStr = orderDateObj.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });

    const estDeliveryDate = new Date(orderDateObj);
    estDeliveryDate.setDate(estDeliveryDate.getDate() + 5);
    const deliveryDateStr = estDeliveryDate.toLocaleString("en-IN", { dateStyle: "medium" });

    const price = order.product?.price || 0;
    const total = order.total_amount || (price * order.quantity);
    const status = (order.status || "processing").toLowerCase();

    const orderCard = document.createElement("div");
    orderCard.className = "section";
    orderCard.style.marginBottom = "30px";
    orderCard.style.border = "1px solid #ddd";

    let stepInfo = getStepInfo(status);

    orderCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 12px;">
        <div>
          <div style="font-weight: bold; font-size: 1.15rem; color: var(--primary);">Order #${order.id}</div>
          <div style="font-size: 0.85rem; color: #666; margin-top: 4px;">Placed on ${orderDateStr}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; color: ${status === "cancelled" ? "#c23b5a" : "var(--secondary)"}; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;">
            ${status}
          </div>
          <div style="font-size: 1.25rem; font-weight: 800; margin-top: 6px; color: var(--dark);">₹${total}</div>
        </div>
      </div>

      <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 25px;">
        <img src="${order.product?.image_url}" style="width: 90px; height: 90px; object-fit: cover; border-radius: 10px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <div style="flex: 1;">
          <div style="font-weight: 600; font-size: 1.05rem; color: var(--dark);">${order.product?.name || "Product info unavailable"}</div>
          <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">Size: ${order.size || "Regular"} | Qty: ${order.quantity}</div>
          <div style="font-size: 0.85rem; color: #888; margin-top: 6px; display: flex; align-items: flex-start; gap: 4px;">
            <svg style="width: 14px; height: 14px; margin-top: 2px;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            <span>${order.shipping_address || "Address on profile"}</span>
          </div>
        </div>
      </div>

      ${status !== "cancelled" ? `
        <div class="tracking-progress-container" style="margin: 30px 10px 40px 10px;">
          <div style="position: relative; height: 4px; background: #eee; border-radius: 4px;">
            <div class="progress-line" style="position: absolute; top: 0; left: 0; height: 100%; background: var(--secondary); border-radius: 4px; width: ${stepInfo.progress}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            
            <div style="position: absolute; top: -13px; left: 0; right: 0; display: flex; justify-content: space-between; pointer-events: none;">
              <div style="display: flex; flex-direction: column; align-items: center; width: 60px; margin-left: -30px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${stepInfo.step >= 1 ? "var(--secondary)" : "#eee"}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 2;">1</div>
                <div style="font-size: 0.75rem; margin-top: 8px; color: ${stepInfo.step >= 1 ? "var(--secondary)" : "#888"}; font-weight: ${stepInfo.step >= 1 ? "600" : "400"}; white-space: nowrap;">Processing</div>
              </div>
              
              <div style="display: flex; flex-direction: column; align-items: center; width: 60px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${stepInfo.step >= 2 ? "var(--secondary)" : "#eee"}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 2;">2</div>
                <div style="font-size: 0.75rem; margin-top: 8px; color: ${stepInfo.step >= 2 ? "var(--secondary)" : "#888"}; font-weight: ${stepInfo.step >= 2 ? "600" : "400"}; white-space: nowrap;">Shipped</div>
              </div>
              
              <div style="display: flex; flex-direction: column; align-items: center; width: 60px; margin-right: -30px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${stepInfo.step >= 3 ? "var(--secondary)" : "#eee"}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); z-index: 2;">3</div>
                <div style="font-size: 0.75rem; margin-top: 8px; color: ${stepInfo.step >= 3 ? "var(--secondary)" : "#888"}; font-weight: ${stepInfo.step >= 3 ? "600" : "400"}; white-space: nowrap;">Delivered</div>
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top: 15px; padding: 12px; background: #f8fbff; border-radius: 8px; border-left: 3px solid #3b82f6; font-size: 0.85rem; color: #1e40af;">
          <strong>Estimated Delivery:</strong> ${deliveryDateStr}
        </div>
      ` : `
        <div style="background: #fff5f5; padding: 12px; border-radius: 8px; color: #c23b5a; font-size: 0.9rem; text-align: center; border: 1px dashed #feb2b2;">
          <strong style="display: block; margin-bottom: 2px;">Order Cancelled</strong>
          This order is no longer being processed.
        </div>
      `}
    `;

    trackingContent.appendChild(orderCard);
  });
}

function getStepInfo(status) {
  if (["processing", "pending", "paid"].includes(status)) return { step: 1, progress: 0 };
  if (status === "shipped") return { step: 2, progress: 50 };
  if (status === "delivered") return { step: 3, progress: 100 };
  return { step: 0, progress: 0 };
}

init();

