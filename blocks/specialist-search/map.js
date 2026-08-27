/* global google */
import { loadScript } from '../../scripts/aem.js';

const markers = new Map();
let map;
let activeMarker = null;

export async function initializeMap(apiKey) {
  await loadScript(`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`);

  if (!window.google?.maps) {
    throw new Error('Google Maps failed to load');
  }

  const mapElement = document.getElementById('cmp-googlemap__placeholder');
  map = new google.maps.Map(mapElement,
    {center: {lat: 37.09,lng: -95.71,},
    zoom: 8,
    mapTypeControl: true,
    streetViewControl: true,
    fullscreenControl: true,
    disableDefaultUI: false,
  });

  return map;
}

export async function getCoordsAsync(zipCode) {
  const res = await new google.maps.Geocoder().geocode({ address: zipCode});

  if (res.results?.length) {
    return {
      lat: res.results[0].geometry.location.lat(),
      lng: res.results[0].geometry.location.lng()
    };
  }

  return null;
}


// NOTE: `markers` is never populated (nothing calls markers.set(...) in this
// file) — per-provider pin markers were never wired up as a feature, so
// registerProviderMarkers/focusProviderOnMap are currently no-ops. Sonar
// correctly flags this as dead code. Suppressing rather than implementing
// marker population here, since that would be a functional addition, not a
// lint fix — flag if per-provider markers should actually be built out.
export function registerProviderMarkers() {
  // eslint-disable-next-line sonarjs/no-empty-collection
  markers.forEach((marker) => {
    marker.setMap(null);
  });
  // eslint-disable-next-line sonarjs/no-empty-collection
  markers.clear();
}

export function focusProviderOnMap(providerId) {
  // eslint-disable-next-line sonarjs/no-empty-collection
  const marker = markers.get(providerId);

  if (!marker) {
    return;
  }

  map.panTo(marker.getPosition());
  map.setZoom(15);
  marker.setAnimation(google.maps.Animation.BOUNCE);

  setTimeout(() => {
    marker.setAnimation(null);
  }, 1500);
}


export function showLocationOnMap(lat,lng,zoom = 12) {
  // Remove existing marker
  if (activeMarker) {
    activeMarker.setMap(null);
  }

  activeMarker = new google.maps.Marker({
    position: {
      lat: Number(lat),
      lng: Number(lng),
    },
    map,
  });

  map.panTo({
    lat: Number(lat),
    lng: Number(lng),
  });

  map.setZoom(zoom);
}

// Google Maps only paints tiles for the container size it knew about at
export function resizeMap() {
  if (!map) {
    return;
  }
  google.maps.event.trigger(map, 'resize');
}
