// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered', reg))
            .catch(err => console.log('Service Worker registration failed', err));
    });
}

// OpenWeatherMap API Configuration
const API_KEY = '5fa880cce39ad7197758233da7e0c7da';
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_API_URL = 'https://api.openweathermap.org/geo/1.0';

// PWS API Configuration (Weather Underground / Weather.com)
const PWS_API_KEY = '197bad59d647405abbad59d647f05a65';
const PWS_STATION_ID = 'IPIRAS1';
const PWS_API_URL = 'https://api.weather.com/v2/pws/observations/current';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingState = document.getElementById('loadingState');
const mainDashboard = document.getElementById('mainDashboard');
const radarSection = document.getElementById('radarSection');
const pwsBtn = document.getElementById('pwsBtn');

// New DOM Elements for Details
const uvIndex = document.getElementById('uvIndex');
const windDir = document.getElementById('windDir');
const sunriseTime = document.getElementById('sunriseTime');
const sunsetTime = document.getElementById('sunsetTime');
const currentSunTime = document.getElementById('currentSunTime');
const sunPathActive = document.getElementById('sunPathActive');
const sunPoint = document.getElementById('sunPoint');

// Unit Elements
const tempUnitToggle = document.getElementById('tempUnitToggle');
const pressureUnitSelect = document.getElementById('pressureUnitSelect');
const windUnitSelect = document.getElementById('windUnitSelect');

// Radar Map Variables
let map = null;
let currentWeatherLayer = null;
let locationMarker = null;
let currentCoords = { lat: 0, lon: 0 };
let legendControl = null;

// Unit State
let units = {
    temp: localStorage.getItem('unitTemp') || 'C',
    pressure: localStorage.getItem('unitPressure') || 'hPa',
    wind: localStorage.getItem('unitWind') || 'kmh'
};

// Data State
let currentResponseData = null; // Store last full current weather response
let currentAqiData = null;      // Store AQI data
let currentWeatherData = null;  // Store current weather for chart context
let currentChartData = null;    // Store data for switching views

// Chart Variables
let weatherChart = null;
let currentMetric = 'temp';
let currentTimeRange = '24h'; // '24h' or '5d'

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
    pwsBtn.addEventListener('click', fetchPwsData);
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

    // Initialize Unit Controls
    initializeUnitControls();

    // Initialize Chart Controls
    initializeChartControls();

    // Initialize Modal Logic
    initializeModalLogic();

    // Forecast Details Button (Scroll to Detailed Forecast)
    const detailsBtn = document.querySelector('.forecast-summary-card .btn-text');
    if (detailsBtn) {
        detailsBtn.addEventListener('click', () => {
            const detailedForecastSection = document.getElementById('detailedForecastSection');
            if (detailedForecastSection) {
                detailedForecastSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
});

function initializeUnitControls() {
    // Temp Toggles
    tempUnitToggle.querySelectorAll('.toggle-btn').forEach(btn => {
        if (btn.getAttribute('data-unit') === units.temp) btn.classList.add('active');
        else btn.classList.remove('active');

        btn.addEventListener('click', () => {
            tempUnitToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            units.temp = btn.getAttribute('data-unit');
            localStorage.setItem('unitTemp', units.temp);
            updateWeatherDisplay();
        });
    });

    // Pressure Select
    pressureUnitSelect.value = units.pressure;
    pressureUnitSelect.addEventListener('change', (e) => {
        units.pressure = e.target.value;
        localStorage.setItem('unitPressure', units.pressure);
        updateWeatherDisplay();
    });

    // Wind Select
    windUnitSelect.value = units.wind;
    windUnitSelect.addEventListener('change', (e) => {
        units.wind = e.target.value;
        localStorage.setItem('unitWind', units.wind);
        updateWeatherDisplay();
    });
}

// Convert temperature
function formatTemp(celsius) {
    if (units.temp === 'F') {
        const f = (celsius * 9 / 5) + 32;
        return `${Math.round(f)}°F`;
    }
    return `${Math.round(celsius)}°C`;
}

// Convert pressure from hPa
function formatPressure(hPa) {
    let value = hPa;
    let label = 'hPa';

    switch (units.pressure) {
        case 'atm':
            value = hPa / 1013.25;
            label = 'atm';
            break;
        case 'mbar':
            value = hPa; // 1 hPa = 1 mbar
            label = 'mbar';
            break;
        case 'mmhg':
            value = hPa * 0.750062;
            label = 'mmHg';
            break;
        case 'inhg':
            value = hPa * 0.02953;
            label = 'inHg';
            break;
    }

    const precision = units.pressure === 'atm' ? 3 : (units.pressure === 'inhg' ? 2 : 0);
    return `${value.toFixed(precision)} ${label}`;
}

// Convert wind speed from km/h
function formatWind(kmh) {
    let value = kmh;
    let label = 'km/h';

    switch (units.wind) {
        case 'ms':
            value = kmh / 3.6;
            label = 'm/s';
            break;
        case 'mph':
            value = kmh / 1.60934;
            label = 'mph';
            break;
        case 'kn':
            value = kmh / 1.852;
            label = 'kn';
            break;
    }

    return `${Math.round(value)} ${label}`;
}

// Get cardinal direction from degrees
function getWindDirection(deg) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
}

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

        if (!currentResponse.ok || !forecastResponse.ok) {
            throw new Error('Erro ao buscar dados do clima');
        }

        const currentData = await currentResponse.json();
        const forecastData = await forecastResponse.json();

        // Fetch Air Quality & UV Index (Separate calls)
        const aqiResponse = await fetch(
            `${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const uvResponse = await fetch(
            `${API_BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );

        if (aqiResponse.ok) currentAqiData = await aqiResponse.json();
        if (uvResponse.ok) {
            const uvData = await uvResponse.json();
            currentData.uvi = uvData.value;
        }

        // Store current weather data
        currentResponseData = currentData;
        currentChartData = forecastData;

        // Display data
        updateWeatherDisplay(locationName);

        // Hourly forecast is now integrated into the chart
        displayChartForecast(forecastData);

        hideLoading();
        hideError();

    } catch (error) {
        hideLoading();
        showError(error.message);
    }
}

