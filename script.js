// OpenWeatherMap API Configuration
const API_KEY = '5fa880cce39ad7197758233da7e0c7da';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_API_URL = 'https://api.openweathermap.org/geo/1.0';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingState = document.getElementById('loadingState');
const currentWeather = document.getElementById('currentWeather');
const weeklySection = document.getElementById('weeklySection');
const radarSection = document.getElementById('radarSection');

// Radar Map Variables
let map = null;
let currentWeatherLayer = null;
let locationMarker = null;
let currentCoords = { lat: 0, lon: 0 };
let legendControl = null;

// Legend Data Configuration
const legendData = {
    'precipitation_new': {
        title: 'Precipitação',
        colors: 'linear-gradient(to right, rgba(225, 200, 100, 0), rgba(200, 150, 150, 0), rgba(150, 150, 170, 0), rgba(120, 120, 190, 0), rgba(110, 110, 205, 0.3), rgba(80, 80, 225, 0.7), rgba(20, 20, 255, 0.9))',
        labels: ['Fraca', 'Moderada', 'Forte']
    },
    'clouds_new': {
        title: 'Nuvens',
        colors: 'linear-gradient(to right, rgba(255, 255, 255, 0.0), rgba(253, 253, 255, 0.2), rgba(250, 250, 255, 0.5), rgba(245, 245, 255, 0.8), rgba(240, 240, 255, 1.0))',
        labels: ['0%', '50%', '100%']
    },
    'temp_new': {
        title: 'Temperatura',
        colors: 'linear-gradient(to right, #9d68b6, #745ec4, #5c81d6, #59b1d9, #5ce4d9, #74eeb3, #9ae678, #c6d649, #e6be3f, #f29b43, #ed6b46, #da373e, #b40a32)',
        labels: ['-40°C', '0°C', '40°C']
    },
    'wind_new': {
        title: 'Velocidade do Vento',
        colors: 'linear-gradient(to right, rgba(255, 255, 255, 0), rgba(238, 206, 206, 0.4), rgba(179, 100, 188, 0.7), rgba(63, 33, 59, 0.8), rgba(116, 76, 172, 0.9), rgba(70, 0, 175, 1))',
        labels: ['0 m/s', '50 m/s', '100+ m/s']
    },
    'pressure_new': {
        title: 'Pressão Atmosférica',
        colors: 'linear-gradient(to right, #0073ff, #00aaff, #40d0ff, #80e6ff, #bff9ff, #ffff80, #ffda40, #ffb500, #ff8f00, #ff6600, #ff4000, #cc2c00, #991e00)',
        labels: ['950 hPa', '1013 hPa', '1070 hPa']
    }
};

// Weather icon mapping
const weatherIcons = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    locationBtn.addEventListener('click', handleGeolocation);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Load last searched city from localStorage
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        cityInput.value = lastCity;
        searchCity(lastCity);
    } else {
        // Auto-detect location on first load
        handleGeolocation();
    }

    // Initialize radar map layer controls
    initializeRadarControls();
});

// Handle search button click
function handleSearch() {
    const city = cityInput.value.trim();
    if (city) {
        searchCity(city);
    } else {
        showError('Por favor, digite o nome de uma cidade');
    }
}

// Handle geolocation button click
function handleGeolocation() {
    if ('geolocation' in navigator) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude);
            },
            (error) => {
                hideLoading();
                showError('Não foi possível obter sua localização. Por favor, pesquise uma cidade.');
            }
        );
    } else {
        showError('Geolocalização não é suportada pelo seu navegador');
    }
}

