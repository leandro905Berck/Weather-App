/**
 * Agricola.js - Logic for Agricultural Mode
 * Using Agromonitoring API & Leaflet-Geoman
 */

const AGRO_API_KEY = 'b944c9689e1bdce7cfaa2fa4ae3842a7';
const OWM_API_KEY = '5fa880cce39ad7197758233da7e0c7da';
const AGRO_API_URL = 'https://api.agromonitoring.com/agro/1.0';
const OWM_API_URL = 'https://api.openweathermap.org/data/2.5';
const STORAGE_KEY = 'weather_app_ag_areas';

let map;
let currentUnit = 'hectare'; 
let currentWindUnit = 'kmh'; // 'kmh' or 'ms'
let savedAreas = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let mapLayers = []; // Store references to map layers
let currentActiveIndex = -1;
let forecastChart = null; // Global for Chart.js instance
let radarLayer = null;
let isRadarActive = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initUnitSelector();
    initWindUnitSelector();
    renderSavedAreas();
    renderAllAreasOnMap();
    initRadarToggle(); 
    initGeoLocation(); // New
    
    // Add loading overlay to the new dashboard panel
    const panel = document.querySelector('.ag-dashboard-panel') || document.body;
    if (!document.getElementById('agLoader')) {
        const loader = document.createElement('div');
        loader.id = 'agLoader';
        loader.className = 'ag-loader hidden';
        loader.innerHTML = '<div class="spinner"></div><p>Buscando dados meteorológicos...</p>';
        panel.appendChild(loader);
    }
});

function initMap() {
    const defaultCenter = [-14.2350, -51.9253];
    map = L.map('agMap').setView(defaultCenter, 4);

    // Map Layers
    const streets = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap collaborators © CARTO'
    });

    const satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        attribution: '© Google'
    });

    // Default to Satellite
    satellite.addTo(map);

    // Add Layer Control
    const baseMaps = {
        "🛰️ Satélite": satellite,
        "🗺️ Mapa": streets
    };
    L.control.layers(baseMaps).addTo(map);

    map.pm.addControls({
        position: 'topleft',
        drawMarker: false,
        drawPolyline: false,
        drawRectangle: true,
        drawPolygon: true,
        drawCircle: false,
        drawCircleMarker: false,
        editMode: true,
        dragMode: true,
        cutPolygon: false,
        removalMode: true,
    });

    // Event: When a polygon is finished
    map.on('pm:create', (e) => {
        const layer = e.layer;
        const geojson = layer.toGeoJSON();
        const index = savedAreas.length;
        
        setupLayerListeners(layer, index);
        processNewPolygon(geojson, layer, index);
    });

    // Global hide hint function (more aggressive)
    const hideHint = () => {
        const hint = document.getElementById('mapHint');
        if (hint) {
            hint.classList.add('hidden');
            setTimeout(() => {
                if (hint) hint.style.display = 'none';
            }, 300); // Wait for transition
        }
    };

    // Hide hint on ANY map interaction
    map.on('movestart', hideHint);
    map.on('zoomstart', hideHint);
    map.on('mousedown', hideHint);
    
    // Geoman events
    map.on('pm:drawstart', hideHint);
    map.on('pm:actionstart', hideHint);
    map.on('pm:globaleditmodetoggled', hideHint);
    map.on('pm:globalremovalmodetoggled', hideHint);

    // Fullscreen behavior
    initFullscreenToggle();

    // Invalidate size shortly after to ensure full map render on load
    setTimeout(() => {
        if(map) map.invalidateSize();
    }, 500);
}

function initFullscreenToggle() {
    const btn = document.getElementById('fullscreenBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            // Apply fullscreen directly to the map container, bypassing generic page max-widths
            const mapContainer = document.querySelector('.ag-map-container');
            if(mapContainer) {
                mapContainer.requestFullscreen().catch(err => {});
            }
            btn.innerHTML = '🔲 Sair da Tela Cheia';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                btn.innerHTML = '🔲 Tela Cheia';
            }
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            btn.innerHTML = '🔲 Tela Cheia';
        } else {
            btn.innerHTML = '🔲 Sair da Tela Cheia';
        }
        // Force leaflet to recalculate tiles for the massive size change
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 200);
    });
}

