'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon missing in React Leaflet
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function LocationMarker({ position, setPosition, readonly }) {
    const map = useMapEvents({
        click(e) {
            if (!readonly && setPosition) {
                setPosition(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
            }
        },
    });

    return position === null ? null : (
        <Marker position={position} icon={icon}></Marker>
    );
}

// Component to center map when position changes
function RecenterAutomatically({ position }) {
    const map = useMapEvents({});
    useEffect(() => {
        if (position) {
            map.flyTo(position, map.getZoom());
        }
    }, [position, map]);
    return null;
}

export default function Map({ position, setPosition, readonly = false }) {
    // Default center to Tashkent, Uzbekistan
    const defaultCenter = { lat: 41.2995, lng: 69.2401 };
    const center = position || defaultCenter;

    return (
        <MapContainer
            center={center}
            zoom={10}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            className="rounded-xl"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} readonly={readonly} />
            <RecenterAutomatically position={position} />
        </MapContainer>
    );
}
