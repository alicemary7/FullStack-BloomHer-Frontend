// Usage: Handles admin dashboard, product management, user listing, and order status updates.

const userRole = localStorage.getItem("role");
const token = localStorage.getItem("access_token");

if (userRole !== "admin") {
  window.showToast("Access Denied! Admins only.", "error");
  setTimeout(() => {
    window.location.href = "../index.html";
  }, 2000);
}

const BASE_URL = window.API_BASE_URL;

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".content-section");

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      menuItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      sections.forEach((section) => {
        section.style.display = "none";
        section.classList.remove("active");
      });

      const sectionId = item.getAttribute("data-section");
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.style.display = "block";
        setTimeout(() => targetSection.classList.add("active"), 10);

        if (sectionId === "products") fetchProducts();
        if (sectionId === "users") fetchUsers();
        if (sectionId === "orders") fetchOrders();
        if (sectionId === "contacts") fetchContacts();
        if (sectionId === "dashboard") refreshDashboard();
      }
    });
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (await window.customConfirm("Are you sure you want to logout?")) {
        localStorage.clear();
        window.location.href = "./login.html";
      }
    });
  }

  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
    addProductForm.addEventListener("submit", handleAddProduct);
  }

  refreshDashboard();
});

function toggleProductForm() {
  const container = document.getElementById("addProductFormContainer");
  container.style.display =
    container.style.display === "none" ? "block" : "none";
}

function openAddProductForm() {
  const container = document.getElementById("addProductFormContainer");
  document.getElementById("formTitle").innerText = "Add New Product";
  document.getElementById("addProductForm").reset();
  document.getElementById("p_id").value = "";
  document.getElementById("p_features").value = "";
  container.style.display = "block";
}

