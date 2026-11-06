
const editModeButton = document.getElementById(
    "editModeButton"
);

const editModePanel = document.getElementById(
    "editModePanel"
);

const editQuickPhrasesButton = document.getElementById(
    "editQuickPhrasesButton"
);

const editModeContent = document.getElementById(
    "editModeContent"
);

let isEditMode = false;

// Open or close Edit Mode.
function toggleEditMode() {
    isEditMode = !isEditMode;

    editModePanel.hidden = !isEditMode;

    editModeButton.textContent = isEditMode
        ? "Done Editing"
        : "Edit Mode";

    editModeButton.setAttribute(
        "aria-expanded",
        String(isEditMode)
    );

    // Clear any unfinished edits when leaving Edit Mode.
    if (!isEditMode) {
        editModeContent.replaceChildren();
    }
}

editModeButton.addEventListener("click", toggleEditMode);


/* =========================================
   QUICK PHRASE MANAGEMENT
========================================= */

// Display all Quick Phrases with Edit/Delete controls.
function showQuickPhraseEditor() {
    if (!vocabulary) {
        alert("Vocabulary is still loading.");
        return;
    }

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Edit Quick Phrases";

    const description = document.createElement("p");
    description.textContent =
        "Add, edit, or delete your persistent Quick Phrases.";

    editModeContent.append(heading, description);

    const phraseList = document.createElement("div");
    phraseList.className = "edit-phrase-list";

    vocabulary.quickPhrases.forEach(phrase => {
        const row = document.createElement("div");
        row.className = "edit-phrase-row";

        const text = document.createElement("span");
        text.className = "edit-phrase-text";
        text.textContent = phrase.text;

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            showQuickPhraseForm(phrase.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete this Quick Phrase?\n\n"${phrase.text}"`
            );

            if (!confirmed) return;

            const previousPhrases = [...vocabulary.quickPhrases];

            vocabulary.quickPhrases = vocabulary.quickPhrases.filter(
                item => item.id !== phrase.id
            );

            if (!saveVocabulary()) {
                vocabulary.quickPhrases = previousPhrases;
                alert("Unable to delete the Quick Phrase.");
                return;
            }

            renderQuickPhrases();
            showQuickPhraseEditor();
        });

        row.append(text, editButton, deleteButton);
        phraseList.appendChild(row);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Add Quick Phrase";
    addButton.className = "primary-button";

    addButton.addEventListener("click", () => {
        showQuickPhraseForm();
    });

    phraseList.appendChild(addButton);
    editModeContent.appendChild(phraseList);
}

// Display a form for adding or editing one Quick Phrase.
function showQuickPhraseForm(phraseId = null) {
    if (!vocabulary) return;

    const phrase = phraseId
        ? vocabulary.quickPhrases.find(item => item.id === phraseId)
        : null;

    if (phraseId && !phrase) return;

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = phrase
        ? "Edit Quick Phrase"
        : "Add Quick Phrase";

    const form = document.createElement("form");
    form.className = "quick-phrase-editor";

    const group = document.createElement("div");
    group.className = "edit-field-group";

    const label = document.createElement("label");
    label.textContent = "Quick Phrase Text";
    label.htmlFor = "quickPhraseTextInput";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "quickPhraseTextInput";
    input.maxLength = 120;
    input.required = true;
    input.value = phrase ? phrase.text : "";

    group.append(label, input);
    form.appendChild(group);

    const actions = document.createElement("div");
    actions.className = "edit-form-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    cancelButton.addEventListener("click", showQuickPhraseEditor);

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = phrase
        ? "Save Changes"
        : "Add Quick Phrase";
    saveButton.className = "primary-button";

    actions.append(cancelButton, saveButton);
    form.appendChild(actions);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const newText = input.value.trim();

        if (!newText) {
            alert("Quick Phrases cannot be empty.");
            return;
        }

        // Save a snapshot for rollback if storage fails.
        const previousPhrases = vocabulary.quickPhrases.map(
            item => ({ ...item })
        );

        if (phrase) {
            phrase.text = newText;
        } else {
            vocabulary.quickPhrases.push({
                id: createPhraseId(),
                text: newText
            });
        }

        if (!saveVocabulary()) {
            vocabulary.quickPhrases = previousPhrases;
            alert("Unable to save Quick Phrase.");
            return;
        }

        renderQuickPhrases();
        showQuickPhraseEditor();
    });

    editModeContent.append(heading, form);
    input.focus();
}

// Connect the editor to the Edit Mode button.
editQuickPhrasesButton.addEventListener(
    "click",
    showQuickPhraseEditor
);

/* =========================================
   CATEGORY RENAMING
========================================= */

const editCategoriesButton = document.getElementById(
    "editCategoriesButton"
);


function showCategoryEditor() {
    if (!vocabulary) return;

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Manage Categories";

    const description = document.createElement("p");
    description.textContent =
        "Edit, delete, or create categories for your communication vocabulary.";

    editModeContent.append(heading, description);

    const categoryList = document.createElement("div");
    categoryList.className = "edit-phrase-list";

    vocabulary.categories.forEach(category => {
        const row = document.createElement("div");
        row.className = "edit-phrase-row";

        const details = document.createElement("div");
        details.className = "edit-phrase-text";

        const name = document.createElement("div");
        name.textContent = category.name;

        const count = document.createElement("small");
        count.textContent =
            `${category.phrases.length} phrases`;

        details.append(name, count);

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            showCategoryNameForm(category.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete "${category.name}"?\n\n` +
                `This will permanently remove ${category.phrases.length} ` +
                `phrases and their favorites from this device.\n\n` +
                "This action cannot be undone."
            );

            if (!confirmed) return;

            const previousCategories = [...vocabulary.categories];

            vocabulary.categories = vocabulary.categories.filter(
                item => item.id !== category.id
            );

            if (!saveVocabulary()) {
                vocabulary.categories = previousCategories;
                alert("Unable to delete the category.");
                return;
            }

            renderCategories();
            showCategories();
            showCategoryEditor();
        });

        row.append(details, editButton, deleteButton);
        categoryList.appendChild(row);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Add New Category";
    addButton.className = "primary-button";

    addButton.addEventListener("click", showAddCategoryForm);

    categoryList.appendChild(addButton);
    editModeContent.appendChild(categoryList);
}


