// Usage: Manages the detailed view of a single product, including features, size selection, and cart/buy actions.

const CART_API_URL = `${window.API_BASE_URL}/cart`;
const PRODUCT_API_URL = `${window.API_BASE_URL}/products`;

const userId = localStorage.getItem("user_id");
const token = localStorage.getItem("access_token");

const urlParams = new URLSearchParams(window.location.search);
let productId = urlParams.get("id") || document.body.dataset.productId;

const productName = document.getElementById("productName");
const productImage = document.getElementById("productImage");
const productPrice = document.getElementById("productPrice");
const productDescription = document.getElementById("productDescription");
const featuresBox = document.getElementById("featuresBox");
const quantityInput = document.getElementById("productQuantity");
const addToCartBtn = document.getElementById("addToCartBtn");
const buyNowBtn = document.getElementById("buyNowBtn");

const loadingContent = document.getElementById("loadingContent");
const productContent = document.getElementById("productContent");

let baseProductPrice = 0;
let isOutOfStock = false;

function applyOutOfStockUI() {
  // Dim the product image
  if (productImage) {
    productImage.style.opacity = "0.5";
    productImage.style.filter = "grayscale(40%)";
  }

  // Insert badge near price
  const priceEl = document.getElementById("productPrice");
  if (priceEl && !document.getElementById("outOfStockBadge")) {
    const badge = document.createElement("div");
    badge.id = "outOfStockBadge";
    badge.textContent = "OUT OF STOCK";
    badge.style.cssText = [
      "display:inline-block",
      "background:#c0392b",
      "color:#fff",
      "font-size:0.75rem",
      "font-weight:700",
      "padding:5px 14px",
      "border-radius:20px",
      "letter-spacing:0.5px",
      "margin-top:10px",
    ].join(";");
    priceEl.insertAdjacentElement("afterend", badge);
  }

  // Disable quantity input
  if (quantityInput) {
    quantityInput.disabled = true;
    quantityInput.style.opacity = "0.5";
  }

  // Disable size radios
  document.querySelectorAll('input[name="size"]').forEach(r => {
    r.disabled = true;
  });

  // Disable and style action buttons
  const disabledStyle = [
    "background:#ccc",
    "color:#777",
    "cursor:not-allowed",
    "border:none",
    "opacity:0.75",
  ].join(";");

  if (addToCartBtn) {
    addToCartBtn.disabled = true;
    addToCartBtn.textContent = "Out of Stock";
    addToCartBtn.style.cssText = disabledStyle;
  }
  if (buyNowBtn) {
    buyNowBtn.disabled = true;
    buyNowBtn.textContent = "Out of Stock";
    buyNowBtn.style.cssText = disabledStyle;
  }
}

function updatePriceBySize() {
  const selectedSize =
    document.querySelector('input[name="size"]:checked')?.value || "Regular";
  let multiplier = 1.0;

  if (selectedSize === "Small")
    multiplier = 0.9;
  else if (selectedSize === "Regular")
    multiplier = 1.0;
  else if (selectedSize === "Large")
    multiplier = 1.1;
  else if (selectedSize === "XL") multiplier = 1.2;

  const calculatedPrice = Math.round(baseProductPrice * multiplier);
  if (productPrice) productPrice.textContent = `₹${calculatedPrice}`;
}

