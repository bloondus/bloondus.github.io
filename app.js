/**
 * No More Trama - Main Application
 * Minimal, fast alternative to SBB-App for public transport departures
 * Uses Swiss Transport API (transport.opendata.ch)
 */

// ============================================
// State Management
// ============================================
const state = {
    userLocation: null,
    currentStation: null,
    nearbyStations: null,
    searchRadius: 50,
    autoRefreshInterval: null,
    departures: []
};

// ============================================
// DOM Elements
// ============================================
const elements = {
    loadingState: document.getElementById('loadingState'),
    loadingText: document.getElementById('loadingText'),
    errorState: document.getElementById('errorState'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    searchContainer: document.getElementById('searchContainer'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    stationInfo: document.getElementById('stationInfo'),
    stationName: document.getElementById('stationName'),
    stationDistance: document.getElementById('stationDistance'),
    refreshBtn: document.getElementById('refreshBtn'),
    changeStationBtn: document.getElementById('changeStationBtn'),
    departuresContainer: document.getElementById('departuresContainer'),
    departuresList: document.getElementById('departuresList'),
    lastUpdate: document.getElementById('lastUpdate'),
    radiusControl: document.getElementById('radiusControl'),
    radiusSlider: document.getElementById('radiusSlider'),
    radiusValue: document.getElementById('radiusValue'),
    retryWithRadiusBtn: document.getElementById('retryWithRadiusBtn'),
    useLocationBtn: document.getElementById('useLocationBtn'),
    radiusSelector: document.getElementById('radiusSelector'),
    radiusSelect: document.getElementById('radiusSelect'),
    nearbyStations: document.getElementById('nearbyStations'),
    stationsList: document.getElementById('stationsList'),
    routeModal: document.getElementById('routeModal'),
    closeModal: document.getElementById('closeModal'),
    routeTitle: document.getElementById('routeTitle'),
    routeLoading: document.getElementById('routeLoading'),
    routeError: document.getElementById('routeError'),
    routeErrorText: document.getElementById('routeErrorText'),
    routeInfo: document.getElementById('routeInfo'),
    routeDescription: document.getElementById('routeDescription'),
    stopsList: document.getElementById('stopsList')
};

// ============================================
// API Functions
// ============================================

async function findNearbyStations(lat, lon, radius = 1000) {
    // Swiss Transport API uses WGS84 coordinates (latitude/longitude)
    // x = longitude, y = latitude
    const url = `https://transport.opendata.ch/v1/locations?x=${lon}&y=${lat}&type=station`;
    
    try {
        console.log('🔍 Searching for stations near:', { lat, lon, radius });
        console.log('📍 API URL:', url);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        console.log('📡 Full API response:', data);
        
        // The API returns a 'stations' array
        const stations = data.stations || [];
        console.log('📊 Found', stations.length, 'stations from API');
        
        if (stations.length === 0) {
            console.log('⚠️ No stations returned by API');
            return [];
        }
        
        // Calculate distance for each station and filter by radius
        const stationsWithDistance = stations.map(station => {
            if (!station.coordinate) {
                console.log('⚠️ Station missing coordinates:', station.name);
                return null;
            }
            // station.coordinate.x = longitude, station.coordinate.y = latitude
            const stationLat = station.coordinate.y;
            const stationLon = station.coordinate.x;
            console.log(`  🗺️ ${station.name}: lat=${stationLat}, lon=${stationLon}`);
            const distance = calculateDistance(lat, lon, stationLat, stationLon);
            console.log(`  📍 ${station.name}: ${Math.round(distance)}m away`);
            return { ...station, distance };
        }).filter(station => station !== null && station.distance <= radius)
          .sort((a, b) => a.distance - b.distance);
        
        console.log('✅ Filtered to', stationsWithDistance.length, 'stations within', radius, 'meters');
        return stationsWithDistance;
    } catch (error) {
        console.error('Error finding nearby stations:', error);
        throw error;
    }
}

async function searchStationsByName(query) {
    const url = `https://transport.opendata.ch/v1/locations?query=${encodeURIComponent(query)}&type=station`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        return data.stations || [];
    } catch (error) {
        console.error('Error searching stations:', error);
        throw error;
    }
}

async function fetchDepartures(stationId, limit = 6) {
    const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(stationId)}&limit=${limit}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        return data.stationboard || [];
    } catch (error) {
        console.error('Error fetching departures:', error);
        throw error;
    }
}

async function fetchConnectionStops(from, to) {
    const url = `https://transport.opendata.ch/v1/connections?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&limit=1`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        
        const data = await response.json();
        
        if (data.connections && data.connections.length > 0) {
            return data.connections[0];
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching connection:', error);
        throw error;
    }
}