function showCategoryNameForm(categoryId) {
    const category = getCategory(categoryId);
    if (!category) return;

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Rename Category";

    const form = document.createElement("form");
    form.className = "quick-phrase-editor";

    const group = document.createElement("div");
    group.className = "edit-field-group";

    const label = document.createElement("label");
    label.textContent = "Category Name";
    label.htmlFor = "renameCategoryInput";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "renameCategoryInput";
    input.value = category.name;
    input.maxLength = 60;
    input.required = true;

    group.append(label, input);
    form.appendChild(group);

    const actions = document.createElement("div");
    actions.className = "edit-form-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", showCategoryEditor);

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save Category Name";
    saveButton.className = "primary-button";

    actions.append(cancelButton, saveButton);
    form.appendChild(actions);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const newName = input.value.trim();

        if (!newName) {
            alert("Category name cannot be empty.");
            return;
        }

        const duplicate = vocabulary.categories.some(
            item =>
                item.id !== categoryId &&
                item.name.toLocaleLowerCase() ===
                newName.toLocaleLowerCase()
        );

        if (duplicate) {
            alert("A category with that name already exists.");
            return;
        }

        const previousName = category.name;
        category.name = newName;

        if (!saveVocabulary()) {
            category.name = previousName;
            alert("Unable to save the category name.");
            return;
        }

        renderCategories();
        showCategories();
        showCategoryEditor();
    });

    editModeContent.append(heading, form);
    input.focus();
}

editCategoriesButton.addEventListener(
    "click",
    showCategoryEditor
);

// Shared confirmation message for editing actions.
function showEditConfirmation(message) {
    editModeContent.replaceChildren();

    const confirmation = document.createElement("p");
    confirmation.className = "edit-success-message";
    confirmation.textContent = message;

    editModeContent.appendChild(confirmation);
}


/* =========================================
   PHRASE EDITING
========================================= */

const editCategoryPhrasesButton = document.getElementById(
    "editCategoryPhrasesButton"
);

// Create a permanent ID for new phrases.
function createPhraseId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "phrase-" + Date.now() + "-" +
        Math.random().toString(36).slice(2);
}

// Save a change, restoring previous data if saving fails.
function savePhraseChange(category, previousPhrases) {
    if (!saveVocabulary()) {
        category.phrases = previousPhrases;
        alert("Unable to save your changes.");
        return false;
    }

    return true;
}

// Display the category selector and its phrases.
function showPhraseEditor(categoryId = null) {
    if (!vocabulary) return;

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Edit Category Phrases";
    editModeContent.appendChild(heading);

    const label = document.createElement("label");
    label.textContent = "Choose a category";
    label.htmlFor = "phraseEditorCategory";

    const select = document.createElement("select");
    select.id = "phraseEditorCategory";
    select.className = "edit-category-select";

    vocabulary.categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });

    if (categoryId && getCategory(categoryId)) {
        select.value = categoryId;
    }

    editModeContent.append(label, select);

    const phraseList = document.createElement("div");
    phraseList.className = "edit-phrase-list";
    editModeContent.appendChild(phraseList);

    select.addEventListener("change", () => {
        renderEditablePhrases(select.value, phraseList);
    });

    if (select.value) {
        renderEditablePhrases(select.value, phraseList);
    } else {
        phraseList.textContent =
            "No categories available.";
    }
}

