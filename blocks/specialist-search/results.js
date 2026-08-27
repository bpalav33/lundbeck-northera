import { renderProvider } from './templates.js';
import { registerProviderMarkers, showLocationOnMap, resizeMap } from './map.js';
import getSpecialistData from './api.js';

export function renderResults(resultSection, providers, zip) {
  resultSection.querySelector('.cmp-result__length').textContent = providers.length;
  resultSection.querySelector('.cmp-result__zipCode').textContent = zip;

  const list = resultSection.querySelector('.cmp-result__lists');
  list.replaceChildren();

  providers.forEach((provider) => {
      list.append(renderProvider(provider));
  });

  registerProviderMarkers(providers);

  const cards = list.querySelectorAll('.cmp-panel');

  cards.forEach((card) => {
     card.addEventListener( 'click', () => {
      const provider = providers.find( (item) =>
          item.lundbeckID === card.dataset.providerId
      );

      if(provider){
        showLocationOnMap( provider.latitude, provider.longitude, 15);
        document.querySelector('.cmp-result__googlemap')?.scrollIntoView({
          behavior: 'smooth',block: 'start'
        });
      }
    });
  });
}

export function attachRadiusHandler( resultSection,coords,zip,config) {
  const radiusSelect = resultSection.querySelector( '#cmp-specialist__selectradius');

  radiusSelect.addEventListener( 'change', async (e) => {
    try {
      const radius = Number( e.target.value);
      const specialistData = await getSpecialistData( coords,config.apiEndpoint,zip,radius);
      const providers =typeof specialistData.MemberList === 'string'
        ? JSON.parse(specialistData.MemberList)
        : specialistData.MemberList;

      renderResults( resultSection, providers, zip );
      resizeMap();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error( 'Radius change failed:', error);
    }
  });
}
