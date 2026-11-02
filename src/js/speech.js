
const messageInput = document.getElementById("messageInput");
const speakButton = document.getElementById("speakButton");
const stopButton = document.getElementById("stopButton");

// Check whether the browser supports speech synthesis.
const speechSupported =
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

if (!speechSupported) {
    speakButton.disabled = true;
    stopButton.disabled = true;
    alert("Text-to-speech is not supported in this browser.");
}

// Speak the message entered by the user.
function speakMessage() {
    if (!speechSupported) return;

    const text = messageInput.value.trim();

    // Don't attempt to speak an empty message.
    if (text === "") {
        return;
    }

    // Stop any speech already playing.
    window.speechSynthesis.cancel();

    // Create a new speech request.
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 1;

    // Speak the message.
    window.speechSynthesis.speak(utterance);
}

// Stop speech when requested.
function stopSpeech() {
    if (!speechSupported) return;

    window.speechSynthesis.cancel();
}

// Connect the buttons to their functions.
speakButton.addEventListener("click", speakMessage);
stopButton.addEventListener("click", stopSpeech);