// ============================================
// PDF Generator Utility — pdfkit
// Used for: Export laporan kinerja (FR-009)
// ============================================
const PDFDocument = require('pdfkit');

/**
 * Generate a performance report PDF
 * @param {Object} laporanData - Report data from LAPORAN_EVENT
 * @param {Object} eventData - Event details
 * @returns {PDFDocument} - PDF document stream
 */
const generateLaporanPDF = (laporanData, eventData) => {
  const doc = new PDFDocument({ margin: 50 });

  // TODO: Implement full PDF report generation
  // Header
  doc.fontSize(20).text('EventCrew - Laporan Kinerja Panitia', { align: 'center' });
  doc.moveDown();
  doc.fontSize(16).text(eventData.nama_event || 'Event', { align: 'center' });
  doc.moveDown(2);

  // Summary
  doc.fontSize(12).text(`Total Tugas: ${laporanData.total_tugas || 0}`);
  doc.text(`Tugas Selesai: ${laporanData.tugas_selesai || 0}`);
  doc.text(`Tugas Terlambat: ${laporanData.tugas_terlambat || 0}`);
  doc.text(`Persentase Selesai: ${laporanData.persen_selesai || 0}%`);

  return doc;
};

module.exports = { generateLaporanPDF };
