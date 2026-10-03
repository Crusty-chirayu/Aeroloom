import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

export const size = {
  width: 180,
  height: 180,
};

export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F6F4EE',
          borderRadius: '40px',
          border: '4px solid #EDEAE2',
        }}
      >
        <svg
          width="116"
          height="116"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Weft Thread 1: Flight vector */}
          <path
            d="M 5 24 C 9 24, 12 18, 15 12 C 17.5 7, 21.5 5.5, 24.5 7.5 C 27.5 9.5, 27 15, 23.5 18 C 19 22, 11 22.5, 7.5 17 C 4.5 12, 7 6.5, 13.5 6.5 C 19 6.5, 23.5 11, 26.5 17"
            stroke="#0E1116"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Loom Cross-Weave Thread */}
          <path
            d="M 10 9 C 14 13, 18 19, 22 25"
            stroke="#0E1116"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="0.1 6.5"
          />

          {/* Vermilion Beacon Dot */}
          <circle cx="26.5" cy="17" r="2.8" fill="#FF4F1F" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
