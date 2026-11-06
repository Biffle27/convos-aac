
/* =========================================
   VOCABULARY BACKUP AND RECOVERY
========================================= */

const exportVocabularyButton = document.getElementById(
    "exportVocabularyButton"
);

const importVocabularyButton = document.getElementById(
    "importVocabularyButton"
);

const restoreDefaultsButton = document.getElementById(
    "restoreDefaultsButton"
);

const vocabularyImportFile = document.getElementById(
    "vocabularyImportFile"
);

const vocabularyBackupStatus = document.getElementById(
    "vocabularyBackupStatus"
);

function showBackupStatus(message) {
    vocabularyBackupStatus.textContent = message;
}

// Validate a complete vocabulary before importing it.
// This is intentionally stricter than the initial
// storage check in phrases.js.
function validateBackup(data) {
    if (!data || typeof data !== "object" ||
        Array.isArray(data) || data.version !== 1 ||
        !Array.isArray(data.quickPhrases) ||
        !Array.isArray(data.categories)) {
        return false;
    }

    const validText = (value, maxLength) =>
        typeof value === "string" &&
        value.trim().length > 0 &&
        value.length <= maxLength;

    const validId = value =>
        typeof value === "string" &&
        value.length > 0 &&
        value.length <= 200;

    const quickIds = new Set();
    const categoryIds = new Set();
    const categoryNames = new Set();

    for (const phrase of data.quickPhrases) {
        if (!phrase || typeof phrase !== "object" ||
            !validId(phrase.id) ||
            !validText(phrase.text, 120) ||
            quickIds.has(phrase.id)) {
            return false;
        }

        quickIds.add(phrase.id);
    }

    for (const category of data.categories) {
        if (!category || typeof category !== "object" ||
            !validId(category.id) ||
            !validText(category.name, 60) ||
            !Array.isArray(category.phrases) ||
            categoryIds.has(category.id)) {
            return false;
        }

        const normalizedName =
            category.name.trim().toLocaleLowerCase();

        if (categoryNames.has(normalizedName)) {
            return false;
        }

        categoryIds.add(category.id);
        categoryNames.add(normalizedName);

        const phraseIds = new Set();

        for (const phrase of category.phrases) {
            if (!phrase || typeof phrase !== "object" ||
                !validId(phrase.id) ||
                !validText(phrase.text, 300) ||
                typeof phrase.favorite !== "boolean" ||
                phraseIds.has(phrase.id)) {
                return false;
            }

            phraseIds.add(phrase.id);
        }
    }

    return true;
}

// Apply a validated vocabulary, with rollback
// if the browser cannot save it.
function applyVocabulary(newVocabulary) {
    if (!validateBackup(newVocabulary)) {
        return false;
    }

    const previousVocabulary = vocabulary;
    vocabulary = newVocabulary;

    if (!saveVocabulary()) {
        vocabulary = previousVocabulary;
        return false;
    }

    // Update all communication buttons.
    renderQuickPhrases();
    renderCategories();
    showCategories();

    // Close any open editing form, which may refer
    // to categories or phrases that no longer exist.
    editModeContent.replaceChildren();

    return true;
}

/* =========================================
   EXPORT
========================================= */