// Helper to update all items that depend on unit settings
function updateWeatherDisplay(customLocation = null) {
    if (!currentResponseData) return;
    displayCurrentWeather(currentResponseData, customLocation);
    if (weatherChart) updateChart();
    displaySunPath(currentResponseData);
}

// Display current weather in Dashboard
function displayCurrentWeather(data, customLocation = null) {
    currentWeatherData = data; // Store for chart use

    const location = customLocation || `${data.name}, ${data.sys.country}`;
    const tempValueNumeric = Math.round(data.main.temp);
    const temp = formatTemp(data.main.temp);
    const description = data.weather[0].description;
    const icon = weatherIcons[data.weather[0].icon] || '🌤️';
    const humidity = data.main.humidity;
    const windKmh = data.wind.speed * 3.6;
    const windSpeed = formatWind(windKmh);
    const pressureValue = data.main.pressure;
    const pressure = formatPressure(pressureValue);
    const uvValue = data.uvi !== undefined ? Math.round(data.uvi) : 0;
    const windDegree = data.wind.deg !== undefined ? data.wind.deg : 0;
    const windDirCardinal = getWindDirection(windDegree);

    // Update Hero Section
    if (document.getElementById('heroTempValue')) document.getElementById('heroTempValue').textContent = temp;
    if (document.getElementById('heroDescription')) document.getElementById('heroDescription').textContent = description.charAt(0).toUpperCase() + description.slice(1);
    if (document.getElementById('heroLocation')) document.getElementById('heroLocation').textContent = location;
    if (document.getElementById('heroIcon')) document.getElementById('heroIcon').textContent = icon;

    // Update Global Headers (fallback) - Removed city name update to preserve app title
    // Preserving "Weather App BR" as requested by user

    const mainDashboard = document.getElementById('mainDashboard');
    if (mainDashboard) mainDashboard.classList.remove('hidden');

    // Update Detail Cards
    // UV Card
    if (document.getElementById('uvIndex')) document.getElementById('uvIndex').textContent = uvValue;
    if (document.getElementById('uvLabel')) {
        let uvText = 'Baixo';
        if (uvValue >= 3) uvText = 'Moderado';
        if (uvValue >= 6) uvText = 'Alto';
        if (uvValue >= 8) uvText = 'Muito Alto';
        if (uvValue >= 11) uvText = 'Extremo';
        document.getElementById('uvLabel').textContent = uvText;
    }
    updateGauge('uvGauge', uvValue, 11);

    // Humidity Card
    if (document.getElementById('humidity')) document.getElementById('humidity').textContent = `${humidity}%`;
    updateGauge('humidityGauge', humidity, 100);

    // Feels Like Card
    if (document.getElementById('feelsLike')) document.getElementById('feelsLike').textContent = temp;
    updateGauge('tempGauge', data.main.temp, 50); // Scale 0-50 C

    // Wind Card
    if (document.getElementById('windDirName')) document.getElementById('windDirName').textContent = windDirCardinal;
    if (document.getElementById('windSpeed')) document.getElementById('windSpeed').textContent = windSpeed.split(' ')[0]; // Just number
    if (document.getElementById('windArrow')) {
        document.getElementById('windArrow').style.transform = `translate(-50%, -100%) rotate(${windDegree}deg)`;
    }

    // Pressure Card
    if (document.getElementById('pressure')) document.getElementById('pressure').textContent = pressure.split(' ')[0];
    if (document.getElementById('pressureUnit')) document.getElementById('pressureUnit').textContent = units.pressure === 'hPa' ? 'hPa' : units.pressure;
    // Pressure gauge: typically 950-1050 range for sea level. Scale it.
    const pPercent = ((pressureValue - 950) / 100) * 100;
    updateGauge('pressureGauge', Math.max(0, Math.min(100, pPercent)), 100);

    // Initialize or update radar map
    const lat = data.coord.lat;
    const lon = data.coord.lon;
    initializeMap(lat, lon);
}

