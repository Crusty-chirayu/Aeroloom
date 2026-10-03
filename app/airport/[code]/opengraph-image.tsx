import { ImageResponse } from 'next/og';
import { GLOBAL_AIRPORTS } from '@/lib/airports/airportData';

export const runtime = 'nodejs';

export const alt = 'Aeroloom — Aerodrome Dossier';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const resolvedParams = await params;
  const rawCode = resolvedParams?.code ? decodeURIComponent(resolvedParams.code) : 'AIRPORT';
  const upperCode = rawCode.toUpperCase();

  const airport = GLOBAL_AIRPORTS.find(
    (a) => a.icao.toUpperCase() === upperCode || a.iata?.toUpperCase() === upperCode
  );

  const icao = airport?.icao || upperCode;
  const iata = airport?.iata || (upperCode.length === 3 ? upperCode : '---');
  const name = airport?.name || `${upperCode} Aerodrome`;
  const location = airport ? `${airport.city}, ${airport.country}` : 'Global Airspace Station';
  const elevation = airport?.elevationFt ? `${airport.elevationFt} FT ELEVATION` : 'SEA LEVEL';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#F6F4EE',
          padding: '60px 80px',
          border: '12px solid #EDEAE2',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 5 24 C 9 24, 12 18, 15 12 C 17.5 7, 21.5 5.5, 24.5 7.5 C 27.5 9.5, 27 15, 23.5 18 C 19 22, 11 22.5, 7.5 17 C 4.5 12, 7 6.5, 13.5 6.5 C 19 6.5, 23.5 11, 26.5 17"
                stroke="#0E1116"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 10 9 C 14 13, 18 19, 22 25"
                stroke="#0E1116"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeDasharray="0.1 6.5"
              />
              <circle cx="26.5" cy="17" r="2.8" fill="#FF4F1F" />
            </svg>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#0E1116',
                fontFamily: 'monospace',
              }}
            >
              AEROLOOM · AERODROME DOSSIER
            </span>
          </div>

          <div
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              border: '1px solid #D9D7CE',
              backgroundColor: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'monospace',
              color: '#4B525D',
            }}
          >
            TERMINAL RADAR SECTOR
          </div>
        </div>

        {/* Center Airport Card Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '18px' }}>
            <span
              style={{
                fontSize: '84px',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                color: '#0E1116',
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {icao}
            </span>
            {iata && iata !== '---' && (
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 600,
                  color: '#FF4F1F',
                  fontFamily: 'monospace',
                }}
              >
                /{iata}
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '36px',
              fontWeight: 600,
              color: '#0E1116',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
            }}
          >
            {name}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '22px',
              color: '#4B525D',
            }}
          >
            {location}
          </div>

          {/* Badges Row */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <div
              style={{
                padding: '6px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D7CE',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: '#0E1116',
              }}
            >
              {elevation}
            </div>

            <div
              style={{
                padding: '6px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D7CE',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: '#0E1116',
              }}
            >
              ATC RADAR SCOPE READY
            </div>

            <div
              style={{
                padding: '6px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D7CE',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: '#0E1116',
              }}
            >
              NOAA METAR TELEMETRY
            </div>
          </div>
        </div>

        {/* Bottom Metadata Band */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #D9D7CE',
            paddingTop: '24px',
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#878D96',
          }}
        >
          <div style={{ display: 'flex' }}>EDITORIAL AVIATION CARTOGRAPHY</div>
          <div style={{ display: 'flex' }}>LIVE TERMINAL TRAFFIC</div>
          <div style={{ display: 'flex', color: '#FF4F1F', fontWeight: 700 }}>VERIFIED AERODROME INDEX</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
