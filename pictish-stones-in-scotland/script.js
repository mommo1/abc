// Define the base layers: Satellite and OpenStreetMap
var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="https://www.esri.com">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Initialize the map with a default view of Scotland
var map = L.map('map', {
  center: [58.5, -4.3],  // Coordinates for Scotland
  zoom: 7,
  layers: [satelliteLayer]  // Default to satellite layer
});

// Layer control to toggle between the layers
L.control.layers({
  "Satellite Imagery": satelliteLayer,
  "OpenStreetMap with Labels": osmLayer
}).addTo(map);

// Define the Ordnance Survey Grid and WGS84 coordinates systems
var osgb36 = "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +datum=OSGB36 +units=m +no_defs";
var wgs84 = "+proj=longlat +datum=WGS84 +no_defs";  // WGS84 system (Latitude/Longitude)

// Function to load CSV data and parse it
function loadCSV() {
  var csvUrl = 'https://raw.githubusercontent.com/mommo1/username.github.io/main/pictish_stones.csv';  // Corrected CSV URL
  Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function(results) {
      console.log(results);  // Log the CSV results to check
      addMarkersToMap(results.data);  // Add markers after parsing CSV
    }
  });
}

// Function to add markers for the Pictish Stones
function addMarkersToMap(stones) {
  var markersLayer = L.layerGroup();  // Create a layer to store the markers for search functionality
  var markers = [];  // This will hold the markers for the search control

  stones.forEach(function(stone) {
    var easting = parseFloat(stone["SITE EASTING"]);
    var northing = parseFloat(stone["SITE NORTHING"]);

    var coords = proj4(osgb36, wgs84, [easting, northing]);
    var lat = coords[1];   // Latitude
    var lon = coords[0];   // Longitude

    var name = stone["SITE NAME"];
    var description = stone["SITE TYPE"] + ": " + stone["SITE NAME"];
    var url = stone.URL;

   // Create a custom icon
var pictishIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/mommo1/username.github.io/main/pictish_stone_icon.png', // Path to your image
  iconSize: [33, 33], // Size of the icon (you can adjust this)
  iconAnchor: [16, 32], // Anchor point (to center it on the map)
  popupAnchor: [0, -32] // Popup positioning relative to the icon
});

// Use the custom icon when adding a marker
var marker = L.marker([lat, lon], {icon: pictishIcon})
  .bindPopup("<b>" + name + "</b><br>" + description + "<br><a href='" + url + "' target='_blank'>More Info</a>")
  .addTo(map);
    
    
    markers.push({
      name: name,
      latLng: [lat, lon],
      marker: marker
    });

    markersLayer.addLayer(marker);  // Add marker to the layer
  // Mouse-over event to change marker style and open popup
    marker.on('mouseover', function (e) {
  var layer = e.target;
  var icon = layer.options.icon;
  var largerIcon = L.icon({
    iconUrl: icon.options.iconUrl,
    iconSize: [40, 40],  // Slightly larger size
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
  layer.setIcon(largerIcon);
  layer.openPopup();
});

marker.on('mouseout', function (e) {
  var layer = e.target;
  var icon = layer.options.icon;
  var originalIcon = L.icon({
    iconUrl: icon.options.iconUrl,
    iconSize: [33, 33],  // Original size
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
  layer.setIcon(originalIcon);
});
 });

  // Create the search control using the markers layer
  var searchControl = new L.Control.Search({
    layer: markersLayer,  // Use the markersLayer for search
    propertyName: 'name', // Search based on the 'name' property of the markers
    zoom: 12,             // Zoom level after searching
    initial: false,       // No initial marker selected
    marker: false         // Disable creating a new marker on search
  });

  map.addControl(searchControl);  // Add the search control to the map
}

// Add custom fullscreen control (Native)
var fullscreenButton = L.control({ position: 'topright' });

fullscreenButton.onAdd = function () {
  var button = L.DomUtil.create('button', 'leaflet-control-fullscreen');
  button.innerHTML = '⛶'; // Fullscreen icon
  
  L.DomEvent.on(button, 'click', function () {
    if (!document.fullscreenElement) {
      map._container.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
  
  return button;
};

fullscreenButton.addTo(map);

// Call the function to load the CSV and display the markers
loadCSV();