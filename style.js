var map = L.map('map').setView([-22.5609, 17.0658], 12);

var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

var baseMaps = {"OpenStreetMap": osm};

//Importing Styled Layers from Geoserver
var wmsLayers = { 
    "Townships": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:whk_townships",  format: 'image/png', transparent: true,}),

    "Streets": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:whk_streets",  format: 'image/png', transparent: true,}),

    "Trunk Roads": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:Windhoek_Trunk_Road",  format: 'image/png', transparent: true,}),

    "Police Station Radius of 2km": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:buffer_police",  format: 'image/png', transparent: true,}),    

    "CCTV Radius of 150m": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:CCTVbuffer",  format: 'image/png', transparent: true,}),

    "CCTV Camera": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:CCTV_Cameras",  format: 'image/png', transparent: true,}),

    "Police Stations": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:PoliceStation",  format: 'image/png', transparent: true,}),

    "Crime Hotspots": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:crimehotspot",  format: 'image/png', transparent: true,}),

    "Crime Incidents": L.tileLayer.wms('http://10.101.59.74:8080/geoserver/Windhoek/wms?',{
        layers:	"Windhoek:crimeincidents",  format: 'image/png', transparent: true,}),

    
    };

L.control.layers(baseMaps,wmsLayers).addTo(map);


// Crime data WFS URL
const wfsUrl = 'http://localhost:8080/geoserver/Windhoek/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=Windhoek%3Acrimeincidents&maxFeatures=50';

// Create an empty layer to hold the crime incident markers
var crimeincident = L.layerGroup().addTo(map);

// Function to fetch crime data from GeoServer WFS
function fetchCrimeIncident() {
    // Fetch the XML data from GeoServer
    fetch(wfsUrl)
        .then(response => response.text()) // Parse the response as text (XML)
        .then(xmlText => {
            // Parse the XML text into an XML document
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlText, "application/xml");

            // Clear existing markers on the map
            crimeincident.clearLayers();

            // Get all crime incidents from the XML response
            var crimeNodes = xmlDoc.getElementsByTagName('Windhoek:crimeincidents');
            
            // Iterate over crime nodes and add markers
            Array.from(crimeNodes).forEach(crimeNode => {
                var coordinates = crimeNode.getElementsByTagName('gml:coordinates')[0].textContent.split(',');
                var lat = parseFloat(coordinates[1]); // Latitude
                var lng = parseFloat(coordinates[0]); // Longitude
                var name = crimeNode.getElementsByTagName('Windhoek:Name')[0]?.textContent || "No name available";
                var type = crimeNode.getElementsByTagName('Windhoek:FolderPath')[0]?.textContent || "Unknown";

                // Assign a color based on the crime type
                var markerColor = getCrimeColor(type);

                // Create marker
                var marker = L.marker([lat, lng]).addTo(crimeincident);

                // Assign a color to the marker based on the crime type
                marker.setIcon(L.divIcon({
                    className: 'marker-icon',
                    iconSize: [10, 10], 
                    iconAnchor: [5, 5],
                    bgOpacity: 0.8,
                    className: 'marker-' + markerColor // Adds color based on crime type
                }));
            });
        })
        .catch(err => {
            console.error('Error fetching crime data:', err);
        });
}

// Function to get marker color based on crime type
function getCrimeColor(type) {
    switch (type) {
        case 'Assault GBV':
            return 'FF0000'; // Red
        case 'Armed Robberies':
            return 'FFA500'; // Orange
        case 'ATM Card Snatching':
            return '387C3F'; // Green
        case 'Cellphone Grabbing':
            return '7A3883'; // Purple
        case 'Cellphone Grabbing Out Of Vehicle':
            return '833838'; // Maroon
        case 'Hijacking':
            return '837638'; // Olive
        case 'Housebreaking':
            return '38837E'; // Teal
        case 'Liquor Act':
            return '383D83'; // Blue
        case 'Murder/Rape':
            return '83833D'; // Olive-brown
        case 'Rape/Murder':
            return '384E83'; // Dark blue
        case 'Robberies From Shop':
            return '7C8338'; // Yellow-green
        case 'Theft From Person':
            return '833D66'; // Dark pink
        case 'Theft Out Of Motor Vehicle':
            return '5D3883'; // Dark purple
        default:
            return '808080'; // Gray for unknown types
    }
}

// Initial load with all crime data
fetchCrimeIncident();

// Add a legend to the map
var legend = L.control({ position: 'topright' });

legend.onAdd = function () {
    var div = L.DomUtil.create('div', 'legend');
    var crimeTypes = [
        { type: 'Assault GBV', color: 'FF0000' },
        { type: 'Armed Robberies', color: 'FFA500' },
        { type: 'ATM Card Snatching', color: '387C3F' },
        { type: 'Cellphone Grabbing', color: '7A3883' },
        { type: 'Cellphone Grabbing Out Of Vehicle', color: '833838' },
        { type: 'Hijacking', color: '837638' },
        { type: 'Housebreaking', color: '38837E' },
        { type: 'Liquor Act', color: '383D83' },
        { type: 'Murder/Rape', color: '83833D' },
        { type: 'Rape/Murder', color: '384E83' },
        { type: 'Robberies From Shop', color: '7C8338' },
        { type: 'Theft From Person', color: '833D66' },
        { type: 'Theft Out Of Motor Vehicle', color: '5D3883' }
    ];

    crimeTypes.forEach(function (crime) {
        div.innerHTML += `<div><span style="background:#${crime.color}"></span>${crime.type}</div>`;
    });

    return div;
};

// Add the legend to the map
legend.addTo(map);

// Add a scale bar to the map
L.control.scale({ position: 'bottomleft' }).addTo(map);

