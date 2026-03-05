window.API_BASE_URL = "https://fullstack-bloomher-backend.onrender.com";

function injectGlobalStyles() {
    if (document.getElementById("bloomher-global-styles")) return;

    const styles = `
        #toast-container {
            position: fixed;
            top: 85px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .toast {
            background: #fff;
            color: #1a1a1a;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 300px;
            max-width: 450px;
            transform: translateX(120%);
            transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            border-left: 5px solid #c41e3a;
            font-weight: 500;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .toast.show {
            transform: translateX(0);
        }
        .toast.success { border-left-color: #28a745; }
        .toast.error { border-left-color: #dc3545; }
        .toast.info { border-left-color: #17a2b8; }
        .toast-icon { font-size: 20px; }

        #custom-confirm-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .confirm-box {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            max-width: 400px;
            width: 90%;
            text-align: center;
            animation: modalIn 0.3s ease-out;
        }
        @keyframes modalIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .confirm-box h3 { margin-bottom: 15px; color: #1a1a1a; }
        .confirm-box p { margin-bottom: 25px; color: #666; }
        .confirm-buttons { display: flex; gap: 15px; justify-content: center; }
        .btn-confirm-yes, .btn-confirm-no {
            padding: 10px 25px;
            border-radius: 25px;
            border: none;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
        }
        .btn-confirm-yes { background: #c41e3a; color: white; }
        .btn-confirm-no { background: #f0f0f0; color: #666; }
        .btn-confirm-yes:hover { background: #a01729; }
        .btn-confirm-no:hover { background: #e0e0e0; }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.id = "bloomher-global-styles";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}

function createToastContainer() {
    if (!document.getElementById("toast-container")) {
        injectGlobalStyles();
        const container = document.createElement("div");
        container.id = "toast-container";
        if (document.body) {
            document.body.appendChild(container);
        } else {
            document.addEventListener("DOMContentLoaded", () => {
                document.body.appendChild(container);
            });
        }
    }
}

window.showToast = function (message, type = "info") {
    createToastContainer();
    const container = document.getElementById("toast-container");

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);

    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

function createConfirmModal() {
    if (!document.getElementById("custom-confirm-modal")) {
        injectGlobalStyles();
        const modal = document.createElement("div");
        modal.id = "custom-confirm-modal";
        modal.innerHTML = `
            <div class="confirm-box">
                <h3 id="confirm-title">Confirm</h3>
                <p id="confirm-message">Are you sure?</p>
                <div class="confirm-buttons">
                    <button class="btn-confirm-no" id="confirm-no">No</button>
                    <button class="btn-confirm-yes" id="confirm-yes">Yes</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

window.customConfirm = function (message, title = "Confirm") {
    return new Promise((resolve) => {
        createConfirmModal();
        const modal = document.getElementById("custom-confirm-modal");
        const msgEl = document.getElementById("confirm-message");
        const titleEl = document.getElementById("confirm-title");
        const yesBtn = document.getElementById("confirm-yes");
        const noBtn = document.getElementById("confirm-no");

        msgEl.textContent = message;
        titleEl.textContent = title;
        modal.style.display = "flex";

        const handleResponse = (result) => {
            modal.style.display = "none";
            yesBtn.removeEventListener("click", onYes);
            noBtn.removeEventListener("click", onNo);
            resolve(result);
        };

        const onYes = () => handleResponse(true);
        const onNo = () => handleResponse(false);

        yesBtn.addEventListener("click", onYes);
        noBtn.addEventListener("click", onNo);
    });
};
