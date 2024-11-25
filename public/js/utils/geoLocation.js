function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en kilómetros
    const dLat = (lat2 - lat1) * (Math.PI / 180);  // Diferencia de latitudes
    const dLon = (lon2 - lon1) * (Math.PI / 180);  // Diferencia de longitudes
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distancia en kilómetros
    return distance;
}

async function verificarDireccion(direccion) {
    const location = await getLocation(direccion);
    if (location) {
        return true; // La dirección existe
    } else {
        console.log('Dirección no válida');
        return false; // La dirección no existe
    }
}

async function compararDireccionConLocal(direccion) {
    const direccionLocal = await getLocation(ubicacionLocal);
    const direccionRemota = await getLocation(direccion);

    const distance = haversineDistance(direccionLocal.lat, direccionLocal.lon, direccionRemota.lat, direccionRemota.lon);
    return distance <= 3; // 3 kilometros
}

async function getLocation(direccion) {
    try {
        const response = await fetch(`${baseUrl}/autenticacion/VerificarDireccion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                direccion: direccion,
            }),
        });

        const data = await response.json();

        // Verificamos si la respuesta contiene los datos necesarios
        if (data.error) {
            alert('Dirección no válida');
            return null; // Retorna null si hay un error en la dirección
        }


        const { lat, lon, display_name } = data;
        
        // Si los datos de latitud y longitud existen, la dirección es válida
        if (lat && lon) {
            return { lat, lon, display_name };
        } else {
            alert('Dirección no encontrada');
            return null; // Retorna null si no se encuentra la dirección
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al verificar la dirección');
        return null; // Retorna null en caso de error en la solicitud
    }
}