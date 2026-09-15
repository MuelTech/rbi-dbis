import React from "react";
import banner from "@/assets/letterhead-banner.jpg";
import bagongPilipinas from "@/assets/bagong-pilipinas.png";

interface LetterheadProps {
  barangayName?: string;
}

/**
 * Shared official letterhead used by every document template.
 *
 * The banner artwork is placed as a background at the top of the page, and the
 * logo + heading are one vertically-stacked, centred group over its white area.
 * Document content then flows straight after.
 */
const Letterhead: React.FC<LetterheadProps> = ({ barangayName }) => (
  <div className="relative w-full">
    {/* Full banner artwork, behind the content */}
    <img
      src={banner}
      alt=""
      aria-hidden="true"
      className="absolute top-0 left-0 w-full pointer-events-none select-none"
    />

    {/* Logo + heading: one centred, vertically-aligned group */}
    <div className="relative w-full flex flex-col items-center pt-[6mm]">
      <img
        src={bagongPilipinas}
        alt="Bagong Pilipinas"
        className="w-[24mm] pointer-events-none select-none"
      />
      <p className="text-[10pt] font-bold italic tracking-widest uppercase mt-[0.5mm]">
        Bagong Pilipinas
      </p>

      <div className="w-[70%] text-center leading-[1.15] mt-0.5">
        <p className="text-[10pt] font-bold">Republic of the Philippines</p>
        <p className="text-[10pt]">City of Manila</p>
        <p className="text-[11pt] font-bold uppercase">
          {barangayName || "BARANGAY 418"} ZONE 43 DISTRICT IV
        </p>
        <p className="text-[10pt] font-bold uppercase">
          Office of the Barangay Chairman
        </p>
      </div>
    </div>
  </div>
);

export default Letterhead;
