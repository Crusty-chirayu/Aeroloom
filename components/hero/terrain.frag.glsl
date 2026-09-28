uniform float u_time;
uniform float u_intensity;
uniform vec3 u_baseColor;
uniform vec3 u_highlightColor;

varying float vElevation;
varying float vDistToCursor;
varying vec3 vWorldPos;

void main() {
    // Disc shaping with anti-aliased edge
    vec2 coord = gl_PointCoord - vec2(0.5);
    float distFromCenter = length(coord);
    if (distFromCenter > 0.5) {
        discard;
    }
    float discAlpha = smoothstep(0.5, 0.15, distFromCenter);

    // Color gradient based on elevation and cursor proximity
    float elevationFactor = clamp((vElevation + 0.6) / 2.2, 0.0, 1.0);
    float cursorGlow = exp(-vDistToCursor * 0.35) * clamp(u_intensity, 0.0, 1.0);

    // Modern aviation cyan -> electric teal -> luminous core
    vec3 color = mix(u_baseColor, u_highlightColor, elevationFactor * 0.7 + cursorGlow * 0.8);
    // Add specular white highlights at peaks of cursor ripples
    color += vec3(0.7, 0.9, 1.0) * pow(cursorGlow, 2.5);

    // Distance-based circular fade out toward perimeter (fade beyond radius 18.0)
    float planarRadius = length(vWorldPos.xz);
    float borderFade = smoothstep(22.0, 14.0, planarRadius);

    float finalAlpha = discAlpha * borderFade * (0.45 + cursorGlow * 0.5 + elevationFactor * 0.3);

    gl_FragColor = vec4(color, clamp(finalAlpha, 0.0, 0.95));
}
