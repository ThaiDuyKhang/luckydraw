$(document).ready(function() {
  // URL của Google Apps Script
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFy0SIHPSaD7gaAY1zMmSfZuLOVg1mIB8mvp40CaPdeZeuJB39h7AG1pw6OsTqASJW/exec"; //LuckyDraw11
  const prizes = [
    { percentage: 20, count: 6, probability: 0.5 },   // 50% xác suất trúng 20%
    { percentage: 30, count: 5, probability: 0.3 },   // 30% xác suất trúng 30%
    { percentage: 40, count: 3, probability: 0.15 },  // 15% xác suất trúng 40%
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

  // Initialize wheel
  initializeWheel();

  // Spin button click handler
  $("#ez-spin-btn").click(function() {
    if (isSpinning) return;
    performSpin();
  });

  // Form submission handler
  $("#user-form").submit(function(e) {
    e.preventDefault();
    handleFormSubmission();
  });

  // Reset modal khi đóng
  $('#congratsModal').on('hidden.bs.modal', function() {
    resetModal();
  });

  // ==================== CORE FUNCTIONS ====================

  function initializeWheel() {
    // Calculate total segments
    prizes.forEach((prize) => {
      totalSegments += prize.count;
    });

    // Create segments array
    prizes.forEach((prize) => {
      for (let i = 0; i < prize.count; i++) {
        segments.push({
          percentage: prize.percentage,
          color: null
        });
      }
    });

    // Shuffle và gán màu
    segments = shuffleArray(segments);
    segments.forEach((segment, index) => {
      if (segment.percentage === 50) {
        segment.color = "#ffeab9";
      } else {
        segment.color = index % 2 === 0 ? "#f3ffe1" : "#246d4b";
      }
    });

    // Draw the wheel
    drawWheel(segments);
  }

  function performSpin() {
    // Start spinning
    isSpinning = true;
    $("#ez-spin-btn").css('pointer-events', 'none');
    $(".spin-button-wrapper").addClass('spinning');

    // Determine winning segment
    selectedPrize = getRandomPrizeByProbability();
    
    // Calculate rotation
    const winningSegments = segments.filter(seg => seg.percentage === selectedPrize.percentage);
    const randomWinningSegment = Math.floor(Math.random() * winningSegments.length);
    const segmentIndex = segments.findIndex(seg => 
      seg.percentage === selectedPrize.percentage && 
      segments.filter(s => s.percentage === selectedPrize.percentage).indexOf(seg) === randomWinningSegment
    );

    const segmentAngle = 360 / segments.length;
    const segmentMiddle = segmentIndex * segmentAngle + segmentAngle / 2;
    const extraSpins = 3;
    const spinAngle = extraSpins * 360 + (360 - segmentMiddle);

    // Animate wheel
    $('.custom-wheel').css({
      'transform': `rotate(${spinAngle}deg)`,
      'transition': 'transform 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });

    // Show result after animation
    setTimeout(() => {
      isSpinning = false;
      $("#ez-spin-btn").css('pointer-events', 'auto');
      $(".spin-button-wrapper").removeClass('spinning');

      showSpinResult();
    }, 4000);
  }

  function showSpinResult() {
    $("#prize-text").text(`Giảm giá ${selectedPrize.percentage}%`);
    $("#discount-percentage").val(selectedPrize.percentage);
    
    $("#congratsModal").addClass('modal-zoom-in');
    congratsModal.show();
    createConfetti();

    setTimeout(() => {
      $("#congratsModal").removeClass('modal-zoom-in');
    }, 600);
  }

  function handleFormSubmission() {
    // Validation
    const fullname = $("#fullname").val().trim();
    const email = $("#email").val().trim();
    let isValid = true;

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
    setLoadingState(true);

    const formData = {
      fullname: fullname,
      email: email,
      discountPercentage: selectedPrize.percentage
    };

    // Send data
    sendDataToServer(formData);
  }

  function sendDataToServer(data) {
    const formData = new FormData();
    formData.append('fullname', data.fullname);
    formData.append('email', data.email);
    formData.append('discountPercentage', data.discountPercentage);
    formData.append('timestamp', new Date().toISOString());

    fetch(SCRIPT_URL, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      // Generate unique discount code (chỉ để gửi lên server, không hiển thị)
      const timestamp = Date.now().toString(36).toUpperCase();
      const discountCode = `WEB${data.discountPercentage}_${timestamp}`;
      
      handleSuccess({
        success: true,
        discountCode: discountCode,
        emailSent: true,
        message: "Dữ liệu đã được gửi thành công"
      });
    })
    .catch(error => {
      handleFallback(data);
    });
  }

  function handleSuccess(response) {
    setLoadingState(false);
    
    $("#success-message").removeClass("d-none");
    $("#user-form").addClass("d-none");
    
    // Chỉ hiển thị trạng thái email, không hiển thị mã giảm giá
    updateEmailStatus(response.emailSent);
  }

  function handleFallback(data) {
    const tempCode = generateTempDiscountCode(data.discountPercentage);
    
    handleSuccess({
      success: true,
      discountCode: tempCode,
      emailSent: false,
      message: "Mã tạm thời (offline)"
    });
  }

  function updateEmailStatus(emailSent) {
    setTimeout(() => {
      if (emailSent) {
        $("#email-status").html(`
          <div class="d-flex flex-column align-items-center justify-content-center text-success">
            <div id="success-lottie" style="width: 75px; height: 75px; margin-bottom: 15px;"></div>
            <span class="text-center">🎉 Chúc mừng! <strong>Mã giảm giá ${selectedPrize.percentage}%</strong> đã được gửi đến email của bạn<br>
            <small>Vui lòng kiểm tra hộp thư (inbox/spam/junk)</small></span>
          </div>
        `);

        // Load Lottie success animation
        if (typeof lottie !== 'undefined') {
          lottie.loadAnimation({
            container: document.getElementById('success-lottie'),
            renderer: 'svg',
            loop: false,
            autoplay: true,
            path: './images/success.json'
          });
        } else {
          // Fallback: CSS success icon
          $("#success-lottie").html(`
            <svg xmlns="http://www.w3.org/2000/svg" width="75" height="75" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16" style="color: #28a745;">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.061L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          `);
        }
      } else {
        $("#email-status").html(`
          <div class="d-flex flex-column align-items-center justify-content-center text-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" class="bi bi-exclamation-triangle-fill mb-3" viewBox="0 0 16 16" style="color: #ffc107;">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <span class="text-center"><strong>⚠️ Không thể gửi email tự động</strong><br>
            <small>Vui lòng liên hệ bộ phận hỗ trợ để nhận mã giảm giá ${selectedPrize.percentage}%:<br>
            📞 Hotline: <a href="tel:0877223579">0877.223.579</a><br>
            📧 Email: <a href="mailto:support@eztech.com.vn">support@eztech.com.vn</a></small></span>
          </div>
        `);
      }
    }, 1000);
  }

  function setLoadingState(loading) {
    $("#submit-btn").prop('disabled', loading);
    if (loading) {
      $("#loading-spinner").removeClass("d-none");
      $("#submit-text").addClass("d-none");
      $("#success-message, #error-message").addClass("d-none");
    } else {
      $("#loading-spinner").addClass("d-none");
      $("#submit-text").removeClass("d-none");
    }
  }

  function resetModal() {
    $("#user-form")[0].reset();
    $("#user-form").removeClass("d-none");
    $("#success-message").addClass("d-none");
    $("#error-message").addClass("d-none");
    $(".error-message").text("");
    setLoadingState(false);
  }

  // ==================== UTILITY FUNCTIONS ====================

  function drawWheel(segments) {
    const svg = $(".wheel");
    const centerX = 250;
    const centerY = 250;
    const radius = 240;
    const anglePerSegment = 360 / segments.length;

    let svgContent = "";

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
      
      let textColor = (segment.color === "#f3ffe1" || segment.color === "#ffeab9") ? "#246d4b" : "#ffffff";

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

  function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  function createConfetti() {
    // Tạo container cho Lottie animation
    const lottieContainer = $(`
      <div id="lottie-confetti" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
      "></div>
    `);
    
    $('body').append(lottieContainer);

    // Load và play Lottie animation
    if (typeof lottie !== 'undefined') {
      const animation = lottie.loadAnimation({
        container: document.getElementById('lottie-confetti'),
        renderer: 'svg',
        loop: false,
        autoplay: true,
        path: './images/confetti.json'
      });

      // Xóa animation sau khi hoàn thành
      animation.addEventListener('complete', function() {
        setTimeout(() => {
          lottieContainer.remove();
        }, 500);
      });

      // Fallback: Xóa sau 5 giây trong trường hợp animation không complete
      setTimeout(() => {
        if (document.getElementById('lottie-confetti')) {
          lottieContainer.remove();
        }
      }, 5000);

    } else {
      // Fallback: CSS confetti nếu Lottie không load được
      console.log('Lottie not loaded, using CSS fallback');
      createCSSConfetti();
      lottieContainer.remove();
    }
  }

  function createCSSConfetti() {
    // Fallback CSS confetti (simplified version)
    const confettiCount = 50;
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#f0932b", "#eb4d4b", "#6c5ce7"];
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = $("<div>").css({
        position: 'fixed',
        left: Math.random() * window.innerWidth + 'px',
        top: '-10px',
        width: Math.random() * 8 + 4 + 'px',
        height: Math.random() * 8 + 4 + 'px',
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        zIndex: 9999,
        borderRadius: '2px',
        animation: `confettiFall ${Math.random() * 3 + 2}s ease-in-out ${Math.random() * 3}s forwards`
      });

      $('body').append(confetti);

      setTimeout(() => {
        confetti.remove();
      }, 6000);
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function generateTempDiscountCode(percentage) {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TEMP${percentage}_${timestamp}`;
  }
});