(async function silentPDF() {
  let pdfName = document.title.replace(/\s*[-–]\s*Google\s*Drive$/i, '').trim();
  if (!pdfName.toLowerCase().endsWith('.pdf')) pdfName += '.pdf';

  let canvases = [];
  document.querySelectorAll('canvas').forEach(c => {
    if (c.width > 100 && c.height > 100) canvases.push(c);
  });

  if (canvases.length === 0) {
    const images = document.querySelectorAll('img[src^="blob:"]');
    for (let img of images) {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvases.push(c);
    }
  }

  if (canvases.length === 0) {
    console.error('❌ Không tìm thấy trang nào.');
    return;
  }

  console.log(`📄 Tìm thấy ${canvases.length} trang.`);

  // Hàm tạo PDF thủ công (đơn giản, không dùng thư viện)
  function createPDFFromImages(images, filename) {
    // images: mảng { width, height, dataURL (JPEG) }
    // Trả về Blob

    // Chuyển dataURL sang Uint8Array
    function dataURLToBytes(dataURL) {
      const base64 = dataURL.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }

    // Khởi tạo các phần
    let objects = [];
    let objCounter = 1;
    let imageRefs = [];

    // Hàm tạo object text (không có stream)
    function createObjectText(num, content) {
      return `${num} 0 obj\n${content}\nendobj\n`;
    }

    // Tạo XObject cho từng ảnh
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imgBytes = dataURLToBytes(img.dataURL);
      const w = img.width;
      const h = img.height;
      // Object nội dung (chứa stream)
      const streamContent = `<< /Length ${imgBytes.length} /Filter /DCTDecode >>\nstream\n`;
      const objNum = objCounter++;
      // Lưu object này với stream bytes
      objects.push({
        num: objNum,
        text: `${objNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 ${streamContent}`,
        stream: imgBytes,
        endText: `\nendstream\nendobj\n`
      });
      imageRefs.push({ id: objNum, width: w, height: h });
    }

    // Tạo trang
    let pageRefs = [];
    for (let i = 0; i < images.length; i++) {
      const img = imageRefs[i];
      const w = img.width;
      const h = img.height;
      // Nội dung trang (vẽ ảnh)
      const content = `q\n${w} 0 0 ${h} 0 0 cm\n/Img${i+1} Do\nQ`;
      const contentObjNum = objCounter++;
      objects.push({
        num: contentObjNum,
        text: `${contentObjNum} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
        stream: null
      });
      // Page object
      const pageObjNum = objCounter++;
      const pageText = `${pageObjNum} 0 obj\n<< /Type /Page /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Img${i+1} ${img.id} 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj\n`;
      objects.push({
        num: pageObjNum,
        text: pageText,
        stream: null
      });
      pageRefs.push(pageObjNum);
    }

    // Pages
    const pagesObjNum = objCounter++;
    const pagesText = `${pagesObjNum} 0 obj\n<< /Type /Pages /Count ${pageRefs.length} /Kids [${pageRefs.map(n => `${n} 0 R`).join(' ')}] >>\nendobj\n`;
    objects.push({ num: pagesObjNum, text: pagesText, stream: null });

    // Catalog
    const catalogObjNum = objCounter++;
    const catalogText = `${catalogObjNum} 0 obj\n<< /Type /Catalog /Pages ${pagesObjNum} 0 R >>\nendobj\n`;
    objects.push({ num: catalogObjNum, text: catalogText, stream: null });

    // Xây dựng file PDF (nối các phần)
    let parts = [];
    parts.push(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34, 0x0A])); // %PDF-1.4\n

    // Sắp xếp object theo số thứ tự
    objects.sort((a, b) => a.num - b.num);

    // Ghi từng object
    let offsets = {};
    let currentOffset = parts.reduce((sum, p) => sum + p.length, 0);
    for (let obj of objects) {
      offsets[obj.num] = currentOffset;
      // Ghi text
      const textBytes = new TextEncoder().encode(obj.text);
      parts.push(textBytes);
      currentOffset += textBytes.length;
      if (obj.stream) {
        parts.push(obj.stream);
        currentOffset += obj.stream.length;
        const endBytes = new TextEncoder().encode(obj.endText);
        parts.push(endBytes);
        currentOffset += endBytes.length;
      }
    }

    // Xref
    const xrefOffset = currentOffset;
    let xref = `xref\n0 ${objCounter}\n0000000000 65535 f \n`;
    for (let i = 1; i < objCounter; i++) {
      const off = offsets[i] || 0;
      xref += String(off).padStart(10, '0') + ' 00000 n \n';
    }
    const trailer = `trailer\n<< /Size ${objCounter} /Root ${catalogObjNum} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    // Ghi xref và trailer
    parts.push(new TextEncoder().encode(xref));
    parts.push(new TextEncoder().encode(trailer));

    // Gộp các phần thành blob
    const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
    const result = new Uint8Array(totalLength);
    let pos = 0;
    for (let p of parts) {
      result.set(p, pos);
      pos += p.length;
    }
    return new Blob([result], { type: 'application/pdf' });
  }

  // Chuẩn bị dữ liệu ảnh
  const images = canvases.map(c => ({
    width: c.width,
    height: c.height,
    dataURL: c.toDataURL('image/jpeg', 0.95)
  }));

  console.log('⏳ Đang tạo PDF...');
  const pdfBlob = createPDFFromImages(images, pdfName);

  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = pdfName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);

  console.log(`✅ File "${pdfName}" đã tải xuống.`);
})();
