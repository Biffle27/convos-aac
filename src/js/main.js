
document.addEventListener("DOMContentLoaded", () => {
    loadPhrases();

    const clearButton = document.getElementById("clearButton");

    clearButton.addEventListener("click", () => {
        document.getElementById("messageInput").value = "";
    });
});
