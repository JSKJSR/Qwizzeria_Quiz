import { useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../../styles/BuzzerQRCode.css';

/**
 * Small inline QR code (scoreboard) that expands to a full-screen modal on click.
 * The modal is designed for projecting to an audience.
 */
export default function BuzzerQRCode({ roomCode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const joinUrl = `${window.location.origin}/buzz/${roomCode}`;

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <>
      {/* Small inline QR in scoreboard */}
      <button
        className="buzzer-qr__inline"
        onClick={openModal}
        title="Click to enlarge QR code"
        aria-label="Show QR code to join buzzer room"
      >
        <QRCodeSVG
          value={joinUrl}
          size={56}
          level="M"
          bgColor="transparent"
          fgColor="#e85c1a"
        />
      </button>

      {/* Full-screen modal for projecting */}
      {modalOpen && (
        <div className="buzzer-qr__overlay" onClick={closeModal}>
          <div className="buzzer-qr__modal" onClick={(e) => e.stopPropagation()}>
            <button className="buzzer-qr__close" onClick={closeModal} aria-label="Close">
              &times;
            </button>

            <h2 className="buzzer-qr__title">Join the Buzzer</h2>
            <p className="buzzer-qr__subtitle">Scan the QR code or visit the link below</p>

            <div className="buzzer-qr__code-wrapper">
              <QRCodeSVG
                value={joinUrl}
                size={240}
                level="M"
                bgColor="#ffffff"
                fgColor="#1a1015"
                includeMargin
              />
            </div>

            <div className="buzzer-qr__room-code">{roomCode}</div>

            <div className="buzzer-qr__url">{joinUrl}</div>
          </div>
        </div>
      )}
    </>
  );
}
