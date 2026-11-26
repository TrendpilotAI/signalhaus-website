import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Home-screen / touch icon. Matches the terracotta mark in icon.svg so iOS
 * and other clients that request /apple-icon (or apple-touch-icon) get a PNG
 * instead of the HTML 404 page.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#A84D34",
          borderRadius: 40,
        }}
      >
        <svg width="110" height="110" viewBox="0 0 64 64" fill="none">
          <path
            d="M14 50V30.5L28 18l14 12.5V50z M24 50V39.5h8V50 M41 16.5a8.5 8.5 0 0 1 7.5 7.5 M42 9a16 16 0 0 1 14 14"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
