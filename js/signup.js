const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("fullname").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;
  const terms = document.getElementById("terms").checked;

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