// Render editable phrases for the chosen category.
function renderEditablePhrases(categoryId, container) {
    const category = getCategory(categoryId);
    if (!category) return;

    container.replaceChildren();

    const description = document.createElement("p");
    description.textContent =
        "Edit or delete phrases, or add a new phrase below.";
    container.appendChild(description);

    category.phrases.forEach(phrase => {
        const row = document.createElement("div");
        row.className = "edit-phrase-row";

        const text = document.createElement("span");
        text.className = "edit-phrase-text";
        text.textContent = phrase.text;

        if (phrase.favorite) {
            const star = document.createElement("span");
            star.textContent = " ★";
            star.className = "edit-favorite-indicator";
            star.setAttribute("aria-label", "Favorite");
            text.appendChild(star);
        }

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            showPhraseEditForm(categoryId, phrase.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete this phrase?\n\n"${phrase.text}"`
            );

            if (!confirmed) return;

            const previousPhrases = [...category.phrases];

            category.phrases = category.phrases.filter(
                item => item.id !== phrase.id
            );

            if (!savePhraseChange(category, previousPhrases)) {
                return;
            }

            refreshCommunicationCategories();
            renderEditablePhrases(categoryId, container);
        });

        row.append(text, editButton, deleteButton);
        container.appendChild(row);
    });

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "+ Add New Phrase";
    addButton.className = "primary-button";

    addButton.addEventListener("click", () => {
        showPhraseEditForm(categoryId);
    });

    container.appendChild(addButton);
}

// Display the form for adding or editing one phrase.
function showPhraseEditForm(categoryId, phraseId = null) {
    const category = getCategory(categoryId);
    if (!category) return;

    const phrase = phraseId
        ? category.phrases.find(item => item.id === phraseId)
        : null;

    if (phraseId && !phrase) return;

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = phrase ? "Edit Phrase" : "Add New Phrase";

    const description = document.createElement("p");
    description.textContent = `Category: ${category.name}`;

    const form = document.createElement("form");
    form.className = "quick-phrase-editor";

    const group = document.createElement("div");
    group.className = "edit-field-group";

    const label = document.createElement("label");
    label.textContent = "Phrase text";
    label.htmlFor = "editablePhraseText";

    const input = document.createElement("textarea");
    input.id = "editablePhraseText";
    input.rows = 3;
    input.maxLength = 300;
    input.required = true;
    input.value = phrase ? phrase.text : "";

    group.append(label, input);
    form.appendChild(group);

    const actions = document.createElement("div");
    actions.className = "edit-form-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    cancelButton.addEventListener("click", () => {
        showPhraseEditor(categoryId);
    });

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Save Phrase";
    saveButton.className = "primary-button";

    actions.append(cancelButton, saveButton);
    form.appendChild(actions);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const newText = input.value.trim();

        if (!newText) {
            alert("Phrase text cannot be empty.");
            return;
        }

        // Keep a snapshot for rollback if storage fails.
        const previousPhrases = category.phrases.map(
            item => ({ ...item })
        );

        if (phrase) {
            // Editing preserves the phrase ID and favorite status.
            phrase.text = newText;
        } else {
            category.phrases.push({
                id: createPhraseId(),
                text: newText,
                favorite: false
            });
        }

        if (!savePhraseChange(category, previousPhrases)) {
            return;
        }

        refreshCommunicationCategories();
        showPhraseEditor(categoryId);
    });

    editModeContent.append(heading, description, form);
    input.focus();
}

// Refresh the communication interface after vocabulary changes.
function refreshCommunicationCategories() {
    renderCategories();
    showCategories();
}

editCategoryPhrasesButton.addEventListener("click", () => {
    showPhraseEditor();
});


/* =========================================
   CATEGORY CREATION AND DELETION
========================================= */

// Generate a permanent ID for a new category.
function createCategoryId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return "category-" + crypto.randomUUID();
    }

    return "category-" + Date.now() + "-" +
        Math.random().toString(36).slice(2);
}

// Create a new category.
function showAddCategoryForm() {
    if (!vocabulary) return;

    editModeContent.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Add New Category";

    const description = document.createElement("p");
    description.textContent =
        "Create a new category. You can add phrases to it afterward.";

    const form = document.createElement("form");
    form.className = "quick-phrase-editor";

    const group = document.createElement("div");
    group.className = "edit-field-group";

    const label = document.createElement("label");
    label.textContent = "Category Name";
    label.htmlFor = "newCategoryName";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "newCategoryName";
    input.maxLength = 60;
    input.required = true;
    input.placeholder = "e.g. Family & Friends";

    group.append(label, input);
    form.appendChild(group);

    const actions = document.createElement("div");
    actions.className = "edit-form-actions";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    cancelButton.addEventListener("click", showCategoryEditor);

    const saveButton = document.createElement("button");
    saveButton.type = "submit";
    saveButton.textContent = "Create Category";
    saveButton.className = "primary-button";

    actions.append(cancelButton, saveButton);
    form.appendChild(actions);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name = input.value.trim();

        if (!name) {
            alert("Please enter a category name.");
            return;
        }

        // Prevent duplicate category names.
        const duplicate = vocabulary.categories.some(
            category =>
                category.name.toLocaleLowerCase() ===
                name.toLocaleLowerCase()
        );

        if (duplicate) {
            alert("A category with that name already exists.");
            return;
        }

        const newCategory = {
            id: createCategoryId(),
            name: name,
            phrases: []
        };

        vocabulary.categories.push(newCategory);

        if (!saveVocabulary()) {
            vocabulary.categories.pop();
            alert("Unable to save the new category.");
            return;
        }

        renderCategories();
        showCategories();
        showCategoryEditor();
    });

    editModeContent.append(heading, description, form);
    input.focus();
}

