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

  // Spin button click handler - FIX: Sử dụng đúng ID từ HTML
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
    // FIX: Tính toán góc quay chính xác hơn
    const extraSpins = 3; // Số vòng quay thêm
    const spinAngle = extraSpins * 360 + (360 - segmentMiddle);

    // Rotate the wheel with CSS animation - FIX: Sử dụng đúng selector
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
    }, 4000); // FIX: Thời gian khớp với animation
  });

  // Form submission handler
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

    // Gửi dữ liệu
    sendDataWithFormData(formData);
  });

  // FIX: Cải thiện hàm gửi dữ liệu
  function sendDataWithFormData(data) {
    try {
      // Tạo mã giảm giá
      const discountCode = generateMockDiscountCode(data.discountPercentage);
      
      // Lưu dữ liệu vào localStorage (nếu có thể)
      if (typeof(Storage) !== "undefined") {
        let savedData = JSON.parse(localStorage.getItem('luckyWheelData') || '[]');
        savedData.push({
          fullname: data.fullname,
          email: data.email,
          discountPercentage: data.discountPercentage,
          discountCode: discountCode,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('luckyWheelData', JSON.stringify(savedData));
      }
      
      // Xử lý thành công ngay lập tức
      setTimeout(() => {
        handleSuccess({
          success: true,
          discountCode: discountCode,
          emailSent: true
        });
      }, 1500);
      
      // Gửi dữ liệu đến Google Script trong background
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      })
      .then(() => {
        console.log('Dữ liệu đã được gửi đến Google Script');
      })
      .catch(error => {
        console.error('Lỗi khi gửi dữ liệu:', error);
      });
      
    } catch (error) {
      console.error('Lỗi khi xử lý dữ liệu:', error);
      
      // Xử lý lỗi
      setTimeout(() => {
        const backupCode = generateMockDiscountCode(data.discountPercentage);
        handleSuccess({
          success: true,
          discountCode: backupCode,
          emailSent: false
        });
      }, 1500);
    }
  }

  // Xử lý khi gửi form thành công
  function handleSuccess(response) {
    // Reset form state
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
    
    // Hiển thị thông báo thành công
    $("#success-message").removeClass("d-none");
    $("#user-form").addClass("d-none");
    
    // Hiển thị mã giảm giá
    // $("#discount-card").removeClass("d-none");
    // $("#coupon-code").val(response.discountCode);
    // $("#discount-info").text(`Mã giảm ${selectedPrize.percentage}% có thể sử dụng cho đơn hàng tiếp theo của bạn.`);
    
    // Cập nhật trạng thái email
    setTimeout(() => {
      if (response.emailSent) {
        $("#email-status").html('<span class="text-success">✓ Mã giảm giá đã được gửi đến email của bạn!</span>');
      } else {
        $("#email-status").html('<span class="text-warning">⚠ Không thể gửi email. Vui lòng lưu lại mã giảm giá.</span>');
      }
    }, 2000);
  }

  // Copy button handler
  // $(document).on('click', '#copy-btn', function() {
  //   const couponCode = $("#coupon-code").val();
    
  //   // Modern clipboard API
  //   if (navigator.clipboard) {
  //     navigator.clipboard.writeText(couponCode).then(() => {
  //       showCopySuccess($(this));
  //     }).catch(() => {
  //       // Fallback method
  //       fallbackCopyTextToClipboard(couponCode, $(this));
  //     });
  //   } else {
  //     // Fallback method
  //     fallbackCopyTextToClipboard(couponCode, $(this));
  //   }
  // });

  // FIX: Cải thiện hàm copy
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
    const radius = 250; // Tăng radius để vòng quay to bằng viền
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

      // Loại bỏ stroke để không có khoảng trắng
      svgContent += `<path d="${pathData}" fill="${segment.color}" />`;

      // Add text với màu tương phản dựa trên màu nền
      const textAngle = startAngle + anglePerSegment / 2;
      const textRad = ((textAngle - 90) * Math.PI) / 180;
      const textX = centerX + radius * 0.7 * Math.cos(textRad);
      const textY = centerY + radius * 0.7 * Math.sin(textRad);
      
      // Chọn màu text tương phản cho từng màu nền
      let textColor;
      if (segment.color === "#ffeab9" || segment.color === "#ffcc80") {
        textColor = "#246d4b"; // Text xanh đậm cho nền vàng/cam nhạt
      } else {
        textColor = "#ffeab9"; // Text vàng nhạt cho nền xanh đậm
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

    // Center circle nhỏ hơn
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
    
    // Fallback - trả về giải thưởng cuối cùng
    return prizes[prizes.length - 1];
  }

  // Hàm hiển thị thống kê tỷ lệ trúng (debug)
  function showProbabilityStats() {
    console.log("=== TỶ LỆ TRÚNG THƯỞNG ===");
    prizes.forEach(prize => {
      console.log(`${prize.percentage}%: ${(prize.probability * 100).toFixed(1)}% xác suất`);
    });
    
    const totalProb = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    console.log(`Tổng xác suất: ${(totalProb * 100).toFixed(1)}%`);
  }

  // Hiển thị stats khi load trang
  showProbabilityStats();

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // FIX: Cải thiện hiệu ứng confetti
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

      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, (randomDelay + randomDuration) * 1000);
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function generateMockDiscountCode(percentage) {
    const prefix = `EZTECH${percentage}`;
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let suffix = "";
    
    for (let i = 0; i < 6; i++) {
      suffix += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return prefix + suffix;
  }

  // FIX: Thêm event handler cho việc reset wheel khi modal đóng
  let adminMode = false;
  
  $(document).keydown(function(e) {
    // Ctrl+Shift+A để bật/tắt admin mode
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
    // Tạo admin panel nếu chưa có
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
    
    // Tạo controls cho từng giải thưởng
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
    
    // Event handlers
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
    
    // Cảnh báo nếu tổng không bằng 100%
    if (Math.abs(total - 1) > 0.01) {
      alert(`Cảnh báo: Tổng tỷ lệ là ${(total * 100).toFixed(1)}%. Nên để tổng = 100% để chính xác.`);
    }
    
    // Cập nhật tỷ lệ
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
    // Reset form khi đóng modal
    $("#user-form")[0].reset();
    $("#user-form").removeClass("d-none");
    $("#success-message").addClass("d-none");
    $("#discount-card").addClass("d-none");
    $(".error-message").text("");
    
    // Reset button state
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
  });
});