// Helper to update SVG gauge fill
function updateGauge(elementId, value, max) {
    const gauge = document.getElementById(elementId);
    if (!gauge) return;
    const pathLength = 125.6; // pi * 40
    let progress = (value / max) * pathLength;
    progress = Math.min(pathLength, Math.max(0, progress));
    gauge.style.strokeDasharray = `${progress}, 1000`;
}

// Display Sun Path Trajectory in Dashboard card
function displaySunPath(data) {
    if (!data.sys || !data.sys.sunrise) return;

    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);
    const now = new Date(data.dt * 1000);

    const formatTime = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (document.getElementById('sunriseTime')) document.getElementById('sunriseTime').textContent = formatTime(sunrise);
    if (document.getElementById('sunsetTime')) document.getElementById('sunsetTime').textContent = formatTime(sunset);

    const isDay = now > sunrise && now < sunset;
    const sunStatusLabel = document.getElementById('sunStatusLabel');
    const sunStatusTime = document.getElementById('sunStatusTime');

    if (sunStatusLabel) sunStatusLabel.textContent = isDay ? 'Pôr do Sol' : 'Nascer do Sol';
    if (sunStatusTime) sunStatusTime.textContent = isDay ? formatTime(sunset) : formatTime(sunrise);

    // Calculate progress (0 to 1) for the path
    const totalDayTime = sunset - sunrise;
    let progress = (now - sunrise) / totalDayTime;
    progress = Math.max(0, Math.min(1, progress));

    const sunPathActive = document.getElementById('sunPathActive');
    const sunPoint = document.getElementById('sunPoint');
    const sunTimeLabel = document.getElementById('sunTimeLabel');

    if (sunPathActive) {
        // Use getTotalLength() to get actual SVG path length for perfect alignment
        const pathLength = sunPathActive.getTotalLength();
        sunPathActive.style.strokeDasharray = isDay ? `${progress * pathLength}, 1000` : `0, 1000`;
    }

    if (sunPoint) {
        if (!isDay) {
            sunPoint.style.display = 'none';
            if (sunTimeLabel) sunTimeLabel.style.display = 'none';
        } else {
            sunPoint.style.display = 'block';
            if (sunTimeLabel) sunTimeLabel.style.display = 'block';

            const t = progress;
            const p0 = { x: 5, y: 35 };
            const p1 = { x: 50, y: 0 };
            const p2 = { x: 95, y: 35 };
            const x = (1 - t) ** 2 * p0.x + 2 * (1 - t) * t * p1.x + t ** 2 * p2.x;
            const y = (1 - t) ** 2 * p0.y + 2 * (1 - t) * t * p1.y + t ** 2 * p2.y;

            sunPoint.setAttribute('cx', x);
            sunPoint.setAttribute('cy', y);

            if (sunTimeLabel) {
                // Determine current local time at the location
                const localDate = new Date((data.dt + data.timezone) * 1000);
                const hours = localDate.getUTCHours().toString().padStart(2, '0');
                const minutes = localDate.getUTCMinutes().toString().padStart(2, '0');
                sunTimeLabel.textContent = `${hours}:${minutes}`;

                // Position label relative to dot
                // Positioned below the dot. y + 14 ensures it fits in the new 60px height viewBox
                // when the sun is at the bottom (y=35). 35 + 14 = 49, which is < 60.
                let labelY = y + 14;

                // Safety bound to ensure it never gets cut off (viewBox is 60 high)
                if (labelY > 55) labelY = 55;

                sunTimeLabel.setAttribute('x', x);
                sunTimeLabel.setAttribute('y', labelY);
            }
        }
    }
}