async function fetchProductDetails() {
  if (!productId) {
    if (loadingContent)
      loadingContent.textContent = "Error: No product ID provided.";
    return;
  }

  try {
    const res = await fetch(`${PRODUCT_API_URL}/${productId}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error("Product not found");
      throw new Error("Failed to fetch product details");
    }
    const product = await res.json();

    if (productName) productName.textContent = product.name;
    if (productImage) {
      productImage.src = product.image_url;
      productImage.alt = product.name;
    }

    if (productPrice) {
      baseProductPrice = product.price;
      updatePriceBySize();
    }

    if (productDescription)
      productDescription.textContent = product.description;

    const starSpan = document.querySelector(".rating .stars");
    if (starSpan) {
      const rating = product.rating || 0;
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5 ? 1 : 0;
      const emptyStars = 5 - fullStars - halfStar;
      starSpan.innerHTML =
        '<i class="fas fa-star"></i>'.repeat(fullStars) + (halfStar ? '<i class="fas fa-star-half-alt"></i>' : "") + '<i class="far fa-star"></i>'.repeat(emptyStars);
    }

    if (featuresBox) {
      let featuresHtml = '<h2 class="features-title">Key Features</h2>';
      let features = [];

      if (Array.isArray(product.features)) {
        features = product.features;
      } else if (
        typeof product.features === "string" &&
        product.features.trim() !== ""
      ) {
        features = product.features
          .split(/\r?\n|,/)
          .map((f) => f.trim())
          .filter((f) => f !== "");
      }

      if (features.length === 0) {
        features = [
          "100% Certified Organic Cotton",
          "Breathable & Chemical-Free",
          "Ultra-Absorbent Core",
          "Eco-friendly & Biodegradable",
        ];
      }

      features.forEach((f) => {
        featuresHtml += `<div class="feature-item"><span class="checkmark"><i class="fas fa-check"></i></span><span>${f}</span></div>`;
      });
      featuresBox.innerHTML = featuresHtml;
    }

    // Stock check — apply out-of-stock UI if needed
    if (product.stock <= 0) {
      isOutOfStock = true;
      applyOutOfStockUI();
    }

    if (loadingContent) loadingContent.style.display = "none";
    if (productContent) productContent.style.display = "block";

    // Fetch and Display Reviews
    fetchAndDisplayReviews();

  } catch (err) {
    if (loadingContent) {
      loadingContent.style.color = "red";
      loadingContent.textContent = "Error: " + err.message;
    }
  }
}

async function fetchAndDisplayReviews() {
  const reviewsList = document.getElementById("reviewsList");
  const reviewCount = document.getElementById("reviewCount");
  
  try {
    const response = await fetch(`${window.API_BASE_URL}/reviews/product/${productId}`);
    if (!response.ok) throw new Error("Could not fetch reviews");
    
    const reviews = await response.json();
    if (reviewCount) reviewCount.textContent = `(${reviews.length} reviews)`;
    
    if (reviews.length === 0) {
      reviewsList.innerHTML = '<p style="color: #888; font-style: italic;">No reviews yet. Be the first to review!</p>';
      return;
    }

    // Sort by newest first
    reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    reviewsList.innerHTML = reviews.map(review => `
      <div style="margin-bottom: 2rem; border-bottom: 1px solid #f5f5f5; padding-bottom: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <div style="font-weight: 600; color: #333;">Customer</div>
          <div style="color: #ffc107; font-size: 0.9rem;">
            ${'<i class="fas fa-star"></i>'.repeat(review.rating)}${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
          </div>
        </div>
        <p style="color: #555; line-height: 1.6; margin: 0;">${review.comment}</p>
        <div style="font-size: 0.75rem; color: #999; margin-top: 0.8rem;">
          ${new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error("Reviews error:", err);
    if (reviewsList) reviewsList.innerHTML = '<p style="color: #888;">Unable to load reviews.</p>';
  }
}

async function addToCart() {
  if (isOutOfStock) {
    window.showToast("Sorry, this product is currently out of stock.", "error");
    return;
  }
  if (!userId) {
    window.showToast("Please login first!", "info");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);
    return;
  }

  let quantity = parseInt(quantityInput.value);
  if (isNaN(quantity) || quantity <= 0) {
    window.showToast("Please enter a valid quantity", "error");
    return;
  }
  if (quantity >= 99) {
    quantity = 98;
    quantityInput.value = 98;
    window.showToast("Maximum quantity is 98", "info");
  }

  const selectedSize =
    document.querySelector('input[name="size"]:checked')?.value || "Regular";

  try {
    const response = await fetch(`${CART_API_URL}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: parseInt(productId),
        quantity,
        size: selectedSize,
      }),
    });

    if (response.ok) {
      window.showToast("Added to cart successfully!", "success");
    } else if (response.status === 401) {
      window.showToast("Session expired. Please login again.", "error");
      setTimeout(() => {
        window.location.href = "./login.html";
      }, 1500);
    } else {
      const errorData = await response.json();
      window.showToast("Failed to add to cart: " + (errorData.detail || "Unknown error"), "error");
    }
  } catch (error) {
    window.showToast("Server error. Could not add to cart.", "error");
  }
}

async function buyNow() {
  if (isOutOfStock) {
    window.showToast("Sorry, this product is currently out of stock.", "error");
    return;
  }
  if (!userId) {
    window.showToast("Please login first!", "info");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);
    return;
  }

  let quantity =
    (parseInt(quantityInput.value) || 1) >= 99
      ? 98
      : parseInt(quantityInput.value) || 1;
  const selectedSize =
    document.querySelector('input[name="size"]:checked')?.value || "Regular";

  let multiplier = 1.0;
  if (selectedSize === "Small") multiplier = 0.9;
  else if (selectedSize === "Regular") multiplier = 1.0;
  else if (selectedSize === "Large") multiplier = 1.1;
  else if (selectedSize === "XL") multiplier = 1.2;
  const currentPrice = Math.round(baseProductPrice * multiplier);

  const productData = {
    id: productId,
    name: productName.textContent,
    image: productImage.src,
    selectedSize,
    quantity,
    price: currentPrice,
  };

  localStorage.setItem("selectedProduct", JSON.stringify(productData));
  localStorage.removeItem("checkoutMode");
  localStorage.removeItem("cartTotal");
  window.location.href = "./address.html";
}

document.addEventListener("DOMContentLoaded", () => {
  fetchProductDetails();

  if (addToCartBtn)
    addToCartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart();
    });

  if (buyNowBtn)
    buyNowBtn.addEventListener("click", (e) => {
      e.preventDefault();
      buyNow();
    });

  const sizeRadios = document.querySelectorAll('input[name="size"]');
  sizeRadios.forEach((radio) => {
    radio.addEventListener("change", updatePriceBySize);
  });
});

