
document.addEventListener("DOMContentLoaded", () => {
    loadPhrases();

    const clearButton = document.getElementById("clearButton");

    clearButton.addEventListener("click", () => {
        document.getElementById("messageInput").value = "";
    });
});


// Register the service worker for offline access.
if ("serviceWorker" in navigator) {
    let refreshing = false;

    // Reload once when a new service worker takes control.
    navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {
            if (refreshing) return;

            refreshing = true;
            window.location.reload();
        }
    );

    window.addEventListener("load", async () => {
        try {
            const registration =
                await navigator.serviceWorker.register(
                    "./service-worker.js",
                    {
                        updateViaCache: "none"
                    }
                );

            // Check GitHub Pages for an updated service worker.
            await registration.update();

        } catch (error) {
            console.error(
                "Service worker registration failed:",
                error
            );
        }
    });
}
