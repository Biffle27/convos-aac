
const categoryGrid = document.querySelector(".category-grid");
const phraseContainer = document.getElementById("phraseContainer");
const quickPhrasesGrid = document.querySelector(".quick-phrases-grid");

const VOCABULARY_STORAGE_KEY = "convosAACVocabularyV1";
const LEGACY_FAVORITES_KEY = "convosAACFavorites";

let vocabulary = null;

// Save the personalized vocabulary.
function saveVocabulary() {
    try {
        localStorage.setItem(
            VOCABULARY_STORAGE_KEY,
            JSON.stringify(vocabulary)
        );
        return true;
    } catch (error) {
        console.error("Unable to save vocabulary:", error);
        return false;
    }
}

// Check that stored data has the structure we expect.
function isValidVocabulary(data) {
    return (
        data &&
        data.version === 1 &&
        Array.isArray(data.categories) &&
        Array.isArray(data.quickPhrases) &&
        data.categories.every(category =>
            typeof category.id === "string" &&
            typeof category.name === "string" &&
            Array.isArray(category.phrases) &&
            category.phrases.every(phrase =>
                typeof phrase.id === "string" &&
                typeof phrase.text === "string" &&
                typeof phrase.favorite === "boolean"
            )
        ) &&
        data.quickPhrases.every(phrase =>
            typeof phrase.id === "string" &&
            typeof phrase.text === "string"
        )
    );
}

// Convert the original JSON library into editable data.
function createDefaultVocabulary(defaultLibrary) {
    let oldFavorites = {};

    try {
        const stored = JSON.parse(
            localStorage.getItem(LEGACY_FAVORITES_KEY) || "{}"
        );

        if (stored && typeof stored === "object" &&
            !Array.isArray(stored)) {
            oldFavorites = stored;
        }
    } catch (error) {
        console.error("Could not read old favorites:", error);
    }

    const categories = Object.entries(defaultLibrary).map(
        ([categoryId, category]) => ({
            id: categoryId,
            name: category.name,
            phrases: category.phrases.map((text, index) => ({
                id: `${categoryId}-phrase-${index + 1}`,
                text: text,
                favorite: Array.isArray(oldFavorites[categoryId]) &&
                    oldFavorites[categoryId].includes(text)
            }))
        })
    );

    const quickPhrases = Array.from(
        document.querySelectorAll(".quick-phrase-button")
    ).map((button, index) => ({
        id: `quick-${index + 1}`,
        text: button.dataset.phrase || button.textContent.trim()
    }));

    return {
        version: 1,
        quickPhrases: quickPhrases,
        categories: categories
    };
}

// Load saved vocabulary or initialize from defaults.
async function loadPhrases() {
    try {
        const saved = localStorage.getItem(
            VOCABULARY_STORAGE_KEY
        );

        if (saved !== null) {
            const parsed = JSON.parse(saved);

            if (!isValidVocabulary(parsed)) {
                throw new Error(
                    "Saved vocabulary has an unsupported format."
                );
            }

            vocabulary = parsed;
        } else {
            const response = await fetch("src/data/phrases.json");

            if (!response.ok) {
                throw new Error("Could not load default phrases.");
            }

            const defaults = await response.json();

            vocabulary = createDefaultVocabulary(defaults);

            if (!saveVocabulary()) {
                console.warn(
                    "Vocabulary is available, but persistence failed."
                );
            }
        }

        renderQuickPhrases();
        renderCategories();

    } catch (error) {
        console.error("Vocabulary loading error:", error);

        phraseContainer.hidden = false;
        phraseContainer.textContent =
            "Unable to load vocabulary. Please check your saved data.";
    }
}

// Display persistent Quick Phrases.
function renderQuickPhrases() {
    if (!vocabulary || !quickPhrasesGrid) return;

    quickPhrasesGrid.replaceChildren();

    // Hide the Quick Phrases section if no phrases exist.
    const quickPhrasesSection = document.getElementById(
        "quickPhrasesSection"
    );

    if (quickPhrasesSection) {
        quickPhrasesSection.hidden =
            vocabulary.quickPhrases.length === 0;
    }

    vocabulary.quickPhrases.forEach(phrase => {
        const button = document.createElement("button");

        button.className = "quick-phrase-button";
        button.textContent = phrase.text;
        button.dataset.phrase = phrase.text;

        button.addEventListener("click", () => {
            speakText(phrase.text);
        });

        quickPhrasesGrid.appendChild(button);
    });
}

// Display category buttons from personalized data.
function renderCategories() {
    if (!vocabulary) return;

    categoryGrid.replaceChildren();

    vocabulary.categories.forEach(category => {
        const button = document.createElement("button");

        button.className = "category-button";
        button.dataset.category = category.id;
        button.textContent = category.name;

        button.addEventListener("click", () => {
            showCategory(category.id);
        });

        categoryGrid.appendChild(button);
    });
}

// Find a category by its permanent ID.
function getCategory(categoryId) {
    return vocabulary?.categories.find(
        category => category.id === categoryId
    );
}

// Toggle a favorite using its permanent phrase ID.
function toggleFavorite(categoryId, phraseId) {
    const category = getCategory(categoryId);
    if (!category) return;

    const phrase = category.phrases.find(
        item => item.id === phraseId
    );

    if (!phrase) return;

    const previousValue = phrase.favorite;
    phrase.favorite = !phrase.favorite;

    if (!saveVocabulary()) {
        phrase.favorite = previousValue;
        alert("Unable to save this favorite. Please try again.");
        return;
    }

    showCategory(categoryId);
}

// Display the selected category.
function showCategory(categoryId) {
    const category = getCategory(categoryId);
    if (!category) return;

    categoryGrid.hidden = true;
    phraseContainer.hidden = false;
    phraseContainer.replaceChildren();

    const backButton = document.createElement("button");
    backButton.textContent = "← Back";
    backButton.className = "back-button";
    backButton.addEventListener("click", showCategories);

    phraseContainer.appendChild(backButton);

    const heading = document.createElement("h3");
    heading.textContent = category.name;
    phraseContainer.appendChild(heading);

    const phraseGrid = document.createElement("div");
    phraseGrid.className = "phrase-grid";

    // Favorites first, preserving original phrase order.
    const sortedPhrases = [...category.phrases].sort(
        (a, b) => Number(b.favorite) - Number(a.favorite)
    );

    sortedPhrases.forEach(phrase => {
        const phraseRow = document.createElement("div");
        phraseRow.className = "phrase-row";

        const button = document.createElement("button");
        button.className = "phrase-button";
        button.textContent = phrase.text;

        button.addEventListener("click", () => {
            speakText(phrase.text);
        });

        const favoriteButton = document.createElement("button");
        favoriteButton.className = "favorite-button";
        favoriteButton.textContent = phrase.favorite ? "★" : "☆";

        favoriteButton.setAttribute(
            "aria-label",
            phrase.favorite
                ? `Remove ${phrase.text} from favorites`
                : `Add ${phrase.text} to favorites`
        );

        favoriteButton.setAttribute(
            "aria-pressed",
            String(phrase.favorite)
        );

        favoriteButton.addEventListener("click", () => {
            toggleFavorite(categoryId, phrase.id);
        });

        phraseRow.appendChild(button);
        phraseRow.appendChild(favoriteButton);
        phraseGrid.appendChild(phraseRow);
    });

    phraseContainer.appendChild(phraseGrid);
}

// Return to the category selection screen.
function showCategories() {
    phraseContainer.hidden = true;
    categoryGrid.hidden = false;
}
