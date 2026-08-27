export default async function getSpecialistData(coords, apiEndpoint, zipCode, miles = 10) {
  const formData = new FormData();

  formData.append('zipLat', coords.lat);
  formData.append('zipLong', coords.lng);
  formData.append('zipCode', zipCode);
  formData.append('miles', miles);

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
