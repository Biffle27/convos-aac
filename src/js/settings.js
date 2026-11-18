
const themeButton = document.getElementById("themeButton");
const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");

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

        textSize: [
            "small",
            "medium",
            "large",
            "xl",
            "xxl"
        ].includes(savedTextSize)
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


settingsButton.addEventListener("click", () => {

    // Close Edit Mode before opening Settings.
    if (settingsPanel.hidden && !editModePanel.hidden) {
        toggleEditMode();
    }

    // Open or close the Settings panel.
    settingsPanel.hidden = !settingsPanel.hidden;

    const isSettingsOpen = !settingsPanel.hidden;

    settingsButton.setAttribute(
        "aria-expanded",
        String(isSettingsOpen)
    );

    // Get the communication vocabulary sections.
    const quickPhrasesSection = document.getElementById(
        "quickPhrasesSection"
    );

    const categoriesSection = document.querySelector(
        ".categories-section"
    );

    const phraseContainer = document.getElementById(
        "phraseContainer"
    );

    if (isSettingsOpen) {
        // Hide communication vocabulary while Settings is open.
        quickPhrasesSection.hidden = true;
        categoriesSection.hidden = true;
        phraseContainer.hidden = true;

    } else {
        // Restore Quick Phrases if any exist.
        quickPhrasesSection.hidden =
            !vocabulary || vocabulary.quickPhrases.length === 0;

        // Restore the category selection screen.
        categoriesSection.hidden = false;
        showCategories();
    }
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
const languageSelect = document.getElementById("languageSelect");
const voiceSelect = document.getElementById("voiceSelect");
const testVoiceButton = document.getElementById("testVoiceButton");

const voiceTestPhrases = {
    en: "Hello! This is my Convos voice.",
    es: "¡Hola! Esta es mi voz de Convos.",
    fil: "Kumusta! Ito ang boses ko sa Convos.",
    tl: "Kumusta! Ito ang boses ko sa Convos.",
    fr: "Bonjour ! Voici ma voix Convos.",
    de: "Hallo! Das ist meine Convos-Stimme.",
    it: "Ciao! Questa è la mia voce Convos.",
    pt: "Olá! Esta é a minha voz do Convos.",
    ja: "こんにちは！これは私のConvosの声です。",
    ko: "안녕하세요! 이것은 제 Convos 목소리입니다.",
    zh: "你好！这是我的 Convos 语音。",
    hi: "नमस्ते! यह मेरी Convos आवाज़ है।",
    ar: "مرحبًا! هذا صوتي في Convos.",
    ru: "Привет! Это мой голос в Convos.",
    nl: "Hallo! Dit is mijn Convos-stem.",
    vi: "Xin chào! Đây là giọng nói Convos của tôi.",
    th: "สวัสดี! นี่คือเสียง Convos ของฉัน."
};

let selectedVoiceURI = localStorage.getItem("convos-voice") || "";
let selectedLanguage = localStorage.getItem("convos-language") || "en";

// Populate the dropdown with available voices.
function populateVoiceList() {
    if (!("speechSynthesis" in window)) {
        languageSelect.disabled = true;
        voiceSelect.disabled = true;
        testVoiceButton.disabled = true;
        return;
    }

    const voices = window.speechSynthesis.getVoices();

    // Some browsers load their voice list asynchronously.
    // Don't erase saved selections while waiting.
    if (voices.length === 0) {
        return;
    }

    // Build a list of languages available on this device.
    const displayNames = new Intl.DisplayNames(
        ["en"],
        { type: "language" }
    );

    const languages = [...new Set(
        voices.map(voice => voice.lang.split("-")[0].toLowerCase())
    )].sort((a, b) => {
        const nameA = displayNames.of(a) || a;
        const nameB = displayNames.of(b) || b;

        return nameA.localeCompare(nameB, "en");
    });

    languageSelect.replaceChildren();

    languages.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang;

        try {
            const displayNames = new Intl.DisplayNames(
                ["en"],
                { type: "language" }
            );

            option.textContent = displayNames.of(lang) || lang;
        } catch {
            option.textContent = lang;
        }

        languageSelect.appendChild(option);
    });

    // Restore the selected language, if available.
    if (!languages.includes(selectedLanguage)) {
        selectedLanguage = languages.includes("en")
            ? "en"
            : languages[0];
    }

    languageSelect.value = selectedLanguage;

    // Display only voices matching the selected language.
    const filteredVoices = voices.filter(voice =>
        voice.lang.split("-")[0].toLowerCase() === selectedLanguage
    );

    voiceSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Device Default";
    voiceSelect.appendChild(defaultOption);

    filteredVoices
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(voice => {
            const option = document.createElement("option");
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

    // Restore the saved voice if it matches the language.
    voiceSelect.value = filteredVoices.some(
        voice => voice.voiceURI === selectedVoiceURI
    ) ? selectedVoiceURI : "";
}

languageSelect.addEventListener("change", () => {
    selectedLanguage = languageSelect.value;

    // Reset the selected voice when switching languages.
    selectedVoiceURI = "";

    localStorage.setItem(
        "convos-language",
        selectedLanguage
    );

    localStorage.setItem("convos-voice", "");

    // Refresh the voice list for the selected language.
    populateVoiceList();
});

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
    // Find the test phrase for the selected language.
    const testPhrase = voiceTestPhrases[selectedLanguage];

    if (testPhrase) {
        // Speak the translated phrase.
        speakText(testPhrase);
    } else {
        // Notify the user if no translation is available.
        alert("A test phrase is not yet available for this language.");
    }
});

// Browsers may load voices asynchronously.
window.speechSynthesis?.addEventListener(
    "voiceschanged",
    populateVoiceList
);

// Initial voice loading.
populateVoiceList();