// Search city by name
async function searchCity(cityName) {
    try {
        showLoading();
        hideError();

        // Get coordinates from city name using Geocoding API
        const geoResponse = await fetch(
            `${GEO_API_URL}/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${API_KEY}`
        );

        if (!geoResponse.ok) throw new Error('Erro ao buscar cidade');

        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            throw new Error('Cidade não encontrada. Tente outro nome.');
        }

        const { lat, lon, name, country } = geoData[0];

        // Save to localStorage
        localStorage.setItem('lastCity', cityName);

        // Fetch weather data
        await fetchWeatherByCoords(lat, lon, `${name}, ${country}`);

    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon, locationName = null) {
    try {
        // Fetch current weather
        const currentResponse = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`
        );

        // Fetch forecast data (5 day / 3 hour)
        const forecastResponse = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`
        );

        // Check for API key activation issues
        if (currentResponse.status === 401 || forecastResponse.status === 401) {
            throw new Error('⏰ Chave da API ainda não foi ativada. Aguarde 10-15 minutos e recarregue a página (F5).');
        }

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Erro ao buscar dados do clima');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        // Display data
        displayCurrentWeather(currentData, locationName);

        // Hourly forecast is now integrated into the chart
        displayChartForecast(forecastData);

        hideLoading();
        hideError();

    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Chart Variables
let weatherChart = null;
let currentChartData = null; // Store data for switching views
let currentWeatherData = null; // Store current weather for chart context
let currentMetric = 'temp';
let currentTimeRange = '24h'; // '24h' or '5d'

// Display current weather
function displayCurrentWeather(data, customLocation = null) {
    currentWeatherData = data; // Store for chart use

    const location = customLocation || `${data.name}, ${data.sys.country}`;
    const temp = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const description = data.weather[0].description;
    const icon = weatherIcons[data.weather[0].icon] || '🌤️';
    const humidity = data.main.humidity;
    const windSpeed = Math.round(data.wind.speed * 3.6); // Convert m/s to km/h
    const pressure = data.main.pressure;

    // Update DOM
    document.getElementById('weatherIconMain').textContent = icon;
    document.getElementById('tempValue').textContent = `${temp}°C`;
    document.getElementById('weatherDescription').textContent = description;
    document.getElementById('weatherLocation').textContent = location;
    document.getElementById('feelsLike').textContent = `${feelsLike}°C`;
    document.getElementById('humidity').textContent = `${humidity}%`;
    document.getElementById('windSpeed').textContent = `${windSpeed} km/h`;
    document.getElementById('pressure').textContent = `${pressure} hPa`;

    // Show current weather section
    currentWeather.classList.remove('hidden');

    // Initialize or update radar map with current coordinates
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    initializeMap(lat, lon);
}

// Display weekly forecast as Chart
function displayChartForecast(data) {
    // Show weekly section (now general forecast section)
    const forecastSection = document.getElementById('weeklySection');
    forecastSection.classList.remove('hidden');

    // Store data for reuse
    currentChartData = data;

    // Initialize chart with default settings
    currentMetric = 'temp';
    currentTimeRange = '24h';

    // Update UI buttons to match defaults
    document.querySelectorAll('.layer-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.layer-btn[data-chart="temp"]').classList.add('active');

    document.querySelectorAll('.range-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.range-btn[data-range="24h"]').classList.add('active');

    updateChart();

    // Initialize chart controls
    initializeChartControls();
}

function initializeChartControls() {
    // Metric buttons
    const chartButtons = document.querySelectorAll('.layer-btn[data-chart]');

    chartButtons.forEach(button => {
        button.onclick = () => {
            // Update active state
            chartButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update metric and chart
            currentMetric = button.getAttribute('data-chart');
            updateChart();
        };
    });

    // Time range buttons
    const rangeButtons = document.querySelectorAll('.range-btn');
    rangeButtons.forEach(button => {
        button.onclick = () => {
            // Update active state
            rangeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update range and chart
            currentTimeRange = button.getAttribute('data-range');
            updateChart();
        };
    });
}

function updateChart() {
    if (!currentChartData) return;

    const ctx = document.getElementById('weatherChart').getContext('2d');

    // Prepare data list
    let fullList = [];

    // Add current weather as first point if available
    if (currentWeatherData) {
        // Create a compatible object structure
        const currentPoint = {
            dt: currentWeatherData.dt,
            main: currentWeatherData.main,
            weather: currentWeatherData.weather,
            clouds: currentWeatherData.clouds,
            wind: currentWeatherData.wind,
            pop: 0 // Current weather doesn't usually have prob of precipitation, treat as 0
        };
        fullList.push(currentPoint);
    }

    // Append forecast list
    fullList = fullList.concat(currentChartData.list);

    // Filter data based on range
    let filteredList = [];

    if (currentTimeRange === '24h') {
        // Get current + next 8 intervals (approx 24h)
        filteredList = fullList.slice(0, 9);
    } else {
        // Get all data (5 days)
        filteredList = fullList;
    }

    // Process data
    const labels = [];
    const values = [];

    const now = new Date();
    const todayDate = now.getDate();
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(todayDate + 1);

    filteredList.forEach(item => {
        const date = new Date(item.dt * 1000);

        // Format label: DD/MM HH:mm
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        const labelText = `${day}/${month} ${hours}:${minutes}`;

        labels.push(labelText);

        let value;
        switch (currentMetric) {
            case 'temp':
                value = Math.round(item.main.temp);
                break;
            case 'rain':
                // pop is probability of precipitation (0 to 1) -> convert to %
                value = Math.round((item.pop || 0) * 100);
                break;
            case 'clouds':
                value = item.clouds.all;
                break;
            case 'wind':
                value = Math.round(item.wind.speed * 3.6); // km/h
                break;
            default:
                value = Math.round(item.main.temp);
        }
        values.push(value);
    });

    // Configuration based on metric
    let label = 'Temperatura (°C)';
    let color = 'rgba(75, 192, 192, 1)';
    let bgColor = 'rgba(75, 192, 192, 0.2)';
    let yAxisLabel = '°C';

    if (currentMetric === 'rain') {
        label = 'Probabilidade de Chuva (%)';
        color = 'rgba(54, 162, 235, 1)';
        bgColor = 'rgba(54, 162, 235, 0.2)';
        yAxisLabel = '%';
    } else if (currentMetric === 'clouds') {
        label = 'Nuvens (%)';
        color = 'rgba(200, 200, 200, 1)';
        bgColor = 'rgba(200, 200, 200, 0.2)';
        yAxisLabel = '%';
    } else if (currentMetric === 'wind') {
        label = 'Vento (km/h)';
        color = 'rgba(153, 102, 255, 1)';
        bgColor = 'rgba(153, 102, 255, 0.2)';
        yAxisLabel = 'km/h';
    } else { // temp
        color = 'rgba(255, 206, 86, 1)'; // Yellow/Orangeish
        bgColor = 'rgba(255, 206, 86, 0.2)';
    }

    // Destroy existing chart if it exists
    if (weatherChart) {
        weatherChart.destroy();
    }

    // Create new chart
    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: values,
                borderColor: color,
                backgroundColor: bgColor,
                borderWidth: 2,
                fill: true,
                tension: 0.4, // Smooth curves
                pointRadius: currentTimeRange === '24h' ? 4 : 2, // Larger points for 24h view
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        maxTicksLimit: currentTimeRange === '24h' ? 9 : 10,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: 'rgba(255, 255, 255, 0.5)'
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// UI Helper Functions
function showLoading() {
    loadingState.classList.add('active');
    currentWeather.classList.add('hidden');
    // hourlySection.classList.add('hidden'); // Removed
    weeklySection.classList.add('hidden');
    // radarSection.classList.add('hidden'); // REMOVED: Keep radar visible to avoid resize issues
}

function hideLoading() {
    loadingState.classList.remove('active');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.add('active');

    // Auto-hide error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.classList.remove('active');
}

// ========== RADAR MAP FUNCTIONS ==========

// Initialize Leaflet map
function initializeMap(lat, lon) {
    // If map already exists, update center and marker
    if (map) {
        map.setView([lat, lon], 10);
        updateLocationMarker(lat, lon);
        return;
    }

    // Show radar section first
    radarSection.classList.remove('hidden');

    // Small delay to ensure container is visible before creating map
    setTimeout(() => {
        // Create new map
        map = L.map('radarMap').setView([lat, lon], 10);

        // Add base tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(map);

        // Add initial weather layer (precipitation)
        currentWeatherLayer = L.tileLayer(
            `https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${API_KEY}`,
            {
                attribution: '© OpenWeatherMap',
                opacity: 0.6,
                maxZoom: 18
            }
        ).addTo(map);

        // Add legend
        addLegend('precipitation_new');

        // Add location marker
        updateLocationMarker(lat, lon);

        // Store current coordinates
        currentCoords = { lat, lon };

        // Add click handler for map interaction
        map.on('click', onMapClick);

        // Force map to recalculate size after everything is loaded
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, 100);
}

// Add legend to map
function addLegend(layerName) {
    const data = legendData[layerName];
    if (!data) return;

    // Remove existing legend
    if (legendControl) {
        map.removeControl(legendControl);
    }

    legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');

        let labelsHtml = '';
        data.labels.forEach((label, index) => {
            // Align labels based on position (start, center, end)
            let alignment = 'center';
            if (index === 0) alignment = 'flex-start';
            if (index === data.labels.length - 1) alignment = 'flex-end';

            labelsHtml += `<span>${label}</span>`;
        });

        div.innerHTML = `
            <span class="legend-title">${data.title}</span>
            <div class="legend-scale">
                <div class="legend-bar" style="background: ${data.colors}"></div>
                <div class="legend-labels">${labelsHtml}</div>
            </div>
        `;

        return div;
    };

    legendControl.addTo(map);
}

// Update location marker on map
function updateLocationMarker(lat, lon) {
    // Remove existing marker if any
    if (locationMarker) {
        map.removeLayer(locationMarker);
    }

    // Create custom icon
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="font-size: 2rem; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">📍</div>',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    // Add new marker
    locationMarker = L.marker([lat, lon], { icon: customIcon }).addTo(map);

    // Store current coordinates
    currentCoords = { lat, lon };
}

// Initialize radar layer control buttons
function initializeRadarControls() {
    const layerButtons = document.querySelectorAll('.layer-btn[data-layer]');

    layerButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            layerButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Get layer name from data attribute
            const layerName = button.getAttribute('data-layer');

            // Switch weather layer
            switchWeatherLayer(layerName);
        });
    });
}

