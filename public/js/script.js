const socket = io();

// Track if it's the first time the map is centering on the user's location
let isFirstLocationUpdate = true;

// Initialize the map
const map = L.map("map").setView([20.5937, 78.9629], 4);

// Add a tile layer to the map
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "StreetMap-byPayalKri",
}).addTo(map);

// Store markers by user ID
const markers = {};

// Check for geolocation support and start watching position
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });

      // Only center the map the very first time
      if (isFirstLocationUpdate) {
        map.setView([latitude, longitude], 16);
        isFirstLocationUpdate = false;
      }
    },
    (error) => {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
} else {
  console.log("Geolocation is not supported by this browser.");
}

// Listen for incoming location data from the server
socket.on("receive-location", (data) => {
  const { id, latitude, longitude } = data;

  if (markers[id]) {
    // Update the marker's position
    markers[id].setLatLng([latitude, longitude]);
  } else {
    // Create a new marker if it doesn't exist
    markers[id] = L.marker([latitude, longitude]).addTo(map).bindTooltip(id);
  }
});

// Remove markers when a user disconnects
socket.on("user-disconnected", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
}

// Center map on user's current location
function goToCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 16);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Location error: " + error.message);
      },
      {
        enableHighAccuracy: false, // 🔄 toggle for speed vs precision
        timeout: 10000,
        maximumAge: 10000, // reuse recent result if valid
      }
    );
  } else {
    alert("Geolocation not supported.");
  }
}


// Toggle contributors popup
function toggleContributorsPopup() {
  const popup = document.getElementById("contributorsPopup");
  const hidden = popup.getAttribute("aria-hidden") === "true";
  popup.setAttribute("aria-hidden", hidden ? "false" : "true");
}