exportVocabularyButton.addEventListener("click", () => {
    if (!vocabulary || !validateBackup(vocabulary)) {
        showBackupStatus(
            "Vocabulary is not ready to export."
        );
        return;
    }

    try {
        const json = JSON.stringify(vocabulary, null, 2);

        const blob = new Blob([json], {
            type: "application/json"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;

        const date = new Date().toISOString().slice(0, 10);
        link.download = `convos-aac-backup-${date}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        // Release the temporary download URL.
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 60000);

        showBackupStatus(
            "Backup prepared. Check your downloads or save dialog."
        );

    } catch (error) {
        console.error("Vocabulary export failed:", error);

        showBackupStatus(
            "Unable to export vocabulary."
        );
    }
});

/* =========================================
   IMPORT
========================================= */

importVocabularyButton.addEventListener("click", () => {
    vocabularyImportFile.value = "";
    vocabularyImportFile.click();
});

vocabularyImportFile.addEventListener(
    "change",
    async () => {
        const file = vocabularyImportFile.files[0];

        if (!file) return;

        // Prevent accidentally loading very large files.
        const MAX_BACKUP_SIZE = 5 * 1024 * 1024;

        if (file.size > MAX_BACKUP_SIZE) {
            showBackupStatus(
                "Backup file is too large (maximum 5 MB)."
            );
            return;
        }

        try {
            const fileText = await file.text();
            const importedVocabulary = JSON.parse(fileText);

            if (!validateBackup(importedVocabulary)) {
                showBackupStatus(
                    "Invalid or unsupported vocabulary backup."
                );
                return;
            }

            const categoryCount =
                importedVocabulary.categories.length;

            const phraseCount =
                importedVocabulary.categories.reduce(
                    (total, category) =>
                        total + category.phrases.length,
                    0
                );

            const quickCount =
                importedVocabulary.quickPhrases.length;

            const confirmed = confirm(
                "Import this vocabulary backup?\n\n" +
                `${categoryCount} categories\n` +
                `${phraseCount} category phrases\n` +
                `${quickCount} Quick Phrases\n\n` +
                "This will REPLACE your current vocabulary " +
                "and favorites on this device.\n\n" +
                "Export your current vocabulary first " +
                "if you want to keep a copy."
            );

            if (!confirmed) {
                showBackupStatus("Import canceled.");
                return;
            }

            if (!applyVocabulary(importedVocabulary)) {
                showBackupStatus(
                    "Unable to save imported vocabulary. " +
                    "Your previous vocabulary was kept."
                );
                return;
            }

            showBackupStatus(
                "Vocabulary imported successfully!"
            );

        } catch (error) {
            console.error("Vocabulary import failed:", error);

            showBackupStatus(
                "Unable to read this backup file."
            );
        } finally {
            vocabularyImportFile.value = "";
        }
    }
);

/* =========================================
   RESTORE DEFAULTS
========================================= */

restoreDefaultsButton.addEventListener(
    "click",
    async () => {
        if (!vocabulary) return;

        const confirmed = confirm(
            "Restore the original Convos AAC vocabulary?\n\n" +
            "This will replace all personalized categories, " +
            "phrases, Quick Phrases, and favorites.\n\n" +
            "Export your current vocabulary first " +
            "if you want to keep it."
        );

        if (!confirmed) {
            showBackupStatus("Restore canceled.");
            return;
        }

        restoreDefaultsButton.disabled = true;

        try {
            const response = await fetch(
                "src/data/phrases.json"
            );

            if (!response.ok) {
                throw new Error(
                    "Unable to load default vocabulary."
                );
            }

            const defaults = await response.json();

            // Build fresh default categories without
            // reimporting the old favorites.
            const categories = Object.entries(defaults).map(
                ([categoryId, category]) => ({
                    id: categoryId,
                    name: category.name,
                    phrases: category.phrases.map(
                        (text, index) => ({
                            id: `${categoryId}-phrase-${index + 1}`,
                            text: text,
                            favorite: false
                        })
                    )
                })
            );

            const defaultVocabulary = {
                version: 1,
                quickPhrases: [
                    { id: "quick-1", text: "Yes" },
                    { id: "quick-2", text: "No" },
                    { id: "quick-3", text: "Please wait." },
                    { id: "quick-4", text: "I need help." }
                ],
                categories: categories
            };

            if (!applyVocabulary(defaultVocabulary)) {
                showBackupStatus(
                    "Unable to save default vocabulary. " +
                    "Your previous vocabulary was kept."
                );
                return;
            }

            showBackupStatus(
                "Original vocabulary restored successfully!"
            );

        } catch (error) {
            console.error("Restore defaults failed:", error);

            showBackupStatus(
                "Unable to restore defaults. " +
                "Your existing vocabulary was not changed."
            );
        } finally {
            restoreDefaultsButton.disabled = false;
        }
    }
);