// ============================================
// Helper Functions
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)}m away`;
    }
    return `${(meters / 1000).toFixed(1)}km away`;
}

function getMinutesUntilDeparture(departureTime) {
    const now = new Date();
    const departure = new Date(departureTime);
    const diff = departure - now;
    return Math.max(0, Math.round(diff / 60000));
}

function getTransportType(category) {
    if (!category) return 'default';
    
    const cat = category.toLowerCase();
    if (cat.includes('tram') || cat.includes('str')) return 'tram';
    if (cat.includes('bus') || cat.includes('nfb')) return 'bus';
    if (cat.includes('train') || cat.includes('zug') || cat.includes('ic') || 
        cat.includes('ir') || cat.includes('re') || cat.includes('s')) return 'train';
    
    return 'default';
}

// ============================================
// UI Functions
// ============================================

function showLoading(message = 'Loading...') {
    elements.loadingText.textContent = message;
    elements.loadingState.classList.remove('hidden');
    elements.errorState.classList.add('hidden');
    elements.searchContainer.classList.remove('hidden');
    elements.stationInfo.classList.add('hidden');
    elements.departuresContainer.classList.add('hidden');
    elements.radiusControl.classList.add('hidden');
    elements.nearbyStations.classList.add('hidden');
}

function showError(message, showRetry = true) {
    elements.errorText.textContent = message;
    elements.errorState.classList.remove('hidden');
    elements.retryBtn.style.display = showRetry ? 'inline-block' : 'none';
    elements.loadingState.classList.add('hidden');
    elements.stationInfo.classList.add('hidden');
    elements.departuresContainer.classList.add('hidden');
    elements.radiusControl.classList.add('hidden');
    elements.searchContainer.classList.remove('hidden');
}

function showDepartures() {
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.radiusControl.classList.add('hidden');
    elements.searchContainer.classList.add('hidden');
    elements.nearbyStations.classList.add('hidden');
    elements.stationInfo.classList.remove('hidden');
    elements.departuresContainer.classList.remove('hidden');
}

function renderDepartures(departures) {
    if (!departures || departures.length === 0) {
        elements.departuresList.innerHTML = `
            <div class="empty-state">
                <p>No departures found at this time.</p>
            </div>
        `;
        return;
    }

    elements.departuresList.innerHTML = departures.map((departure, index) => {
        const minutes = getMinutesUntilDeparture(departure.stop.departure);
        const transportType = getTransportType(departure.category);
        
        let timeClass = '';
        if (minutes <= 2) timeClass = 'urgent';
        else if (minutes <= 5) timeClass = 'soon';
        
        return `
            <div class="departure-card" data-departure-index="${index}">
                <div class="transport-type ${transportType}"></div>
                <div class="line-badge ${transportType}">
                    ${departure.number || departure.category}
                </div>
                <div class="departure-info">
                    <div class="departure-destination">${departure.to || 'Unknown'}</div>
                    <div class="departure-category">${departure.category || ''}</div>
                </div>
                <div class="departure-time">
                    <div class="time-minutes ${timeClass}">${minutes}'</div>
                    <div class="time-label">min</div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.departure-card').forEach(card => {
        card.addEventListener('click', handleDepartureClick);
    });

    const now = new Date();
    elements.lastUpdate.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

function updateStationInfo(station) {
    elements.stationName.textContent = station.name;
    
    if (station.distance !== undefined) {
        elements.stationDistance.textContent = formatDistance(station.distance);
    } else {
        elements.stationDistance.textContent = '';
    }
}

function renderNearbyStations(stations) {
    if (!stations || stations.length === 0) {
        elements.stationsList.innerHTML = '<p>No stations found</p>';
        return;
    }
    
    elements.stationsList.innerHTML = stations.map((station, index) => {
        return `
            <div class="station-card" data-station-index="${index}">
                <div class="station-card-icon">🚉</div>
                <div class="station-card-name">${station.name}</div>
                <div class="station-card-distance">${formatDistance(station.distance)}</div>
            </div>
        `;
    }).join('');
    
    // Store stations in state for later use
    state.nearbyStations = stations;
    
    // Add click handlers
    document.querySelectorAll('.station-card').forEach(card => {
        card.addEventListener('click', handleStationSelect);
    });
}

async function handleStationSelect(event) {
    const card = event.currentTarget;
    const stationIndex = parseInt(card.dataset.stationIndex);
    
    if (isNaN(stationIndex) || !state.nearbyStations || !state.nearbyStations[stationIndex]) {
        console.error('Invalid station index');
        return;
    }
    
    state.currentStation = state.nearbyStations[stationIndex];
    console.log('Selected station:', state.currentStation.name);
    await loadDepartures();
}