function initRadarToggle() {
    const btn = document.getElementById('radarToggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
        isRadarActive = !isRadarActive;
        if (isRadarActive) {
            btn.classList.add('active');
            btn.innerHTML = '📡 Radar de Chuva: <b>ON</b>';
            addRadarLayer();
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '📡 Radar de Chuva: <b>OFF</b>';
            removeRadarLayer();
        }
    });
}

function addRadarLayer() {
    if (radarLayer) map.removeLayer(radarLayer);
    radarLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OWM_API_KEY}`,
        {
            attribution: '© OpenWeatherMap',
            opacity: 0.65,
            zIndex: 400
        }
    ).addTo(map);
}

function removeRadarLayer() {
    if (radarLayer) {
        map.removeLayer(radarLayer);
        radarLayer = null;
    }
}

function initGeoLocation() {
    const btn = document.getElementById('geoLocateBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert("Geolocalização não suportada no seu navegador.");
            return;
        }

        btn.innerHTML = '⏳ Localizando...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 16); // Zoom in close
                btn.innerHTML = '📍 Localizar';
                
                // Add a temporary pulsing marker or similar if desired
                L.circleMarker([latitude, longitude], {
                    radius: 8,
                    fillColor: "#3b82f6",
                    color: "white",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(map).bindPopup("Você está aqui").openPopup();
            },
            (error) => {
                alert("Não foi possível obter sua localização. Verifique as permissões.");
                btn.innerHTML = '📍 Localizar';
            }
        );
    });
}

function renderAllAreasOnMap() {
    // Clear existing layers from the helper array and map
    mapLayers.forEach(l => map.removeLayer(l));
    mapLayers = [];

    savedAreas.forEach((area, index) => {
        const layer = L.geoJSON(area.geojson, {
            style: (feature) => ({
                color: area.color || '#3b82f6',
                fillColor: area.color || '#3b82f6',
                fillOpacity: index === currentActiveIndex ? 0.4 : 0.1,
                weight: index === currentActiveIndex ? 4 : 2,
                dashArray: index === currentActiveIndex ? '' : '5, 5'
            }),
            onEachFeature: (feature, l) => {
                l.pm.setOptions({ id: area.id, index: index });
                setupLayerListeners(l, index);
                
                // Click to select
                l.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    loadSavedArea(index);
                });
            }
        }).addTo(map);
        
        mapLayers.push(layer);
    });
}

function initUnitSelector() {
    const select = document.getElementById('areaUnitSelect');
    if (select) {
        select.addEventListener('change', (e) => {
            currentUnit = e.target.value;
            updateAreaDisplay();
            renderSavedAreas(); 
        });
    }
}

function initWindUnitSelector() {
    const buttons = document.querySelectorAll('#windUnitToggle .compact-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWindUnit = btn.dataset.windUnit;
            if(currentActiveIndex >= 0) {
                const area = savedAreas[currentActiveIndex];
                fetchAgData(area.id);
            }
        });
    });
}

function updateAreaDisplay(m2 = null) {
    const sizeSpan = document.getElementById('currentAreaSize');
    const unitSpan = document.getElementById('currentAreaUnit');
    
    // If m2 is provided, store it as the "current" reference
    if (m2 !== null) sizeSpan.dataset.m2 = m2;
    
    const baseM2 = parseFloat(sizeSpan.dataset.m2 || 0);
    if (baseM2 === 0) return;

    let value = 0;
    let unitLabel = 'ha';

    if (currentUnit === 'hectare') {
        value = baseM2 / 10000;
        unitLabel = 'ha';
    } else if (currentUnit === 'paulista') {
        value = baseM2 / 24200;
        unitLabel = 'alq. P';
    } else if (currentUnit === 'mineiro') {
        value = baseM2 / 48400;
        unitLabel = 'alq. M';
    } else if (currentUnit === 'm2') {
        value = baseM2;
        unitLabel = 'm²';
    }

    sizeSpan.textContent = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    unitSpan.textContent = unitLabel;
}

async function processNewPolygon(geojson, layer, index) {
    let latlngs = layer.getLatLngs();
    if(Array.isArray(latlngs[0])) latlngs = latlngs[0]; 
    
    let areaM2 = calculateAreaManual(latlngs);
    
    updateAreaDisplay(areaM2);
    
    const name = await showCustomModal({
        title: "Nomear Nova Área",
        icon: "🚜",
        type: "prompt",
        placeholder: "Ex: Talhão Sul, Fazenda Boa Vista...",
        defaultValue: `Área ${index + 1}`
    });

    if (!name) {
        layer.remove();
        return;
    }

    document.getElementById('areaNameLabel').textContent = name;

    try {
        const polyData = await registerPolygonApi(name, geojson);
        
        if (polyData && polyData.id) {
            const newArea = {
                id: polyData.id,
                name: name,
                m2: areaM2,
                geojson: geojson,
                color: '#3b82f6' // Default Blue
            };
            
            savedAreas.push(newArea);
            saveToStorage();
            
            currentActiveIndex = savedAreas.length - 1;
            renderSavedAreas();
            renderAllAreasOnMap();
            
            fetchAgData(polyData.id);
        }
    } catch (err) {
        alert("Erro ao conectar com a API Agrícola.");
        layer.remove();
    }
}

async function registerPolygonApi(name, geojson) {
    const response = await fetch(`${AGRO_API_URL}/polygons?appid=${AGRO_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: name,
            geo_json: geojson
        })
    });
    return await response.json();
}

