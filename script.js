$(document).ready(function() {
  // URL của Google Apps Script
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx3gO96QsPD17XN_54LXhGREHsL7-oIbqJb7xNzl7mueouSmpJxo0dif5H_PaMNrtIS/exec";

  // Wheel configuration với tỷ lệ trúng tùy chỉnh
  const prizes = [
    { percentage: 20, count: 8, probability: 0.5 },   // 50% xác suất trúng 20%
    { percentage: 30, count: 6, probability: 0.3 },   // 30% xác suất trúng 30%
    { percentage: 40, count: 4, probability: 0.15 },  // 15% xác suất trúng 40%
    { percentage: 50, count: 2, probability: 0.05 },  // 5% xác suất trúng 50%
  ];

  let segments = [];
  let totalSegments = 0;
  let selectedPrize = null;
  let isSpinning = false;

  // Tạo modal bootstrap
  const congratsModal = new bootstrap.Modal($("#congratsModal")[0], {
    backdrop: 'static',
    keyboard: false
  });

  // Calculate total segments
  prizes.forEach((prize) => {
    totalSegments += prize.count;
  });

  // Create segments array với màu cố định theo vị trí
  prizes.forEach((prize) => {
    for (let i = 0; i < prize.count; i++) {
      segments.push({
        percentage: prize.percentage,
        color: null, // Sẽ được gán màu sau dựa trên vị trí
      });
    }
  });

  // Shuffle the segments for randomness
  segments = shuffleArray(segments);

  // Gán màu theo vị trí sau khi shuffle
  segments.forEach((segment, index) => {
    if (segment.percentage === 50) {
      segment.color = "#ffcc80"; // Màu cam nhạt cho 50%
    } else {
      // Xen kẽ 2 màu theo vị trí index
      segment.color = index % 2 === 0 ? "#ffeab9" : "#246d4b";
    }
  });

  // Draw the wheel
  drawWheel(segments);

  // Spin button click handler
  $("#ez-spin-btn").click(function() {
    if (isSpinning) return;

    // Start spinning
    isSpinning = true;
    $(this).css('pointer-events', 'none');
    
    // Add spinning animation class
    $(".spin-button-wrapper").addClass('spinning');

    // Determine winning segment dựa trên tỷ lệ xác suất
    selectedPrize = getRandomPrizeByProbability();
    
    // Tìm segment có giá trị trúng thưởng
    const winningSegments = segments.filter(seg => seg.percentage === selectedPrize.percentage);
    const randomWinningSegment = Math.floor(Math.random() * winningSegments.length);
    const segmentIndex = segments.findIndex(seg => 
      seg.percentage === selectedPrize.percentage && 
      segments.filter(s => s.percentage === selectedPrize.percentage).indexOf(seg) === randomWinningSegment
    );

    // Calculate rotation angle
    const segmentAngle = 360 / segments.length;
    const segmentMiddle = segmentIndex * segmentAngle + segmentAngle / 2;
    const extraSpins = 3; // Số vòng quay thêm
    const spinAngle = extraSpins * 360 + (360 - segmentMiddle);

    // Rotate the wheel with CSS animation
    $('.custom-wheel').css({
      'transform': `rotate(${spinAngle}deg)`,
      'transition': 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
 
    // After spinning is complete
    setTimeout(() => {
      isSpinning = false;
      $(this).css('pointer-events', 'auto');
      
      // Remove spinning animation class
      $(".spin-button-wrapper").removeClass('spinning');

      // Hiển thị kết quả trong modal
      $("#prize-text").text(`Giảm giá ${selectedPrize.percentage}%`);
      $("#discount-percentage").val(selectedPrize.percentage);
      
      // Thêm class zoom in cho modal
      $("#congratsModal").addClass('modal-zoom-in');
      
      // Hiển thị modal chúc mừng với hiệu ứng zoom in
      congratsModal.show();

      // Create confetti effect
      createConfetti();

      // Remove zoom in class sau khi animation hoàn thành
      setTimeout(() => {
        $("#congratsModal").removeClass('modal-zoom-in');
      }, 600);
    }, 4000);
  });

  // Form submission handler - FIXED: Gửi dữ liệu thật đến Google Apps Script
  $("#user-form").submit(function(e) {
    e.preventDefault();

    // Validation
    let isValid = true;
    const fullname = $("#fullname").val().trim();
    const email = $("#email").val().trim();

    // Clear previous errors
    $(".error-message").text("");

    if (fullname === "") {
      $("#fullname-error").text("Vui lòng nhập họ tên");
      isValid = false;
    }

    if (email === "") {
      $("#email-error").text("Vui lòng nhập email");
      isValid = false;
    } else if (!isValidEmail(email)) {
      $("#email-error").text("Email không hợp lệ");
      isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    $("#submit-btn").prop('disabled', true);
    $("#loading-spinner").removeClass("d-none");
    $("#submit-text").addClass("d-none");
    $("#success-message, #error-message").addClass("d-none");

    const formData = {
      fullname: fullname,
      email: email,
      discountPercentage: selectedPrize.percentage
    };

    // FIXED: Gửi dữ liệu thật đến Google Apps Script
    sendDataToGoogleAppsScript(formData);
  });

  // FIXED: Hàm gửi dữ liệu thật đến Google Apps Script
  function sendDataToGoogleAppsScript(data) {
    console.log("Đang gửi dữ liệu đến Google Apps Script:", data);

    // Tạo FormData để gửi
    const formData = new FormData();
    formData.append('fullname', data.fullname);
    formData.append('email', data.email);
    formData.append('discountPercentage', data.discountPercentage);

    // Sử dụng JSONP để tránh CORS (khuyên dùng cách này)
    const callbackName = 'jsonpCallback_' + Date.now();
    
    // Tạo script tag để gửi JSONP request
    const script = document.createElement('script');
    script.src = SCRIPT_URL + '?' + 
                 'fullname=' + encodeURIComponent(data.fullname) + 
                 '&email=' + encodeURIComponent(data.email) + 
                 '&discountPercentage=' + data.discountPercentage + 
                 '&callback=' + callbackName;

    // Tạo callback function để nhận response
    window[callbackName] = function(response) {
      console.log("Nhận response từ Google Apps Script:", response);
      
      // Cleanup
      document.head.removeChild(script);
      delete window[callbackName];
      
      if (response.success) {
        handleSuccess(response);
      } else {
        handleError(response.error || "Có lỗi xảy ra");
      }
    };

    // Thêm timeout để xử lý trường hợp không có response
    setTimeout(() => {
      if (window[callbackName]) {
        console.log("Timeout - không nhận được response, sử dụng fallback");
        document.head.removeChild(script);
        delete window[callbackName];
        handleFallback(data);
      }
    }, 10000); // 10 giây timeout

    // Gửi request
    document.head.appendChild(script);
  }

  // FIXED: Xử lý khi nhận được response thành công từ Google Apps Script
  function handleSuccess(response) {
    console.log("Xử lý thành công:", response);
    
    // Reset form state
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
    
    // Hiển thị thông báo thành công
    $("#success-message").removeClass("d-none");
    $("#user-form").addClass("d-none");
    
    // Hiển thị mã giảm giá từ Google Apps Script
    $("#discount-card").removeClass("d-none");
    $("#coupon-code").val(response.discountCode);
    $("#discount-info").text(`Mã giảm ${selectedPrize.percentage}% có thể sử dụng cho đơn hàng tiếp theo của bạn.`);
    
    // Cập nhật trạng thái email
    setTimeout(() => {
      if (response.emailSent) {
        $("#email-status").html('<span class="text-success">✓ Mã giảm giá đã được gửi đến email của bạn!</span>');
      } else {
        $("#email-status").html('<span class="text-warning">⚠ Không thể gửi email. Vui lòng lưu lại mã giảm giá.</span>');
      }
    }, 2000);
  }

  // FIXED: Xử lý khi có lỗi từ Google Apps Script
  function handleError(errorMessage) {
    console.error("Lỗi từ Google Apps Script:", errorMessage);
    
    // Reset form state
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
    
    // Hiển thị thông báo lỗi
    $("#error-message").removeClass("d-none").text("Lỗi: " + errorMessage);
  }

  // FIXED: Xử lý fallback khi không nhận được response
  function handleFallback(data) {
    console.log("Sử dụng fallback - tạo mã giảm giá tạm thời");
    
    // Tạo mã giảm giá tạm thời
    const tempCode = generateTempDiscountCode(data.discountPercentage);
    
    handleSuccess({
      success: true,
      discountCode: tempCode,
      emailSent: false,
      message: "Sử dụng mã tạm thời"
    });
  }

  // Copy button handler
  $(document).on('click', '#copy-btn', function() {
    const couponCode = $("#coupon-code").val();
    
    // Modern clipboard API
    if (navigator.clipboard) {
      navigator.clipboard.writeText(couponCode).then(() => {
        showCopySuccess($(this));
      }).catch(() => {
        // Fallback method
        fallbackCopyTextToClipboard(couponCode, $(this));
      });
    } else {
      // Fallback method
      fallbackCopyTextToClipboard(couponCode, $(this));
    }
  });

  function fallbackCopyTextToClipboard(text, $btn) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showCopySuccess($btn);
      }
    } catch (err) {
      console.error('Không thể copy mã giảm giá');
    }
    
    document.body.removeChild(textArea);
  }

  function showCopySuccess($btn) {
    const originalHtml = $btn.html();
    $btn.html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>');
    
    setTimeout(() => {
      $btn.html(originalHtml);
    }, 1500);
  }

  // Helper functions
  function drawWheel(segments) {
    const svg = $(".wheel");
    const centerX = 250;
    const centerY = 250;
    const radius = 250;
    const anglePerSegment = 360 / segments.length;

    let svgContent = "";

    // Create the segments
    segments.forEach((segment, index) => {
      const startAngle = index * anglePerSegment;
      const endAngle = (index + 1) * anglePerSegment;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);

      const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

      const pathData = [
        `M ${centerX},${centerY}`,
        `L ${x1},${y1}`,
        `A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2}`,
        "Z",
      ].join(" ");

      svgContent += `<path d="${pathData}" fill="${segment.color}" />`;

      // Add text
      const textAngle = startAngle + anglePerSegment / 2;
      const textRad = ((textAngle - 90) * Math.PI) / 180;
      const textX = centerX + radius * 0.7 * Math.cos(textRad);
      const textY = centerY + radius * 0.7 * Math.sin(textRad);
      
      let textColor;
      if (segment.color === "#ffeab9" || segment.color === "#ffcc80") {
        textColor = "#246d4b";
      } else {
        textColor = "#ffeab9";
      }

      svgContent += `
        <text 
          x="${textX}" 
          y="${textY}" 
          fill="${textColor}" 
          font-size="18" 
          font-weight="bold" 
          text-anchor="middle"
          dominant-baseline="middle"
          style="text-shadow: 1px 1px 2px rgba(0,0,0,0.3);"
        >
          ${segment.percentage}%
        </text>
      `;
    });

    // Center circle
    svgContent += `<circle cx="${centerX}" cy="${centerY}" r="25" fill="#246d4b" />`;
    
    // Logo EZ ở giữa
    svgContent += `
      <text 
        x="${centerX}" 
        y="${centerY}" 
        fill="#ffeab9" 
        font-size="14" 
        font-weight="bold" 
        text-anchor="middle"
        dominant-baseline="middle"
      >
        EZ
      </text>
    `;

    svg.html(svgContent);
  }

  // Hàm chọn giải thưởng dựa trên xác suất
  function getRandomPrizeByProbability() {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (const prize of prizes) {
      cumulativeProbability += prize.probability;
      if (random <= cumulativeProbability) {
        return prize;
      }
    }
    
    return prizes[prizes.length - 1];
  }

  function showProbabilityStats() {
    console.log("=== TỶ LỆ TRÚNG THƯỞNG ===");
    prizes.forEach(prize => {
      console.log(`${prize.percentage}%: ${(prize.probability * 100).toFixed(1)}% xác suất`);
    });
    
    const totalProb = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    console.log(`Tổng xác suất: ${(totalProb * 100).toFixed(1)}%`);
  }

  showProbabilityStats();

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function createConfetti() {
    const confettiCount = 150;
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7"];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = $("<div>").addClass("confetti");
      
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomX = Math.random() * window.innerWidth;
      const randomDelay = Math.random() * 3;
      const randomDuration = Math.random() * 3 + 2;
      
      confetti.css({
        position: 'fixed',
        left: randomX + 'px',
        top: '-10px',
        width: Math.random() * 8 + 4 + 'px',
        height: Math.random() * 8 + 4 + 'px',
        backgroundColor: randomColor,
        zIndex: 9999,
        borderRadius: '2px',
        animationDelay: randomDelay + 's',
        animationDuration: randomDuration + 's'
      });

      $('body').append(confetti);

      setTimeout(() => {
        confetti.remove();
      }, (randomDelay + randomDuration) * 1000);
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // FIXED: Tạo mã tạm thời khi không kết nối được Google Apps Script
  function generateTempDiscountCode(percentage) {
    const prefix = `TEMP${percentage}_`;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    
    for (let i = 0; i < 6; i++) {
      suffix += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return prefix + suffix;
  }

  // Admin panel code giữ nguyên...
  let adminMode = false;
  
  $(document).keydown(function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      adminMode = !adminMode;
      toggleAdminPanel();
    }
  });

  function toggleAdminPanel() {
    if (adminMode) {
      showAdminPanel();
    } else {
      hideAdminPanel();
    }
  }

  function showAdminPanel() {
    if ($('#admin-panel').length === 0) {
      createAdminPanel();
    }
    $('#admin-panel').show();
  }

  function hideAdminPanel() {
    $('#admin-panel').hide();
  }

  function createAdminPanel() {
    const adminHTML = `
      <div id="admin-panel" style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 2px solid #246d4b;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 300px;
        display: none;
      ">
        <h5 style="color: #246d4b; margin-bottom: 15px;">⚙️ Điều Chỉnh Tỷ Lệ Trúng</h5>
        <div id="probability-controls"></div>
        <button id="update-probabilities" class="btn btn-primary btn-sm mt-3">Cập Nhật</button>
        <button id="reset-probabilities" class="btn btn-secondary btn-sm mt-3 ms-2">Reset</button>
        <small class="d-block mt-2 text-muted">Nhấn Ctrl+Shift+A để ẩn</small>
      </div>
    `;
    
    $('body').append(adminHTML);
    
    prizes.forEach((prize, index) => {
      const controlHTML = `
        <div class="mb-2">
          <label class="form-label" style="font-size: 12px;">
            Giải ${prize.percentage}%: 
            <span class="probability-display">${(prize.probability * 100).toFixed(1)}%</span>
          </label>
          <input type="range" 
                 class="form-range probability-slider" 
                 data-index="${index}"
                 min="0" 
                 max="100" 
                 value="${prize.probability * 100}"
                 style="height: 5px;">
        </div>
      `;
      $('#probability-controls').append(controlHTML);
    });
    
    $('.probability-slider').on('input', function() {
      const index = $(this).data('index');
      const value = $(this).val();
      $(this).siblings('label').find('.probability-display').text(value + '%');
    });
    
    $('#update-probabilities').click(function() {
      updateProbabilities();
    });
    
    $('#reset-probabilities').click(function() {
      resetProbabilities();
    });
  }

  function updateProbabilities() {
    let total = 0;
    const newProbabilities = [];
    
    $('.probability-slider').each(function(index) {
      const value = parseFloat($(this).val()) / 100;
      newProbabilities.push(value);
      total += value;
    });
    
    if (Math.abs(total - 1) > 0.01) {
      alert(`Cảnh báo: Tổng tỷ lệ là ${(total * 100).toFixed(1)}%. Nên để tổng = 100% để chính xác.`);
    }
    
    prizes.forEach((prize, index) => {
      prize.probability = newProbabilities[index];
    });
    
    showProbabilityStats();
    alert('Đã cập nhật tỷ lệ trúng thưởng!');
  }

  function resetProbabilities() {
    const defaultProbabilities = [0.5, 0.3, 0.15, 0.05];
    
    prizes.forEach((prize, index) => {
      prize.probability = defaultProbabilities[index];
    });
    
    $('.probability-slider').each(function(index) {
      const newValue = defaultProbabilities[index] * 100;
      $(this).val(newValue);
      $(this).siblings('label').find('.probability-display').text(newValue.toFixed(1) + '%');
    });
    
    showProbabilityStats();
    alert('Đã reset về tỷ lệ mặc định!');
  }

  $('#congratsModal').on('hidden.bs.modal', function () {
    $("#user-form")[0].reset();
    $("#user-form").removeClass("d-none");
    $("#success-message").addClass("d-none");
    $("#discount-card").addClass("d-none");
    $(".error-message").text("");
    
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
  });
});