$(document).ready(function() {
  // URL của Google Apps Script
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxIqE_F_iM3Av8ixl7Fc_8iksGtP9A-cV-DDWMpXNQO1rQJpOD_2r84ZLPU6FpvdEC9/exec";

const prizeZones = [
    // Thứ tự này có thể cần điều chỉnh theo thiết kế thực tế của bạn
    { percentage: 20, startAngle: 0, endAngle: 30, position: "12-1h", color: "vang" },
    { percentage: 50, startAngle: 30, endAngle: 60, position: "1-2h", color: "xanh" },
    { percentage: 40, startAngle: 60, endAngle: 90, position: "2-3h", color: "vang" },
    { percentage: 20, startAngle: 90, endAngle: 120, position: "3-4h", color: "xanh" },
    { percentage: 30, startAngle: 120, endAngle: 150, position: "4-5h", color: "vang" },
    { percentage: 20, startAngle: 150, endAngle: 180, position: "5-6h", color: "xanh" },
    { percentage: 20, startAngle: 180, endAngle: 210, position: "6-7h", color: "vang" },
    { percentage: 30, startAngle: 210, endAngle: 240, position: "7-8h", color: "xanh" },
    { percentage: 40, startAngle: 240, endAngle: 270, position: "8-9h", color: "vang" },
    { percentage: 30, startAngle: 270, endAngle: 300, position: "9-10h", color: "xanh" },
    { percentage: 50, startAngle: 300, endAngle: 330, position: "10-11h", color: "vang" },
    { percentage: 40, startAngle: 330, endAngle: 360, position: "11-12h", color: "xanh" }
  ];

  let selectedPrize = null;
  let isSpinning = false;
  let currentRotation = 0;

  // Tạo modal bootstrap
  const congratsModal = new bootstrap.Modal($("#congratsModal")[0], {
    backdrop: 'static',
    keyboard: false
  });

  // Khởi tạo vòng quay với thiết kế EZ TECH
  initEZTechWheel();

  function initEZTechWheel() {
    // Gán sự kiện click cho nút quay mới
    $('#ez-spin-btn').click(handleSpin);
  }
 // DEBUG: Hàm test góc
  window.testAngle = function(testAngle) {
    const result = calculatePrizeFromAngle(testAngle);
    updateDebugInfo({
      expected: `Test ${testAngle}°`,
      finalAngle: testAngle,
      result: result
    });
  };

  // Hàm tính toán giải thưởng từ góc (CẦN ĐIỀU CHỈNH)
  function calculatePrizeFromAngle(finalAngle) {
    const normalizedAngle = ((finalAngle % 360) + 360) % 360;
    
    // THỬ CÁC CÁCH TÍNH KHÁC NHAU:
    
    // Cách 1: Kim chỉ cố định ở 0°, vòng quay ngược chiều kim đồng hồ
    let pointerAngle1 = normalizedAngle;
    
    // Cách 2: Kim chỉ cố định ở 0°, vòng quay theo chiều kim đồng hồ  
    let pointerAngle2 = (360 - normalizedAngle) % 360;
    
    // Cách 3: Điều chỉnh thêm offset
    let pointerAngle3 = (normalizedAngle + 90) % 360;
    let pointerAngle4 = (360 - normalizedAngle + 90) % 360;

    console.log('=== ANGLE DEBUG ===');
    console.log('Final Angle:', finalAngle);
    console.log('Normalized:', normalizedAngle);
    console.log('Method 1 (direct):', pointerAngle1);
    console.log('Method 2 (reverse):', pointerAngle2);
    console.log('Method 3 (+90):', pointerAngle3);
    console.log('Method 4 (reverse+90):', pointerAngle4);

    // Thử từng cách và tìm vùng phù hợp
    const methods = [
      { name: 'Direct', angle: pointerAngle1 },
      { name: 'Reverse', angle: pointerAngle2 },
      { name: 'Direct+90', angle: pointerAngle3 },
      { name: 'Reverse+90', angle: pointerAngle4 }
    ];

    let foundZone = null;
    let usedMethod = '';

    // Thử method 2 trước (thường đúng nhất)
    for (let zone of prizeZones) {
      if (pointerAngle2 >= zone.startAngle && pointerAngle2 < zone.endAngle) {
        foundZone = zone;
        usedMethod = 'Reverse';
        break;
      }
    }

    // Nếu không tìm thấy, thử các method khác
    if (!foundZone) {
      for (let method of methods) {
        for (let zone of prizeZones) {
          if (method.angle >= zone.startAngle && method.angle < zone.endAngle) {
            foundZone = zone;
            usedMethod = method.name;
            break;
          }
        }
        if (foundZone) break;
      }
    }

    // Fallback
    if (!foundZone) {
      foundZone = prizeZones[0];
      usedMethod = 'Fallback';
    }

    console.log(`Found zone: ${foundZone.percentage}% (${foundZone.position}) using ${usedMethod}`);

    return {
      ...foundZone,
      debugInfo: {
        finalAngle,
        normalizedAngle,
        pointerAngle: usedMethod === 'Reverse' ? pointerAngle2 : pointerAngle1,
        method: usedMethod
      }
    };
  }

  // Cập nhật thông tin debug
  function updateDebugInfo(data) {
    $('#debug-expected').text(`Expected: ${data.expected}`);
    $('#debug-angle').text(`Final Angle: ${data.finalAngle?.toFixed(2)}°`);
    $('#debug-normalized').text(`Normalized: ${data.result?.debugInfo?.normalizedAngle?.toFixed(2)}°`);
    $('#debug-pointer').text(`Pointer Angle: ${data.result?.debugInfo?.pointerAngle?.toFixed(2)}°`);
    $('#debug-result').text(`Result: ${data.result?.percentage}% (${data.result?.position})`);
    
    const isMatch = data.expected.includes(data.result?.percentage + '%');
    $('#debug-match').text(`Match: ${isMatch ? '✅ CORRECT' : '❌ WRONG'}`);
    $('#debug-match').css('color', isMatch ? 'green' : 'red');
  }

  function generateSpinAngle(targetPrize) {
    const matchingZones = prizeZones.filter(zone => zone.percentage === targetPrize.percentage);
    const selectedZone = matchingZones[Math.floor(Math.random() * matchingZones.length)];
    
    const randomAngleInZone = selectedZone.startAngle + 
      Math.random() * (selectedZone.endAngle - selectedZone.startAngle);
    
    const spins = 8 + Math.random() * 4;
    // THỬ CÁCH TÍNH KHÁC: thay vì (360 - randomAngleInZone) 
    const finalAngle = spins * 360 + randomAngleInZone; // Thử không đảo ngược

    console.log(`Target: ${targetPrize.percentage}%, Zone: ${selectedZone.position}, Random: ${randomAngleInZone.toFixed(2)}°, Final: ${finalAngle.toFixed(2)}°`);
    
    return finalAngle;
  }

  function handleSpin() {
    if (isSpinning) return;

    isSpinning = true;
    $('#ez-spin-btn').css('pointer-events', 'none');

    const randomPrize = getRandomPrize();
    selectedPrize = randomPrize;

    const spinAngle = generateSpinAngle(randomPrize);
    currentRotation += spinAngle;

    $('.custom-wheel').css({
      'transform': `rotate(${currentRotation}deg)`,
      'transition': 'transform 5s cubic-bezier(0.1, 0.1, 0.17, 1)'
    });

    // Update debug info
    updateDebugInfo({
      expected: `${selectedPrize.percentage}%`,
      finalAngle: currentRotation,
      result: { percentage: '...', position: 'Spinning...' }
    });

    setTimeout(() => {
      isSpinning = false;
      $('#ez-spin-btn').css('pointer-events', 'auto');

      const finalResult = calculatePrizeFromAngle(currentRotation);
      
      // Update debug với kết quả cuối
      updateDebugInfo({
        expected: `${selectedPrize.percentage}%`,
        finalAngle: currentRotation,
        result: finalResult
      });

      showResult();
    }, 5000);
  }

  function getRandomPrize() {
    const prizes = [
      { percentage: 20, weight: 40 },
      { percentage: 30, weight: 30 },
      { percentage: 40, weight: 20 },
      { percentage: 50, weight: 10 }
    ];

    const totalWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let random = Math.random() * totalWeight;

    for (let prize of prizes) {
      random -= prize.weight;
      if (random <= 0) {
        return { percentage: prize.percentage };
      }
    }

    return { percentage: 20 };
  }

  function showResult() {
    $("#prize-text").text(`Giảm giá ${selectedPrize.percentage}%`);
    $("#discount-percentage").val(selectedPrize.percentage);
    
    $("#congratsModal").addClass('modal-zoom-in');
    // congratsModal.show();
    createConfetti();

    setTimeout(() => {
      $("#congratsModal").removeClass('modal-zoom-in');
    }, 600);
  }

  // Các hàm khác giữ nguyên
  $("#user-form").submit(function(e) {
    e.preventDefault();

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

    $("#submit-btn").prop('disabled', true);
    $("#loading-spinner").removeClass("d-none");
    $("#submit-text").addClass("d-none");

    const formData = {
      fullname: fullname,
      email: email,
      discountPercentage: selectedPrize.percentage
    };

    sendDataWithFormData(formData);
  });

  function sendDataWithFormData(data) {
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
      
      const response = {
        success: true,
        discountCode: discountCode,
        emailSent: true
      };
      
      handleSuccess(response);
      
      const formData = new FormData();
      for (const key in data) {
        formData.append(key, data[key]);
      }
      
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData
      });
      
    } catch (error) {
      const backupCode = generateMockDiscountCode(data.discountPercentage);
      handleSuccess({
        success: true,
        discountCode: backupCode,
        emailSent: false
      });
    }
  }

  function handleSuccess(response) {
    $("#submit-btn").prop('disabled', false);
    $("#loading-spinner").addClass("d-none");
    $("#submit-text").removeClass("d-none");
    
    $("#success-message").removeClass("d-none");
    $("#user-form").addClass("d-none");
    
    $("#discount-card").removeClass("d-none");
    $("#coupon-code").val(response.discountCode);
    $("#discount-info").text(`Mã giảm ${selectedPrize.percentage}% có thể sử dụng cho đơn hàng tiếp theo của bạn.`);
    
    setTimeout(() => {
      if (response.emailSent) {
        $("#email-status").html('<span class="text-success">✓ Mã giảm giá đã được gửi đến email của bạn!</span>');
      } else {
        $("#email-status").html('<span class="text-warning">⚠ Không thể gửi email. Vui lòng lưu lại mã giảm giá.</span>');
      }
    }, 2000);
  }

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

  function createConfetti() {
    const confettiCount = 100;
    const $container = $(".ez-wheel-wrapper");

    for (let i = 0; i < confettiCount; i++) {
      const $confetti = $("<div>").addClass("confetti");
      const colors = ["#FFD700", "#2E7D32", "#4CAF50", "#FFD54F"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      $confetti.css({
        backgroundColor: randomColor,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 10 + 5}px`,
        height: `${Math.random() * 10 + 5}px`,
        animationDuration: `${Math.random() * 3 + 2}s`
      });

      $container.append($confetti);

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
    let result = `EZTECH${percentage}_`;
    const length = 6;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }
});