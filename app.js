/**
 * TimeMark Photo Stamper - Core Application Logic
 * Pure client-side Canvas rendering, EXIF metadata parsing & Batch ZIP export
 */

(() => {
  'use strict';

  // --- STATE ---
  const state = {
    images: [], // { id, file, imgElement, exif, date, lat, lng, address, width, height }
    activeIndex: -1,
    isComparing: false,
    logoImage: null,
    sampleLogoCreated: false,
    isRendering: false,
    
    // Configurations
    config: {
      template: 'construction', // construction | classic | inspection | minimalist | hud_gps
      
      // Date & Time
      showDateTime: true,
      dateTimeValue: '', // YYYY-MM-DDTHH:mm:ss
      dateFormat: 'dd/MM/yyyy HH:mm:ss',
      showDayOfWeek: true,
      showSeconds: true,
      
      // Location & GPS
      showLocation: true,
      address: 'Số 123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      lat: '10.776889',
      lng: '106.700806',
      showGpsCoords: true,
      
      // Project & Work
      showProjectInfo: true,
      projectName: 'Dự án Căn hộ Sunview Tower',
      workItem: 'Nghiệm thu cốt thép sàn tầng 5',
      inspector: 'Kỹ sư: Nguyễn Văn A',
      notes: 'Đạt yêu cầu kỹ thuật TCVN 5574:2018',
      verifyCode: '#TM-' + Math.floor(100000 + Math.random() * 900000),
      
      // Logo & Brand
      showLogo: true,
      logoSize: 48,
      
      // Style & Position
      position: 'bottom-left', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
      scale: 100, // percentage 50 - 180
      margin: 30, // px at base 1920p
      bgStyle: 'glass-dark', // glass-dark, solid-dark, navy, glass-light, transparent
      bgOpacity: 75, // 0 - 100
      accentColor: '#00E5FF',
      textColor: '#FFFFFF',
      
      // Export
      exportFormat: 'image/jpeg',
      exportQuality: 0.95
    }
  };

  // Day names in Vietnamese and English
  const VN_DAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // DOM Elements
  const DOM = {
    // Header & Global Buttons
    btnResetAll: document.getElementById('btnResetAll'),
    btnDownloadSingle: document.getElementById('btnDownloadSingle'),
    btnBatchDownload: document.getElementById('btnBatchDownload'),
    batchBtnText: document.getElementById('batchBtnText'),
    btnDownloadSingleBottom: document.getElementById('btnDownloadSingleBottom'),
    btnBatchDownloadBottom: document.getElementById('btnBatchDownloadBottom'),
    
    // Upload & Thumbnails
    dropzone: document.getElementById('dropzone'),
    fileInput: document.getElementById('fileInput'),
    imageCounterBadge: document.getElementById('imageCounterBadge'),
    thumbnailsContainer: document.getElementById('thumbnailsContainer'),
    thumbnailsList: document.getElementById('thumbnailsList'),
    thumbCount: document.getElementById('thumbCount'),
    btnClearImages: document.getElementById('btnClearImages'),
    btnEmptyBrowse: document.getElementById('btnEmptyBrowse'),
    btnDropzoneDemo: document.getElementById('btnDropzoneDemo'),
    btnEmptyDemo: document.getElementById('btnEmptyDemo'),
    
    // Templates
    templateCards: document.querySelectorAll('.template-card'),
    
    // Date & Time
    chkShowDateTime: document.getElementById('chkShowDateTime'),
    datetimeFields: document.getElementById('datetimeFields'),
    inputDateTime: document.getElementById('inputDateTime'),
    btnUseExifDate: document.getElementById('btnUseExifDate'),
    btnUseCurrentDate: document.getElementById('btnUseCurrentDate'),
    selectDateFormat: document.getElementById('selectDateFormat'),
    chkShowDayOfWeek: document.getElementById('chkShowDayOfWeek'),
    chkShowSeconds: document.getElementById('chkShowSeconds'),
    exifDateStatus: document.getElementById('exifDateStatus'),
    
    // Location & GPS
    chkShowLocation: document.getElementById('chkShowLocation'),
    locationFields: document.getElementById('locationFields'),
    inputAddress: document.getElementById('inputAddress'),
    btnReverseGeocode: document.getElementById('btnReverseGeocode'),
    inputLat: document.getElementById('inputLat'),
    inputLng: document.getElementById('inputLng'),
    btnUseExifGps: document.getElementById('btnUseExifGps'),
    btnBrowserGps: document.getElementById('btnBrowserGps'),
    chkShowGpsCoords: document.getElementById('chkShowGpsCoords'),
    
    // Project & Work
    chkShowProjectInfo: document.getElementById('chkShowProjectInfo'),
    projectFields: document.getElementById('projectFields'),
    inputProjectName: document.getElementById('inputProjectName'),
    inputWorkItem: document.getElementById('inputWorkItem'),
    inputInspector: document.getElementById('inputInspector'),
    inputNotes: document.getElementById('inputNotes'),
    inputVerifyCode: document.getElementById('inputVerifyCode'),
    btnGenVerifyCode: document.getElementById('btnGenVerifyCode'),
    
    // Logo
    chkShowLogo: document.getElementById('chkShowLogo'),
    logoFields: document.getElementById('logoFields'),
    logoInput: document.getElementById('logoInput'),
    btnUploadLogo: document.getElementById('btnUploadLogo'),
    btnUseSampleLogo: document.getElementById('btnUseSampleLogo'),
    btnRemoveLogo: document.getElementById('btnRemoveLogo'),
    logoPreviewImg: document.getElementById('logoPreviewImg'),
    logoPlaceholder: document.getElementById('logoPlaceholder'),
    rangeLogoSize: document.getElementById('rangeLogoSize'),
    valLogoSize: document.getElementById('valLogoSize'),
    
    // Style & Position
    posButtons: document.querySelectorAll('.pos-btn'),
    rangeScale: document.getElementById('rangeScale'),
    valScale: document.getElementById('valScale'),
    rangeMargin: document.getElementById('rangeMargin'),
    valMargin: document.getElementById('valMargin'),
    selectBgStyle: document.getElementById('selectBgStyle'),
    rangeBgOpacity: document.getElementById('rangeBgOpacity'),
    valBgOpacity: document.getElementById('valBgOpacity'),
    inputAccentColor: document.getElementById('inputAccentColor'),
    valAccentHex: document.getElementById('valAccentHex'),
    inputTextColor: document.getElementById('inputTextColor'),
    valTextHex: document.getElementById('valTextHex'),
    presetDots: document.querySelectorAll('.preset-dot'),
    
    // Export
    selectExportFormat: document.getElementById('selectExportFormat'),
    rangeQuality: document.getElementById('rangeQuality'),
    valQuality: document.getElementById('valQuality'),
    grpQuality: document.getElementById('grpQuality'),
    
    // Preview & Canvas
    previewCanvas: document.getElementById('previewCanvas'),
    emptyStatePlaceholder: document.getElementById('emptyStatePlaceholder'),
    renderLoadingOverlay: document.getElementById('renderLoadingOverlay'),
    loadingMessage: document.getElementById('loadingMessage'),
    txtImageResolution: document.getElementById('txtImageResolution'),
    txtImageSize: document.getElementById('txtImageSize'),
    txtExifBadge: document.getElementById('txtExifBadge'),
    btnToggleCompare: document.getElementById('btnToggleCompare'),
    lblCompare: document.getElementById('lblCompare'),
    btnZoomFit: document.getElementById('btnZoomFit'),
    btnZoom100: document.getElementById('btnZoom100'),
    
    // Batch Progress
    batchProgressBarWrapper: document.getElementById('batchProgressBarWrapper'),
    batchProgressText: document.getElementById('batchProgressText'),
    batchProgressPercent: document.getElementById('batchProgressPercent'),
    batchProgressBarFill: document.getElementById('batchProgressBarFill'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  // --- INITIALIZATION ---
  function init() {
    // Set initial date/time to now
    setCurrentDateTime();
    
    // Initialize UI form fields from default config
    syncFormFromConfig();
    
    // Generate default sample logo so user has something cool immediately
    createDefaultSampleLogo();
    
    // Setup event listeners
    bindEvents();
    
    // Create demo image if user wants to test right away without uploading
    console.log("TimeMark Stamper initialized.");
  }

  // --- EVENT BINDING ---
  function bindEvents() {
    // Upload triggers
    DOM.dropzone.addEventListener('click', () => DOM.fileInput.click());
    DOM.btnEmptyBrowse.addEventListener('click', () => DOM.fileInput.click());
    DOM.fileInput.addEventListener('change', (e) => handleFilesSelected(e.target.files));
    
    if (DOM.btnDropzoneDemo) {
      DOM.btnDropzoneDemo.addEventListener('click', (e) => {
        e.stopPropagation();
        loadDemoImage();
      });
    }
    if (DOM.btnEmptyDemo) {
      DOM.btnEmptyDemo.addEventListener('click', (e) => {
        e.stopPropagation();
        loadDemoImage();
      });
    }
    
    // Drag & Drop
    DOM.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      DOM.dropzone.classList.add('dragover');
    });
    DOM.dropzone.addEventListener('dragleave', () => DOM.dropzone.classList.remove('dragover'));
    DOM.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    });

    // Clear all images
    DOM.btnClearImages.addEventListener('click', clearAllImages);

    // Template selection
    DOM.templateCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.templateCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.config.template = card.dataset.template;
        renderActiveImage();
      });
    });

    // Position buttons
    DOM.posButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.posButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.config.position = btn.dataset.pos;
        renderActiveImage();
      });
    });

    // Section Toggles
    setupToggle(DOM.chkShowDateTime, DOM.datetimeFields, (checked) => {
      state.config.showDateTime = checked;
      renderActiveImage();
    });
    setupToggle(DOM.chkShowLocation, DOM.locationFields, (checked) => {
      state.config.showLocation = checked;
      renderActiveImage();
    });
    setupToggle(DOM.chkShowProjectInfo, DOM.projectFields, (checked) => {
      state.config.showProjectInfo = checked;
      renderActiveImage();
    });
    setupToggle(DOM.chkShowLogo, DOM.logoFields, (checked) => {
      state.config.showLogo = checked;
      renderActiveImage();
    });

    // Date/Time controls
    DOM.inputDateTime.addEventListener('input', (e) => {
      state.config.dateTimeValue = e.target.value;
      renderActiveImage();
    });
    DOM.btnUseCurrentDate.addEventListener('click', () => {
      setCurrentDateTime();
      renderActiveImage();
    });
    DOM.btnUseExifDate.addEventListener('click', applyActiveImageExifDate);
    DOM.selectDateFormat.addEventListener('change', (e) => {
      state.config.dateFormat = e.target.value;
      renderActiveImage();
    });
    DOM.chkShowDayOfWeek.addEventListener('change', (e) => {
      state.config.showDayOfWeek = e.target.checked;
      renderActiveImage();
    });
    DOM.chkShowSeconds.addEventListener('change', (e) => {
      state.config.showSeconds = e.target.checked;
      renderActiveImage();
    });

    // Location controls
    DOM.inputAddress.addEventListener('input', (e) => {
      state.config.address = e.target.value;
      renderActiveImage();
    });
    DOM.inputLat.addEventListener('input', (e) => {
      state.config.lat = e.target.value;
      renderActiveImage();
    });
    DOM.inputLng.addEventListener('input', (e) => {
      state.config.lng = e.target.value;
      renderActiveImage();
    });
    DOM.chkShowGpsCoords.addEventListener('change', (e) => {
      state.config.showGpsCoords = e.target.checked;
      renderActiveImage();
    });
    DOM.btnUseExifGps.addEventListener('click', applyActiveImageExifGps);
    DOM.btnBrowserGps.addEventListener('click', requestBrowserGps);
    DOM.btnReverseGeocode.addEventListener('click', fetchAddressFromGps);

    // Project controls
    DOM.inputProjectName.addEventListener('input', (e) => {
      state.config.projectName = e.target.value;
      renderActiveImage();
    });
    DOM.inputWorkItem.addEventListener('input', (e) => {
      state.config.workItem = e.target.value;
      renderActiveImage();
    });
    DOM.inputInspector.addEventListener('input', (e) => {
      state.config.inspector = e.target.value;
      renderActiveImage();
    });
    DOM.inputNotes.addEventListener('input', (e) => {
      state.config.notes = e.target.value;
      renderActiveImage();
    });
    DOM.inputVerifyCode.addEventListener('input', (e) => {
      state.config.verifyCode = e.target.value;
      renderActiveImage();
    });
    DOM.btnGenVerifyCode.addEventListener('click', () => {
      state.config.verifyCode = '#TM-' + Math.floor(100000 + Math.random() * 900000);
      DOM.inputVerifyCode.value = state.config.verifyCode;
      renderActiveImage();
    });

    // Logo controls
    DOM.btnUploadLogo.addEventListener('click', () => DOM.logoInput.click());
    DOM.logoInput.addEventListener('change', handleLogoSelected);
    DOM.btnUseSampleLogo.addEventListener('click', createDefaultSampleLogo);
    DOM.btnRemoveLogo.addEventListener('click', removeLogo);
    DOM.rangeLogoSize.addEventListener('input', (e) => {
      state.config.logoSize = parseInt(e.target.value, 10);
      DOM.valLogoSize.textContent = `${state.config.logoSize}px`;
      renderActiveImage();
    });

    // Sliders & Colors
    DOM.rangeScale.addEventListener('input', (e) => {
      state.config.scale = parseInt(e.target.value, 10);
      DOM.valScale.textContent = `${state.config.scale}%`;
      renderActiveImage();
    });
    DOM.rangeMargin.addEventListener('input', (e) => {
      state.config.margin = parseInt(e.target.value, 10);
      DOM.valMargin.textContent = `${state.config.margin}px`;
      renderActiveImage();
    });
    DOM.selectBgStyle.addEventListener('change', (e) => {
      state.config.bgStyle = e.target.value;
      renderActiveImage();
    });
    DOM.rangeBgOpacity.addEventListener('input', (e) => {
      state.config.bgOpacity = parseInt(e.target.value, 10);
      DOM.valBgOpacity.textContent = `${state.config.bgOpacity}%`;
      renderActiveImage();
    });
    DOM.inputAccentColor.addEventListener('input', (e) => {
      state.config.accentColor = e.target.value;
      DOM.valAccentHex.textContent = e.target.value.toUpperCase();
      renderActiveImage();
    });
    DOM.inputTextColor.addEventListener('input', (e) => {
      state.config.textColor = e.target.value;
      DOM.valTextHex.textContent = e.target.value.toUpperCase();
      renderActiveImage();
    });

    // Preset color dots
    DOM.presetDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const color = dot.dataset.color;
        state.config.accentColor = color;
        DOM.inputAccentColor.value = color;
        DOM.valAccentHex.textContent = color;
        renderActiveImage();
      });
    });

    // Export formats & Quality
    DOM.selectExportFormat.addEventListener('change', (e) => {
      state.config.exportFormat = e.target.value;
      DOM.grpQuality.style.display = (e.target.value === 'image/jpeg') ? 'flex' : 'none';
    });
    DOM.rangeQuality.addEventListener('input', (e) => {
      state.config.exportQuality = parseInt(e.target.value, 10) / 100;
      DOM.valQuality.textContent = `${e.target.value}%`;
    });

    // Reset button
    DOM.btnResetAll.addEventListener('click', resetAllSettings);

    // Download Single buttons
    DOM.btnDownloadSingle.addEventListener('click', downloadCurrentSingle);
    DOM.btnDownloadSingleBottom.addEventListener('click', downloadCurrentSingle);

    // Batch Download buttons
    DOM.btnBatchDownload.addEventListener('click', downloadAllBatchZip);
    DOM.btnBatchDownloadBottom.addEventListener('click', downloadAllBatchZip);

    // Compare original button (press & hold or click toggle)
    DOM.btnToggleCompare.addEventListener('mousedown', () => toggleCompare(true));
    DOM.btnToggleCompare.addEventListener('mouseup', () => toggleCompare(false));
    DOM.btnToggleCompare.addEventListener('mouseleave', () => toggleCompare(false));
    DOM.btnToggleCompare.addEventListener('touchstart', (e) => { e.preventDefault(); toggleCompare(true); });
    DOM.btnToggleCompare.addEventListener('touchend', (e) => { e.preventDefault(); toggleCompare(false); });

    // Zoom buttons
    DOM.btnZoomFit.addEventListener('click', () => {
      DOM.previewCanvas.style.maxWidth = '100%';
      DOM.previewCanvas.style.maxHeight = '100%';
    });
    DOM.btnZoom100.addEventListener('click', () => {
      DOM.previewCanvas.style.maxWidth = 'none';
      DOM.previewCanvas.style.maxHeight = 'none';
    });
  }

  function setupToggle(checkbox, bodyElement, callback) {
    checkbox.addEventListener('change', () => {
      bodyElement.style.opacity = checkbox.checked ? '1' : '0.4';
      bodyElement.style.pointerEvents = checkbox.checked ? 'auto' : 'none';
      callback(checkbox.checked);
    });
  }

  function syncFormFromConfig() {
    DOM.inputDateTime.value = state.config.dateTimeValue;
    DOM.inputAddress.value = state.config.address;
    DOM.inputLat.value = state.config.lat;
    DOM.inputLng.value = state.config.lng;
    DOM.inputProjectName.value = state.config.projectName;
    DOM.inputWorkItem.value = state.config.workItem;
    DOM.inputInspector.value = state.config.inspector;
    DOM.inputNotes.value = state.config.notes;
    DOM.inputVerifyCode.value = state.config.verifyCode;
    DOM.rangeLogoSize.value = state.config.logoSize;
    DOM.valLogoSize.textContent = `${state.config.logoSize}px`;
    DOM.rangeScale.value = state.config.scale;
    DOM.valScale.textContent = `${state.config.scale}%`;
    DOM.rangeMargin.value = state.config.margin;
    DOM.valMargin.textContent = `${state.config.margin}px`;
    DOM.selectBgStyle.value = state.config.bgStyle;
    DOM.rangeBgOpacity.value = state.config.bgOpacity;
    DOM.valBgOpacity.textContent = `${state.config.bgOpacity}%`;
    DOM.inputAccentColor.value = state.config.accentColor;
    DOM.valAccentHex.textContent = state.config.accentColor;
    DOM.inputTextColor.value = state.config.textColor;
    DOM.valTextHex.textContent = state.config.textColor;
  }

  function setCurrentDateTime() {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm:ss for input[type="datetime-local"]
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    state.config.dateTimeValue = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    DOM.inputDateTime.value = state.config.dateTimeValue;
  }

  // --- FILE HANDLING & EXIF ---
  async function handleFilesSelected(files) {
    if (!files || files.length === 0) return;
    
    showLoading(true, "Đang đọc thông tin ảnh và dữ liệu EXIF...");

    const fileList = Array.from(files);
    let loadedCount = 0;

    for (const file of fileList) {
      if (!file.type.startsWith('image/')) continue;

      try {
        const item = await processImageFile(file);
        state.images.push(item);
        loadedCount++;
      } catch (err) {
        console.error("Error reading file:", file.name, err);
        showToast(`Không thể đọc ảnh ${file.name}: ${err.message}`, 'error');
      }
    }

    showLoading(false);

    if (loadedCount > 0) {
      if (state.activeIndex === -1 || state.activeIndex >= state.images.length) {
        state.activeIndex = state.images.length - loadedCount;
      }
      updateThumbnailsUI();
      selectImage(state.activeIndex);
      showToast(`Đã thêm thành công ${loadedCount} ảnh!`, 'success');
    }
  }

  async function processImageFile(file) {
    return new Promise(async (resolve, reject) => {
      // 1. Read EXIF metadata using exifr
      let exif = null;
      let parsedDate = null;
      let parsedLat = null;
      let parsedLng = null;
      let camera = null;

      if (window.exifr) {
        try {
          exif = await window.exifr.parse(file, [
            'DateTimeOriginal', 'CreateDate', 'ModifyDate',
            'latitude', 'longitude', 'Make', 'Model'
          ]);

          if (exif) {
            // Parse Date
            const rawDate = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate;
            if (rawDate instanceof Date && !isNaN(rawDate)) {
              parsedDate = rawDate;
            }

            // Parse GPS
            if (typeof exif.latitude === 'number' && typeof exif.longitude === 'number') {
              parsedLat = exif.latitude.toFixed(6);
              parsedLng = exif.longitude.toFixed(6);
            }

            // Camera info
            if (exif.Make || exif.Model) {
              camera = `${exif.Make || ''} ${exif.Model || ''}`.trim();
            }
          }
        } catch (exifErr) {
          console.warn("EXIF read error or no EXIF in file:", exifErr);
        }
      }

      // 2. Fallback date from file if no EXIF date
      if (!parsedDate && file.lastModified) {
        parsedDate = new Date(file.lastModified);
      }

      // 3. Load image object for rendering
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: 'img_' + Math.random().toString(36).substr(2, 9),
            file: file,
            imgElement: img,
            thumbnailSrc: e.target.result,
            width: img.naturalWidth || img.width,
            height: img.naturalHeight || img.height,
            exif: exif,
            parsedDate: parsedDate,
            lat: parsedLat,
            lng: parsedLng,
            camera: camera,
            address: null // will be filled if reverse geocoded
          });
        };
        img.onerror = () => reject(new Error("Lỗi nạp hình ảnh"));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Lỗi đọc tập tin"));
      reader.readAsDataURL(file);
    });
  }

  function updateThumbnailsUI() {
    const count = state.images.length;
    DOM.thumbCount.textContent = count;
    DOM.imageCounterBadge.textContent = `${count} ảnh`;
    DOM.imageCounterBadge.style.display = count > 0 ? 'inline-block' : 'none';
    DOM.thumbnailsContainer.style.display = count > 1 ? 'block' : 'none';

    // Show/Hide batch download buttons
    if (count > 1) {
      DOM.btnBatchDownload.style.display = 'inline-flex';
      DOM.btnBatchDownloadBottom.style.display = 'inline-flex';
      DOM.batchBtnText.textContent = `Tải tất cả (${count} ảnh ZIP)`;
    } else {
      DOM.btnBatchDownload.style.display = 'none';
      DOM.btnBatchDownloadBottom.style.display = 'none';
    }

    // Render thumbnail items
    DOM.thumbnailsList.innerHTML = '';
    state.images.forEach((imgObj, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `thumb-item ${idx === state.activeIndex ? 'active' : ''}`;
      thumb.title = imgObj.file.name;
      
      const img = document.createElement('img');
      img.src = imgObj.thumbnailSrc;
      thumb.appendChild(img);

      const delBtn = document.createElement('button');
      delBtn.className = 'thumb-remove-btn';
      delBtn.innerHTML = '×';
      delBtn.title = 'Xóa ảnh này';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        removeImageAtIndex(idx);
      };
      thumb.appendChild(delBtn);

      thumb.onclick = () => selectImage(idx);
      DOM.thumbnailsList.appendChild(thumb);
    });
  }

  function selectImage(index) {
    if (index < 0 || index >= state.images.length) return;
    state.activeIndex = index;

    const current = state.images[index];

    // Update thumbnail active states
    const items = DOM.thumbnailsList.querySelectorAll('.thumb-item');
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    // Update image info tag
    DOM.txtImageResolution.textContent = `${current.width} × ${current.height} px`;
    DOM.txtImageSize.textContent = formatBytes(current.file.size);

    // Update EXIF badges and controls
    if (current.exif && (current.parsedDate || current.lat)) {
      DOM.txtExifBadge.style.display = 'inline-block';
      DOM.txtExifBadge.textContent = 'EXIF ĐÃ ĐỌC';
    } else {
      DOM.txtExifBadge.style.display = 'none';
    }

    // Auto-apply EXIF date if available and not manually overridden
    if (current.parsedDate) {
      DOM.btnUseExifDate.disabled = false;
      const d = current.parsedDate;
      const dateStr = formatToDatetimeLocal(d);
      state.config.dateTimeValue = dateStr;
      DOM.inputDateTime.value = dateStr;
      DOM.exifDateStatus.textContent = `Đã tìm thấy ngày chụp gốc: ${formatDate(d, 'dd/MM/yyyy HH:mm:ss')}`;
    } else {
      DOM.btnUseExifDate.disabled = true;
      DOM.exifDateStatus.textContent = `Không có ngày chụp gốc trong EXIF. Dùng thời gian hiện tại hoặc file date.`;
    }

    // Auto-apply EXIF GPS if available
    if (current.lat && current.lng) {
      DOM.btnUseExifGps.disabled = false;
      state.config.lat = current.lat;
      state.config.lng = current.lng;
      DOM.inputLat.value = current.lat;
      DOM.inputLng.value = current.lng;
      // Auto reverse geocode first time
      if (!current.address) {
        fetchAddressFromGps();
      }
    } else {
      DOM.btnUseExifGps.disabled = true;
    }

    // Enable download buttons
    DOM.btnDownloadSingle.disabled = false;
    DOM.btnDownloadSingleBottom.disabled = false;

    // Show canvas, hide empty state
    DOM.emptyStatePlaceholder.style.display = 'none';
    DOM.previewCanvas.style.display = 'block';

    // Render image
    renderActiveImage();
  }

  function removeImageAtIndex(idx) {
    state.images.splice(idx, 1);
    if (state.images.length === 0) {
      clearAllImages();
    } else {
      if (state.activeIndex >= state.images.length) {
        state.activeIndex = state.images.length - 1;
      }
      updateThumbnailsUI();
      selectImage(state.activeIndex);
    }
  }

  function clearAllImages() {
    state.images = [];
    state.activeIndex = -1;
    DOM.fileInput.value = '';
    DOM.emptyStatePlaceholder.style.display = 'flex';
    DOM.previewCanvas.style.display = 'none';
    DOM.btnDownloadSingle.disabled = true;
    DOM.btnDownloadSingleBottom.disabled = true;
    DOM.btnBatchDownload.style.display = 'none';
    DOM.btnBatchDownloadBottom.style.display = 'none';
    DOM.imageCounterBadge.style.display = 'none';
    DOM.thumbnailsContainer.style.display = 'none';
    DOM.txtImageResolution.textContent = 'Chưa có ảnh';
    DOM.txtImageSize.textContent = '0 MB';
    DOM.txtExifBadge.style.display = 'none';
    showToast("Đã xóa danh sách ảnh.", 'info');
  }

  function applyActiveImageExifDate() {
    if (state.activeIndex < 0) return;
    const cur = state.images[state.activeIndex];
    if (cur && cur.parsedDate) {
      state.config.dateTimeValue = formatToDatetimeLocal(cur.parsedDate);
      DOM.inputDateTime.value = state.config.dateTimeValue;
      renderActiveImage();
      showToast("Đã áp dụng ngày giờ chụp gốc từ EXIF!", "success");
    }
  }

  function applyActiveImageExifGps() {
    if (state.activeIndex < 0) return;
    const cur = state.images[state.activeIndex];
    if (cur && cur.lat && cur.lng) {
      state.config.lat = cur.lat;
      state.config.lng = cur.lng;
      DOM.inputLat.value = cur.lat;
      DOM.inputLng.value = cur.lng;
      renderActiveImage();
      showToast("Đã lấy tọa độ GPS từ ảnh!", "success");
    }
  }

  function requestBrowserGps() {
    if (!navigator.geolocation) {
      showToast("Trình duyệt không hỗ trợ Geolocation.", "error");
      return;
    }
    showToast("Đang xác định vị trí hiện tại của bạn...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.config.lat = pos.coords.latitude.toFixed(6);
        state.config.lng = pos.coords.longitude.toFixed(6);
        DOM.inputLat.value = state.config.lat;
        DOM.inputLng.value = state.config.lng;
        renderActiveImage();
        showToast("Đã cập nhật tọa độ thiết bị thành công!", "success");
        fetchAddressFromGps();
      },
      (err) => {
        showToast("Không thể lấy vị trí: " + err.message, "error");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  async function fetchAddressFromGps() {
    const lat = state.config.lat;
    const lng = state.config.lng;
    if (!lat || !lng) {
      showToast("Vui lòng nhập hoặc lấy tọa độ GPS trước.", "error");
      return;
    }

    showToast("Đang tìm địa chỉ từ OpenStreetMap...", "info");
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
      if (!res.ok) throw new Error("Mạng hoặc máy chủ không phản hồi");
      const data = await res.json();
      if (data && data.display_name) {
        state.config.address = data.display_name;
        DOM.inputAddress.value = data.display_name;
        if (state.activeIndex >= 0) {
          state.images[state.activeIndex].address = data.display_name;
        }
        renderActiveImage();
        showToast("Đã tìm thấy địa chỉ!", "success");
      } else {
        throw new Error("Không có dữ liệu địa chỉ");
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      showToast("Không thể tự động lấy địa chỉ (bạn có thể nhập tay).", "info");
    }
  }

  // --- DEMO IMAGE GENERATOR ---
  function loadDemoImage() {
    showLoading(true, "Đang tạo ảnh công trình mẫu độ phân giải cao...");

    const w = 1920;
    const h = 1280;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.4, '#1e293b');
    skyGrad.addColorStop(0.8, '#334155');
    skyGrad.addColorStop(1, '#475569');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Ground & building concrete structure
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Building pillars and scaffolding silhouettes
    ctx.fillStyle = '#0f172a';
    for (let x = 80; x < w; x += 180) {
      ctx.fillRect(x, h * 0.3, 24, h * 0.4);
    }
    for (let y = h * 0.35; y < h * 0.7; y += 90) {
      ctx.fillRect(60, y, w - 120, 14);
    }

    // Construction crane silhouette
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(w * 0.75, h * 0.7);
    ctx.lineTo(w * 0.75, h * 0.15);
    ctx.lineTo(w * 0.95, h * 0.15);
    ctx.moveTo(w * 0.65, h * 0.15);
    ctx.lineTo(w * 0.95, h * 0.15);
    ctx.stroke();

    // Crane cables
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.75, h * 0.1);
    ctx.lineTo(w * 0.9, h * 0.15);
    ctx.lineTo(w * 0.75, h * 0.15);
    ctx.stroke();

    // Text on demo photo: "HIỆN TRƯỜNG THI CÔNG - DEMO"
    ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('ẢNH HIỆN TRƯỜNG THI CÔNG (DEMO)', 80, 120);

    canvas.toBlob((blob) => {
      showLoading(false);
      const demoFile = new File([blob], "Hien_Truong_Thi_Cong_Demo.jpg", {
        type: "image/jpeg",
        lastModified: Date.now() - 3600000 // 1 hour ago
      });
      handleFilesSelected([demoFile]);
    }, 'image/jpeg', 0.92);
  }

  // --- LOGO HANDLING ---
  function handleLogoSelected(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        state.logoImage = img;
        DOM.logoPreviewImg.src = event.target.result;
        DOM.logoPreviewImg.style.display = 'block';
        DOM.logoPlaceholder.style.display = 'none';
        DOM.btnRemoveLogo.style.display = 'inline-block';
        renderActiveImage();
        showToast("Đã tải lên logo thành công!", "success");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function createDefaultSampleLogo() {
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    // Draw stylish shield badge with checkmark and helmet
    ctx.clearRect(0, 0, 120, 120);

    // Shield background
    ctx.beginPath();
    ctx.moveTo(60, 10);
    ctx.lineTo(105, 25);
    ctx.lineTo(95, 80);
    ctx.lineTo(60, 110);
    ctx.lineTo(25, 80);
    ctx.lineTo(15, 25);
    ctx.closePath();
    ctx.fillStyle = '#0284c7';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00e5ff';
    ctx.stroke();

    // Checkmark
    ctx.beginPath();
    ctx.moveTo(38, 58);
    ctx.lineTo(54, 75);
    ctx.lineTo(82, 42);
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const img = new Image();
    img.onload = () => {
      state.logoImage = img;
      DOM.logoPreviewImg.src = img.src;
      DOM.logoPreviewImg.style.display = 'block';
      DOM.logoPlaceholder.style.display = 'none';
      DOM.btnRemoveLogo.style.display = 'inline-block';
      renderActiveImage();
    };
    img.src = canvas.toDataURL();
  }

  function removeLogo() {
    state.logoImage = null;
    DOM.logoInput.value = '';
    DOM.logoPreviewImg.src = '';
    DOM.logoPreviewImg.style.display = 'none';
    DOM.logoPlaceholder.style.display = 'flex';
    DOM.btnRemoveLogo.style.display = 'none';
    renderActiveImage();
  }

  // --- CANVAS RENDERING ENGINE ---
  function renderActiveImage() {
    if (state.activeIndex < 0 || state.activeIndex >= state.images.length) return;
    const imgObj = state.images[state.activeIndex];
    drawStampOnCanvas(DOM.previewCanvas, imgObj, state.config, state.isComparing);
  }

  /**
   * Core function: Renders stamp onto target canvas at FULL image resolution
   */
  function drawStampOnCanvas(canvas, imgObj, config, isOriginalOnly = false) {
    const img = imgObj.imgElement;
    const w = imgObj.width;
    const h = imgObj.height;

    // Set canvas dimensions to full native resolution
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // 1. Draw base photo
    ctx.drawImage(img, 0, 0, w, h);

    // If comparing original, return immediately without stamp
    if (isOriginalOnly) return;

    // 2. Calculate proportional scale factor
    // Base reference: 1920px image width/height = 1.0 multiplier
    const maxDim = Math.max(w, h);
    const baseMultiplier = maxDim / 1600;
    const userScale = config.scale / 100;
    const s = baseMultiplier * userScale;

    // Parse date for this specific image or config override
    let stampDate = new Date();
    if (config.dateTimeValue) {
      stampDate = new Date(config.dateTimeValue);
    } else if (imgObj.parsedDate) {
      stampDate = imgObj.parsedDate;
    }

    // Collect data payload
    const data = {
      date: stampDate,
      timeStr: formatTimeString(stampDate, config.showSeconds),
      dateStr: formatDate(stampDate, config.dateFormat),
      dayOfWeek: getDayOfWeekName(stampDate, config.showDayOfWeek),
      address: config.address || imgObj.address || '',
      lat: config.lat || imgObj.lat || '',
      lng: config.lng || imgObj.lng || '',
      projectName: config.projectName,
      workItem: config.workItem,
      inspector: config.inspector,
      notes: config.notes,
      verifyCode: config.verifyCode,
      camera: imgObj.camera || ''
    };

    // Render based on selected template
    ctx.save();
    switch (config.template) {
      case 'construction':
        renderTemplateConstruction(ctx, w, h, s, data, config);
        break;
      case 'classic':
        renderTemplateClassic(ctx, w, h, s, data, config);
        break;
      case 'inspection':
        renderTemplateInspection(ctx, w, h, s, data, config);
        break;
      case 'minimalist':
        renderTemplateMinimalist(ctx, w, h, s, data, config);
        break;
      case 'hud_gps':
        renderTemplateHudGps(ctx, w, h, s, data, config);
        break;
      default:
        renderTemplateConstruction(ctx, w, h, s, data, config);
    }
    ctx.restore();
  }

  // --- TEMPLATE 1: BÁO CÁO CÔNG TRÌNH (CONSTRUCTION) ---
  function renderTemplateConstruction(ctx, imgW, imgH, s, data, config) {
    const margin = config.margin * s;
    const padding = 20 * s;
    const boxWidth = Math.min(680 * s, imgW - margin * 2);

    // Build line items
    const lines = [];
    if (config.showDateTime) {
      lines.push({
        icon: '🕒',
        label: 'Thời gian:',
        value: `${data.dateStr} (${data.dayOfWeek})`
      });
    }
    if (config.showLocation && data.address) {
      lines.push({
        icon: '📍',
        label: 'Vị trí:',
        value: data.address
      });
    }
    if (config.showLocation && config.showGpsCoords && data.lat && data.lng) {
      lines.push({
        icon: '🌐',
        label: 'Tọa độ:',
        value: formatCoordsDMS(data.lat, data.lng)
      });
    }
    if (config.showProjectInfo) {
      if (data.projectName) lines.push({ icon: '🏢', label: 'Dự án:', value: data.projectName });
      if (data.workItem) lines.push({ icon: '📋', label: 'Hạng mục:', value: data.workItem });
      if (data.inspector) lines.push({ icon: '👷', label: 'Người thực hiện:', value: data.inspector });
      if (data.notes) lines.push({ icon: '📝', label: 'Ghi chú:', value: data.notes });
      if (data.verifyCode) lines.push({ icon: '🔒', label: 'Mã xác thực:', value: `${data.verifyCode} (Chống sửa đổi)` });
    }

    // Typography setup
    const timeFontSize = Math.round(44 * s);
    const labelFontSize = Math.round(18 * s);
    const valueFontSize = Math.round(19 * s);
    const lineHeight = Math.round(28 * s);

    // Estimate box height
    let totalHeight = padding * 2;
    if (config.showDateTime) {
      totalHeight += timeFontSize + (16 * s); // Big time header + gap
    }

    // Add height for lines with auto-wrap
    const maxValWidth = boxWidth - padding * 2 - (150 * s);
    ctx.font = `600 ${valueFontSize}px "Plus Jakarta Sans", sans-serif`;
    
    const computedRows = [];
    lines.forEach(item => {
      const wrapped = wrapTextLines(ctx, item.value, maxValWidth);
      const rowHeight = Math.max(wrapped.length * lineHeight, lineHeight + 4 * s);
      computedRows.push({ item, wrapped, rowHeight });
      totalHeight += rowHeight + (6 * s);
    });

    // Determine Box Position (X, Y)
    const { boxX, boxY } = calculateBoxPosition(imgW, imgH, boxWidth, totalHeight, margin, config.position);

    // Draw Background Box
    drawBackgroundBox(ctx, boxX, boxY, boxWidth, totalHeight, 14 * s, config);

    // Draw Accent Left Bar
    ctx.fillStyle = config.accentColor;
    drawRoundedRect(ctx, boxX + 6 * s, boxY + 12 * s, 6 * s, totalHeight - 24 * s, 3 * s);
    ctx.fill();

    let curY = boxY + padding;
    const contentX = boxX + padding + (10 * s);

    // Draw Big Digital Clock & Logo Header
    if (config.showDateTime) {
      ctx.font = `700 ${timeFontSize}px "JetBrains Mono", "Oswald", monospace`;
      ctx.fillStyle = config.textColor;
      ctx.fillText(data.timeStr, contentX, curY + timeFontSize * 0.85);

      // Draw Logo if enabled
      if (config.showLogo && state.logoImage) {
        const logoSz = config.logoSize * s * 1.2;
        const logoX = boxX + boxWidth - padding - logoSz;
        const logoY = curY - 2 * s;
        ctx.drawImage(state.logoImage, logoX, logoY, logoSz, logoSz);
      }

      curY += timeFontSize + (12 * s);

      // Thin separator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(contentX, curY);
      ctx.lineTo(boxX + boxWidth - padding, curY);
      ctx.stroke();

      curY += 12 * s;
    }

    // Draw Rows
    computedRows.forEach(({ item, wrapped }) => {
      // Icon and Label
      ctx.font = `700 ${labelFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = config.accentColor;
      const labelText = `${item.icon} ${item.label}`;
      ctx.fillText(labelText, contentX, curY + labelFontSize * 0.85);

      const valX = contentX + (135 * s);
      ctx.font = `600 ${valueFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = config.textColor;

      wrapped.forEach((line, lineIdx) => {
        ctx.fillText(line, valX, curY + (lineIdx * lineHeight) + valueFontSize * 0.85);
      });

      curY += Math.max(wrapped.length * lineHeight, lineHeight) + (6 * s);
    });
  }

  // --- TEMPLATE 2: TIMEMARK CỔ ĐIỂN (CLASSIC) ---
  function renderTemplateClassic(ctx, imgW, imgH, s, data, config) {
    const margin = config.margin * s;
    const padding = 20 * s;
    const boxWidth = Math.min(620 * s, imgW - margin * 2);

    const clockFontSize = Math.round(72 * s);
    const subFontSize = Math.round(22 * s);
    const infoFontSize = Math.round(18 * s);
    const lineGap = Math.round(26 * s);

    // Wrap address
    ctx.font = `600 ${infoFontSize}px "Plus Jakarta Sans", sans-serif`;
    const wrappedAddr = wrapTextLines(ctx, data.address || '', boxWidth - padding * 2);

    let totalHeight = padding * 2 + clockFontSize + (14 * s) + subFontSize + (14 * s);
    if (config.showLocation && data.address) {
      totalHeight += wrappedAddr.length * lineGap + (10 * s);
    }
    if (config.showLocation && config.showGpsCoords && data.lat && data.lng) {
      totalHeight += lineGap;
    }
    if (config.showProjectInfo && data.projectName) {
      totalHeight += lineGap;
    }

    const { boxX, boxY } = calculateBoxPosition(imgW, imgH, boxWidth, totalHeight, margin, config.position);
    drawBackgroundBox(ctx, boxX, boxY, boxWidth, totalHeight, 14 * s, config);

    let curY = boxY + padding;
    const contentX = boxX + padding;

    // Big Time
    ctx.font = `700 ${clockFontSize}px "Oswald", "JetBrains Mono", sans-serif`;
    ctx.fillStyle = config.accentColor;
    ctx.fillText(data.timeStr, contentX, curY + clockFontSize * 0.85);

    // Logo at top right if enabled
    if (config.showLogo && state.logoImage) {
      const logoSz = config.logoSize * s * 1.3;
      ctx.drawImage(state.logoImage, boxX + boxWidth - padding - logoSz, curY, logoSz, logoSz);
    }

    curY += clockFontSize + 8 * s;

    // Date & Day of week
    ctx.font = `700 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = config.textColor;
    const dateRow = `${data.dayOfWeek}, ${data.dateStr}  •  ⛅ 31°C`;
    ctx.fillText(dateRow, contentX, curY + subFontSize * 0.85);

    curY += subFontSize + 14 * s;

    // Separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(contentX, curY);
    ctx.lineTo(boxX + boxWidth - padding, curY);
    ctx.stroke();

    curY += 14 * s;

    // Address
    if (config.showLocation && data.address) {
      ctx.font = `600 ${infoFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      wrappedAddr.forEach(line => {
        ctx.fillText(`📍 ${line}`, contentX, curY + infoFontSize * 0.85);
        curY += lineGap;
      });
    }

    // GPS
    if (config.showLocation && config.showGpsCoords && data.lat && data.lng) {
      ctx.font = `500 ${infoFontSize - 2 * s}px "JetBrains Mono", monospace`;
      ctx.fillStyle = config.accentColor;
      ctx.fillText(`🌐 GPS: ${data.lat}° N, ${data.lng}° E`, contentX, curY + infoFontSize * 0.85);
      curY += lineGap;
    }

    // Project Name
    if (config.showProjectInfo && data.projectName) {
      ctx.font = `700 ${infoFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = '#facc15';
      ctx.fillText(`🏢 ${data.projectName} - ${data.workItem || ''}`, contentX, curY + infoFontSize * 0.85);
    }
  }

  // --- TEMPLATE 3: THẺ NGHIỆM THU / GIÁM SÁT (INSPECTION) ---
  function renderTemplateInspection(ctx, imgW, imgH, s, data, config) {
    const margin = config.margin * s;
    const padding = 22 * s;
    const boxWidth = Math.min(660 * s, imgW - margin * 2);

    const titleFontSize = Math.round(20 * s);
    const contentFontSize = Math.round(18 * s);
    const lineGap = Math.round(28 * s);

    let totalHeight = padding * 2 + (54 * s) + (14 * s); // Header badge area

    const rows = [];
    if (config.showDateTime) {
      rows.push({ label: 'THỜI GIAN', val: `${data.dateStr} - ${data.timeStr} (${data.dayOfWeek})` });
    }
    if (config.showLocation && data.address) {
      rows.push({ label: 'ĐỊA ĐIỂM', val: data.address });
    }
    if (config.showLocation && config.showGpsCoords && data.lat && data.lng) {
      rows.push({ label: 'TỌA ĐỘ GPS', val: `${data.lat}° N, ${data.lng}° E` });
    }
    if (config.showProjectInfo) {
      if (data.projectName) rows.push({ label: 'DỰ ÁN', val: data.projectName });
      if (data.workItem) rows.push({ label: 'HẠNG MỤC', val: data.workItem });
      if (data.inspector) rows.push({ label: 'GIÁM SÁT', val: data.inspector });
      if (data.verifyCode) rows.push({ label: 'SỐ BIÊN BẢN', val: data.verifyCode });
    }

    ctx.font = `600 ${contentFontSize}px "Plus Jakarta Sans", sans-serif`;
    const wrappedRows = [];
    rows.forEach(r => {
      const wrapped = wrapTextLines(ctx, r.val, boxWidth - padding * 2 - (140 * s));
      wrappedRows.push({ label: r.label, wrapped });
      totalHeight += wrapped.length * lineGap + (6 * s);
    });

    const { boxX, boxY } = calculateBoxPosition(imgW, imgH, boxWidth, totalHeight, margin, config.position);
    drawBackgroundBox(ctx, boxX, boxY, boxWidth, totalHeight, 16 * s, config);

    // Draw Top Header Badge: "PHIẾU KIỂM TRA HIỆN TRƯỜNG" + "ĐÃ NGHIỆM THU"
    let curY = boxY + padding;
    const contentX = boxX + padding;

    // Header Title
    ctx.font = `800 ${titleFontSize}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = config.textColor;
    ctx.fillText("BIÊN BẢN HÌNH ẢNH HIỆN TRƯỜNG", contentX, curY + titleFontSize * 0.85);

    // Verified Stamp Tag
    const tagText = "✓ ĐÃ NGHIỆM THU";
    ctx.font = `800 ${Math.round(14 * s)}px "Plus Jakarta Sans", sans-serif`;
    const tagW = ctx.measureText(tagText).width + (16 * s);
    const tagH = 26 * s;
    const tagX = boxX + boxWidth - padding - tagW;
    const tagY = curY;

    ctx.fillStyle = '#059669'; // Green verified badge
    drawRoundedRect(ctx, tagX, tagY, tagW, tagH, 6 * s);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, tagX + (8 * s), tagY + (18 * s));

    curY += 36 * s;

    // Double line divider
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(contentX, curY);
    ctx.lineTo(boxX + boxWidth - padding, curY);
    ctx.stroke();

    curY += 14 * s;

    // Draw Table Rows
    wrappedRows.forEach(({ label, wrapped }) => {
      ctx.font = `700 ${contentFontSize - 2 * s}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = config.accentColor;
      ctx.fillText(label, contentX, curY + contentFontSize * 0.85);

      const valX = contentX + (130 * s);
      ctx.font = `600 ${contentFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = config.textColor;

      wrapped.forEach((line, lIdx) => {
        ctx.fillText(line, valX, curY + (lIdx * lineGap) + contentFontSize * 0.85);
      });

      curY += wrapped.length * lineGap + (6 * s);
    });
  }

  // --- TEMPLATE 4: TỐI GIẢN (MINIMALIST) ---
  function renderTemplateMinimalist(ctx, imgW, imgH, s, data, config) {
    const margin = config.margin * s;
    const padding = 16 * s;
    const boxWidth = Math.min(580 * s, imgW - margin * 2);

    const timeFontSize = Math.round(36 * s);
    const subFontSize = Math.round(18 * s);
    const lineGap = Math.round(24 * s);

    ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
    const wrappedAddr = wrapTextLines(ctx, data.address || '', boxWidth - padding * 2);

    let totalHeight = padding * 2 + timeFontSize + (12 * s);
    if (config.showLocation && data.address) {
      totalHeight += wrappedAddr.length * lineGap + (6 * s);
    }
    if (config.showProjectInfo && data.projectName) {
      totalHeight += lineGap;
    }

    const { boxX, boxY } = calculateBoxPosition(imgW, imgH, boxWidth, totalHeight, margin, config.position);

    // Minimalist transparent dark pill
    drawBackgroundBox(ctx, boxX, boxY, boxWidth, totalHeight, 10 * s, config);

    let curY = boxY + padding;
    const contentX = boxX + padding;

    // Time & Date in 1 clean line
    ctx.font = `700 ${timeFontSize}px "JetBrains Mono", sans-serif`;
    ctx.fillStyle = config.textColor;
    ctx.fillText(`${data.timeStr} | ${data.dateStr}`, contentX, curY + timeFontSize * 0.85);

    curY += timeFontSize + (12 * s);

    if (config.showLocation && data.address) {
      ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = config.accentColor;
      wrappedAddr.forEach(line => {
        ctx.fillText(`📍 ${line}`, contentX, curY + subFontSize * 0.85);
        curY += lineGap;
      });
    }

    if (config.showProjectInfo && data.projectName) {
      ctx.font = `600 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`${data.projectName} • ${data.workItem || ''}`, contentX, curY + subFontSize * 0.85);
    }
  }

  // --- TEMPLATE 5: HUD TỌA ĐỘ GPS (TECHNICAL HUD) ---
  function renderTemplateHudGps(ctx, imgW, imgH, s, data, config) {
    const margin = config.margin * s;
    const padding = 20 * s;
    const boxWidth = Math.min(620 * s, imgW - margin * 2);

    const monoFontSize = Math.round(20 * s);
    const subFontSize = Math.round(16 * s);
    const lineGap = Math.round(26 * s);

    let totalHeight = padding * 2 + (4 * lineGap) + (10 * s);
    if (config.showLocation && data.address) totalHeight += lineGap;

    const { boxX, boxY } = calculateBoxPosition(imgW, imgH, boxWidth, totalHeight, margin, config.position);

    // Dark technical HUD box
    drawBackgroundBox(ctx, boxX, boxY, boxWidth, totalHeight, 6 * s, config);

    // Draw HUD Corner Brackets
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 2.5 * s;
    const bLen = 14 * s;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + bLen); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + bLen, boxY);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxWidth - bLen, boxY); ctx.lineTo(boxX + boxWidth, boxY); ctx.lineTo(boxX + boxWidth, boxY + bLen);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + totalHeight - bLen); ctx.lineTo(boxX, boxY + totalHeight); ctx.lineTo(boxX + bLen, boxY + totalHeight);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxWidth - bLen, boxY + totalHeight); ctx.lineTo(boxX + boxWidth, boxY + totalHeight); ctx.lineTo(boxX + boxWidth, boxY + totalHeight - bLen);
    ctx.stroke();

    let curY = boxY + padding;
    const contentX = boxX + padding;

    // Technical Coordinates Line
    ctx.font = `700 ${monoFontSize}px "JetBrains Mono", monospace`;
    ctx.fillStyle = config.accentColor;
    ctx.fillText(`⌖ LAT: ${data.lat || '0.000000'}° N`, contentX, curY + monoFontSize * 0.85);
    ctx.fillText(`  LNG: ${data.lng || '0.000000'}° E`, contentX + (260 * s), curY + monoFontSize * 0.85);

    curY += lineGap;

    // Time & Timestamp
    ctx.font = `600 ${monoFontSize - 2 * s}px "JetBrains Mono", monospace`;
    ctx.fillStyle = config.textColor;
    ctx.fillText(`⏱ UTC+7 : ${data.dateStr} ${data.timeStr}`, contentX, curY + monoFontSize * 0.85);

    curY += lineGap;

    // Address
    if (config.showLocation && data.address) {
      ctx.font = `500 ${subFontSize}px "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText(`LOC: ${data.address}`, contentX, curY + subFontSize * 0.85);
      curY += lineGap;
    }

    // Camera & Verification
    ctx.font = `500 ${subFontSize - 2 * s}px "JetBrains Mono", monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`DEV: ${data.camera || 'Standard Camera'}  |  SIG: ${data.verifyCode}`, contentX, curY + subFontSize * 0.85);
  }

  // --- DRAWING HELPERS ---
  function calculateBoxPosition(imgW, imgH, boxW, boxH, margin, pos) {
    let boxX = margin;
    let boxY = imgH - boxH - margin;

    switch (pos) {
      case 'bottom-left':
        boxX = margin;
        boxY = imgH - boxH - margin;
        break;
      case 'bottom-center':
        boxX = (imgW - boxW) / 2;
        boxY = imgH - boxH - margin;
        break;
      case 'bottom-right':
        boxX = imgW - boxW - margin;
        boxY = imgH - boxH - margin;
        break;
      case 'top-left':
        boxX = margin;
        boxY = margin;
        break;
      case 'top-center':
        boxX = (imgW - boxW) / 2;
        boxY = margin;
        break;
      case 'top-right':
        boxX = imgW - boxW - margin;
        boxY = margin;
        break;
    }

    return { boxX, boxY };
  }

  function drawBackgroundBox(ctx, x, y, w, h, radius, config) {
    const opacity = (config.bgOpacity / 100);

    ctx.save();
    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    let fill = `rgba(15, 23, 42, ${opacity})`;
    let border = `rgba(255, 255, 255, 0.15)`;

    switch (config.bgStyle) {
      case 'solid-dark':
        fill = `rgba(11, 15, 25, 1)`;
        break;
      case 'navy':
        fill = `rgba(10, 25, 47, ${opacity})`;
        border = `rgba(0, 229, 255, 0.3)`;
        break;
      case 'glass-light':
        fill = `rgba(255, 255, 255, ${opacity * 0.85})`;
        border = `rgba(0, 0, 0, 0.15)`;
        break;
      case 'transparent':
        fill = 'transparent';
        border = 'transparent';
        ctx.shadowColor = 'transparent';
        break;
    }

    drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();

    if (border !== 'transparent') {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = border;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
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

  function wrapTextLines(ctx, text, maxWidth) {
    if (!text) return [];
    const words = String(text).split(' ');
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

  function formatTimeString(date, showSeconds = true) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
  }

  function formatDate(date, format) {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    let out = format;
    out = out.replace('yyyy', yyyy);
    out = out.replace('MM', MM);
    out = out.replace('dd', dd);
    out = out.replace('HH', HH);
    out = out.replace('mm', mm);
    out = out.replace('ss', ss);
    return out;
  }

  function formatToDatetimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  function getDayOfWeekName(date, isEnabled) {
    if (!isEnabled) return '';
    return VN_DAYS[date.getDay()];
  }

  function formatCoordsDMS(latStr, lngStr) {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return `${latStr}, ${lngStr}`;

    const toDMS = (deg, isLat) => {
      const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
      const absDeg = Math.abs(deg);
      const d = Math.floor(absDeg);
      const minFloat = (absDeg - d) * 60;
      const m = Math.floor(minFloat);
      const s = ((minFloat - m) * 60).toFixed(1);
      return `${d}°${m}'${s}" ${dir}`;
    };

    return `${toDMS(lat, true)}, ${toDMS(lng, false)}`;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // --- EXPORT & DOWNLOAD ---
  async function downloadCurrentSingle() {
    if (state.activeIndex < 0) return;
    const imgObj = state.images[state.activeIndex];
    
    showLoading(true, "Đang kết xuất ảnh chất lượng cao...");

    setTimeout(() => {
      // Re-draw onto a clean full-res canvas
      const exportCanvas = document.createElement('canvas');
      drawStampOnCanvas(exportCanvas, imgObj, state.config, false);

      const format = state.config.exportFormat;
      const quality = state.config.exportQuality;
      const ext = format === 'image/png' ? 'png' : 'jpg';

      exportCanvas.toBlob((blob) => {
        showLoading(false);
        if (!blob) {
          showToast("Lỗi khi kết xuất ảnh", "error");
          return;
        }

        const originalName = imgObj.file.name.replace(/\.[^/.]+$/, "");
        const fileName = `${originalName}_TimeMark.${ext}`;

        triggerDownload(blob, fileName);
        showToast(`Đã xuất ảnh thành công: ${fileName}`, 'success');
      }, format, quality);
    }, 50);
  }

  async function downloadAllBatchZip() {
    if (state.images.length === 0) return;
    if (!window.JSZip) {
      showToast("Thư viện JSZip chưa sẵn sàng.", "error");
      return;
    }

    const zip = new window.JSZip();
    const count = state.images.length;
    const format = state.config.exportFormat;
    const quality = state.config.exportQuality;
    const ext = format === 'image/png' ? 'png' : 'jpg';

    // Show progress bar
    DOM.batchProgressBarWrapper.style.display = 'flex';
    DOM.btnBatchDownload.disabled = true;
    DOM.btnBatchDownloadBottom.disabled = true;

    for (let i = 0; i < count; i++) {
      const imgObj = state.images[i];
      const pct = Math.round(((i + 1) / count) * 100);
      DOM.batchProgressText.textContent = `Đang xử lý ảnh ${i + 1}/${count} (${imgObj.file.name})...`;
      DOM.batchProgressPercent.textContent = `${pct}%`;
      DOM.batchProgressBarFill.style.width = `${pct}%`;

      // Allow UI update
      await new Promise(r => setTimeout(r, 20));

      const canvas = document.createElement('canvas');
      drawStampOnCanvas(canvas, imgObj, state.config, false);

      const blob = await new Promise((res) => canvas.toBlob(res, format, quality));
      const originalName = imgObj.file.name.replace(/\.[^/.]+$/, "");
      zip.file(`${originalName}_TimeMark.${ext}`, blob);
    }

    DOM.batchProgressText.textContent = "Đang nén file ZIP...";
    const zipBlob = await zip.generateAsync({ type: "blob" });

    DOM.batchProgressBarWrapper.style.display = 'none';
    DOM.btnBatchDownload.disabled = false;
    DOM.btnBatchDownloadBottom.disabled = false;

    const zipName = `TimeMark_Batch_${Date.now()}.zip`;
    triggerDownload(zipBlob, zipName);
    showToast(`Đã tải về toàn bộ ${count} ảnh trong file ZIP!`, 'success');
  }

  function triggerDownload(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 5000);
  }

  function toggleCompare(showOriginal) {
    state.isComparing = showOriginal;
    DOM.lblCompare.textContent = showOriginal ? "Đang xem ảnh gốc..." : "Xem ảnh gốc";
    renderActiveImage();
  }

  function resetAllSettings() {
    if (!confirm("Bạn có chắc chắn muốn đặt lại toàn bộ cài đặt về mặc định?")) return;
    
    state.config.template = 'construction';
    state.config.position = 'bottom-left';
    state.config.scale = 100;
    state.config.margin = 30;
    state.config.bgStyle = 'glass-dark';
    state.config.bgOpacity = 75;
    state.config.accentColor = '#00E5FF';
    state.config.textColor = '#FFFFFF';
    state.config.showDateTime = true;
    state.config.showLocation = true;
    state.config.showProjectInfo = true;
    state.config.showLogo = true;

    // Reset template card selection UI
    DOM.templateCards.forEach(c => c.classList.toggle('active', c.dataset.template === 'construction'));
    DOM.posButtons.forEach(b => b.classList.toggle('active', b.dataset.pos === 'bottom-left'));

    syncFormFromConfig();
    createDefaultSampleLogo();
    setCurrentDateTime();
    renderActiveImage();
    showToast("Đã đặt lại cài đặt về mặc định.", "info");
  }

  function showLoading(show, message = "Đang xử lý...") {
    DOM.renderLoadingOverlay.style.display = show ? 'flex' : 'none';
    DOM.loadingMessage.textContent = message;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    DOM.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Run init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
