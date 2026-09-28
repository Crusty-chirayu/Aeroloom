uniform vec3 u_cursor;
uniform float u_time;
uniform float u_intensity;
uniform float u_pointSize;

varying float vElevation;
varying float vDistToCursor;
varying vec3 vWorldPos;

void main() {
    // Ambient topographic wave motion
    float ambientWave = sin(position.x * 0.22 + u_time * 0.5) * cos(position.z * 0.22 + u_time * 0.38) * 0.45;
    ambientWave += sin((position.x + position.z) * 0.15 + u_time * 0.2) * 0.25;

    // Interactive cursor displacement ripple
    vec2 diff = position.xz - u_cursor.xz;
    float dist = length(diff);
    
    // Wave packet radiating outward from cursor with exponential spatial decay
    float ripple = sin(dist * 1.6 - u_time * 4.5) * exp(-dist * 0.28) * u_intensity * 2.2;
    // Local Gaussian uplift dome under the cursor
    float dome = exp(-dist * dist * 0.08) * u_intensity * 1.1;

    float totalElevation = ambientWave + ripple + dome;
    vec3 displacedPos = vec3(position.x, position.y + totalElevation, position.z);

    vElevation = totalElevation;
    vDistToCursor = dist;
    vWorldPos = displacedPos;

    vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Attenuated point size with proximity boost near cursor
    float sizeFactor = 1.0 + exp(-dist * 0.3) * 1.6 * clamp(u_intensity, 0.0, 1.0);
    gl_PointSize = (u_pointSize * sizeFactor) * (18.0 / -mvPosition.z);
    gl_PointSize = clamp(gl_PointSize, 1.5, 32.0);
}
