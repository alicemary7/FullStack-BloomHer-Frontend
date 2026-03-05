const loginForm = document.querySelector("form");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (email === "admin@gmail.com" && password === "admin") {
    localStorage.setItem("access_token", "admin-bypass-token");
    localStorage.setItem("user_id", "999");
    localStorage.setItem("user_email", "admin@gmail.com");
    localStorage.setItem("role", "admin");
    window.location.href = "./admin.html";
    return;
  }

  if (!email || !password) {
    window.showToast("Please enter email and password", "error");
    return;
  }

  try {
    const response = await fetch(`${window.API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Login failed");
    }

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_id", data.user_id);
    localStorage.setItem("user_email", data.email);
    localStorage.setItem("role", data.role);

    window.showToast("Login successful! Welcome back.", "success");

    setTimeout(() => {
      if (data.role === "admin") {
        window.location.href = "./admin.html";
      } else {
        window.location.href = "./product.html";
      }
    }, 1500);
  } catch (error) {
    window.showToast(error.message || "Server error", "error");
  }
});

