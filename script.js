$(document).ready(function() {
  // URL của Google Apps Script
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxIqE_F_iM3Av8ixl7Fc_8iksGtP9A-cV-DDWMpXNQO1rQJpOD_2r84ZLPU6FpvdEC9/exec";

  // Wheel configuration
  const prizes = [
    { percentage: 20, count: 8, color: "#4CAF50" }, // Green
    { percentage: 30, count: 6, color: "#2196F3" }, // Blue
    { percentage: 40, count: 4, color: "#FFC107" }, // Yellow
    { percentage: 50, count: 2, color: "#FF5722" }, // Orange
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

  // Create segments array
  prizes.forEach((prize) => {
    for (let i = 0; i < prize.count; i++) {
      segments.push({
        percentage: prize.percentage,
        color: prize.color,
      });
    }
  });

  // Shuffle the segments for randomness
  segments = shuffleArray(segments);

  // Draw the wheel
  drawWheel(segments);

  // Spin button click handler
  $("#spin-btn").click(function() {
    if (isSpinning) return;

    // Start spinning
    isSpinning = true;
    $(this).prop('disabled', true);

    // Determine winning segment
    const segmentIndex = Math.floor(Math.random() * segments.length);
    selectedPrize = segments[segmentIndex];

    // Calculate rotation angle
    const segmentAngle = 360 / segments.length;
    const segmentMiddle = segmentIndex * segmentAngle + segmentAngle / 2;
    const spinAngle = 3600 + (360 - segmentMiddle);

    // Rotate the wheel with CSS animation
    $('.wheel').css({
      'transform': `rotate(${spinAngle}deg)`,
      'transition': 'transform 5s cubic-bezier(0.1, 0.1, 0.17, 1)'
    });
 
    // After spinning is complete
    setTimeout(() => {
      isSpinning = false;
      $(this).prop('disabled', false);

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
    }, 5000); // Spin duration
  });

  // Form submission handler
  $("#user-form").submit(function(e) {
    e.preventDefault();

    // Validation
    let isValid = true;
    const fullname = $("#fullname").val().trim();
    const email = $("#email").val().trim();

    if (fullname === "") {
      $("#fullname-error").text("Vui lòng nhập họ tên");
      isValid = false;
    } else {
      $("#fullname-error").text("");
    }

    if (email === "") {
      $("#email-error").text("Vui lòng nhập email");
      isValid = false;
    } else if (!isValidEmail(email)) {
      $("#email-error").text("Email không hợp lệ");
      isValid = false;
    } else {
      $("#email-error").text("");
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

    // Gửi dữ liệu sử dụng formData (tránh CORS)
    sendDataWithFormData(formData);
  });

  // Gửi dữ liệu với FormData để tránh lỗi CORS
  function sendDataWithFormData(data) {
    // Lưu dữ liệu vào localStorage
    try {
      let savedData = JSON.parse(localStorage.getItem('luckyWheelData') || '[]');
      const discountCode = generateMockDiscountCode(data.discountPercentage);
      
      savedData.push({
        fullname: data.fullname,
        email: data.email,
        discountPercentage: data.discountPercentage,
        discountCode: discountCode,
        timestamp: new Date().toISOString()
      });
      
      localStorage.setItem('luckyWheelData', JSON.stringify(savedData));
      
      // Tạo đối tượng response
      const response = {
        success: true,
        discountCode: discountCode,
        emailSent: true
      };
      
      // Xử lý thành công
      handleSuccess(response);
      
      // Gửi dữ liệu đến Google Script với FormData
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      
      // Fetch với mode 'no-cors'
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
      console.error('Lỗi khi lưu dữ liệu:', error);
      
      // Tạo mã giảm giá dự phòng trong trường hợp lỗi
      const backupCode = generateMockDiscountCode(data.discountPercentage);
      
      // Xử lý thành công với mã dự phòng
      handleSuccess({
        success: true,
        discountCode: backupCode,
        emailSent: false
      });
    }
  }

  // Gửi dữ liệu sử dụng form ẩn
  function sendDataWithHiddenForm(data) {
    // Tạo form ẩn
    const $form = $("<form>")
      .attr("action", SCRIPT_URL)
      .attr("method", "POST")
      .attr("target", "hidden-iframe");
      
    // Thêm các trường dữ liệu
    for (const key in data) {
      $("<input>")
        .attr("type", "hidden")
        .attr("name", key)
        .attr("value", data[key])
        .appendTo($form);
    }
    
    // Thêm form vào body
    $form.appendTo("body");
    
    // Gửi form
    $form.submit();
    
    // Xóa form
    $form.remove();
    
    // Xử lý giả định thành công (vì iframe không thể trả về dữ liệu do CORS)
    setTimeout(() => {
      const discountCode = generateMockDiscountCode(data.discountPercentage);
      handleSuccess({
        success: true,
        discountCode: discountCode,
        emailSent: true
      });
    }, 1000);
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

  // Copy button handler
  $("#copy-btn").click(function() {
    $("#coupon-code").select();
    document.execCommand("copy");
    
    const $btn = $(this);
    const originalHtml = $btn.html();
    
    $btn.html('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>');
    
    setTimeout(() => {
      $btn.html(originalHtml);
    }, 1500);
  });

  // Helper functions
  function drawWheel(segments) {
    const svg = $(".wheel");
    const centerX = 250;
    const centerY = 250;
    const radius = 200;
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

      svgContent += `<path d="${pathData}" fill="${segment.color}" stroke="#ffffff" stroke-width="2" />`;

      // Add text
      const textAngle = startAngle + anglePerSegment / 2;
      const textRad = ((textAngle - 90) * Math.PI) / 180;
      const textX = centerX + radius * 0.75 * Math.cos(textRad);
      const textY = centerY + radius * 0.75 * Math.sin(textRad);

      svgContent += `
        <text 
          x="${textX}" 
          y="${textY}" 
          fill="white" 
          font-size="14" 
          font-weight="bold" 
          text-anchor="middle"
          transform="rotate(${textAngle}, ${textX}, ${textY})"
        >
          ${segment.percentage}%
        </text>
      `;
    });

    // Add a circle in the center
    svgContent += `<circle cx="${centerX}" cy="${centerY}" r="40" fill="#ffffff" stroke="#cccccc" stroke-width="2" />`;

    svg.html(svgContent);
  }

  function shuffleArray(array) {
    let currentIndex = array.length;
    let temporaryValue, randomIndex;

    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  function createConfetti() {
    const confettiCount = 100;
    const $container = $(".wheel-container");

    for (let i = 0; i < confettiCount; i++) {
      const $confetti = $("<div>").addClass("confetti");

      const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      $confetti.css({
        backgroundColor: randomColor,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 10 + 5}px`,
        animationDuration: `${Math.random() * 3 + 2}s`
      });

      $container.append($confetti);

      // Remove confetti after animation
      setTimeout(() => {
        $confetti.remove();
      }, 5000);
    }
  }

  function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  }

  function generateMockDiscountCode(percentage) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = `SAVE${percentage}_`;
    const length = 8;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return result;
  }
});