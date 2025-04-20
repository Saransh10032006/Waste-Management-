let map;
let marker;

function initMap() {
  const defaultLocation = { lat: 28.6139, lng: 77.2090 }; // Delhi default

  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });

  marker = new google.maps.Marker({
    position: defaultLocation,
    map: map,
    draggable: true,
  });

  map.addListener("click", (e) => {
    placeMarker(e.latLng);
  });

  marker.addListener("dragend", () => {
    const pos = marker.getPosition();
    updateLocationInput(pos);
  });
}

function placeMarker(position) {
  marker.setPosition(position);
  updateLocationInput(position);
  map.panTo(position);
}

function updateLocationInput(pos) {
  const lat = pos.lat().toFixed(5);
  const lng = pos.lng().toFixed(5);
  document.getElementById("location").value = `Lat: ${lat}, Lng: ${lng}`;

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ location: { lat: parseFloat(lat), lng: parseFloat(lng) } }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById("location").value = results[0].formatted_address;
    } else {
      console.warn("Geocoder failed due to: " + status);
    }
  });
}

document.getElementById('getLocationBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const currentLocation = { lat: latitude, lng: longitude };
      placeMarker(currentLocation);
      map.setZoom(16);
    },
    (error) => {
      alert('Unable to retrieve your location.');
      console.error(error);
    }
  );
});

document.getElementById('complaintForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const imageFile = document.getElementById('image').files[0];
  const location = document.getElementById('location').value;
  const description = document.getElementById('description').value;
  const statusMsg = document.getElementById('statusMessage');

  if (!imageFile || !location) {
    alert("Please upload an image and provide a location.");
    return;
  }

  try {
    // Upload image to Firebase Storage
    const storageRef = firebase.storage().ref('reports/' + Date.now() + '_' + imageFile.name);
    const snapshot = await storageRef.put(imageFile);
    const imageUrl = await snapshot.ref.getDownloadURL();

    // Save to Firestore
    await db.collection('wasteReports').add({
      imageUrl,
      location,
      description,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    statusMsg.textContent = "✅ Report submitted and saved!";
    this.reset();
    marker.setMap(null); // Reset marker
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "❌ Failed to submit report. Try again.";
  }
});
