import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'Aeroloom — Flight Dossier';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : 'FLIGHT';
  const displayId = rawId.toUpperCase();

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
              AEROLOOM · FLIGHT DOSSIER
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
              color: '#FF4F1F',
            }}
          >
            LIVE TELEMETRY
          </div>
        </div>

        {/* Center Flight Card Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              {displayId}
            </span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#FFE9E1',
                border: '1px solid #FF4F1F',
                color: '#C93A10',
                fontSize: '15px',
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              AIRBORNE CONTACT
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#4B525D',
              lineHeight: 1.4,
              maxWidth: '850px',
            }}
          >
            Real-time ADS-B transponder telemetry, barometric altitude profile, ground vector reckoning, and verified feed provenance.
          </div>

          {/* Telemetry Stat Pill Row */}
          <div style={{ display: 'flex', gap: '24px', marginTop: '10px' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D7CE',
                borderRadius: '8px',
                padding: '14px 24px',
              }}
            >
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#878D96', letterSpacing: '0.06em' }}>
                IDENTIFIER / HEX
              </span>
              <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 700, color: '#0E1116', marginTop: '4px' }}>
                {displayId}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D7CE',
                borderRadius: '8px',
                padding: '14px 24px',
              }}
            >
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#878D96', letterSpacing: '0.06em' }}>
                TELEMETRY SOURCE
              </span>
              <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 700, color: '#0E1116', marginTop: '4px' }}>
                1090 MHz ADS-B
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9D7CE',
                borderRadius: '8px',
                padding: '14px 24px',
              }}
            >
              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#878D96', letterSpacing: '0.06em' }}>
                INTERPOLATION
              </span>
              <span style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 700, color: '#0E1116', marginTop: '4px' }}>
                Sub-Pixel Kinematics
              </span>
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
          <div style={{ display: 'flex' }}>ZERO SYNTHETIC TRAFFIC</div>
          <div style={{ display: 'flex', color: '#FF4F1F', fontWeight: 700 }}>VERIFIED PROVENANCE</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
