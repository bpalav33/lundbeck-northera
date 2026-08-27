import { getCoordsAsync, showLocationOnMap, resizeMap } from './map.js';
import getSpecialistData from './api.js';
import { renderResults, attachRadiusHandler } from './results.js';
import { getConfig, getResultSection } from './state.js';

export async function submitForm(form) {
  const zipInput = form.querySelector('.specialist-search-zip input');
  const zip = zipInput.value.trim();

  try {
    const coords = await getCoordsAsync(zip);
    showLocationOnMap(coords.lat, coords.lng, 10);

    const DEFAULT_RADIUS = 10;
    const config = getConfig();
    const specialistData = await getSpecialistData(coords, config.apiEndpoint, zip, DEFAULT_RADIUS);
    const providers = typeof specialistData.MemberList === 'string'
      ? JSON.parse(specialistData.MemberList)
      : specialistData.MemberList;

    const resultSection = getResultSection();
    form.style.display = 'none';
    resultSection.style.display = 'block';

    renderResults(resultSection, providers, zip);
    resizeMap();
    attachRadiusHandler(resultSection, coords, zip, config);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  form.parentElement.style.backgroundImage = 'none';
}

export function initValidationListeners(form) {
  if (form.dataset.validationInitialized) {
    return;
  }

  form.dataset.validationInitialized = 'true';

  const zipInput = form.querySelector('#form-zipcode');
  const termsInput = form.querySelector('#form-terms');
  const button = form.querySelector('#form-submitbtn');

  if (!zipInput || !termsInput || !button) {
    return;
  }

  const removeError = (field) => {
    document
      .querySelectorAll(`.form-error[data-field="${field.id}"]`)
      .forEach((err) => err.remove());
  };

  const showError = (field, message) => {
    const existingErrors = [...document.querySelectorAll('.form-error')]
      .filter((err) => err.dataset.field === field.id);

    existingErrors.forEach((err) => err.remove());

    const error = document.createElement('div');
    error.className = 'form-error';
    error.dataset.field = field.id;
    error.textContent = message;

    button.before(error);
  };

  // ZIP validation happens only when the user leaves the field.
  zipInput.addEventListener('blur', () => {
    const zip = zipInput.value.trim();

    if (zip.length !== 5) {
      showError(zipInput, 'This is an invalid zip code.');
    } else {
      removeError(zipInput);
    }
  });

  // Remove ZIP error when the user starts entering a valid ZIP again.
  zipInput.addEventListener('input', () => {
    if (zipInput.value.trim().length === 5) {
      removeError(zipInput);
    }
  });

  // Remove Terms error as soon as the box is checked.
  termsInput.addEventListener('change', () => {
    if (termsInput.checked) {
      removeError(termsInput);
    }
  });

  button.addEventListener('click', async (event) => {
    event.preventDefault();

    const zip = zipInput.value.trim();
    const termsAccepted = termsInput.checked;

    let isValid = true;

    // ZIP validation on submit
    if (zip.length !== 5) {
      showError(zipInput, 'This is an invalid zip code.');
      isValid = false;
    } else {
      removeError(zipInput);
    }

    // Terms validation
    if (!termsAccepted) {
      showError(
        termsInput,
        'Terms and Conditions is a required field.',
      );
      isValid = false;
    } else {
      removeError(termsInput);
    }

    if (!isValid) {
      return;
    }

    await submitForm(form);
  });
}
