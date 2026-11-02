
const themeButton = document.getElementById("themeButton");
const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettingsButton = document.getElementById(
    "closeSettingsButton"
);

const textSizeSelect = document.getElementById("textSizeSelect");
const speechRateSlider = document.getElementById("speechRate");
const speechRateValue = document.getElementById(
    "speechRateValue"
);

// Default application preferences.
const defaultSettings = {
    theme: "dark",
    textSize: "medium",
    speechRate: 1
};

// Load preferences saved on this device.
function loadSettings() {
    const savedTheme = localStorage.getItem("convos-theme");
    const savedTextSize = localStorage.getItem("convos-text-size");
    const savedSpeechRate = localStorage.getItem("convos-speech-rate");

    return {
        theme: ["dark", "light"].includes(savedTheme)
            ? savedTheme
            : defaultSettings.theme,

        textSize: ["small", "medium", "large"].includes(savedTextSize)
            ? savedTextSize
            : defaultSettings.textSize,

        speechRate: savedSpeechRate !== null &&
            Number.isFinite(Number(savedSpeechRate)) &&
            Number(savedSpeechRate) >= 0.5 &&
            Number(savedSpeechRate) <= 1.5
                ? Number(savedSpeechRate)
                : defaultSettings.speechRate
    };
}

let appSettings = loadSettings();

// Apply the currently selected settings.
function applySettings() {
    document.documentElement.dataset.theme = appSettings.theme;
    document.documentElement.dataset.textSize = appSettings.textSize;

    textSizeSelect.value = appSettings.textSize;
    speechRateSlider.value = appSettings.speechRate;

    speechRateValue.textContent =
        appSettings.speechRate.toFixed(1) + "x";

    themeButton.textContent =
        appSettings.theme === "dark"
            ? "Light Mode"
            : "Dark Mode";
}

// Toggle between dark and light mode.
themeButton.addEventListener("click", () => {
    appSettings.theme =
        appSettings.theme === "dark" ? "light" : "dark";

    localStorage.setItem("convos-theme", appSettings.theme);
    applySettings();
});

// Open the settings panel.
settingsButton.addEventListener("click", () => {
    settingsPanel.hidden = false;
    closeSettingsButton.focus();
});

// Close the settings panel.
closeSettingsButton.addEventListener("click", () => {
    settingsPanel.hidden = true;
    settingsButton.focus();
});

// Change text size.
textSizeSelect.addEventListener("change", () => {
    appSettings.textSize = textSizeSelect.value;

    localStorage.setItem(
        "convos-text-size",
        appSettings.textSize
    );

    applySettings();
});

// Change speech speed.
speechRateSlider.addEventListener("input", () => {
    appSettings.speechRate = Number(speechRateSlider.value);

    localStorage.setItem(
        "convos-speech-rate",
        appSettings.speechRate
    );

    applySettings();
});

// Restore saved preferences when the page loads.
applySettings();


// Voice preference controls
const voiceSelect = document.getElementById("voiceSelect");
const testVoiceButton = document.getElementById("testVoiceButton");

// Retrieve the saved voice preference.
let selectedVoiceURI =
    localStorage.getItem("convos-voice") || "";

// Populate the dropdown with available voices.
function populateVoiceList() {
    if (!("speechSynthesis" in window)) {
        voiceSelect.disabled = true;
        testVoiceButton.disabled = true;
        return;
    }

    const voices = window.speechSynthesis.getVoices();

    // Keep the default voice option.
    voiceSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Device Default";
    voiceSelect.appendChild(defaultOption);

    // Show available English voices.
    const englishVoices = voices.filter(voice =>
        voice.lang.toLowerCase().startsWith("en")
    );

    englishVoices.forEach(voice => {
        const option = document.createElement("option");

        option.value = voice.voiceURI;
        option.textContent = `${voice.name} (${voice.lang})`;

        voiceSelect.appendChild(option);
    });

    // Restore the saved voice when it becomes available.
    const savedVoiceAvailable = englishVoices.some(
        voice => voice.voiceURI === selectedVoiceURI
    );

    if (savedVoiceAvailable) {
        voiceSelect.value = selectedVoiceURI;
    } else {
        // Display Device Default temporarily,
        // but preserve the saved preference.
        voiceSelect.value = "";
    }
}

// Save voice changes.
voiceSelect.addEventListener("change", () => {
    selectedVoiceURI = voiceSelect.value;

    localStorage.setItem(
        "convos-voice",
        selectedVoiceURI
    );
});

// Test the selected voice.
testVoiceButton.addEventListener("click", () => {
    speakText("Hello! This is my Convos AAC voice.");
});

// Browsers may load voices asynchronously.
window.speechSynthesis?.addEventListener(
    "voiceschanged",
    populateVoiceList
);

// Initial voice loading.
populateVoiceList();