// Display Dashboard Forecasts
function displayChartForecast(data) {
    currentChartData = data;
    currentMetric = 'temp';
    currentTimeRange = '24h';

    updateChart();
    displayForecastSummary(data);
}

// Render the 5-Day summary list
function displayForecastSummary(data) {
    const list = document.getElementById('forecastSummaryList');
    if (!list) return;
    list.innerHTML = '';

    // Group by day and get noon forecast or avg
    const dailyData = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('pt-BR', { weekday: 'long' });
        if (!dailyData[date]) dailyData[date] = item;
    });

    Object.keys(dailyData).slice(0, 5).forEach((day, index) => {
        const item = dailyData[day];
        const icon = weatherIcons[item.weather[0].icon] || '🌤️';
        const dayLabel = index === 0 ? 'Hoje' : (index === 1 ? 'Amanhã' : day.split('-')[0].charAt(0).toUpperCase() + day.split('-')[0].slice(1, 3) + '.');

        const div = document.createElement('div');
        div.className = 'forecast-summary-item';
        div.innerHTML = `
            <span>${dayLabel}</span>
            <span>${icon}</span>
            <span class="forecast-item-temp">${formatTemp(item.main.temp)}</span>
        `;
        list.appendChild(div);
    });
}

function updateChart() {
    if (!currentChartData) return;
    const ctx = document.getElementById('weatherChart').getContext('2d');

    // Set data-range on the scroll wrapper for mobile min-width styling
    const scrollWrapper = document.querySelector('.chart-scroll-wrapper');
    if (scrollWrapper) {
        scrollWrapper.setAttribute('data-range', currentTimeRange);
        // Reset scroll position when range changes
        scrollWrapper.scrollLeft = 0;
    }

    let fullList = [];
    if (currentWeatherData) fullList.push({ ...currentWeatherData, pop: 0 });
    fullList = fullList.concat(currentChartData.list);

    let filteredList = currentTimeRange === '24h' ? fullList.slice(0, 9) : fullList;
    const labels = [];
    const values = [];

    filteredList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');

        labels.push(`${day}/${month} ${hour}:00`);

        let val;
        if (currentMetric === 'temp') {
            val = item.main.temp;
            if (units.temp === 'F') val = (val * 9 / 5) + 32;
            val = Math.round(val);
        } else {
            val = currentMetric === 'rain' ? Math.round((item.pop || 0) * 100) : (currentMetric === 'clouds' ? item.clouds.all : Math.round(item.wind.speed * 3.6));
        }
        values.push(val);
    });

    if (weatherChart) weatherChart.destroy();

    const valueSuffix = currentMetric === 'temp' ? (units.temp === 'C' ? '°C' : '°F') : (currentMetric === 'wind' ? ' km/h' : '%');

    // Dynamic Colors
    let borderColor = '#ffd700';
    let bgColor = 'rgba(255, 215, 0, 0.1)';

    if (currentMetric === 'rain') {
        borderColor = '#00aaff';
        bgColor = 'rgba(0, 170, 255, 0.1)';
    } else if (currentMetric === 'clouds') {
        borderColor = '#a0c4ff'; // Light Blue/Grayish
        bgColor = 'rgba(160, 196, 255, 0.1)';
    } else if (currentMetric === 'wind') {
        borderColor = '#bf00ff'; // Purple
        bgColor = 'rgba(191, 0, 255, 0.1)';
    }

    weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                data: values,
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
                        label: (context) => ` ${context.parsed.y}${valueSuffix}`
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
                    grace: '15%',
                    ticks: {
                        color: 'rgba(255,255,255,0.5)',
                        callback: (value) => value + valueSuffix
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
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
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'bold 11px sans-serif';

                chart.getDatasetMeta(0).data.forEach((datapoint, index) => {
                    const value = data.datasets[0].data[index];
                    ctx.fillText(value + (currentMetric === 'temp' ? '°' : ''), datapoint.x, datapoint.y - 12);
                });
                ctx.restore();
            }
        }]
    });
}

