// Usage: Manages navigation bar state and role-based visibility for authenticated users.

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("user_id");
  const userRole = localStorage.getItem("role");
  const loginBtn = document.querySelector(".btn-login");
  const adminLink = document.querySelector(".btn-admin");

  if (
    userRole === "admin" &&
    !window.location.pathname.includes("admin.html")
  ) {
    const isPagesDir = window.location.pathname.includes("/pages/");
    window.location.href = isPagesDir ? "./admin.html" : "./pages/admin.html";
    return;
  }

  if (userId && loginBtn) {
    const isPagesDir = window.location.pathname.includes("/pages/");

    if (userRole === "admin") {
      loginBtn.textContent = "Dashboard";
      loginBtn.href = isPagesDir ? "./admin.html" : "./pages/admin.html";
    } else {
      loginBtn.textContent = "Profile";
      loginBtn.href = isPagesDir ? "./profile.html" : "./pages/profile.html";
    }
  }

  if (adminLink) {
    adminLink.style.display = (userRole === "admin") ? "inline-block" : "none";
  }

  const trackingLink = document.getElementById("tracking-link");
  if (trackingLink) {
    if (userId && userRole !== "admin") {
      trackingLink.parentElement.style.display = "inline-block";
    } else {
      trackingLink.parentElement.style.display = "none";
    }
  }
});

