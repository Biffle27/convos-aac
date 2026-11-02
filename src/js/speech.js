
const messageInput = document.getElementById("messageInput");
const speakButton = document.getElementById("speakButton");
const stopButton = document.getElementById("stopButton");

const speechSupported =
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

// Reusable text-to-speech function.
function speakText(text) {
    if (!speechSupported || !text.trim()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = appSettings.speechRate;

    window.speechSynthesis.speak(utterance);
}

// Speak text entered by the user.
function speakMessage() {
    speakText(messageInput.value);
}

// Stop speech.
function stopSpeech() {
    if (!speechSupported) return;

    window.speechSynthesis.cancel();
}

// Connect buttons.
speakButton.addEventListener("click", speakMessage);
stopButton.addEventListener("click", stopSpeech);

// Disable speech buttons if unsupported.
if (!speechSupported) {
    speakButton.disabled = true;
    stopButton.disabled = true;
}