async function fetchProducts() {
  try {
    const response = await fetch(`${BASE_URL}/products/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = await response.json();
    const body = document.getElementById("productsBody");
    body.innerHTML = "";

    products.forEach((p) => {
      body.innerHTML += `
                <tr>
                    <td><img src="${p.image_url}" width="50" style="border-radius: 5px;"></td>
                    <td>${p.name}</td>
                    <td>₹${p.price}</td>
                    <td>${p.stock}</td>
                    <td>
                        <button class="status processing" style="border:none; cursor:pointer;" onclick="editProduct(${p.id})">Edit</button>
                        <button class="status pending" style="border:none; cursor:pointer;" onclick="deleteProduct(${p.id})">Deactivate</button>
                    </td>
                </tr>
            `;
    });
  } catch (err) { }
}

async function fetchUsers() {
  try {
    const response = await fetch(`${BASE_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await response.json();
    const body = document.getElementById("usersBody");
    body.innerHTML = "";

    users.forEach((u) => {
      body.innerHTML += `
                <tr>
                    <td>#${u.id}</td>
                    <td>${u.name}</td>
                    <td>${u.email}</td>
                    <td><span class="badge" style="background:${u.role === "admin" ? "#ffe2e5" : "#f0f0f0"}">${u.role}</span></td>
                </tr>
            `;
    });
  } catch (err) { }
}

async function fetchContacts() {
  try {
    const response = await fetch(`${BASE_URL}/contacts/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const contacts = await response.json();
    const body = document.getElementById("contactsBody");
    body.innerHTML = "";

    contacts.forEach((c) => {
      const contactDate = new Date(c.created_at).toLocaleDateString("en-GB");
      body.innerHTML += `
                <tr>
                    <td>${contactDate}</td>
                    <td>${c.name}</td>
                    <td><a href="mailto:${c.email}">${c.email}</a></td>
                    <td>${c.subject}</td>
                    <td style="max-width: 300px; white-space: normal;">${c.message}</td>
                </tr>
            `;
    });
  } catch (err) { }
}

async function fetchOrders() {
  try {
    const response = await fetch(`${BASE_URL}/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await response.json();
    const body = document.getElementById("ordersBody");
    body.innerHTML = "";

    orders.forEach((o) => {
      const orderDate = new Date(o.order_date).toLocaleDateString("en-GB");
      const customerName = o.user ? o.user.name : `User #${o.user_id}`;
      const email = o.email || (o.user ? o.user.email : "N/A");
      const phone = o.phone_number || "N/A";
      const address = o.shipping_address || "N/A";
      const productName = o.product ? o.product.name : `Product #${o.product_id}`;

      body.innerHTML += `
                <tr>
                    <td>${customerName}</td>
                    <td>${email}</td>
                    <td>${phone}</td>
                    <td>${address}</td>
                    <td>${productName}</td>
                    <td>₹${o.total_amount}</td>
                    <td>${orderDate}</td>
                    <td>
                        <select onchange="updateOrderStatus(${o.id}, this.value)" class="status-select ${o.status}">
                            <option value="processing" ${o.status === "processing" ? "selected" : ""}>Processing</option>
                            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Shipped</option>
                            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
                            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                        </select>
                    </td>
                </tr>
            `;
    });
  } catch (err) { }
}

async function refreshDashboard() {
  try {
    const orderRes = await fetch(`${BASE_URL}/orders/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const orders = await orderRes.json();

    const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0);
    document.getElementById("stat-total-sales").innerText =
      `₹${totalSales.toLocaleString()}`;
    document.getElementById("stat-total-orders").innerText = orders.length;

    const productRes = await fetch(`${BASE_URL}/products/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const products = await productRes.json();
    document.getElementById("stat-total-products").innerText = products.length;

    const userRes = await fetch(`${BASE_URL}/users/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const users = await userRes.json();
    document.getElementById("stat-total-users").innerText = users.length;

    const recentOrdersBody = document.getElementById(
      "dashboardRecentOrdersBody",
    );
    if (recentOrdersBody) {
      recentOrdersBody.innerHTML = "";
      orders
        .sort((a, b) => b.id - a.id)
        .slice(0, 5)
        .forEach((o) => {
          const orderDate = new Date(o.order_date).toLocaleDateString();
          recentOrdersBody.innerHTML += `
                    <tr>
                        <td>#${o.id} <br><small style="color:#666">${orderDate}</small></td>
                        <td>${o.user ? o.user.name : `User #${o.user_id}`}</td>
                        <td>${o.product ? o.product.name : `Product #${o.product_id}`}</td>
                        <td>₹${o.total_amount}</td>
                        <td>
                          <select onchange="updateOrderStatus(${o.id}, this.value)" class="status-select ${o.status}">
                            <option value="processing" ${o.status === "processing" ? "selected" : ""}>Processing</option>
                            <option value="shipped" ${o.status === "shipped" ? "selected" : ""}>Shipped</option>
                            <option value="delivered" ${o.status === "delivered" ? "selected" : ""}>Delivered</option>
                            <option value="cancelled" ${o.status === "cancelled" ? "selected" : ""}>Cancelled</option>
                          </select>
                        </td>
                    </tr>
                `;
        });
    }
  } catch (err) { }
}

async function handleAddProduct(e) {
  e.preventDefault();

  const pId = document.getElementById("p_id").value;
  const name = document.getElementById("p_name").value.trim();
  const description = document.getElementById("p_desc").value.trim();
  const price = parseFloat(document.getElementById("p_price").value);
  const stock = parseInt(document.getElementById("p_stock").value);
  const image_url = document.getElementById("p_image").value.trim();
  const features = document.getElementById("p_features").value.trim();

  if (!name || !description || isNaN(price) || isNaN(stock) || !image_url) {
    window.showToast("Please fill in all mandatory fields correctly", "error");
    return;
  }

  if (price <= 0) {
    window.showToast("Price must be greater than zero", "error");
    return;
  }

  if (stock < 0) {
    window.showToast("Stock cannot be negative", "error");
    return;
  }

  const payload = {
    name,
    description,
    price,
    stock,
    image_url,
    features,
  };

  const method = pId ? "PUT" : "POST";
  const url = pId ? `${BASE_URL}/products/${pId}` : `${BASE_URL}/products/`;

  try {
    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      window.showToast(`Product ${pId ? "updated" : "added"} successfully!`, "success");
      document.getElementById("addProductForm").reset();
      toggleProductForm();
      fetchProducts();
    } else {
      const error = await response.json();
      window.showToast(
        `Failed to ${pId ? "update" : "add"} product: ` +
        (error.detail || "Unknown error"),
        "error"
      );
    }
  } catch (err) {
    window.showToast("Server connection error!", "error");
  }
}

async function editProduct(id) {
  try {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const p = await response.json();

    document.getElementById("p_id").value = p.id;
    document.getElementById("p_name").value = p.name;
    document.getElementById("p_price").value = p.price;
    document.getElementById("p_stock").value = p.stock;
    document.getElementById("p_image").value = p.image_url;
    document.getElementById("p_desc").value = p.description;
    document.getElementById("p_features").value = p.features || "";

    document.getElementById("formTitle").innerText = "Edit Product";
    document.getElementById("addProductFormContainer").style.display = "block";

    document
      .getElementById("addProductFormContainer")
      .scrollIntoView({ behavior: "smooth" });
  } catch (err) { }
}

async function deleteProduct(id) {
  if (!(await window.customConfirm("Are you sure you want to deactivate this product?"))) return;

  try {
    const response = await fetch(`${BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      fetchProducts();
    }
  } catch (err) { }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(
      `${BASE_URL}/orders/${orderId}/status?new_status=${newStatus}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (response.ok) {
      window.showToast(`Order #${orderId} status updated to ${newStatus}`, "success");
      fetchOrders();
      refreshDashboard();
    } else {
      const error = await response.json();
      window.showToast("Failed to update status: " + (error.detail || "Unknown error"), "error");
    }
  } catch (err) {
    window.showToast("Server connection error!", "error");
  }
}

