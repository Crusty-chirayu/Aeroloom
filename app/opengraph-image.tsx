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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#FF4F1F',
              }}
            />
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '0.1em',
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
