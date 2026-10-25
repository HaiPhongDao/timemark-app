/**
 * TimeMark Camera & Watermark Mobile App Engine
 * Recreates the EXACT TimeMark watermark, branding & mobile experience
 */

(() => {
  'use strict';

  // --- STATE ---
  const state = {
    currentImage: null, // { file, imgElement, width, height, parsedDate, lat, lng }
    template: 'time_location', // time_location | attendance | service | completed | project_report
    
    // Watermark Content
    dateTime: new Date(),
    address: 'West Bay B - Kđt Ecopark KĐT Ecopark,\nX.Phụng Công, Hưng Yên',
    title: 'West Bay B - KĐT Ecopark',
    details: 'Kiểm tra an ninh & tuần tra',
    phone: '0912 345 678',
    
    // TimeMark Branding & Security
    showTimemarkLogo: true,
    showVerifiedCode: true,
    verifyCode: '19949LP99EHX14',
    
    // Style & Placement
    position: 'bottom-left',
    scale: 100, // percentage
    amberColor: '#FFC333', // Exact TimeMark Golden Amber (RGB: 255, 195, 51)
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
    chkShowTimemarkLogo: document.getElementById('chkShowTimemarkLogo'),
    chkShowVerifiedCode: document.getElementById('chkShowVerifiedCode'),
    editVerifyCode: document.getElementById('editVerifyCode'),
    posButtons: document.querySelectorAll('.tm-pos-btn'),
    rangeScale: document.getElementById('rangeScale'),
    valScale: document.getElementById('valScale'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- INITIALIZATION ---
  async function init() {
    // Wait for Google Fonts to be ready so canvas renders crisp Bebas Neue / Barlow
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => renderCanvas());
    }

    // Set initial date/time to now
    syncDateTimeInput();
    DOM.editAddress.value = state.address;
    DOM.editTitle.value = state.title;
    DOM.editDetails.value = state.details;
    DOM.editPhone.value = state.phone;
    DOM.chkShowTimemarkLogo.checked = state.showTimemarkLogo;
    DOM.chkShowVerifiedCode.checked = state.showVerifiedCode;
    DOM.editVerifyCode.value = state.verifyCode;

    // Setup event listeners
    bindEvents();

    // Auto load a sample photo so user sees the exact TimeMark look immediately
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
        renderCanvas();
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

        // Generate a matching random verification code for this photo
        state.verifyCode = Math.floor(10000 + Math.random() * 90000) + 'LP' + Math.floor(10 + Math.random() * 90) + 'EHX' + Math.floor(10 + Math.random() * 90);
        DOM.editVerifyCode.value = state.verifyCode;

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
    const w = 768;
    const h = 1024; // 3:4 aspect ratio matching the user's uploaded TimeMark photo
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d');

    // Pitch black background identical to the user's test photos
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

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
    img.src = tempCanvas.toDataURL('image/jpeg', 0.95);
  }

  // --- EDIT MODAL HANDLING ---
  function openEditModal() {
    syncDateTimeInput();
    DOM.editAddress.value = state.address;
    DOM.editTitle.value = state.title;
    DOM.editDetails.value = state.details;
    DOM.editPhone.value = state.phone;
    DOM.chkShowTimemarkLogo.checked = state.showTimemarkLogo;
    DOM.chkShowVerifiedCode.checked = state.showVerifiedCode;
    DOM.editVerifyCode.value = state.verifyCode;
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
    state.showTimemarkLogo = DOM.chkShowTimemarkLogo.checked;
    state.showVerifiedCode = DOM.chkShowVerifiedCode.checked;
    state.verifyCode = DOM.editVerifyCode.value.trim() || '19949LP99EHX14';
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

    // 2. Base scale: Reference width 768px = 1.0 multiplier
    const baseScale = w / 768;
    const userScale = state.scale / 100;
    const s = baseScale * userScale;

    // Date/Time parts
    const d = state.dateTime;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    // TimeMark exact format: "26 Tháng 10,2026" (no space after comma)
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

    // 3. Render Right-Edge Verified Security Code if enabled
    if (state.showVerifiedCode) {
      renderRightEdgeVerified(ctx, w, h, s, state.verifyCode);
    }

    // 4. Render Bottom-Right Timemark Brand Logo if enabled
    if (state.showTimemarkLogo) {
      renderBottomRightTimemarkLogo(ctx, w, h, s);
    }
  }

  /**
   * TEMPLATE 1: THỜI GIAN & VỊ TRÍ
   * Pixel-exact replica of genuine TimeMark watermark:
   * 04:07 | 26 Tháng 10,2026
   *       | Thứ Hai
   * West Bay B - Kđt Ecopark KĐT Ecopark,
   * X.Phụng Công, Hưng Yên
   */
  function renderTemplateTimeLocation(ctx, imgW, imgH, s, timeStr, dateStr, dayStr, address) {
    const margin = 22 * s;
    const clockHeight = 76 * s;
    const clockFontSize = Math.round(92 * s);
    const dateFontSize = Math.round(23 * s);
    const dayFontSize = Math.round(20 * s);
    const addrFontSize = Math.round(22 * s);
    const lineGap = Math.round(28 * s);

    // Subtle drop shadow identical to TimeMark
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4 * s;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1.5 * s;

    // Wrap address text (matching exact break in photo)
    ctx.font = `500 ${addrFontSize}px "Plus Jakarta Sans", -apple-system, sans-serif`;
    const maxAddrWidth = Math.min(imgW - margin * 2 - (150 * s), 560 * s);
    const addrLines = [];
    address.split('\n').forEach(part => {
      const wrapped = wrapText(ctx, part.trim(), maxAddrWidth);
      wrapped.forEach(l => addrLines.push(l));
    });

    // Total watermark height calculation
    const totalHeight = clockHeight + (27 * s) + (addrLines.length * lineGap);
    const startX = margin;
    // Bottom alignment: sits exactly 25px * s above bottom edge
    const startY = imgH - totalHeight - (25 * s);

    // 1. Draw Condensed Clock "04:07"
    // Preferred font: Bebas Neue, then Barlow Condensed, then Oswald
    ctx.font = `400 ${clockFontSize}px "Bebas Neue", "Barlow Condensed", "Oswald", sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(timeStr, startX, startY + clockHeight * 0.94);

    const timeWidth = ctx.measureText(timeStr).width;

    // 2. Draw Golden Amber Vertical Bar "|"
    const barX = startX + timeWidth + (12 * s);
    const barY = startY;
    const barWidth = 2.5 * s;
    const barHeight = 75 * s;

    ctx.save();
    ctx.fillStyle = state.amberColor; // #FFC333
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, barX, barY, barWidth, barHeight, 1 * s);
    ctx.fill();
    ctx.restore();

    // 3. Draw Date & Day of Week
    const textNextToBarX = barX + barWidth + (14 * s);

    // Line 1: Date "26 Tháng 10,2026"
    ctx.font = `600 ${dateFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = state.textColor;
    ctx.fillText(dateStr, textNextToBarX, barY + dateFontSize * 0.92);

    // Line 2: Day of Week "Thứ Hai" (aligned with bottom of amber bar)
    ctx.font = `500 ${dayFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(dayStr, textNextToBarX, barY + barHeight - (2 * s));

    // 4. Draw Address Lines below
    let curAddrY = startY + clockHeight + (27 * s);
    ctx.font = `500 ${addrFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';

    addrLines.forEach(line => {
      ctx.fillText(line, startX, curAddrY + addrFontSize * 0.85);
      curAddrY += lineGap;
    });
  }

  /**
   * RIGHT-EDGE VERIFIED CODE (TIMEMARK SECURITY CODE)
   * Rotated 90 degrees reading along the right border:
   * 🛡 19949LP99EHX14  Timemark Verified
   */
  function renderRightEdgeVerified(ctx, imgW, imgH, s, verifyCode) {
    ctx.save();
    const rightX = imgW - (12 * s);
    // Center vertically along right border (from Y ~290 to Y ~500)
    const centerY = imgH * 0.40;

    ctx.translate(rightX, centerY);
    ctx.rotate(-Math.PI / 2); // Rotate -90 degrees

    ctx.font = `500 ${Math.round(11.5 * s)}px "JetBrains Mono", "Plus Jakarta Sans", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 3 * s;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = `🛡 ${verifyCode}  Timemark Verified`;
    ctx.fillText(text, 0, 0);

    ctx.restore();
  }

  /**
   * BOTTOM-RIGHT TIMEMARK BRAND LOGO
   * Timemark (in #FFC333 Golden Amber)
   * 100% Chân thực (in rgba(255,255,255,0.75))
   */
  function renderBottomRightTimemarkLogo(ctx, imgW, imgH, s) {
    ctx.save();
    const rightMargin = 14 * s;
    const bottomMargin = 25 * s;
    const posX = imgW - rightMargin;
    const posY = imgH - bottomMargin;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 4 * s;

    // Line 2: "100% Chân thực" (bottom line)
    const subFontSize = Math.round(11.5 * s);
    ctx.font = `500 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.fillText('100% Chân thực', posX, posY);

    // Line 1: "Timemark" (top line)
    const titleFontSize = Math.round(19 * s);
    ctx.font = `700 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = state.amberColor; // #FFC333
    ctx.fillText('Timemark', posX, posY - (15 * s));

    ctx.restore();
  }

  /**
   * TEMPLATE 2: ĐIỂM DANH
   */
  function renderTemplateAttendance(ctx, imgW, imgH, s, timeStr, dateStr, address) {
    const margin = 22 * s;
    const tagFontSize = Math.round(20 * s);
    const timeFontSize = Math.round(24 * s);
    const bodyFontSize = Math.round(22 * s);
    const lineGap = Math.round(28 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4 * s;

    ctx.font = `800 ${tagFontSize}px "Plus Jakarta Sans", sans-serif`;
    const tagW = ctx.measureText("Điểm danh").width + (14 * s);
    const tagH = 30 * s;

    ctx.font = `700 ${timeFontSize}px "JetBrains Mono", monospace`;
    const timeW = ctx.measureText(timeStr).width + (16 * s);

    const maxAddrWidth = Math.min(imgW - margin * 2 - (150 * s), 560 * s);
    const addrLines = [];
    address.split('\n').forEach(part => {
      const wrapped = wrapText(ctx, part.trim(), maxAddrWidth);
      wrapped.forEach(l => addrLines.push(l));
    });

    const totalHeight = tagH + (14 * s) + lineGap + (addrLines.length * lineGap);
    const startX = margin;
    const startY = imgH - totalHeight - (25 * s);

    // Tag: [Điểm danh]
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, startY, tagW, tagH, 5 * s);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `800 ${tagFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText("Điểm danh", startX + (7 * s), startY + tagFontSize * 1.1);
    ctx.restore();

    // Time Box: [23:40]
    ctx.save();
    const timeBoxX = startX + tagW + (6 * s);
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, timeBoxX, startY, timeW, tagH, 5 * s);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.font = `800 ${timeFontSize}px "JetBrains Mono", monospace`;
    ctx.fillText(timeStr, timeBoxX + (7 * s), startY + timeFontSize * 0.95);
    ctx.restore();

    // Body with Amber Vertical Line
    const bodyStartY = startY + tagH + (10 * s);
    const barHeight = (1 + addrLines.length) * lineGap - (6 * s);

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, bodyStartY, 2.5 * s, barHeight, 1 * s);
    ctx.fill();
    ctx.restore();

    const textX = startX + (12 * s);
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
    const margin = 22 * s;
    const titleFontSize = Math.round(26 * s);
    const bodyFontSize = Math.round(21 * s);
    const lineGap = Math.round(28 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4 * s;

    const totalHeight = titleFontSize + (14 * s) + (3 * lineGap);
    const startX = margin;
    const startY = imgH - totalHeight - (25 * s);

    ctx.font = `700 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(title || 'Tên dịch vụ', startX, startY + titleFontSize * 0.85);

    const bodyStartY = startY + titleFontSize + (10 * s);
    const barHeight = (3 * lineGap) - (6 * s);

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, bodyStartY, 2.5 * s, barHeight, 1 * s);
    ctx.fill();
    ctx.restore();

    const textX = startX + (12 * s);
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
   * TEMPLATE 4: ĐÃ HOÀN THÀNH
   */
  function renderTemplateCompleted(ctx, imgW, imgH, s, timeStr, dateStr, address) {
    const margin = 22 * s;
    const badgeFontSize = Math.round(20 * s);
    const titleFontSize = Math.round(25 * s);
    const bodyFontSize = Math.round(21 * s);
    const lineGap = Math.round(28 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4 * s;

    ctx.font = `800 ${badgeFontSize}px "Plus Jakarta Sans", sans-serif`;
    const badgeText = `${timeStr} ✓`;
    const badgeW = ctx.measureText(badgeText).width + (16 * s);
    const badgeH = 28 * s;

    const totalHeight = badgeH + (8 * s) + titleFontSize + (12 * s) + (2 * lineGap);
    const startX = margin;
    const startY = imgH - totalHeight - (25 * s);

    ctx.save();
    ctx.fillStyle = '#00c06d';
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, startY, badgeW, badgeH, 5 * s);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${badgeFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(badgeText, startX + (8 * s), startY + badgeFontSize * 1.05);
    ctx.restore();

    const titleY = startY + badgeH + (10 * s);
    ctx.font = `800 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText("Đã hoàn thành", startX, titleY + titleFontSize * 0.85);

    const bodyStartY = titleY + titleFontSize + (8 * s);
    const barHeight = (2 * lineGap) - (6 * s);

    ctx.save();
    ctx.fillStyle = state.amberColor;
    ctx.shadowColor = 'transparent';
    drawRoundedBar(ctx, startX, bodyStartY, 2.5 * s, barHeight, 1 * s);
    ctx.fill();
    ctx.restore();

    const textX = startX + (12 * s);
    let curY = bodyStartY;

    ctx.font = `600 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(dateStr, textX, curY + bodyFontSize * 0.85);

    curY += lineGap;
    ctx.font = `500 ${bodyFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillText(address.split('\n')[0], textX, curY + bodyFontSize * 0.85);
  }

  /**
   * TEMPLATE 5: CÔNG TRÌNH & DỰ ÁN
   */
  function renderTemplateProjectReport(ctx, imgW, imgH, s, timeStr, dateStr, title, details, address) {
    const margin = 22 * s;
    const timeFontSize = Math.round(58 * s);
    const bodyFontSize = Math.round(20 * s);
    const lineGap = Math.round(26 * s);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4 * s;

    const totalHeight = timeFontSize + (14 * s) + (4 * lineGap);
    const startX = margin;
    const startY = imgH - totalHeight - (25 * s);

    ctx.font = `700 ${timeFontSize}px "JetBrains Mono", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(timeStr, startX, startY + timeFontSize * 0.85);

    const lineY = startY + timeFontSize + (6 * s);
    ctx.save();
    ctx.fillStyle = '#0084ff';
    ctx.shadowColor = 'transparent';
    ctx.fillRect(startX, lineY, 240 * s, 3 * s);
    ctx.restore();

    let curY = lineY + (12 * s);
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
      }, 'image/jpeg', 0.96);
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