async function fetchAgData(polyId) {
    showLoading();
    const area = savedAreas.find(a => a.id === polyId);
    if (!area) return;

    // Calculate centroid for localized weather API (OWM)
    const center = getPolygonCenter(area.geojson);
    const lat = center.lat;
    const lon = center.lng; // Leaflet uses .lng, OWM uses .lon

    try {
        const results = await Promise.allSettled([
            fetchSoilData(polyId),
            fetchWeatherByCoords(lat, lon),   // Real Weather API (OWM)
            fetchForecastByCoords(lat, lon)   // Real Forecast API (OWM)
        ]);

        if (results[0].status === 'fulfilled') updateSoilUI(results[0].value);
        if (results[1].status === 'fulfilled') updateWeatherUI(results[1].value);
        if (results[2].status === 'fulfilled') updateForecastUI(results[2].value);

    } catch (err) {
    } finally {
        hideLoading();
    }
}

function getPolygonCenter(geojson) {
    // Standard Leaflet utility to get center from GeoJSON
    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();
    return bounds.getCenter(); // Returns {lat, lng}
}

async function fetchForecastByCoords(lat, lon) {
    const resp = await fetch(`${OWM_API_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${OWM_API_KEY}`);
    return await resp.json();
}

async function fetchWeatherByCoords(lat, lon) {
    const resp = await fetch(`${OWM_API_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${OWM_API_KEY}`);
    return await resp.json();
}

async function fetchAccumulatedPrecipitation(polyId) {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (7 * 24 * 60 * 60); // 7 days
    const resp = await fetch(`https://api.agromonitoring.com/agro/1.0/weather/history/accumulated_precipitation?polyid=${polyId}&start=${start}&end=${end}&appid=${API_KEY}`);
    return await resp.json();
}

async function fetchAccumulatedTemperature(polyId) {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (30 * 24 * 60 * 60); // 30 days
    const base = 10; // Default base temp for GDD
    const resp = await fetch(`https://api.agromonitoring.com/agro/1.0/weather/history/accumulated_temperature?polyid=${polyId}&start=${start}&end=${end}&threshold=${base}&appid=${API_KEY}`);
    return await resp.json();
}

async function fetchSoilData(polyId) {
    const resp = await fetch(`${AGRO_API_URL}/soil?polyid=${polyId}&appid=${AGRO_API_KEY}`);
    return await resp.json();
}

