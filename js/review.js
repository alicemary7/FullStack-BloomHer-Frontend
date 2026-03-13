const REVIEW_API_URL = `${window.API_BASE_URL}/reviews`;
const token = localStorage.getItem("access_token");
const userId = localStorage.getItem("user_id");

const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("productId");
const orderId = urlParams.get("orderId");

const productName = document.getElementById("item-name");
const productImage = document.getElementById("item-image");
const productDetails = document.getElementById("item-details");
const reviewForm = document.getElementById("review-form");
const submitBtn = document.getElementById("submit-btn");

async function init() {
    if (!token || !userId) {
        window.location.href = "./login.html";
        return;
    }

    if (!productId) {
        window.showToast("No product selected for review.", "error");
        setTimeout(() => window.location.href = "./tracking.html", 2000);
        return;
    }

    await fetchProductDetails();
}

async function fetchProductDetails() {
    try {
        const response = await fetch(`${window.API_BASE_URL}/products/${productId}`);
        if (!response.ok) throw new Error("Failed to load product info");
        
        const product = await response.json();
        productName.textContent = product.name;
        productImage.src = product.image_url;
        productImage.alt = product.name;
        
        // Show some context if orderId is present (optional)
        if (orderId) {
            productDetails.textContent = `Reviewing item from Order #${orderId}`;
        } else {
            productDetails.textContent = "Tell us what you think!";
        }
    } catch (err) {
        console.error(err);
        window.showToast("Error loading product details", "error");
    }
}

reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    if (!ratingInput) {
        window.showToast("Please select a rating", "error");
        return;
    }
    
    const rating = parseInt(ratingInput.value);
    const comment = document.getElementById("comment").value.trim();
    
    if (comment.length < 10) {
        window.showToast("Please write a bit more (at least 10 characters).", "info");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
        const response = await fetch(`${REVIEW_API_URL}/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: parseInt(productId),
                rating: rating,
                comment: comment
            })
        });

        if (response.ok) {
            window.showToast("Thank you for your review!", "success");
            setTimeout(() => {
                window.location.href = `./product_detail.html?id=${productId}`;
            }, 2000);
        } else {
            const error = await response.json();
            throw new Error(error.detail || "Failed to submit review");
        }
    } catch (err) {
        window.showToast(err.message, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Review";
    }
});

init();
