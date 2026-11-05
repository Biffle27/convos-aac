
const categoryButtons = document.querySelectorAll(
    ".category-button"
);

const categoryGrid = document.querySelector(
    ".category-grid"
);

const phraseContainer = document.getElementById(
    "phraseContainer"
);

let phraseLibrary = {};

// Store favorites separately for each category.
const FAVORITES_STORAGE_KEY = "convosAACFavorites";

let favorites = {};

// Load previously saved favorites.
try {
    const savedFavorites = JSON.parse(
        localStorage.getItem(FAVORITES_STORAGE_KEY) || "{}"
    );

    if (
        savedFavorites &&
        typeof savedFavorites === "object" &&
        !Array.isArray(savedFavorites)
    ) {
        favorites = savedFavorites;
    }
} catch (error) {
    console.error("Could not load favorites:", error);
}

// Save favorites to the device.
function saveFavorites() {
    try {
        localStorage.setItem(
            FAVORITES_STORAGE_KEY,
            JSON.stringify(favorites)
        );
    } catch (error) {
        console.error("Could not save favorites:", error);
    }
}

// Check whether a phrase is a favorite.
function isFavorite(categoryId, phrase) {
    return (
        Array.isArray(favorites[categoryId]) &&
        favorites[categoryId].includes(phrase)
    );
}

// Add or remove a favorite.
function toggleFavorite(categoryId, phrase) {
    if (!Array.isArray(favorites[categoryId])) {
        favorites[categoryId] = [];
    }

    if (isFavorite(categoryId, phrase)) {
        favorites[categoryId] = favorites[categoryId].filter(
            (savedPhrase) => savedPhrase !== phrase
        );
    } else {
        favorites[categoryId].push(phrase);
    }

    saveFavorites();

    // Re-render this category with favorites at the top.
    showCategory(categoryId);
}

// Load our phrase library from the JSON file.
async function loadPhrases() {
    try {
        const response = await fetch("src/data/phrases.json");

        if (!response.ok) {
            throw new Error("Could not load phrase library.");
        }

        phraseLibrary = await response.json();

    } catch (error) {
        console.error("Phrase loading error:", error);

        phraseContainer.hidden = false;
        phraseContainer.textContent =
            "Unable to load phrases. Please refresh the page.";
    }
}

// Display phrases for a selected category.
function showCategory(categoryId) {
    const category = phraseLibrary[categoryId];

    if (!category) return;

    // Hide category buttons.
    categoryGrid.hidden = true;

    // Show the phrase area.
    phraseContainer.hidden = false;
    phraseContainer.replaceChildren();

    // Create a Back button.
    const backButton = document.createElement("button");
    backButton.textContent = "← Back";
    backButton.className = "back-button";

    backButton.addEventListener("click", showCategories);

    phraseContainer.appendChild(backButton);

    // Display the selected category name.
    const heading = document.createElement("h3");
    heading.textContent = category.name;

    phraseContainer.appendChild(heading);

    // Create a grid for phrase rows.
    const phraseGrid = document.createElement("div");
    phraseGrid.className = "phrase-grid";

    // Sort favorites to the top while preserving original order.
    const sortedPhrases = [...category.phrases].sort(
        (a, b) =>
            Number(isFavorite(categoryId, b)) -
            Number(isFavorite(categoryId, a))
    );

    
    sortedPhrases.forEach((phrase) => {
        // Shared visual container for phrase and favorite star.
        const phraseRow = document.createElement("div");
        phraseRow.className = "phrase-row";

        // Main phrase button.
        const button = document.createElement("button");
        button.textContent = phrase;
        button.className = "phrase-button";

        button.addEventListener("click", () => {
            speakText(phrase);
        });

        // Favorite star, visually integrated into phrase button.
        const favoriteButton = document.createElement("button");
        favoriteButton.className = "favorite-button";

        const favorited = isFavorite(categoryId, phrase);

        favoriteButton.textContent = favorited ? "★" : "☆";

        favoriteButton.setAttribute(
            "aria-label",
            favorited
                ? `Remove ${phrase} from favorites`
                : `Add ${phrase} to favorites`
        );

        favoriteButton.setAttribute(
            "aria-pressed",
            String(favorited)
        );

        favoriteButton.addEventListener("click", () => {
            toggleFavorite(categoryId, phrase);
        });

        phraseRow.appendChild(button);
        phraseRow.appendChild(favoriteButton);

        phraseGrid.appendChild(phraseRow);
    });


    phraseContainer.appendChild(phraseGrid);
}

// Return to the categories.
function showCategories() {
    phraseContainer.hidden = true;
    categoryGrid.hidden = false;
}

// Connect category buttons to their categories.
categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
        showCategory(button.dataset.category);
    });
});

// Persistent Quick Phrases.
const quickPhraseButtons = document.querySelectorAll(
    ".quick-phrase-button"
);

quickPhraseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const phrase = button.dataset.phrase;

        if (phrase) {
            speakText(phrase);
        }
    });
});