function updateWeatherUI(data) {
    if (!data || data.message) return;
    
    // Air Temp (API is using units=metric, so temperature is already in Celsius)
    const tempC = data.main.temp.toFixed(1);
    document.getElementById('airTemp').textContent = `${tempC}°C`;

    // Humidity
    const humidity = data.main.humidity;
    document.getElementById('airHumidity').textContent = `Umidade: ${humidity}%`;

    // Precipitation Card (New)
    const rainVol = (data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0).toFixed(1);
    const pop = data.pop ? Math.round(data.pop * 100) : (rainVol > 0 ? 100 : 0);
    
    if (document.getElementById('currentRain')) {
        document.getElementById('currentRain').textContent = `${rainVol} mm`;
    }
    if (document.getElementById('rainProbability')) {
        document.getElementById('rainProbability').textContent = `Probabilidade: ${pop}%`;
    }

    // Wind Speed & Direction (Matching Main Dashboard)
    const speedMS = data.wind.speed;
    const deg = data.wind.deg || 0;
    const gustMS = data.wind.gust;
    
    let windVal, unit, gustVal;
    if (currentWindUnit === 'kmh') {
        windVal = (speedMS * 3.6).toFixed(1);
        gustVal = gustMS ? (gustMS * 3.6).toFixed(1) : null;
        unit = 'km/h';
    } else {
        windVal = speedMS.toFixed(1);
        gustVal = gustMS ? gustMS.toFixed(1) : null;
        unit = 'm/s';
    }
    
    // Wind Card Updates
    if (document.getElementById('windDirName')) {
        document.getElementById('windDirName').textContent = getWindDirectionText(deg);
    }
    if (document.getElementById('windSpeed')) {
        document.getElementById('windSpeed').textContent = windVal;
    }
    if (document.getElementById('windUnitLabel')) {
        document.getElementById('windUnitLabel').textContent = unit;
    }
    if (document.getElementById('windArrow')) {
        document.getElementById('windArrow').style.transform = `rotate(${deg}deg)`;
    }

    // Gusts
    const gustRow = document.getElementById('windGustRow');
    const gustDisplay = document.getElementById('windGust');
    if (gustVal && gustRow && gustDisplay) {
        gustRow.style.display = 'block';
        gustDisplay.textContent = `${gustVal} ${unit}`;
    } else if (gustRow) {
        gustRow.style.display = 'none';
    }
}

function getWindDirectionText(deg) {
    const directions = ['Norte', 'Nordeste', 'Leste', 'Sudeste', 'Sul', 'Sudoeste', 'Oeste', 'Noroeste'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
}

function updateAccumulatedRainUI(data) {
    if (!data || data.message || typeof data.precipitations === 'undefined') return;
    document.getElementById('accRain').textContent = `${data.precipitations.toFixed(1)} mm`;
}

function updateGDDUI(data) {
    if (!data || data.message || typeof data.temperature === 'undefined') {
        document.getElementById('accGDD').textContent = "0";
        return;
    }
    // GDD is the accumulated temperature above a threshold
    document.getElementById('accGDD').textContent = Math.max(0, data.temperature).toFixed(0);
}

function updateForecastUI(data) {
    // Standard OWM 'list' array
    const list = data.list || [];
    if (!list || list.length === 0) return;
    
    // Get next 8 intervals (24h)
    const labels = list.slice(0, 8).map(item => {
        const date = new Date(item.dt * 1000);
        return date.getHours() + "h";
    });
    
    const rainData = list.slice(0, 8).map(item => {
        // OWM structure: rain.3h or 0
        let vol = 0;
        if (item.rain && item.rain['3h']) vol = item.rain['3h'];
        else if (item.precipitation) vol = item.precipitation; // Fallback for some API versions
        return parseFloat(vol).toFixed(1);
    });

    renderForecastChart(labels, rainData);
}

function renderForecastChart(labels, rainData) {
    const ctx = document.getElementById('forecastChart');
    if (!ctx) return;

    if (forecastChart) {
        forecastChart.destroy();
    }

    // Colors matching main dashboard rainfall style
    const borderColor = '#00aaff';
    const bgColor = 'rgba(0, 170, 255, 0.15)';

    forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Chuva (mm)',
                data: rainData,
                borderColor: borderColor,
                backgroundColor: bgColor,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: borderColor,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context) => ` ${context.parsed.y} mm`
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255,255,255,0.7)',
                        font: { size: 10 },
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 5
                    },
                    grid: { display: false }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grace: '15%',
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        callback: (value) => value + ' mm'
                    },
                    grid: { 
                        color: 'rgba(255,255,255,0.05)'
                    }
                }
            }
        },
        plugins: [{
            id: 'chartValueLabels',
            afterDatasetsDraw(chart) {
                const { ctx, data } = chart;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = 'bold 11px sans-serif';

                chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                    const value = data.datasets[0].data[index];
                    if (value > 0) {
                        ctx.fillText(value + 'mm', datapoint.x, datapoint.y - 12);
                    }
                });
                ctx.restore();
            }
        }]
    });
}

function updateSoilUI(data) {
    if (!data || data.status === 404 || data.message) return;

    // Moisture (coming in m3/m3, convert to %)
    const m1 = (data.moisture * 100).toFixed(1);
    
    document.getElementById('soilMoistureSurface').textContent = `${m1}%`;
    document.getElementById('moistureBar1').style.width = `${m1}%`;

    // Temp (Kelvin to Celsius)
    const tempC = (data.t0 - 273.15).toFixed(1);
    document.getElementById('soilTemp').textContent = `${tempC}°C`;
    const tempPercent = Math.min(Math.max((tempC / 50) * 100, 0), 100);
    const tempBar = document.getElementById('soilTempBar');
    if (tempBar) tempBar.style.width = `${tempPercent}%`;
}

