
document.addEventListener("DOMContentLoaded", () => {
    loadPhrases();

    const clearButton = document.getElementById("clearButton");

    clearButton.addEventListener("click", () => {
        document.getElementById("messageInput").value = "";
    });
});


// Register the service worker for offline access.
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("./service-worker.js", {
                updateViaCache: "none"
            })
            .catch((error) => {
                console.error(
                    "Service worker registration failed:",
                    error
                );
            });
    });
}
