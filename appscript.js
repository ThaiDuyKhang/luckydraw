// Hàm GET để trả về giao diện
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Vòng Quay May Mắn')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Gửi email người chơi
function sendDiscountEmail(email, fullname, discountCode, discountPercentage) {
  try {
    // Tạo chủ đề email
    const subject = "Mã giảm giá VPS EZ TECH của bạn từ Vòng Quay May Mắn";
    
    // Tạo nội dung HTML cho email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #38d299;">Vòng Quay May Mắn EZtech</h1>
        </div>

        <p>Xin chào <b>${fullname}</b>,</p>

        <p>Chúc mừng bạn đã quay trúng <b>mã giảm giá ${discountPercentage}%</b> từ Vòng Quay May Mắn của EZ TECH!</p>
              
        <div style="background-color: #f8f9fa; border: 1px dashed #ccc; padding: 15px; margin: 20px 0; text-align:center;color:#111">
          <p style="margin: 0; font-size: 14px;">Mã giảm giá của bạn:</p>
          <h2 style="margin: 10px 0; color: #FF5722; letter-spacing: 1px;">${discountCode}</h2>
          <p style="margin: 0; font-size: 14px;">Giảm ${discountPercentage}% cho đơn hàng của bạn</p>
        </div>

        <p>Để sử dụng mã giảm giá này, hãy nhập mã khi thanh toán trên website của EZ TECH.</p>

        <p>Cảm ơn bạn đã tham gia chương trình của EZ TECH</p>

        <p>Liên hệ</p>
        <ul>
          <li>Website: <a href="https://eztech.vn/" target="_blank">https://eztech.vn</a></li>
          <li>Địa chỉ: <a href="https://maps.app.goo.gl/SGg4RYmnArjmwZy56" target="_blank">Số 72 Đường số 6, KDC Cityland Park Hills, P.Gò Vấp. TP.HCM</a></li>
          <li>Hotline: <a href="tel:0877223579" target="_blank">0877.223.579</a></li>
          <li>Zalo: <a href="https://zalo.me/0877223579" target="_blank">0877.223.579</a></li>
          <li>Email: <a href="mailto:support@eztech.com.vn" target="_blank">support@eztech.com.vn</a></li>
          <li>Facebook: <a href="https://www.facebook.com/profile.php?id=61565699495989" target="_blank">Eztech.vn - Cloud VPS & Hosting - Server GPU</a></li>
        </ul>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #777777; text-align: center;">
          <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          <p>&copy; ${new Date().getFullYear()} eztech.vn. Tất cả các quyền được bảo lưu.</p>
        </div>
      </div>
    `;
    
    // Gửi email
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: "Eztech.vn"
    });
    
    return true;
  } catch (error) {
    console.error("Lỗi khi gửi email: " + error.message);
    return false;
  }
}

// Hàm xử lý khi có người chơi gửi form
function handleFormSubmit(formObject) {
  const name = formObject.name;
  const email = formObject.email;
  const discountLevel = spinWheel(); // Giả sử spinWheel() trả về mức giảm giá (20, 30, 40, 50)
  
  const result = processSpinResult(name, email, discountLevel);
  return result;
}

function doPost(e) {
  try {
    let data;
    
    // Xác định cách dữ liệu được gửi đến
    if (e.postData && e.postData.contents) {
      // JSON POST
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // Form submission
      data = {
        fullname: e.parameter.fullname,
        email: e.parameter.email,
        discountPercentage: e.parameter.discountPercentage || spinWheel() // Sử dụng spinWheel nếu không có discountPercentage
      };
    } else {
      throw new Error('No data received');
    }
    
    // Truy cập Google Spreadsheet
    const ss = SpreadsheetApp.openById('1lHI2kIc5l2-SECJws20RogL1Fv983CE6Fwy2Bn3GX58'); // Thay thế bằng ID Spreadsheet thực
    const dataSheet = ss.getSheetByName('DSTT'); // Sheet dữ liệu chính
    const codesSheet = ss.getSheetByName('DSM'); // Sheet mã giảm giá
    
    // Tìm mã giảm giá dựa trên phần trăm
    const codeData = codesSheet.getDataRange().getValues();
    let discountCode = null;
    
    // Bỏ qua hàng tiêu đề và tìm mã chưa sử dụng với phần trăm phù hợp
    for (let i = 1; i < codeData.length; i++) {
      // Kiểm tra nếu mức giảm trùng khớp và mã chưa được sử dụng
      if (codeData[i][0] === data.discountPercentage + "%" && !codeData[i][2]) {
        discountCode = codeData[i][1]; // Lấy mã từ cột B
        
        // Đánh dấu mã đã sử dụng
        codesSheet.getRange(i+1, 3).setValue("Đã sử dụng");
        break;
      }
    }
    
    // Nếu không tìm thấy mã, tạo mã mới
    if (!discountCode) {
      discountCode = "SALE" + data.discountPercentage + "_" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
    
    // Thêm dữ liệu người dùng vào sheet chính
    const newRow = [data.fullname, data.email, discountCode, data.discountPercentage, new Date()];
    dataSheet.appendRow(newRow);
    
    // Gửi email mã giảm giá
    const emailSent = sendDiscountEmail(data.email, data.fullname, discountCode, data.discountPercentage);
    
    // Tạo response dựa trên cách request được gửi đến
    const response = {
      success: true,
      discountCode: discountCode,
      emailSent: emailSent
    };
    
    // Xử lý JSONP callback nếu có
    if (e.parameter && e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + JSON.stringify(response) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Trả về JSON nếu không phải JSONP
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Xử lý lỗi
    const errorResponse = {
      success: false,
      error: error.message
    };
    
    // Xử lý JSONP callback nếu có
    if (e.parameter && e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + JSON.stringify(errorResponse) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Trả về JSON error nếu không phải JSONP
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Hàm để quay vòng quay may mắn và trả về kết quả
function spinWheel() {
  // Các mức giảm giá có thể (20%, 30%, 40%, 50%)
  const discountLevels = [20, 30, 40, 50];
  
  // Xác suất cho từng mức giảm (giảm dần theo mức giảm)
  const probabilities = [0.4, 0.3, 0.2, 0.1]; // Tổng xác suất = 1
  
  // Tạo mảng tích lũy xác suất
  const cumulativeProbabilities = [];
  let sum = 0;
  for (let i = 0; i < probabilities.length; i++) {
    sum += probabilities[i];
    cumulativeProbabilities.push(sum);
  }
  
  // Tạo số ngẫu nhiên từ 0 đến 1
  const randomValue = Math.random();
  
  // Xác định mức giảm giá dựa trên xác suất
  for (let i = 0; i < cumulativeProbabilities.length; i++) {
    if (randomValue <= cumulativeProbabilities[i]) {
      return discountLevels[i];
    }
  }
  
  // Mặc định trả về mức giảm thấp nhất nếu có lỗi
  return discountLevels[0];
}