// Persistence Utilities
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAreas));
}

function renderSavedAreas() {
    const list = document.getElementById('savedAreasList');
    list.innerHTML = '';

    if (savedAreas.length === 0) {
        list.innerHTML = '<li class="empty-msg">Nenhuma área salva no dispositivo.</li>';
        return;
    }

    savedAreas.forEach((area, index) => {
        let value = 0;
        let unitLabel = 'ha';

        if (currentUnit === 'hectare') {
            value = area.m2 / 10000;
            unitLabel = 'ha';
        } else if (currentUnit === 'paulista') {
            value = area.m2 / 24200;
            unitLabel = 'alq. P';
        } else if (currentUnit === 'mineiro') {
            value = area.m2 / 48400;
            unitLabel = 'alq. M';
        } else if (currentUnit === 'm2') {
            value = area.m2;
            unitLabel = 'm²';
        }

        const li = document.createElement('li');
        li.className = 'saved-item';
        if (index === currentActiveIndex) li.style.borderColor = 'var(--color-primary)';
        
        li.innerHTML = `
            <div class="saved-item-main">
                <input type="color" class="area-color-picker" value="${area.color || '#3b82f6'}" 
                    onchange="changeAreaColor(${index}, this.value)" title="Mudar cor">
                <div class="saved-item-info" onclick="loadSavedArea(${index})">
                    <span class="saved-item-name">${area.name}</span>
                    <span class="saved-item-meta">${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ${unitLabel}</span>
                </div>
            </div>
            <div class="saved-item-actions">
                <button class="edit-area-btn" onclick="renameArea(${index}, event)" title="Editar nome">✏️</button>
                <button class="delete-area-btn" onclick="deleteArea(${index}, event)" title="Excluir">×</button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function renameArea(index, e) {
    if(e) e.stopPropagation();
    const area = savedAreas[index];
    
    const newName = await showCustomModal({
        title: "Editar Nome",
        icon: "✏️",
        type: "prompt",
        defaultValue: area.name
    });

    if (newName && newName !== area.name) {
        area.name = newName;
        saveToStorage();
        renderSavedAreas();
        if (index === currentActiveIndex) {
            document.getElementById('areaNameLabel').textContent = newName;
        }
        
        // Sync API
        try {
            await fetch(`https://api.agromonitoring.com/agro/1.0/polygons/${area.id}?appid=${API_KEY}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, geo_json: area.geojson })
            });
        } catch(err) { }
    }
}

function changeAreaColor(index, newColor) {
    savedAreas[index].color = newColor;
    saveToStorage();
    renderAllAreasOnMap();
}

function loadSavedArea(index) {
    currentActiveIndex = index;
    const area = savedAreas[index];
    document.getElementById('areaNameLabel').textContent = area.name;
    updateAreaDisplay(area.m2);
    
    // Refresh map styles
    renderAllAreasOnMap();
    
    // Zoom to active
    const activeLayer = mapLayers[index];
    if(activeLayer) map.fitBounds(activeLayer.getBounds());
    
    // Data
    fetchAgData(area.id);
}

function setupLayerListeners(layer, index) {
    layer.on('pm:update', (e) => {
        const newGeojson = layer.toGeoJSON();
        updateSavedArea(index, newGeojson, layer);
    });
}

async function updateSavedArea(index, geojson, layer) {
    const area = savedAreas[index];
    let latlngs = layer.getLatLngs();
    if(Array.isArray(latlngs[0])) latlngs = latlngs[0];
    
    const newAreaM2 = calculateAreaManual(latlngs);
    area.m2 = newAreaM2;
    area.geojson = geojson;
    
    if (index === currentActiveIndex) {
        updateAreaDisplay(newAreaM2);
    }
    
    saveToStorage();
    renderSavedAreas(); // Força a Sidebar a atualizar os números imediatamente
    renderAllAreasOnMap(); // Reflect changes visually na cor do poligono


    try {
        // Sync with API
        await fetch(`https://api.agromonitoring.com/agro/1.0/polygons/${area.id}?appid=${API_KEY}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: area.name,
                geo_json: geojson
            })
        });
    } catch (err) {
    }
}

async function deleteArea(index, e) {
    if(e) e.stopPropagation();
    const area = savedAreas[index];
    
    const confirmed = await showCustomModal({
        title: `Excluir a área "${area.name}"?`,
        icon: "⚠️",
        type: "confirm"
    });

    if (confirmed) {
        try {
            await fetch(`https://api.agromonitoring.com/agro/1.0/polygons/${area.id}?appid=${API_KEY}`, { method: 'DELETE' });
        } catch(err) {}

        savedAreas.splice(index, 1);
        saveToStorage();
        currentActiveIndex = -1;
        renderSavedAreas();
        renderAllAreasOnMap();
        resetUI();
    }
}

