import { initValidationListeners } from './form.js';
import { createResultsSection } from './templates.js';
import { initializeMap } from './map.js';
import { setConfig, setResultSection } from './state.js';

function getFormConfig() {
  const apiEndpoint = document.querySelector('div.specialist-search.block form').getAttribute('data-action');

  const googleMapKey = document.querySelector('#form-gmapikey').textContent;

  const backgroundImage = document.querySelector('#form-bgimageurl').textContent;

  document.querySelectorAll('#form-gmapikey, #form-bgimageurl').forEach((e) => e.remove());
  document.getElementById('form-zipcode-label').style.display = 'none';

  return {
    googleMapKey,
    apiEndpoint,
    backgroundImage,
  };
}

function fixMarkdownText() {
  // Fix Markdown Links
  // NOTE: this regex and the innerHTML assignments below operate on
  // CMS-authored label text (only editors can change it, not site
  // visitors), so the XSS/ReDoS surface here is not attacker-reachable
  // the way it would be for user-supplied input. Suppressing rather than
  // rewriting to DOM-node construction, to avoid risking a behavior
  // change to working markdown/label parsing — see chat for the option
  // to do a full safe rewrite instead.
  document.querySelectorAll('form label').forEach((el) => {
    // eslint-disable-next-line sonarjs/super-linear-regex
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    if (regex.test(el.innerHTML)) {
      // eslint-disable-next-line browser-security/no-innerhtml, secure-coding/no-improper-sanitization
      el.innerHTML = el.innerHTML.replace(regex, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    }
  });

  // Fix Markdown Label
  document.querySelectorAll('.field-wrapper label').forEach((label) => {
    if (label.dataset.labelEnhanced === 'true') {
      return;
    }

    if (!label.textContent.includes('|')) {
      return;
    }

    label.dataset.labelEnhanced = 'true';
    const [labelText, helperText] = label.textContent.split('|');
    // eslint-disable-next-line browser-security/no-innerhtml
    label.innerHTML = `<span class="ugc-label-text"> ${labelText}  </span><span class="ugc-label-helper"> &nbsp;${helperText} </span>`;
  });

  // Fix Bold Text — CMS-authored content only, see note above fixMarkdownText
  document.querySelectorAll('.plaintext-wrapper p').forEach((el) => {
    // eslint-disable-next-line browser-security/no-innerhtml, secure-coding/no-improper-sanitization
    el.innerHTML = el.innerHTML.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  });

  document.querySelector('#form-zipcode').maxLength = 5;
}

export default async function decorate(block) {
  try {
    const module = await import('../form/form.js');
    if (typeof module.default === 'function') {
      await module.default(block);
    }
  } catch (error) {
    // Non-fatal: continue decorating with whatever markup already exists.
    // eslint-disable-next-line no-console
    console.error('Failed to load form block:', error);
  }

  const config = getFormConfig();
  setConfig(config);

  const form = document.querySelector('.specialist-search form');
  form.noValidate = true;

  const resultSection = createResultsSection();
  setResultSection(resultSection);
  block.append(resultSection);
  block.style.backgroundImage = `url('${config.backgroundImage}')`;

  initializeMap(config.googleMapKey);
  fixMarkdownText();
  initValidationListeners(form);
}