// ============================================
// Core Functions
// ============================================

function getUserLocation() {
    return new Promise((resolve, reject) => {
        console.log('Starting geolocation request...');
        
        if (!navigator.geolocation) {
            console.error('Geolocation not supported');
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Position received:', position.coords);
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                console.error('Geolocation error:', error);
                let message = 'Unable to get your location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Location access denied. Please use search.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Location unavailable. Please use search.';
                        break;
                    case error.TIMEOUT:
                        message = 'Location timeout. Please use search.';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

async function loadDepartures() {
    if (!state.currentStation) {
        showError('No station selected');
        return;
    }

    try {
        showLoading('Loading departures...');
        const departures = await fetchDepartures(state.currentStation.name, 6);
        state.departures = departures;
        
        updateStationInfo(state.currentStation);
        renderDepartures(departures);
        showDepartures();
        
        startAutoRefresh();
    } catch (error) {
        console.error('Error loading departures:', error);
        showError('Failed to load departures. Please try again.');
    }
}

async function initializeWithLocation() {
    elements.searchContainer.classList.remove('hidden');
    
    try {
        console.log('=== Starting location detection ===');
        showLoading('Detecting location...');
        
        // Show radius selector
        elements.radiusSelector.classList.remove('hidden');
        
        console.log('Requesting geolocation...');
        const location = await Promise.race([
            getUserLocation(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Location timeout after 10 seconds')), 10000)
            )
        ]);
        
        state.userLocation = location;
        console.log('✓ User location received:', location);
        
        showLoading('Finding nearby stations...');
        
        // Use radius from selector
        const selectedRadius = parseInt(elements.radiusSelect.value);
        console.log('Search radius:', selectedRadius, 'meters');
        
        let stations = [];
        try {
            console.log('Calling findNearbyStations with:', location.latitude, location.longitude, selectedRadius);
            stations = await findNearbyStations(
                location.latitude, 
                location.longitude, 
                selectedRadius
            );
            console.log('✓ findNearbyStations returned:', stations.length, 'stations');
        } catch (error) {
            console.error('❌ Error in findNearbyStations:', error);
            throw error;
        }
        console.log('✓ Found', stations.length, 'stations within', selectedRadius, 'meters');
        
        if (stations.length === 0) {
            console.log('No stations found - showing radius control');
            elements.loadingState.classList.add('hidden');
            elements.radiusControl.classList.remove('hidden');
            state.searchRadius = selectedRadius;
            elements.radiusSlider.value = selectedRadius;
            elements.radiusValue.textContent = selectedRadius;
            showError('No stations found nearby. Try increasing the radius.', false);
            return;
        }
        
        // Show all nearby stations for selection
        console.log('Showing station selection...');
        elements.loadingState.classList.add('hidden');
        elements.nearbyStations.classList.remove('hidden');
        renderNearbyStations(stations);
        console.log('=== Location detection complete ===');
        
    } catch (error) {
        console.error('!!! Initialization error:', error);
        elements.loadingState.classList.add('hidden');
        showError(error.message || 'Location failed. Please use search.', false);
    }
}

async function searchStation(query) {
    if (!query || query.trim().length < 2) {
        showError('Please enter at least 2 characters', false);
        return;
    }

    try {
        console.log('Searching for station:', query);
        showLoading('Searching stations...');
        const stations = await searchStationsByName(query.trim());
        console.log('Search results:', stations);
        
        if (stations.length === 0) {
            showError(`No stations found for "${query}"`, false);
            return;
        }
        
        state.currentStation = stations[0];
        console.log('Selected station:', state.currentStation.name);
        await loadDepartures();
        
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed. Please try again.');
    }
}

function startAutoRefresh() {
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
    }
    
    state.autoRefreshInterval = setInterval(() => {
        if (state.currentStation) {
            loadDepartures();
        }
    }, 60000);
}

function stopAutoRefresh() {
    if (state.autoRefreshInterval) {
        clearInterval(state.autoRefreshInterval);
        state.autoRefreshInterval = null;
    }
}

// ============================================
// Modal Functions
// ============================================

function showRouteModal() {
    elements.routeModal.classList.remove('hidden');
    elements.routeLoading.classList.remove('hidden');
    elements.routeError.classList.add('hidden');
    elements.routeInfo.classList.add('hidden');
    document.body.style.overflow = 'hidden';
}

function hideRouteModal() {
    elements.routeModal.classList.add('hidden');
    document.body.style.overflow = '';
}

async function showRouteInformation(departure) {
    showRouteModal();
    
    const lineNumber = departure.number || departure.category;
    const destination = departure.to || 'Unknown';
    elements.routeTitle.textContent = `${lineNumber} → ${destination}`;
    
    try {
        const connection = await fetchConnectionStops(
            state.currentStation.name,
            departure.to
        );
        
        if (!connection || !connection.sections || connection.sections.length === 0) {
            throw new Error('No route information available');
        }
        
        const section = connection.sections[0];
        
        if (!section.journey || !section.journey.passList) {
            throw new Error('No stop information available');
        }
        
        const stops = section.journey.passList;
        
        const duration = Math.round((new Date(section.arrival.departure) - new Date(section.departure.departure)) / 60000);
        elements.routeDescription.textContent = `${stops.length} stops • ${duration} min journey`;
        
        renderStopsList(stops, state.currentStation.name);
        
        elements.routeLoading.classList.add('hidden');
        elements.routeInfo.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading route:', error);
        elements.routeLoading.classList.add('hidden');
        elements.routeError.classList.remove('hidden');
        elements.routeErrorText.textContent = 'Unable to load route information. Please try again.';
    }
}

function renderStopsList(stops, currentStationName) {
    if (!stops || stops.length === 0) {
        elements.stopsList.innerHTML = '<p>No stops available</p>';
        return;
    }
    
    elements.stopsList.innerHTML = stops.map((stop, index) => {
        const isCurrent = stop.station.name === currentStationName;
        const currentClass = isCurrent ? 'current' : '';
        
        let distanceHtml = '';
        if (state.userLocation && stop.station.coordinate) {
            const distance = calculateDistance(
                state.userLocation.latitude,
                state.userLocation.longitude,
                stop.station.coordinate.y,
                stop.station.coordinate.x
            );
            distanceHtml = `<div class="stop-distance">${formatDistance(distance)}</div>`;
        }
        
        return `
            <div class="stop-item ${currentClass}">
                <div class="stop-connector">
                    <div class="stop-dot"></div>
                    ${index < stops.length - 1 ? '<div class="stop-line"></div>' : ''}
                </div>
                <div class="stop-details">
                    <div class="stop-name">${stop.station.name}</div>
                    ${isCurrent ? '<div class="stop-distance">Your current stop</div>' : distanceHtml}
                </div>
            </div>
        `;
    }).join('');
}

async function handleDepartureClick(event) {
    const card = event.currentTarget;
    const departureIndex = parseInt(card.dataset.departureIndex);
    
    if (isNaN(departureIndex) || !state.departures[departureIndex]) {
        console.error('Invalid departure index');
        return;
    }
    
    const departure = state.departures[departureIndex];
    await showRouteInformation(departure);
}

// ============================================
// Event Handlers
// ============================================

elements.retryBtn.addEventListener('click', () => {
    initializeWithLocation();
});

elements.searchBtn.addEventListener('click', () => {
    const query = elements.searchInput.value;
    searchStation(query);
});

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = elements.searchInput.value;
        searchStation(query);
    }
});

