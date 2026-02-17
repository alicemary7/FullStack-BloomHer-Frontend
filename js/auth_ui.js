// Usage: Manages navigation bar state and role-based visibility for authenticated users.

// Wait for the page to finish loading before doing anything
document.addEventListener("DOMContentLoaded", () => {
  // Check if there is a logged-in user ID in the browser's memory
  const userId = localStorage.getItem("user_id");
  // Check what role the user has (admin or user)
  const userRole = localStorage.getItem("role");
  // Find the login button in the navigation bar
  const loginBtn = document.querySelector(".btn-login");
  // Find the admin link in the navigation bar (if it exists)
  const adminLink = document.querySelector(".btn-admin");

  // If the user is an admin, make sure they stay on the admin page
  if (
    userRole === "admin" &&
    !window.location.pathname.includes("admin.html")
  ) {
    // Figure out where the admin page is (one folder up or same folder)
    const isPagesDir = window.location.pathname.includes("/pages/");
    // Send them to the admin dashboard
    window.location.href = isPagesDir ? "./admin.html" : "./pages/admin.html";
    return; // Stop here
  }

  // Change the "Login" button if someone is logged in
  if (userId && loginBtn) {
    const isPagesDir = window.location.pathname.includes("/pages/");

    // If it's an admin, change button to say "Dashboard"
    if (userRole === "admin") {
      loginBtn.textContent = "Dashboard";
      loginBtn.href = isPagesDir ? "./admin.html" : "./pages/admin.html";
    } else {
      // If it's a regular user, change button to say "Profile"
      loginBtn.textContent = "Profile";
      loginBtn.href = isPagesDir ? "./profile.html" : "./pages/profile.html";
    }
  }

  // Show or hide the Admin button based on the user's role
  if (adminLink) {
    // Only show it if the role is "admin"
    adminLink.style.display = (userRole === "admin") ? "inline-block" : "none";
  }

  // Show or hide the "MY ORDERS" link
  const trackingLink = document.getElementById("tracking-link");
  if (trackingLink) {
    // Only show it for logged-in regular users (admins don't track orders)
    if (userId && userRole !== "admin") {
      trackingLink.parentElement.style.display = "inline-block";
    } else {
      // Otherwise keep it hidden
      trackingLink.parentElement.style.display = "none";
    }
  }
});
