import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { absensiApi } from '../api/absensiApi';
import { ArrowLeft, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const ScanQRPage = () => {
  const { sesiId } = useParams();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Check if we already have a successful scan or if it's currently loading, don't re-init
    if (scanResult || loading) return;

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const onScanSuccess = async (decodedText) => {
      // Pause scanner
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      setLoading(true);

      try {
        const res = await absensiApi.scanQr(sesiId, decodedText);
        setScanResult({ success: true, message: res.data.message });
      } catch (error) {
        setScanResult({ 
          success: false, 
          message: error.response?.data?.message || 'Gagal memproses QR' 
        });
      } finally {
        setLoading(false);
      }
    };

    const onScanFailure = (error) => {
      // Ignore background scan failures
    };

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  }, [sesiId, scanResult, loading]);

  const handleRetry = () => {
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 p-4 text-white flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-white/20 p-1 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-bold text-lg">Scan QR Kehadiran</h2>
        </div>

        <div className="p-6 flex flex-col items-center min-h-[400px] justify-center">
          {loading ? (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
              <p className="text-slate-500 font-medium">Memproses absensi...</p>
            </div>
          ) : scanResult ? (
            <div className="text-center space-y-4">
              {scanResult.success ? (
                <>
                  <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900">Berhasil!</h3>
                  <p className="text-slate-500">{scanResult.message}</p>
                  <button
                    onClick={() => navigate(-1)}
                    className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 w-full"
                  >
                    Selesai
                  </button>
                </>
              ) : (
                <>
                  <XCircle className="w-20 h-20 text-red-500 mx-auto" />
                  <h3 className="text-xl font-bold text-slate-900">Gagal</h3>
                  <p className="text-slate-500">{scanResult.message}</p>
                  <button
                    onClick={handleRetry}
                    className="mt-4 bg-indigo-50 text-indigo-700 px-6 py-2 rounded-lg font-medium hover:bg-indigo-100 w-full"
                  >
                    Coba Lagi
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="w-full">
              <div id="qr-reader" className="w-full rounded-2xl overflow-hidden"></div>
              <p className="text-center text-sm text-slate-500 mt-4">
                Arahkan kamera ke QR Code yang ditampilkan oleh Ketua / Sekretaris / Bendahara
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScanQRPage;