// Switch weather layer on map
function switchWeatherLayer(layerName) {
    if (!map || !currentWeatherLayer) return;

    // Remove current weather layer
    map.removeLayer(currentWeatherLayer);

    // Add new weather layer
    currentWeatherLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${API_KEY}`,
        {
            attribution: '© OpenWeatherMap',
            opacity: 0.6,
            maxZoom: 18
        }
    ).addTo(map);

    // Update legend
    addLegend(layerName);
}

// Handle map clicks
async function onMapClick(e) {
    const { lat, lng } = e.latlng;

    // Create loading popup
    const popup = L.popup()
        .setLatLng(e.latlng)
        .setContent('<div style="text-align:center;">Carregando dados...</div>')
        .openOn(map);

    try {
        // Fetch weather for clicked location
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lng}&units=metric&lang=pt_br&appid=${API_KEY}`
        );

        if (!response.ok) throw new Error('Dados indisponíveis');

        const data = await response.json();

        // Format content
        const location = data.name ? `${data.name}, ${data.sys.country}` : 'Local Selecionado';
        const temp = Math.round(data.main.temp);
        const description = data.weather[0].description;
        const icon = weatherIcons[data.weather[0].icon] || '🌤️';

        // Calculate local time
        const localDate = new Date((data.dt + data.timezone) * 1000);
        const hours = localDate.getUTCHours().toString().padStart(2, '0');
        const minutes = localDate.getUTCMinutes().toString().padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        const content = `
            <div class="popup-content">
                <div class="popup-location">${location}</div>
                <div class="popup-stat" style="margin-bottom: 8px; font-weight: 500; color: var(--color-text-secondary);">
                    <span>🕒 ${timeString}</span>
                </div>
                <div class="popup-stat">
                    <span>${icon} ${description}</span>
                </div>
                <div class="popup-stat">
                    <span>Temperatura:</span>
                    <strong>${temp}°C</strong>
                </div>
                <div class="popup-stat">
                    <span>Sensação:</span>
                    <strong>${Math.round(data.main.feels_like)}°C</strong>
                </div>
                <div class="popup-stat">
                    <span>Umidade:</span>
                    <strong>${data.main.humidity}%</strong>
                </div>
                <div class="popup-stat">
                    <span>Vento:</span>
                    <strong>${Math.round(data.wind.speed * 3.6)} km/h</strong>
                </div>
            </div>
        `;

        popup.setContent(content);

    } catch (error) {
        popup.setContent('<div style="color:red; text-align:center;">Erro ao carregar dados</div>');
    }
}
