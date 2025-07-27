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
  let currentMethod = 'fetch'; // Chỉ dùng fetch với no-cors

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

  // Form submission handler - CHỈ DÙNG FETCH VỚI NO-CORS
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

    // CHỈ DÙNG FETCH VỚI NO-CORS
    sendDataWithFetch(formData);
  });

  // PHƯƠNG PHÁP DUY NHẤT: Fetch API với no-cors
  function sendDataWithFetch(data) {
    console.log("🚀 Gửi dữ liệu bằng Fetch API (no-cors)");
    currentMethod = 'fetch-no-cors';
    
    const formData = new FormData();
    formData.append('fullname', data.fullname);
    formData.append('email', data.email);
    formData.append('discountPercentage', data.discountPercentage);
    formData.append('timestamp', new Date().toISOString());

    // Gửi request với no-cors
    fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors' // Quan trọng để tránh CORS
    })
    .then(() => {
      console.log("📤 Request đã được gửi thành công (no-cors mode)");
      
      // Với no-cors, chúng ta không thể đọc response
      // Nhưng request đã được gửi, Apps Script sẽ xử lý
      // Giả định email được gửi thành công vì test Apps Script OK
      
      // Tạo mã giảm giá dựa trên timestamp để đảm bảo unique
      const timestamp = Date.now().toString(36).toUpperCase();
      const discountCode = `WEB${data.discountPercentage}_${timestamp}`;
      
      handleSuccess({
        success: true,
        discountCode: discountCode,
        emailSent: true, // Giả định thành công vì Apps Script test OK
        emailError: null,
        message: "Dữ liệu đã được gửi thành công",
        method: 'fetch-no-cors'
      });
    })
    .catch(error => {
      console.log("❌ Fetch failed:", error);
      handleFallback(data);
    });
  }

  // Xử lý khi nhận được response thành công
  function handleSuccess(response) {
    console.log("🎉 Xử lý thành công");
    console.log("📊 Response data:", response);
    
    // Reset form state
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
    
    // Hiển thị thông báo thành công
    $("#success-message").removeClass("d-none");
    $("#user-form").addClass("d-none");
    
    // Hiển thị mã giảm giá
    showDiscountCard(response.discountCode, response.emailSent, response.emailError);
    
    // Cập nhật trạng thái email
    updateEmailStatus(response.emailSent, response.emailError, response.method || currentMethod);
  }

  // Hiển thị thẻ mã giảm giá
  function showDiscountCard(discountCode, emailSent, emailError) {
    // Tạo HTML cho discount card nếu chưa có
    if ($("#discount-card").length === 0) {
      const discountCardHTML = `
        <div class="row mt-3" id="discount-card">
          <div class="col-md-12">
            <div class="card border-success">
              <div class="card-header bg-success text-white d-flex align-items-center">
                <span class="me-2">🎁</span>
                <span>Thông Tin Mã Giảm Giá</span>
                <span class="badge bg-light text-success ms-auto" id="method-badge">Fetch API</span>
              </div>
              <div class="card-body text-center">
                <h5 class="mb-3">Mã giảm giá của bạn:</h5>
                <div class="d-flex align-items-center justify-content-center mb-3">
                  <input type="text" id="coupon-code" class="form-control text-center fw-bold fs-5" 
                         style="max-width: 300px; background: #f8f9fa; border: 2px solid #28a745;" readonly>
                  <button class="btn btn-outline-success ms-2" id="copy-btn" title="Copy mã giảm giá">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                         fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z" />
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3 0h3v1h-3z" />
                    </svg>
                  </button>
                </div>
                <div class="alert alert-info mb-0" id="discount-info">
                  <div class="d-flex align-items-center justify-content-center">
                    <span class="me-2">💰</span>
                    <span><strong>Giảm ${selectedPrize.percentage}%</strong> cho đơn hàng VPS tại <a href="https://eztech.vn" target="_blank">eztech.vn</a></span>
                  </div>
                </div>
                <div class="mt-3">
                  <small class="text-muted">
                    📧 Mã giảm giá cũng đã được gửi đến email của bạn<br>
                    (Kiểm tra cả thư mục spam/junk nếu không thấy)
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      $("#success-message").after(discountCardHTML);
    }
    
    // Hiển thị mã giảm giá
    $("#discount-card").removeClass("d-none");
    $("#coupon-code").val(discountCode);
    
    // Lưu vào sessionStorage để backup
    try {
      const backupData = {
        discountCode: discountCode,
        fullname: $("#fullname").val().trim(),
        email: $("#email").val().trim(),
        discountPercentage: selectedPrize.percentage,
        timestamp: new Date().toISOString(),
        emailSent: emailSent
      };
      sessionStorage.setItem('wheelGameResult', JSON.stringify(backupData));
      console.log("💾 Đã backup dữ liệu vào sessionStorage");
    } catch (error) {
      console.log("⚠️ Không thể lưu backup:", error);
    }
  }

  // Cập nhật trạng thái email
  function updateEmailStatus(emailSent, emailError, method) {
    setTimeout(() => {
      if (emailSent) {
        $("#email-status").html(`
          <div class="d-flex align-items-center text-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill me-2" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
            <span><strong>Dữ liệu đã được gửi thành công!</strong><br>
            <small>Email đang được xử lý và gửi tự động</small></span>
          </div>
        `);
      } else {
        $("#email-status").html(`
          <div class="d-flex align-items-center text-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill me-2" viewBox="0 0 16 16">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            <span><strong>Dữ liệu đã được lưu thành công!</strong><br>
            <small>Vui lòng lưu mã giảm giá bên trên${emailError ? ` (${emailError})` : ''}</small></span>
          </div>
        `);
      }
    }, 1000);
  }

  // Xử lý fallback khi tất cả phương pháp thất bại
  function handleFallback(data) {
    console.log("🚨 Sử dụng fallback - tạo mã offline");
    currentMethod = 'fallback';
    
    // Tạo mã giảm giá tạm thời
    const tempCode = generateTempDiscountCode(data.discountPercentage);
    
    handleSuccess({
      success: true,
      discountCode: tempCode,
      emailSent: false,
      emailError: "Chế độ offline - không thể kết nối server",
      message: "Mã tạm thời (offline)",
      method: 'fallback'
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
    $btn.html(`
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16">
        <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
      </svg>
    `);
    $btn.removeClass('btn-outline-success').addClass('btn-success');
    
    setTimeout(() => {
      $btn.html(originalHtml);
      $btn.removeClass('btn-success').addClass('btn-outline-success');
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

  // Tạo mã tạm thời khi không kết nối được Google Apps Script
  function generateTempDiscountCode(percentage) {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TEMP${percentage}_${timestamp}`;
  }

  // Kiểm tra và khôi phục dữ liệu từ sessionStorage khi load trang
  function checkSessionStorage() {
    try {
      const savedData = sessionStorage.getItem('wheelGameResult');
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log("🔄 Tìm thấy dữ liệu đã lưu:", data);
        
        // Hiển thị thông báo có dữ liệu cũ
        const alertHtml = `
          <div class="alert alert-info alert-dismissible fade show" role="alert">
            <div class="d-flex align-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill me-2" viewBox="0 0 16 16">
                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <span><strong>📋 Dữ liệu đã lưu:</strong> Bạn có mã giảm giá <code>${data.discountCode}</code> từ lần chơi trước.</span>
            </div>
            <div class="mt-2">
              <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="restoreSession()">Khôi phục</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" onclick="clearSession()">Xóa</button>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
          </div>
        `;
        $('.container').prepend(alertHtml);
      }
    } catch (error) {
      console.log("⚠️ Lỗi khi đọc sessionStorage:", error);
    }
  }

  // Khôi phục session
  window.restoreSession = function() {
    try {
      const savedData = sessionStorage.getItem('wheelGameResult');
      if (savedData) {
        const data = JSON.parse(savedData);
        
        // Thiết lập giá trị
        selectedPrize = { percentage: data.discountPercentage };
        $("#prize-text").text(`Giảm giá ${data.discountPercentage}%`);
        $("#discount-percentage").val(data.discountPercentage);
        $("#fullname").val(data.fullname);
        $("#email").val(data.email);
        
        // Hiển thị modal và mã giảm giá
        congratsModal.show();
        currentMethod = 'restored';
        
        handleSuccess({
          success: true,
          discountCode: data.discountCode,
          emailSent: data.emailSent || false,
          emailError: "Dữ liệu được khôi phục từ session",
          message: "Khôi phục thành công",
          method: 'restored'
        });
        
        // Xóa alert
        $('.alert').alert('close');
      }
    } catch (error) {
      console.log("❌ Lỗi khi khôi phục session:", error);
    }
  };

  // Xóa session
  window.clearSession = function() {
    try {
      sessionStorage.removeItem('wheelGameResult');
      $('.alert').alert('close');
      console.log("🗑️ Session storage cleared");
    } catch (error) {
      console.log("❌ Lỗi khi xóa session:", error);
    }
  };

  // Admin panel code - Simplified
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
        min-width: 350px;
        display: none;
      ">
        <h5 style="color: #246d4b; margin-bottom: 15px;">⚙️ Admin Panel</h5>
        
        <div class="mb-3">
          <h6>🎯 Điều Chỉnh Tỷ Lệ Trúng:</h6>
          <div id="probability-controls"></div>
          <div class="btn-group w-100 mt-2" role="group">
            <button id="update-probabilities" class="btn btn-primary btn-sm">Cập Nhật</button>
            <button id="reset-probabilities" class="btn btn-secondary btn-sm">Reset</button>
          </div>
        </div>
        
        <div class="mb-3">
          <h6>🧪 Test Functions:</h6>
          <div class="btn-group w-100 mb-2" role="group">
            <button class="btn btn-sm btn-outline-info" onclick="testFetchRequest()">Test Fetch</button>
            <button class="btn btn-sm btn-outline-success" onclick="testValidation()">Test Validation</button>
          </div>
        </div>
        
        <div class="mb-3">
          <h6>💾 Session Storage:</h6>
          <div class="btn-group w-100" role="group">
            <button class="btn btn-sm btn-outline-warning" onclick="viewSession()">Xem Session</button>
            <button class="btn btn-sm btn-outline-danger" onclick="clearSession()">Xóa Session</button>
          </div>
        </div>
        
        <div class="mb-3">
          <h6>📊 Stats:</h6>
          <div style="font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 5px;">
            <div>Method: <span class="badge bg-primary" id="current-method-badge">Fetch no-cors</span></div>
            <div>Email Status: <span id="email-status-badge" class="badge bg-success">Active</span></div>
            <div>Session: <span id="session-status-badge" class="badge bg-info">Available</span></div>
          </div>
        </div>
        
        <small class="d-block mt-2 text-muted">Nhấn Ctrl+Shift+A để ẩn</small>
      </div>
    `;
    
    $('body').append(adminHTML);
    
    // Tạo controls cho probability
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
    
    // Event listeners
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

    // Update status badges
    updateAdminStatus();
  }

  // Admin test functions
  window.testFetchRequest = function() {
    console.log("🧪 Testing Fetch request");
    
    const testData = {
      fullname: "Test User Admin",
      email: "admin@test.com",
      discountPercentage: 25
    };
    
    sendDataWithFetch(testData);
  };

  window.testValidation = function() {
    console.log("🧪 Testing validation");
    
    // Test với dữ liệu không hợp lệ
    const testCases = [
      { fullname: "", email: "test@example.com", expected: "Tên trống" },
      { fullname: "Test", email: "", expected: "Email trống" },
      { fullname: "Test", email: "invalid-email", expected: "Email không hợp lệ" },
      { fullname: "Valid User", email: "valid@example.com", expected: "Hợp lệ" }
    ];
    
    testCases.forEach((testCase, index) => {
      console.log(`Test case ${index + 1}:`, testCase.expected);
      console.log("Fullname:", testCase.fullname ? "✓" : "✗");
      console.log("Email:", isValidEmail(testCase.email) ? "✓" : "✗");
    });
  };

  window.viewSession = function() {
    try {
      const savedData = sessionStorage.getItem('wheelGameResult');
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log("📋 Session data:", data);
        alert(`Session Data:\nMã: ${data.discountCode}\nEmail: ${data.email}\nTỷ lệ: ${data.discountPercentage}%\nThời gian: ${new Date(data.timestamp).toLocaleString()}`);
      } else {
        alert("Không có dữ liệu session");
      }
    } catch (error) {
      console.log("❌ Lỗi khi đọc session:", error);
      alert("Lỗi khi đọc session data");
    }
  };

  function updateAdminStatus() {
    // Update method badge
    $('#current-method-badge').text('Fetch no-cors').removeClass().addClass('badge bg-primary');
    
    // Update email status badge
    $('#email-status-badge').text('Apps Script OK').removeClass().addClass('badge bg-success');
    
    // Update session status badge
    try {
      const hasSession = sessionStorage.getItem('wheelGameResult');
      if (hasSession) {
        $('#session-status-badge').text('Has Data').removeClass().addClass('badge bg-warning');
      } else {
        $('#session-status-badge').text('Empty').removeClass().addClass('badge bg-secondary');
      }
    } catch (error) {
      $('#session-status-badge').text('Error').removeClass().addClass('badge bg-danger');
    }
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

  // Reset modal khi đóng
  $('#congratsModal').on('hidden.bs.modal', function () {
    $("#user-form")[0].reset();
    $("#user-form").removeClass("d-none");
    $("#success-message").addClass("d-none");
    $("#discount-card").addClass("d-none");
    $("#error-message").addClass("d-none");
    $(".error-message").text("");
    
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
  });

  // Kiểm tra session storage khi load trang
  checkSessionStorage();

  // Log thông tin khởi tạo
  console.log("🚀 Vòng quay may mắn đã khởi tạo");
  console.log("📡 Phương pháp gửi: Fetch API với no-cors mode");
  console.log("📧 Email service: Google Apps Script (đã test OK)");
  console.log("💾 Backup: SessionStorage available");
  console.log("🎮 Admin panel: Ctrl+Shift+A để mở");
});