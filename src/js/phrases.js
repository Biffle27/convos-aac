
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

    // Hide the six category buttons.
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

    // Create a button for each phrase.
    const phraseGrid = document.createElement("div");
    phraseGrid.className = "phrase-grid";

    category.phrases.forEach((phrase) => {
        const button = document.createElement("button");

        button.textContent = phrase;
        button.className = "phrase-button";

        button.addEventListener("click", () => {
            speakText(phrase);
        });

        phraseGrid.appendChild(button);
    });

    phraseContainer.appendChild(phraseGrid);
}

// Return to the six categories.
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