function initializeChartControls() {
    const chartButtons = document.querySelectorAll('.layer-btn[data-chart]');
    chartButtons.forEach(button => {
        button.onclick = () => {
            chartButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentMetric = button.getAttribute('data-chart');
            updateChart();
        };
    });

    const rangeButtons = document.querySelectorAll('.range-btn');
    rangeButtons.forEach(button => {
        button.onclick = () => {
            rangeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentTimeRange = button.getAttribute('data-range');
            updateChart();
        };
    });
}

// Function to hide map interaction hint instantly
function hideMapHint() {
    const mapHint = document.querySelector('.map-hint');
    if (mapHint && !mapHint.classList.contains('fade-out')) {
        mapHint.classList.add('fade-out');
    }
}


// UI Helper Functions
function showLoading() {
    loadingState.classList.add('active');
    if (mainDashboard) mainDashboard.classList.add('hidden');
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

        // Hint will now only hide when the user clicks the map or its controls
        // removing auto-hide timeout as requested by user

        // Add a click listener to the container as a fallback to ensure hint hides
        const mapContainer = document.querySelector('.radar-map-container');
        if (mapContainer) {
            mapContainer.addEventListener('click', hideMapHint, { once: true });
        }

        // Add Recenter Control
        const RecenterControl = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function () {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-recenter');
                container.innerHTML = `
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                    </svg>
                `;
                container.title = 'Voltar para a cidade';
                container.onclick = (e) => {
                    e.stopPropagation();
                    if (currentCoords.lat !== 0) {
                        map.setView([currentCoords.lat, currentCoords.lon], 10);
                    }
                };
                return container;
            }
        });
        map.addControl(new RecenterControl());

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
// (Moved into onMapClick/showAqiLayer logic block below)

// Switch weather layer on map
function switchWeatherLayer(layerName) {
    if (!map || !currentWeatherLayer) return;

    // Remove current weather layer
    map.removeLayer(currentWeatherLayer);

    // Switch weather layer on map
    const url = `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${API_KEY}`;

    currentWeatherLayer = L.tileLayer(url, {
        attribution: '© OpenWeatherMap',
        opacity: 0.6,
        maxZoom: 18
    }).addTo(map);

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

    // Hide the map interaction hint immediately when user clicks the map
    hideMapHint();

    try {
        // Fetch weather and air pollution for clicked location
        const [weatherRes, aqiRes] = await Promise.all([
            fetch(`${API_BASE_URL}/weather?lat=${lat}&lon=${lng}&units=metric&lang=pt_br&appid=${API_KEY}`),
            fetch(`${API_BASE_URL}/air_pollution?lat=${lat}&lon=${lng}&appid=${API_KEY}`)
        ]);

        if (!weatherRes.ok) throw new Error('Dados indisponíveis');

        const data = await weatherRes.json();
        const aData = await aqiRes.json();

        // Format content
        const location = data.name ? `${data.name}, ${data.sys.country}` : 'Local Selecionado';
        const temp = formatTemp(data.main.temp);
        const description = data.weather[0].description;
        const icon = weatherIcons[data.weather[0].icon] || '🌤️';
        const pressure = formatPressure(data.main.pressure);

        const aqi = aData.list[0].main.aqi;
        const aqiLabels = {
            1: 'Boa', 2: 'Regular', 3: 'Moderada', 4: 'Pobre', 5: 'Muito Pobre'
        };
        const aqiText = aqiLabels[aqi] || 'Desconhecido';

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
                    <strong>${temp}</strong>
                </div>
                <div class="popup-stat">
                    <span>Sensação:</span>
                    <strong>${formatTemp(data.main.feels_like)}</strong>
                </div>
                <div class="popup-stat">
                    <span>Pressão:</span>
                    <strong>${pressure}</strong>
                </div>
                <div class="popup-stat">
                    <span>Umidade:</span>
                    <strong>${data.main.humidity}%</strong>
                </div>
                <div class="popup-stat">
                    <span>Vento:</span>
                    <strong>${formatWind(data.wind.speed * 3.6)}</strong>
                </div>
                <div class="popup-stat">
                    <span>Qualidade do Ar:</span>
                    <strong>${aqiText}</strong>
                </div>
            </div>
        `;

        popup.setContent(content);

    } catch (error) {
        console.error("Map click error:", error);
        popup.setContent('<div style="color:red; text-align:center;">Erro ao carregar dados</div>');
    }
}

// ========== RADAR MAP CONTROLS ==========

// ========== PWS DATA FUNCTIONS ==========

async function fetchPwsData() {
    try {
        showLoading();
        hideError();

        // 1. Fetch PWS Real-time Data
        const pwsRes = await fetch(
            `${PWS_API_URL}?stationId=${PWS_STATION_ID}&format=json&units=m&apiKey=${PWS_API_KEY}`
        );

        if (!pwsRes.ok) throw new Error('Erro ao buscar dados da estação pessoal');

        const pwsData = await pwsRes.json();

        if (!pwsData.observations || pwsData.observations.length === 0) {
            throw new Error('Nenhuma observação encontrada para esta estação');
        }

        const observation = pwsData.observations[0];

        // 2. Fetch Forecast from OpenWeatherMap for Pirassununga (since PWS has no forecast)
        // We use the lat/lon from the PWS observation to ensure we get the right forecast area
        const lat = observation.lat;
        const lon = observation.lon;

        const forecastRes = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&lang=pt_br&appid=${API_KEY}`
        );

        if (forecastRes.ok) {
            const forecastData = await forecastRes.json();
            currentChartData = forecastData;
            displayChartForecast(forecastData);
        }

        // 3. Display PWS Data
        displayPwsWeather(observation);

        hideLoading();
        hideError();

    } catch (error) {
        hideLoading();
        showError(error.message);
        console.error("PWS error:", error);
    }
}

