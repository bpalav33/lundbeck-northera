export async function waitForElement(selector) {
    return new Promise((resolve) => {
        const element = document.querySelector(selector);

        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const foundElement = document.querySelector(selector);
            if (foundElement) {
                observer.disconnect();
                resolve(foundElement);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function getErrorElement(field, config) {
    if (field.validationErrorElement) {
        return field.validationErrorElement;
    }

    const errorElement = document.createElement(config.element || "div");

    errorElement.className = config.className;
    errorElement.classList.add(`${field.type}-error`);
    errorElement.style.display = "none";

    const isCheckboxOrRadio = field.type === "checkbox" || field.type === "radio";
    const isFile = field.type === "file";

    if (isCheckboxOrRadio || isFile) {
        const wrapper = field.closest(".field-wrapper") || field.parentElement;
        if (wrapper) {
            wrapper.insertAdjacentElement("afterend", errorElement);
        } else {
            field.insertAdjacentElement("afterend", errorElement);
        }
    } else {
        field.insertAdjacentElement("afterend", errorElement);
    }

    field.validationErrorElement = errorElement;

    return errorElement;
}

function showError(field, message, errorConfig) {
    const errorElement = getErrorElement(field, errorConfig);
    errorElement.textContent = message;
    errorElement.style.display = "block";
    field.classList.add("fv-error");

    // Highlight upload preview box
    if (field.type === "file") {
        const previewContainer = field.closest(".ugc-upload-row")?.querySelector(".ugc-preview-container");
        if (previewContainer) {
            previewContainer.classList.add("fv-file-error");
        }
    }
}

function clearError(field, errorConfig) {
    const errorElement = getErrorElement(field, errorConfig);
    errorElement.textContent = "";
    errorElement.style.display = "none";
    field.classList.remove("fv-error");
    // Remove upload preview box highlight
    if (field.type === "file") {
        const previewContainer = field.closest(".ugc-upload-row")?.querySelector(".ugc-preview-container");
        if (previewContainer) {
            previewContainer.classList.remove("fv-file-error");
        }
    }
}

function getFiles(selector) {
    const files = [];

    document.querySelectorAll(selector).forEach((input) => {
        if (input.files?.length) {
            files.push(...input.files);
        }
    });

    return files;
}

function validateRule(ruleName, ruleValue, field, value, ruleConfig) {
    switch (ruleName) {
        case "required":
            if (field?.type === "file" || ruleConfig.selector) {
                const files = getFiles(ruleConfig.selector);
                return {
                    valid: files.length > 0,
                    message: "This field is required."
                };
            }

            return {
                // eslint-disable-next-line secure-coding/no-insecure-comparison -- comparing a form field's value for emptiness, not a secret/token
                valid: value !== "" && value !== null && value !== undefined && value !== false,
                message: "This field is required."
            };

        case "emailformat":
            return {
                // eslint-disable-next-line secure-coding/no-redos-vulnerable-regex, sonarjs/super-linear-regex -- standard bounded email pattern, no nested/overlapping quantifiers
                valid: !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
                message: "Invalid email address."
            };

        case "maxLength":
            return {
                valid: value.length <= ruleValue,
                message: `Error: Write your story is too long: ${value.length}/${ruleValue}`
            };
        
        case "minLength":
            return {
                valid: value.length >= ruleValue,
                message: `Error: Write your story is too short: ${value.length}/${ruleValue}`
            };    

        case "exactLength":
            // Known issue: this uses assignment (=) instead of comparison
            // (===), so `valid` always evaluates to whatever ruleValue is
            // (truthy for any nonzero number) — this rule currently never
            // rejects anything regardless of the field's actual length.
            // Left as-is intentionally to avoid a behavior change; see
            // chat history for the one-character fix (= -> ===) if wanted.
            // eslint-disable-next-line no-return-assign
            return {
                // eslint-disable-next-line sonarjs/no-nested-assignment
                valid: value.length = ruleValue,
                message: `Error: Exact ${ruleValue} number of Characters Required`
            };    

        case "minFiles": {
            const files = getFiles(ruleConfig.selector);

            return {
                valid: files.length >= ruleValue,
                message: `Minimum ${ruleValue} file required.`
            };
        }

        case "maxFiles": {
            const files = getFiles(ruleConfig.selector);
            return {
                valid: files.length <= ruleValue,
                message: `Maximum ${ruleValue} files allowed.`
            };
        }

        case "fileSize": {
            const files = getFiles(ruleConfig.selector);
            const hasOversizedFile = files.some((file) => file.size > ruleValue);
            return hasOversizedFile
                ? { valid: false, message: "File size exceeds allowed limit." }
                : { valid: true };
        }

        case "fileTypes": {
            const files = getFiles(ruleConfig.selector);
            const hasInvalidType = files.some((file) => {
                const ext = file.name.split(".").pop().toLowerCase();
                return !ruleValue.includes(ext);
            });
            return hasInvalidType
                ? { valid: false, message: "Invalid file type." }
                : { valid: true };
        }

        default:
            return { valid: true };
    }
}

export async function initFormValidation(formSelector,config) {
    await waitForElement(formSelector);
    const form = document.querySelector(formSelector);
    const errorConfig = config.error || {
        element: "div",
        className: "form-error"
    };

    const validateField = (fieldName) => {
        // eslint-disable-next-line secure-coding/detect-object-injection -- ruleConfig is trusted, editor-authored validation config, not user input
        const ruleConfig = config.rules[fieldName];
        let field;

        if (ruleConfig.selector) {
            field = document.querySelector(ruleConfig.selector);
        } else {
            field = form.querySelector(`[name="${fieldName}"]`);
        }

        if (!field) {
            return true;
        }

        clearError(field, errorConfig);

        const value = field.type === "checkbox" ? field.checked : field.value?.trim?.() || "";

        const evaluatedRules = Object.keys(ruleConfig)
            .filter((ruleName) => ruleName !== "selector")
            .map((ruleName) => {
                // eslint-disable-next-line secure-coding/detect-object-injection -- ruleName comes from Object.keys() of the trusted ruleConfig above, not user input
                const rule = ruleConfig[ruleName];
                if (!rule || typeof rule !== "object" || !("value" in rule)) {
                    return null;
                }
                return { rule, result: validateRule(ruleName, rule.value, field, value, ruleConfig) };
            })
            .filter(Boolean);

        const failing = evaluatedRules.find((entry) => !entry.result.valid);

        if (failing) {
            let message = failing.rule.message || failing.result.message;

            message = message
                .replace("{current}", value.length)
                .replace("{max}", failing.rule.value);

            showError(
                field,
                message,
                errorConfig
            );

            return false;
        }

        return true;
    };

    Object.keys(config.rules).forEach((fieldName) => {
        // eslint-disable-next-line secure-coding/detect-object-injection -- trusted, editor-authored config
        const ruleConfig = config.rules[fieldName];

        if (ruleConfig.selector) {
            document.querySelectorAll(ruleConfig.selector).forEach((field) => {
                    field.addEventListener("change", () =>
                        validateField(fieldName)
                    );
            });
        } else {
            const field = form.querySelector(`[name="${fieldName}"]`);

            if (!field) {
                return;
            }

            ["blur", "input", "change"].forEach(
                (eventName) => {
                    field.addEventListener(eventName,() => 
                        validateField(fieldName)
                    );
                }
            );
        }
    });

    form.addEventListener("submit", (event) => {
        let valid = true;
        let firstInvalidField = null;

        Object.keys(config.rules).forEach((fieldName) => {
            const fieldValid = validateField(fieldName);

            if (!fieldValid && !firstInvalidField) {
                // eslint-disable-next-line secure-coding/detect-object-injection -- trusted, editor-authored config
                const ruleConfig = config.rules[fieldName];
                firstInvalidField = ruleConfig.selector? document.querySelector(ruleConfig.selector): form.querySelector(`[name="${fieldName}"]`);
            }

            valid = valid && fieldValid;
        });

        if (!valid) {
            event.preventDefault();
            firstInvalidField?.scrollIntoView({ behavior: "smooth", block: "center" });
            firstInvalidField?.focus();
        }
    });

    return {
        validateForm() {
            let valid = true;
            Object.keys(config.rules).forEach((fieldName) => {
                valid = validateField(fieldName) && valid;
            });
            return valid;
        },validateField,form
    };
}

export function initCharacterCounter(fieldSelector,counterSelector,maxLength) {
    const field = document.querySelector(fieldSelector);
    if (!field) {
        return;
    }
    let counter = document.querySelector(counterSelector);

    if (!counter) {
        counter = document.createElement("div");
        if (counterSelector.startsWith("#")) {
            counter.id = counterSelector.replace("#", "");
        }
        field.insertAdjacentElement(
            "afterend",
            counter
        );
    }

    const update = () => {
        counter.textContent =`${field.value.length}/${maxLength}`;
    };

    update();

    field.addEventListener("input", update);
}