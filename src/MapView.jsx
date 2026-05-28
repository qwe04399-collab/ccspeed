import { GoogleMap, Polyline, Marker, useLoadScript } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 22.835,
  lng: 120.26,
};

export default function MapView() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: "YOUR_API_KEY",
  });

  if (!isLoaded) return <div>Loading Map...</div>;

  const startLine = [
    { lat: 22.843293, lng: 120.247413 },
    { lat: 22.843517, lng: 120.247618 },
  ];

  const endLine = [
    { lat: 22.825971, lng: 120.272488 },
    { lat: 22.826082, lng: 120.272547 },
  ];

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
    >
      <Polyline
        path={startLine}
        options={{
          strokeColor: "#00ff00",
          strokeWeight: 4,
        }}
      />

      <Polyline
        path={endLine}
        options={{
          strokeColor: "#ff0000",
          strokeWeight: 4,
        }}
      />

      <Marker position={startLine[0]} label="S" />
      <Marker position={endLine[0]} label="F" />
    </GoogleMap>
  );
}