function resetUI() {
    document.getElementById('currentAreaSize').textContent = "0.00";
    document.getElementById('areaNameLabel').textContent = "Área não selecionada";
    document.getElementById('soilMoistureSurface').textContent = "-- %";
    document.getElementById('soilTemp').textContent = "-- °C";
    document.getElementById('airTemp').textContent = "-- °C";
    document.getElementById('airHumidity').textContent = "Umidade: --%";
    document.getElementById('windSpeed').textContent = "--";
    document.getElementById('windDirName').textContent = "--";

    const gustRow = document.getElementById('windGustRow');
    if(gustRow) gustRow.style.display = 'none';
    
    document.getElementById('moistureBar1').style.width = "0%";
    const soilBar = document.getElementById('soilTempBar');
    if(soilBar) soilBar.style.width = "0%";
    
    const arrow = document.getElementById('windArrow');
    if(arrow) arrow.style.transform = `translate(-50%, -100%) rotate(0deg)`;

    if(forecastChart) {
        forecastChart.destroy();
        forecastChart = null;
    }
}

function showLoading() {
    const loader = document.getElementById('agLoader');
    if(loader) loader.classList.remove('hidden');
}

function hideLoading() {
    const loader = document.getElementById('agLoader');
    if(loader) loader.classList.add('hidden');
    const grid = document.querySelector('.ag-dashboard-grid');
    if (grid) grid.style.opacity = '1';
}

/**
 * Custom Modal Logic
 */
function showCustomModal({ title, icon, type = 'alert', placeholder = '', defaultValue = '' }) {
    return new Promise((resolve) => {
        const modal = document.getElementById('agModal');
        const titleEl = document.getElementById('agModalTitle');
        const iconEl = document.getElementById('agModalIcon');
        const inputWrap = document.getElementById('agModalInputWrap');
        const input = document.getElementById('agModalInput');
        const btnCancel = document.getElementById('agModalCancel');
        const btnConfirm = document.getElementById('agModalConfirm');

        // Previne que o Leaflet 'engula' toques no mobile pois o modal está dentro do container do mapa
        if (typeof L !== 'undefined' && L.DomEvent) {
            L.DomEvent.disableClickPropagation(modal);
            L.DomEvent.disableScrollPropagation(modal);
        }

        titleEl.textContent = title;
        iconEl.textContent = icon || 'ℹ️';
        input.value = defaultValue;
        input.placeholder = placeholder;

        if (type === 'prompt') {
            inputWrap.classList.remove('hidden');
            setTimeout(() => input.focus(), 100);
        } else {
            inputWrap.classList.add('hidden');
        }

        if (type === 'alert') {
            btnCancel.classList.add('hidden');
        } else {
            btnCancel.classList.remove('hidden');
        }

        modal.classList.remove('hidden');

        const close = (result) => {
            modal.classList.add('hidden');
            btnConfirm.onclick = null;
            btnCancel.onclick = null;
            modal.onclick = null;
            resolve(result);
        };

        btnConfirm.onclick = () => close(type === 'prompt' ? input.value : true);
        btnCancel.onclick = () => close(null);

        // Close on click outside
        modal.onclick = (e) => {
            if (e.target === modal) close(null);
        };

        // Support Enter key
        input.onkeydown = (e) => {
            if (e.key === 'Enter') btnConfirm.click();
            if (e.key === 'Escape') btnCancel.click();
        };
    });
}

function calculateAreaManual(latlngs) {
    const radius = 6371000; // Raio da Terra
    let area = 0;
    if (latlngs.length > 2) {
        for (let i = 0; i < latlngs.length; i++) {
            const p1 = latlngs[i];
            const p2 = latlngs[(i + 1) % latlngs.length];
            area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
        }
        area = area * radius * radius / 2;
    }
    return Math.abs(area);
}
