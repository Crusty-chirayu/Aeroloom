import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const alt = 'Aeroloom — Live Airspace Intelligence';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
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
                fontSize: '22px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#0E1116',
                fontFamily: 'monospace',
              }}
            >
              AEROLOOM
            </span>
          </div>

          <div
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              border: '1px solid #D9D7CE',
              backgroundColor: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'monospace',
              color: '#4B525D',
            }}
          >
            LIVE AIRSPACE OBSERVATORY
          </div>
        </div>

        {/* Center Display Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'baseline',
              fontSize: '76px',
              lineHeight: 1.05,
              fontWeight: 400,
              color: '#0E1116',
              letterSpacing: '-0.03em',
            }}
          >
            <span>Every flight.&nbsp;</span>
            <span style={{ color: '#FF4F1F' }}>Right now.</span>
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: '24px',
              color: '#4B525D',
              maxWidth: '850px',
              lineHeight: 1.4,
            }}
          >
            Real-time crowdsourced ADS-B flight tracking with editorial cartography, sub-pixel dead reckoning, and verified telemetry provenance.
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
          <div style={{ display: 'flex' }}>LIGHT EDITORIAL CARTOGRAPHY</div>
          <div style={{ display: 'flex' }}>175+ RESOLVED AIRFRAMES</div>
          <div style={{ display: 'flex', color: '#FF4F1F', fontWeight: 700 }}>ZERO SYNTHETIC TRAFFIC</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
