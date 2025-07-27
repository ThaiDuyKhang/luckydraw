// Hàm GET để trả về giao diện
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Vòng Quay May Mắn')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

//Hàm lấy mã giảm giá chưa sử dụng từ sheet DSM theo mức giảm
function getUnusedDiscountCode(discountLevel) {
  try {
    const dsmSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DSM");
    const dsmData = dsmSheet.getDataRange().getValues();
    
    console.log("Tổng số dòng trong DSM:", dsmData.length);
    console.log("Đang tìm mã cho mức giảm:", discountLevel);
    
    // Chuyển discountLevel thành số thập phân để so sánh (20 -> 0.2, 30 -> 0.3...)
    const targetValue = discountLevel / 100;
    console.log("Giá trị tìm kiếm (thập phân):", targetValue);
    
    // Bỏ qua hàng tiêu đề
    for (let i = 1; i < dsmData.length; i++) {
      const discountPercent = dsmData[i][0]; // Cột A
      const discountCode = dsmData[i][1];    // Cột B  
      const isUsed = dsmData[i][2];          // Cột C
      
      console.log(`Dòng ${i+1}: ${discountPercent} | ${discountCode} | ${isUsed}`);
      
      // Kiểm tra mức giảm giá khớp (so sánh số với số)
      if (discountPercent === targetValue) {
        console.log("Tìm thấy mức giảm giá khớp!");
        
        // Kiểm tra mã chưa được sử dụng (cột C trống)
        if (isUsed === "" || isUsed === null || isUsed === undefined) {
          console.log("Mã chưa được sử dụng, đánh dấu là đã sử dụng");
          
          // Đánh dấu mã đã được sử dụng
          dsmSheet.getRange(i + 1, 3).setValue("Đã sử dụng");
          
          console.log("Trả về mã:", discountCode);
          return discountCode;
        } else {
          console.log("Mã đã được sử dụng, bỏ qua");
        }
      } else {
        console.log(`Không khớp: ${discountPercent} !== ${targetValue}`);
      }
    }
    
    console.log("Không tìm thấy mã phù hợp");
    return null;
    
  } catch (error) {
    console.error("Lỗi trong getUnusedDiscountCode:", error.message);
    return null;
  }
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
        - Website: <a href="https://eztech.vn/" target="_blank">https://eztech.vn</a></li>
        - Địa chỉ: <a href="https://maps.app.goo.gl/SGg4RYmnArjmwZy56" target="_blank">Số 72 Đường số 6, KDC Cityland Park Hills, P.Gò Vấp. TP.HCM</a></li>
        - Hotline: <a href="tel:0877223579" target="_blank">0877.223.579</a></li>
        - Zalo: <a href="https://zalo.me/0877223579" target="_blank">0877.223.579</a></li>
        - Email: <a href="mailto:support@eztech.com.vn" target="_blank">support@eztech.com.vn</a></li>
        - Facebook: <a href="https://www.facebook.com/profile.php?id=61565699495989" target="_blank">Eztech.vn - Cloud VPS & Hosting - Server GPU</a></li>

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

function doPost(e) {
  try {
    let data;
    
    console.log("Received POST request");
    console.log("e.parameter:", e.parameter);
    console.log("e.postData:", e.postData);
    
    // Xác định cách dữ liệu được gửi đến
    if (e.postData && e.postData.contents) {
      // JSON POST
      console.log("Processing JSON data");
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      // Form submission (FormData)
      console.log("Processing Form data");
      data = {
        fullname: e.parameter.fullname,
        email: e.parameter.email,
        discountPercentage: parseInt(e.parameter.discountPercentage) || spinWheel()
      };
    } else {
      throw new Error('No data received');
    }
    
    // Truy cập Google Spreadsheet
    const ss = SpreadsheetApp.openById('1lHI2kIc5l2-SECJws20RogL1Fv983CE6Fwy2Bn3GX58');
    const dataSheet = ss.getSheetByName('DSTT'); // Sheet dữ liệu chính
    const codesSheet = ss.getSheetByName('DSM'); // Sheet mã giảm giá
    
    // Sử dụng hàm getUnusedDiscountCode để lấy mã
    let discountCode = getUnusedDiscountCode(data.discountPercentage);
    
    // Nếu không tìm thấy mã có sẵn, tạo mã mới
    if (!discountCode) {
      discountCode = "SALE" + data.discountPercentage + "_" + Math.random().toString(36).substring(2, 10).toUpperCase();
      console.log("Không còn mã có sẵn, đã tạo mã mới: " + discountCode);
    } else {
      console.log("Đã sử dụng mã có sẵn: " + discountCode);
    }
    
    // Thêm dữ liệu người dùng vào sheet chính
    const newRow = [data.fullname, data.email, discountCode, data.discountPercentage, new Date()];
    dataSheet.appendRow(newRow);
    
    // Gửi email mã giảm giá
    const emailSent = sendDiscountEmail(data.email, data.fullname, discountCode, data.discountPercentage);
    
    // Tạo response
    const response = {
      success: true,
      discountCode: discountCode,
      emailSent: emailSent,
      message: discountCode.startsWith("SALE") ? "Đã tạo mã mới" : "Đã sử dụng mã có sẵn"
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
    console.error("Lỗi trong doPost: " + error.message);
    
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

// Hàm debug để kiểm tra dữ liệu trong sheet DSM
function debugDSMSheet() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DSM");
    const data = sheet.getDataRange().getValues();
    
    console.log("=== DEBUG SHEET DSM ===");
    console.log("Tổng số dòng:", data.length);
    console.log("Tổng số cột:", data[0] ? data[0].length : 0);
    
    for (let i = 0; i < Math.min(10, data.length); i++) {
      console.log(`Row ${i+1}: [${data[i][0]}] [${data[i][1]}] [${data[i][2]}]`);
      console.log(`Types: [${typeof data[i][0]}] [${typeof data[i][1]}] [${typeof data[i][2]}]`);
      console.log(`Values: A="${data[i][0]}" B="${data[i][1]}" C="${data[i][2]}"`);
      console.log("---");
    }
  } catch (error) {
    console.error("Lỗi khi debug sheet:", error.message);
  }
}

// Hàm test để kiểm tra việc lấy mã giảm giá
function testGetDiscountCode() {
  console.log("=== TEST LẤY MÃ GIẢM GIÁ ===");
  
  const result20 = getUnusedDiscountCode(20);
  const result30 = getUnusedDiscountCode(30);
  const result40 = getUnusedDiscountCode(40);
  const result50 = getUnusedDiscountCode(50);
  
  console.log("Mã 20%: " + result20);
  console.log("Mã 30%: " + result30);
  console.log("Mã 40%: " + result40);
  console.log("Mã 50%: " + result50);
}

// Hàm test tổng hợp
function runAllTests() {
  console.log("BẮT ĐẦU TEST TỔNG HỢP");
  debugDSMSheet();
  console.log("\n");
  testGetDiscountCode();
  console.log("KẾT THÚC TEST");
}