function displayPwsWeather(obs) {
    // Map PWS observation to the format displayCurrentWeather expects (mostly)
    // or just update manually to ensure precision

    const metric = obs.metric;
    const locationName = `Estação Pirassununga (${obs.stationID})`;

    // Create a data object compatible with existing display logic where possible
    const data = {
        name: obs.neighborhood || "Pirassununga",
        sys: { country: obs.country, sunrise: 0, sunset: 0 }, // We'll handle sun path carefully
        main: {
            temp: metric.temp,
            feels_like: metric.heatIndex || metric.temp,
            humidity: obs.humidity,
            pressure: metric.pressure
        },
        wind: {
            speed: metric.windSpeed / 3.6, // PWS is m, but our logic expects speed*3.6 to get kmh? 
            // Actually the PWS units=m means windSpeed is km/h already. 
            // My formatWind takes kmh. My displayCurrentWeather takes speed*3.6.
            // If I pass metric.windSpeed / 3.6 to 'data.wind.speed', then displayCurrentWeather will do (metric.windSpeed/3.6)*3.6 = metric.windSpeed. OK.
            deg: obs.winddir
        },
        weather: [{ description: "Dados da Estação Local", icon: "01d" }], // Station icon
        coord: { lat: obs.lat, lon: obs.lon },
        uvi: obs.uv || 0,
        dt: obs.epoch
    };

    // Update the Dashboard using existing logic
    displayCurrentWeather(data, locationName);

    // Specific updates for PWS (preserving station name)
    if (document.getElementById('heroLocation')) {
        document.getElementById('heroLocation').textContent = locationName;
    }

    // Add owner credit below description with info icon
    const heroDesc = document.getElementById('heroDescription');
    if (heroDesc) {
        heroDesc.innerHTML = `Dados da Estação Local<div style="font-size: 0.7em; opacity: 0.8; margin-top: 2px;">Prop: William de Souza Sardinha <span class="info-icon-small" id="openContactModal">i</span></div>`;

        // Add listener to the newly created icon
        const icon = document.getElementById('openContactModal');
        if (icon) {
            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                document.getElementById('contactModal').classList.add('active');
            });
        }
    }

    // UV can be higher from PWS
    if (obs.uv !== null) {
        if (document.getElementById('uvIndex')) document.getElementById('uvIndex').textContent = Math.round(obs.uv);
    }

    // Since we don't have sunrise/sunset from PWS JSON, we can try to get them from the OWM forecast if available
    if (currentChartData && currentChartData.city) {
        const fakeData = {
            sys: {
                sunrise: currentChartData.city.sunrise,
                sunset: currentChartData.city.sunset
            },
            dt: obs.epoch,
            timezone: currentChartData.city.timezone
        };
        displaySunPath(fakeData);
    }
}

function initializeRadarControls() {
    const layerButtons = document.querySelectorAll('.layer-btn[data-layer]');

    layerButtons.forEach(button => {
        button.addEventListener('click', () => {
            layerButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            switchWeatherLayer(button.getAttribute('data-layer'));
            hideMapHint();
        });
    });
}

function initializeModalLogic() {
    const modal = document.getElementById('contactModal');
    const closeBtn = document.querySelector('.close-modal');

    if (!modal || !closeBtn) return;

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close on ESC key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
}