elements.refreshBtn.addEventListener('click', () => {
    loadDepartures();
});

elements.changeStationBtn.addEventListener('click', () => {
    stopAutoRefresh();
    state.currentStation = null;
    elements.searchInput.value = '';
    elements.stationInfo.classList.add('hidden');
    elements.departuresContainer.classList.add('hidden');
    elements.searchContainer.classList.remove('hidden');
    elements.searchInput.focus();
});

elements.radiusSlider.addEventListener('input', (e) => {
    elements.radiusValue.textContent = e.target.value;
    state.searchRadius = parseInt(e.target.value);
});

elements.retryWithRadiusBtn.addEventListener('click', () => {
    if (state.userLocation) {
        initializeWithLocation();
    } else {
        showError('Location not available. Please search manually.', false);
    }
});

// Use location button
elements.useLocationBtn.addEventListener('click', () => {
    console.log('📍 Use Location button clicked');
    initializeWithLocation();
});

// Radius selector
elements.radiusSelect.addEventListener('change', (e) => {
    state.searchRadius = parseInt(e.target.value);
    console.log('✓ Radius changed to:', state.searchRadius, 'meters');
});

elements.closeModal.addEventListener('click', () => {
    hideRouteModal();
});

elements.routeModal.addEventListener('click', (e) => {
    if (e.target === elements.routeModal) {
        hideRouteModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !elements.routeModal.classList.contains('hidden')) {
        hideRouteModal();
    }
});

// ============================================
// App Initialization
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('No More Trama - Initialized');
    // Don't auto-start location - let user click button
    elements.radiusSelector.classList.remove('hidden');
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.currentStation) {
        loadDepartures();
    }
});

window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
