const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const terms = document.getElementById("terms").checked;

  if (!name || !email || !password || !confirmPassword) {
    window.showToast("Please fill in all fields", "error");
    return;
  }

  // Name validation
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  if (!nameRegex.test(name)) {
    window.showToast("Please enter a valid name (at least 2 characters)", "error");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    window.showToast("Please enter a valid email address", "error");
    return;
  }

  // Password length validation
  if (password.length < 6) {
    window.showToast("Password must be at least 6 characters long", "error");
    return;
  }

  if (password !== confirmPassword) {
    window.showToast("Passwords don't match", "error");
    return;
  }

  if (!terms) {
    window.showToast("Please accept the Terms & Conditions", "error");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/users/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Signup failed");
    }

    window.showToast("Signup successful! Redirecting to login...", "success");
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    window.showToast(error.message || "Server error", "error");
  }
});

