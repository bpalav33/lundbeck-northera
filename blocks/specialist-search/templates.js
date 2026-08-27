export function createResultsSection() {
  const section = document.createElement('div');
  section.classList.add('cmp-specialist__result-section');
  section.style.display = 'none';

  // Map Section
  const mapSection = document.createElement('section');
  mapSection.classList.add( 'cmp-result__googlemap');

  const mapArea = document.createElement('div');
  mapArea.id = 'cmp-googlemap__placeholder';
  mapArea.classList.add( 'cmp-googlemap__maparea' );

  const mapPlaceholder = document.createElement('div');
  mapPlaceholder.classList.add( 'cmp-googlemap__placeholder' );

  const mapTitle = document.createElement('strong');
  mapTitle.textContent = 'Google Maps Placeholder';

  const latPara = document.createElement('p');
  latPara.append('Lat: ');

  const latSpan = document.createElement('span');
  latSpan.classList.add('map-lat');
  latPara.append(latSpan);

  const lngPara = document.createElement('p');
  lngPara.append('Lng: ');

  const lngSpan = document.createElement('span');
  lngSpan.classList.add('map-lng');
  lngPara.append(lngSpan);

  mapPlaceholder.append( mapTitle, latPara, lngPara);
  mapArea.append(mapPlaceholder);
  mapSection.append(mapArea);

  // Result Header Section
  const resultHeader = document.createElement('div');
  resultHeader.classList.add( 'cmp-specialist__result' );

  const heading = document.createElement('p');
  heading.textContent = 'Results for Your Area';

  const doctorMiles = document.createElement('div');
  doctorMiles.classList.add( 'cmp-result__doctormiles');

  const lengthSpan = document.createElement('span');
  lengthSpan.classList.add( 'cmp-result__length');

  const radiusSelect = document.createElement('select');
  radiusSelect.id = 'cmp-specialist__selectradius';

  [10, 20, 30].forEach((radius) => {
    const option = document.createElement('option');
    option.value = radius;
    option.textContent = radius;
    if (radius === 10) { option.selected = true; }
    radiusSelect.append(option);
  });

  const distanceSpan = document.createElement('span');
  distanceSpan.classList.add( 'cmp-result__distance' );
  distanceSpan.append('miles of ');

  const zipCodeSpan = document.createElement('span');
  zipCodeSpan.classList.add( 'cmp-result__zipCode' );

  distanceSpan.append(zipCodeSpan);

  doctorMiles.append(
    lengthSpan,
    document.createTextNode( ' specialists within '),
    radiusSelect,
    distanceSpan,
  );

  resultHeader.append( heading, doctorMiles );

  // Results List Section
  const listSection = document.createElement('section');
  listSection.classList.add( 'cmp-result__list-section' );

  const listContainer = document.createElement('div');
  listContainer.classList.add( 'cmp-result__lists');

  listSection.append(listContainer);

  // Append all sections
  section.append( mapSection, resultHeader, listSection);

  return section;
}

export function renderProvider(provider) {
  const panel = document.createElement('div');
  panel.classList.add('cmp-panel');
  panel.dataset.providerId = provider.lundbeckID;

  const details = document.createElement('div');
  details.classList.add('cmp-specialistsdetails');

  const desktop = document.createElement('div');
  desktop.classList.add(
    'cmp-specialistsdetails__desktop',
  );

  const row = document.createElement('div');
  row.classList.add('row');

  // Doctor Name
  const doctorName = document.createElement('div');
  doctorName.classList.add( 'cmp-specialistsdetails__coloumn', 'cmp-coloumn__doctorname' );
  doctorName.textContent = `${provider.firstName} ${provider.lastName}`;

  // Specialty
  const specialty = document.createElement('div');
  specialty.classList.add( 'cmp-specialistsdetails__coloumn', 'cmp-coloumn__specialty' );
  specialty.textContent = provider.specialty;

  // Address Section
  const addressSection = document.createElement('div');
  addressSection.classList.add( 'cmp-specialistsdetails__coloumn', 'cmp-coloumn__addressSection' );

  const addressIcon =document.createElement('img');
  addressIcon.src = './icons/map-marker.svg';
  addressIcon.alt = 'Address Icon';

  const addressContainer = document.createElement('div');
  addressContainer.classList.add( 'cmp-addressContainer' );

  const address = document.createElement('span');
  address.classList.add( 'cmp-coloumn__address');

  address.textContent = [
    provider.primaryAddress,
    provider.addtionalPrimaryAddress,
    provider.city,
    provider.state,
    provider.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  const phoneLink = document.createElement('a');
  phoneLink.classList.add( 'cmp-coloumn__telNumber' );
  phoneLink.href = `tel:${provider.phNumber}`;
  phoneLink.textContent = provider.phNumber;

  addressContainer.append( address, phoneLink );
  addressSection.append( addressIcon );
  addressSection.append( addressContainer );

  // Distance
  const miles = document.createElement('div');
  miles.classList.add( 'cmp-specialistsdetails__coloumn', 'cmp-coloumn__miles' );
  miles.textContent = `${provider.distance} miles`;

  row.append( doctorName, specialty, addressSection, miles );

  desktop.append(row);
  details.append(desktop);

  panel.append(details);

  return panel;
}
