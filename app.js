/**
 * TimeMark Camera & Watermark Mobile App Engine
 * Recreates the exact TimeMark watermark and mobile user experience
 */

(() => {
  'use strict';

  // --- STATE ---
  const state = {
    currentImage: null, // { file, imgElement, width, height, parsedDate, lat, lng, address }
    template: 'time_location', // time_location | attendance | service | completed | project_report
    
    // Watermark Content
    dateTime: new Date(),
    address: 'West Bay B - Kđt Ecopark KĐT Ecopark,\nX.Phụng Công, Hưng Yên',
    title: 'West Bay B - KĐT Ecopark',
    details: 'Kiểm tra an ninh & tuần tra',
    phone: '0912 345 678',
    
    // Style & Placement
    position: 'bottom-left',
    scale: 100, // percentage
    amberColor: '#E5A93C', // Signature TimeMark Amber Bar
    textColor: '#FFFFFF'
  };

  const VN_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

  // DOM Elements
  const DOM = {
    // Top Bar
    btnPickGallery: document.getElementById('btnPickGallery'),
    filePickerInput: document.getElementById('filePickerInput'),
    
    // Viewport & Canvas
    canvasHolder: document.getElementById('canvasHolder'),
    mainCanvas: document.getElementById('mainCanvas'),
    tapToPickOverlay: document.getElementById('tapToPickOverlay'),
    btnLoadDemoImage: document.getElementById('btnLoadDemoImage'),
    floatingActions: document.getElementById('floatingActions'),
    btnOpenEditModal: document.getElementById('btnOpenEditModal'),
    btnQuickSave: document.getElementById('btnQuickSave'),
    
    // Drawer & Templates
    bottomDrawer: document.getElementById('bottomDrawer'),
    btnCloseDrawer: document.getElementById('btnCloseDrawer'),
    templateCards: document.querySelectorAll('.tm-template-card'),
    
    // Bottom Nav
    btnNavGallery: document.getElementById('btnNavGallery'),
    btnNavEdit: document.getElementById('btnNavEdit'),
    btnNavSave: document.getElementById('btnNavSave'),
    
    // Edit Modal
    editModalOverlay: document.getElementById('editModalOverlay'),
    btnCloseEditModal: document.getElementById('btnCloseEditModal'),
    btnSaveModalChanges: document.getElementById('btnSaveModalChanges'),
    editDateTime: document.getElementById('editDateTime'),
    btnUseExifDate: document.getElementById('btnUseExifDate'),
    btnUseNowDate: document.getElementById('btnUseNowDate'),
    editAddress: document.getElementById('editAddress'),
    btnGetGpsLoc: document.getElementById('btnGetGpsLoc'),
    editTitle: document.getElementById('editTitle'),
    editDetails: document.getElementById('editDetails'),
    editPhone: document.getElementById('editPhone'),
    posButtons: document.querySelectorAll('.tm-pos-btn'),
    rangeScale: document.getElementById('rangeScale'),
    valScale: document.getElementById('valScale'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- INITIALIZATION ---
  function init() {
    // Set initial date/time to now
    syncDateTimeInput();
    DOM.editAddress.value = state.address;
    DOM.editTitle.value = state.title;
    DOM.editDetails.value = state.details;
    DOM.editPhone.value = state.phone;

    // Setup event listeners
    bindEvents();

    // Auto load a sample image so user sees the exact TimeMark look immediately
    loadSamplePhoto();
  }

  // --- EVENT BINDING ---
  function bindEvents() {
    // Pick photo triggers
    DOM.btnPickGallery.addEventListener('click', () => DOM.filePickerInput.click());
    DOM.btnNavGallery.addEventListener('click', () => DOM.filePickerInput.click());
    DOM.tapToPickOverlay.addEventListener('click', (e) => {
      if (e.target !== DOM.btnLoadDemoImage) {
        DOM.filePickerInput.click();
      }
    });
    DOM.filePickerInput.addEventListener('change', handleFileSelected);

    // Demo image
    DOM.btnLoadDemoImage.addEventListener('click', (e) => {
      e.stopPropagation();
      loadSamplePhoto();
    });

    // Template selection
    DOM.templateCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.templateCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.template = card.dataset.template;
        renderCanvas();
      });

      // Quick edit button inside card
      const editBtn = card.querySelector('.tm-btn-edit-trigger');
      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openEditModal();
        });
      }
    });

    // Edit Modal open/close
    DOM.btnOpenEditModal.addEventListener('click', openEditModal);
    DOM.btnNavEdit.addEventListener('click', openEditModal);
    DOM.btnCloseEditModal.addEventListener('click', closeEditModal);
    DOM.btnSaveModalChanges.addEventListener('click', applyModalChanges);
    DOM.editModalOverlay.addEventListener('click', (e) => {
      if (e.target === DOM.editModalOverlay) closeEditModal();
    });

    // Date actions in modal
    DOM.btnUseNowDate.addEventListener('click', () => {
      state.dateTime = new Date();
      syncDateTimeInput();
    });
    DOM.btnUseExifDate.addEventListener('click', applyExifDate);

    // GPS in modal
    DOM.btnGetGpsLoc.addEventListener('click', requestDeviceGps);

    // Position buttons in modal
    DOM.posButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.posButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.position = btn.dataset.pos;
      });
    });

    // Scale slider in modal
    DOM.rangeScale.addEventListener('input', (e) => {
      state.scale = parseInt(e.target.value, 10);
      DOM.valScale.textContent = `${state.scale}%`;
      renderCanvas();
    });

    // Save image triggers
    DOM.btnQuickSave.addEventListener('click', downloadStampedPhoto);
    DOM.btnNavSave.addEventListener('click', downloadStampedPhoto);

    // Drawer toggle
    DOM.btnCloseDrawer.addEventListener('click', () => {
      DOM.bottomDrawer.classList.toggle('collapsed');
    });
  }

  function syncDateTimeInput() {
    const d = state.dateTime;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    DOM.editDateTime.value = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  }

  // --- FILE & EXIF HANDLING ---
  async function handleFileSelected(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    showToast("Đang đọc thông tin ảnh...", "info");

    let parsedDate = null;
    let lat = null;
    let lng = null;

    // Read EXIF with exifr
    if (window.exifr) {
      try {
        const exif = await window.exifr.parse(file, [
          'DateTimeOriginal', 'CreateDate', 'latitude', 'longitude'
        ]);
        if (exif) {
          const rawDate = exif.DateTimeOriginal || exif.CreateDate;
          if (rawDate instanceof Date && !isNaN(rawDate)) {
            parsedDate = rawDate;
          }
          if (typeof exif.latitude === 'number' && typeof exif.longitude === 'number') {
            lat = exif.latitude;
            lng = exif.longitude;
          }
        }
      } catch (err) {
        console.warn("EXIF error:", err);
      }
    }

    if (!parsedDate && file.lastModified) {
      parsedDate = new Date(file.lastModified);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        state.currentImage = {
          file: file,
          imgElement: img,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          parsedDate: parsedDate,
          lat: lat,
          lng: lng
        };

        if (parsedDate) {
          state.dateTime = parsedDate;
          syncDateTimeInput();
          DOM.btnUseExifDate.disabled = false;
        } else {
          DOM.btnUseExifDate.disabled = true;
        }

        // Hide tap placeholder, show floating actions
        DOM.tapToPickOverlay.style.display = 'none';
        DOM.floatingActions.style.display = 'flex';

        renderCanvas();
        showToast("Đã tải ảnh & cập nhật ngày giờ thành công!", "success");

        // If GPS found, reverse geocode
        if (lat && lng) {
          fetchAddressFromCoords(lat, lng);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function applyExifDate() {
    if (state.currentImage && state.currentImage.parsedDate) {
      state.dateTime = state.currentImage.parsedDate;
      syncDateTimeInput();
      renderCanvas();
      showToast("Đã dùng ngày giờ chụp gốc từ ảnh!", "success");
    }
  }

  function requestDeviceGps() {
    if (!navigator.geolocation) {
      showToast("Trình duyệt không hỗ trợ định vị.", "error");
      return;
    }
    showToast("Đang lấy vị trí GPS...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetchAddressFromCoords(lat, lng);
      },
      (err) => {
        showToast("Không thể lấy GPS: " + err.message, "error");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  async function fetchAddressFromCoords(lat, lng) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
      const data = await res.json();
      if (data && data.display_name) {
        state.address = data.display_name;
        DOM.editAddress.value = state.address;
        renderCanvas();
        showToast("Đã cập nhật địa chỉ từ GPS!", "success");
      }
    } catch (e) {
      console.warn("Geocode error:", e);
    }
  }

  // --- SAMPLE PHOTO CREATOR ---
  function loadSamplePhoto() {
    const w = 1080;
    const h = 1920; // 9:16 vertical phone aspect ratio
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d');

    // Realistic night/evening background like in the user's screenshot
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#000000');
    grad.addColorStop(0.5, '#070a0f');
    grad.addColorStop(0.85, '#0b1118');
    grad.addColorStop(1, '#111923');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle architecture lights in distance
    ctx.fillStyle = 'rgba(255, 230, 160, 0.4)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 37) % w;
      const y = h * 0.45 + ((i * 53) % (h * 0.25));
      ctx.fillRect(x, y, 3, 3);
    }

    const img = new Image();
    img.onload = () => {
      state.currentImage = {
        file: { name: 'TimeMark_Sample.jpg' },
        imgElement: img,
        width: w,
        height: h,
        parsedDate: new Date()
      };
      DOM.tapToPickOverlay.style.display = 'none';
      DOM.floatingActions.style.display = 'flex';
      renderCanvas();
    };
    img.src = tempCanvas.toDataURL('image/jpeg', 0.9);
  }

  // --- EDIT MODAL HANDLING ---
  function openEditModal() {
    syncDateTimeInput();
    DOM.editAddress.value = state.address;
    DOM.editTitle.value = state.title;
    DOM.editDetails.value = state.details;
    DOM.editPhone.value = state.phone;
    DOM.rangeScale.value = state.scale;
    DOM.valScale.textContent = `${state.scale}%`;
    DOM.editModalOverlay.classList.add('active');
  }

  function closeEditModal() {
    DOM.editModalOverlay.classList.remove('active');
  }

  function applyModalChanges() {
    if (DOM.editDateTime.value) {
      state.dateTime = new Date(DOM.editDateTime.value);
    }
    state.address = DOM.editAddress.value.trim();
    state.title = DOM.editTitle.value.trim();
    state.details = DOM.editDetails.value.trim();
    state.phone = DOM.editPhone.value.trim();
    closeEditModal();
    renderCanvas();
    showToast("Đã cập nhật nội dung tem!", "success");
  }

  // --- CANVAS RENDERING (PIXEL-ACCURATE TIMEMARK STAMP) ---
  function renderCanvas() {
    if (!state.currentImage) return;

    const img = state.currentImage.imgElement;
    const w = state.currentImage.width;
    const h = state.currentImage.height;

    const canvas = DOM.mainCanvas;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // 1. Draw base photo
    ctx.drawImage(img, 0, 0, w, h);

    // 2. Proportional scale factor based on image resolution
    // Base 1080p width = 1.0 multiplier
    const baseScale = Math.min(w, h) / 1080;
    const userScale = state.scale / 100;
    const s = baseScale * userScale;

    // Date/Time parts
    const d = state.dateTime;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    // TimeMark format: "26 Tháng 10,2026"
    const dateLineStr = `${day} Tháng ${month},${year}`;
    const dayOfWeekStr = VN_DAYS[d.getDay()];

    // Render Template
    ctx.save();
    switch (state.template) {
      case 'time_location':
        renderTemplateTimeLocation(ctx, w, h, s, timeStr, dateLineStr, dayOfWeekStr, state.address);
        break;
      case 'attendance':
        renderTemplateAttendance(ctx, w, h, s, timeStr, `${day}/${month}/${year}`, state.address);
        break;
      case 'service':
        renderTemplateService(ctx, w, h, s, state.title, `${day}/${month}/${year} ${timeStr}`, state.details, state.phone);
        break;
      case 'completed':
        renderTemplateCompleted(ctx, w, h, s, timeStr, `${day}/${month}/${year}`, state.address);
        break;
      case 'project_report':
        renderTemplateProjectReport(ctx, w, h, s, timeStr, `${day}/${month}/${year}`, state.title, state.details, state.address);
        break;
      default:
        renderTemplateTimeLocation(ctx, w, h, s, timeStr, dateLineStr, dayOfWeekStr, state.address);
    }
    ctx.restore();
  }

  /**
   * TEMPLATE 1: THỜI GIAN & VỊ TRÍ (The exact signature TimeMark watermark in screenshot)
   * Format:
   * 03:57 | 26 Tháng 10,2026
   *       | Thứ Hai
   * West Bay B - Kđt Ecopark KĐT Ecopark,
   * X.Phụng Công, Hưng Yên
   */
  function renderTemplateTimeLocation(ctx, imgW, imgH, s, timeStr, dateStr, dayStr, address) {
    const margin = 46 * s;
    const timeFontSize = Math.round(92 * s);
    const dateFontSize = Math.round(26 * s);
    const addrFontSize = Math.round(24 * s);
    const lineGap = Math.round(34 * s);

    // Setup text shadow so it's razor-sharp legible over ANY background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 6 * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2 * s;

    // Measure time text width
    ctx.font = `600 ${timeFontSize}px "Oswald", "Plus Jakarta Sans", sans-serif`;
    const timeWidth = ctx.measureText(timeStr).width;

    // Amber bar dimensions
    const barWidth = 3.5 * s;
    const barHeight = timeFontSize * 0.88;
    const barGap = 16 * s;

    // Wrap address text
    ctx.font = `500 ${addrFontSize}px "Plus Jakarta Sans", sans-serif`;
    const maxAddrWidth = Math.min(imgW - margin * 2, 700 * s);
    const addrLines = [];
    address.split('\n').forEach(part => {
      const wrapped = wrapText(ctx, part.trim(), maxAddrWidth);
      wrapped.forEach(l => addrLines.push(l));
    });

    // Total height calculation
    const headerHeight = timeFontSize;
    const totalHeight = headerHeight + (18 * s) + (addrLines.length * lineGap);

    // Positioning
    const { startX, startY } = calculatePosition(imgW, imgH, margin, totalHeight, state.position);

    // 1. Draw Big Time "03:57"
    ctx.font = `600 ${timeFontSize}px "Oswald", "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.fillText(timeStr, startX, startY + timeFontSize * 0.85);

    // 2. Draw Amber Vertical Bar "|"
    const barX = startX + timeWidth + barGap;
    const barY = startY + (timeFontSize * 0.05);

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent'; // Clean bar
    drawRoundedBar(ctx, barX, barY, barWidth, barHeight, 2 * s);
    ctx.fill();
    ctx.restore();

    // 3. Draw Date & Day of Week stacked next to bar
    const textNextToBarX = barX + barWidth + barGap;
    ctx.font = `600 ${dateFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = state.textColor;

    // Line 1: Date "26 Tháng 10,2026"
    ctx.fillText(dateStr, textNextToBarX, barY + dateFontSize * 0.95);

    // Line 2: Day "Thứ Hai"
    ctx.fillText(dayStr, textNextToBarX, barY + (barHeight * 0.88));

    // 4. Draw Address Lines below
    let curAddrY = startY + timeFontSize + (16 * s);
    ctx.font = `500 ${addrFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';

    addrLines.forEach(line => {
      ctx.fillText(line, startX, curAddrY + addrFontSize * 0.85);
      curAddrY += lineGap;
    });
  }

  /**
   * TEMPLATE 2: ĐIỂM DANH (Yellow Tag Attendance)
   */
  function renderTemplateAttendance(ctx, imgW, imgH, s, timeStr, dateStr, address) {
    const margin = 46 * s;
    const tagFontSize = Math.round(22 * s);
    const timeFontSize = Math.round(28 * s);
    const bodyFontSize = Math.round(24 * s);
    const lineGap = Math.round(34 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 6 * s;

    // Measure widths
    ctx.font = `800 ${tagFontSize}px "Plus Jakarta Sans", sans-serif`;
    const tagW = ctx.measureText("Điểm danh").width + (16 * s);
    const tagH = 34 * s;

    ctx.font = `700 ${timeFontSize}px "JetBrains Mono", monospace`;
    const timeW = ctx.measureText(timeStr).width + (18 * s);

    // Wrap address
    ctx.font = `500 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    const maxAddrWidth = Math.min(imgW - margin * 2 - (24 * s), 700 * s);
    const addrLines = [];
    address.split('\n').forEach(part => {
      const wrapped = wrapText(ctx, part.trim(), maxAddrWidth);
      wrapped.forEach(l => addrLines.push(l));
    });

    const totalHeight = tagH + (16 * s) + lineGap + (addrLines.length * lineGap);
    const { startX, startY } = calculatePosition(imgW, imgH, margin, totalHeight, state.position);

    // Tag: [Điểm danh]
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, startY, tagW, tagH, 6 * s);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `800 ${tagFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText("Điểm danh", startX + (8 * s), startY + tagFontSize * 1.15);
    ctx.restore();

    // Time Box: [23:40]
    ctx.save();
    const timeBoxX = startX + tagW + (6 * s);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, timeBoxX, startY, timeW, tagH, 6 * s);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `800 ${timeFontSize}px "JetBrains Mono", monospace`;
    ctx.fillText(timeStr, timeBoxX + (8 * s), startY + timeFontSize * 0.95);
    ctx.restore();

    // Body with Amber Vertical Line
    const bodyStartY = startY + tagH + (12 * s);
    const barHeight = (1 + addrLines.length) * lineGap - (8 * s);
    const barX = startX;

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, barX, bodyStartY, 3.5 * s, barHeight, 2 * s);
    ctx.fill();
    ctx.restore();

    const textX = barX + (14 * s);
    let curY = bodyStartY;

    ctx.font = `600 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dateStr, textX, curY + bodyFontSize * 0.85);

    curY += lineGap;
    ctx.font = `500 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    addrLines.forEach(l => {
      ctx.fillText(l, textX, curY + bodyFontSize * 0.85);
      curY += lineGap;
    });
  }

  /**
   * TEMPLATE 3: DỊCH VỤ / CÔNG VIỆC
   */
  function renderTemplateService(ctx, imgW, imgH, s, title, dateStr, details, phone) {
    const margin = 46 * s;
    const titleFontSize = Math.round(30 * s);
    const bodyFontSize = Math.round(23 * s);
    const lineGap = Math.round(32 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 6 * s;

    const totalHeight = titleFontSize + (16 * s) + (3 * lineGap);
    const { startX, startY } = calculatePosition(imgW, imgH, margin, totalHeight, state.position);

    // Title
    ctx.font = `700 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title || 'Tên dịch vụ', startX, startY + titleFontSize * 0.85);

    // Amber bar
    const bodyStartY = startY + titleFontSize + (12 * s);
    const barHeight = (3 * lineGap) - (6 * s);

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, bodyStartY, 3.5 * s, barHeight, 2 * s);
    ctx.fill();
    ctx.restore();

    const textX = startX + (14 * s);
    let curY = bodyStartY;

    ctx.font = `600 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dateStr, textX, curY + bodyFontSize * 0.85);

    curY += lineGap;
    ctx.fillText(`👉 : ${details || 'Chi tiết dịch vụ'}`, textX, curY + bodyFontSize * 0.85);

    curY += lineGap;
    ctx.fillText(`☎ : ${phone || '0123456666'}`, textX, curY + bodyFontSize * 0.85);
  }

  /**
   * TEMPLATE 4: ĐÃ HOÀN THÀNH (Task Completed)
   */
  function renderTemplateCompleted(ctx, imgW, imgH, s, timeStr, dateStr, address) {
    const margin = 46 * s;
    const badgeFontSize = Math.round(22 * s);
    const titleFontSize = Math.round(28 * s);
    const bodyFontSize = Math.round(24 * s);
    const lineGap = Math.round(34 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 6 * s;

    ctx.font = `800 ${badgeFontSize}px "Plus Jakarta Sans", sans-serif`;
    const badgeText = `${timeStr} ✓`;
    const badgeW = ctx.measureText(badgeText).width + (18 * s);
    const badgeH = 32 * s;

    const totalHeight = badgeH + (8 * s) + titleFontSize + (14 * s) + (2 * lineGap);
    const { startX, startY } = calculatePosition(imgW, imgH, margin, totalHeight, state.position);

    // Green badge: [09:30 ✓]
    ctx.save();
    ctx.fillStyle = '#00c06d';
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, startY, badgeW, badgeH, 6 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${badgeFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(badgeText, startX + (9 * s), startY + badgeFontSize * 1.05);
    ctx.restore();

    // Bold title: "Đã hoàn thành"
    const titleY = startY + badgeH + (12 * s);
    ctx.font = `800 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Đã hoàn thành", startX, titleY + titleFontSize * 0.85);

    // Amber bar below
    const bodyStartY = titleY + titleFontSize + (10 * s);
    const barHeight = (2 * lineGap) - (6 * s);

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, bodyStartY, 3.5 * s, barHeight, 2 * s);
    ctx.fill();
    ctx.restore();

    const textX = startX + (14 * s);
    let curY = bodyStartY;

    ctx.font = `600 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dateStr, textX, curY + bodyFontSize * 0.85);

    curY += lineGap;
    ctx.font = `500 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(address.split('\n')[0], textX, curY + bodyFontSize * 0.85);
  }

  /**
   * TEMPLATE 5: CÔNG TRÌNH & DỰ ÁN (Detailed Project Format)
   */
  function renderTemplateProjectReport(ctx, imgW, imgH, s, timeStr, dateStr, title, details, address) {
    const margin = 46 * s;
    const timeFontSize = Math.round(64 * s);
    const bodyFontSize = Math.round(22 * s);
    const lineGap = Math.round(30 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 6 * s;

    const totalHeight = timeFontSize + (16 * s) + (4 * lineGap);
    const { startX, startY } = calculatePosition(imgW, imgH, margin, totalHeight, state.position);

    // Time
    ctx.font = `700 ${timeFontSize}px "JetBrains Mono", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeStr, startX, startY + timeFontSize * 0.85);

    // Horizontal Accent Line
    const lineY = startY + timeFontSize + (8 * s);
    ctx.save();
    ctx.fillStyle = '#0084ff';
    ctx.shadowColor = 'transparent';
    ctx.fillRect(startX, lineY, 260 * s, 3.5 * s);
    ctx.restore();

    let curY = lineY + (14 * s);
    ctx.font = `600 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';

    ctx.fillText(`🕒 Thời gian: ${dateStr}`, startX, curY + bodyFontSize * 0.85);
    curY += lineGap;

    ctx.fillText(`🏢 Dự án: ${title || 'West Bay B - Ecopark'}`, startX, curY + bodyFontSize * 0.85);
    curY += lineGap;

    ctx.fillText(`📋 Hạng mục: ${details || 'Nghiệm thu hiện trường'}`, startX, curY + bodyFontSize * 0.85);
    curY += lineGap;

    ctx.fillText(`📍 Vị trí: ${address.split('\n')[0]}`, startX, curY + bodyFontSize * 0.85);
  }

  // --- DRAWING HELPERS ---
  function calculatePosition(imgW, imgH, margin, totalH, pos) {
    let startX = margin;
    let startY = imgH - totalH - margin;

    switch (pos) {
      case 'bottom-left':
        startX = margin;
        startY = imgH - totalH - margin;
        break;
      case 'bottom-center':
        startX = imgW * 0.15;
        startY = imgH - totalH - margin;
        break;
      case 'bottom-right':
        startX = imgW * 0.35;
        startY = imgH - totalH - margin;
        break;
      case 'top-left':
        startX = margin;
        startY = margin;
        break;
      case 'top-right':
        startX = imgW * 0.35;
        startY = margin;
        break;
    }
    return { startX, startY };
  }

  function drawRoundedBar(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // --- EXPORT & DOWNLOAD ---
  function downloadStampedPhoto() {
    if (!state.currentImage) {
      showToast("Vui lòng chọn ảnh trước!", "error");
      return;
    }

    showToast("Đang kết xuất ảnh nét gốc...", "info");

    setTimeout(() => {
      DOM.mainCanvas.toBlob((blob) => {
        if (!blob) {
          showToast("Lỗi kết xuất ảnh", "error");
          return;
        }

        const dateTag = state.dateTime.toISOString().slice(0, 10).replace(/-/g, "");
        const fileName = `TimeMark_${dateTag}_${Date.now().toString().slice(-4)}.jpg`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(link.href), 4000);
        showToast("Đã lưu ảnh vào máy thành công! 🎉", "success");
      }, 'image/jpeg', 0.95);
    }, 100);
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // Run init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
