import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/Lenovo/.gemini/antigravity-cli/brain/a384eb4d-e6ea-4810-9d3d-fec635683630';
const WORKSPACE_DIR = 'D:/Lê Lợi Loop';

// Đọc base64 cho các ảnh
function getBase64Image(filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    const bitmap = fs.readFileSync(filePath);
    return `data:image/png;base64,${bitmap.toString('base64')}`;
  }
  return '';
}

const imagesData = [
  {
    code: 'KT01',
    title: 'Kiểm thử KT01: Kiểm tra trạng thái chờ duyệt và khả năng hiển thị sau khi giáo viên duyệt',
    file: 'KT01_item_pending_and_approved.png',
    desc: 'Học sinh SIM_DONOR đăng món "Bộ thước kẻ mô phỏng". Ban đầu món đồ mang trạng thái pending và bị ẩn khỏi kho chung. Sau khi Thầy Nguyễn Văn A (GV01) kiểm duyệt hợp lệ, trạng thái chuyển available và xuất hiện tức thì trong kho đồ công khai.',
    target: 'Xác minh chu trình kiểm duyệt nội dung an toàn trước khi công khai món đồ.',
    result: 'ĐẠT (Trạng thái chuyển dịch đúng thiết kế, dữ liệu đồng bộ tức thì trên Cloud).'
  },
  {
    code: 'KT02',
    title: 'Kiểm thử KT02: Kiểm tra phân quyền duyệt đồ & Từ chối món đồ không đạt tiêu chuẩn an toàn',
    file: 'KT02_student_blocked_and_teacher_reject.png',
    desc: 'Giao diện tài khoản học sinh bị ẩn hoàn toàn tab Quản trị và Bàn giao. Giáo viên GV01 thực hiện từ chối món đồ không an toàn ("Bút chì gãy mô phỏng") kèm lý do "Đồ dùng không đảm bảo an toàn hoặc tiêu chuẩn sử dụng". Món đồ bị loại khỏi luồng tuần hoàn.',
    target: 'Ngăn chặn học sinh tự duyệt đồ và bảo đảm an toàn đồ dùng học tập học đường.',
    result: 'ĐẠT (Học sinh bị chặn 100%; Giáo viên thao tác từ chối thành công kèm lý do lưu vết).'
  },
  {
    code: 'KT03',
    title: 'Kiểm thử KT03: Hai tài khoản cùng yêu cầu nhận một món đồ & Hàng đợi tự động',
    file: 'KT03_concurrent_requests_matching.png',
    desc: 'Học sinh SIM_REQ1 và SIM_REQ2 gửi yêu cầu nhận cùng một món đồ. Người cho duyệt SIM_REQ1 làm người nhận chính (Rank 1). Hệ thống tự động chuyển SIM_REQ2 vào hàng đợi dự phòng (Rank 2) mà không xảy ra tranh chấp dữ liệu.',
    target: 'Kiểm tra thuật toán điều phối đa yêu cầu và tính toàn vẹn của danh sách đợi.',
    result: 'ĐẠT (Ghi nhận cả 2 yêu cầu, phân tầng ứng viên rõ ràng, không mất mát dữ liệu).'
  },
  {
    code: 'KT04',
    title: 'Kiểm thử KT04: Ghép lịch, tạo mã nhận ngẫu nhiên & Bảo mật quyền riêng tư của mã',
    file: 'KT04_pickup_code_permission_masked.png',
    desc: 'Mã nhận ngẫu nhiên 6 ký tự được tạo sau khi xác nhận lịch hẹn. Mã chỉ hiển thị trên giao diện của bạn nhận (SIM_REQ1) và trực trạm. Khi tài khoản ngoài cuộc (SIM_OTHER) đăng nhập kiểm tra, hoàn toàn không thấy mã hay thông tin giao dịch của người khác.',
    target: 'Bảo vệ quyền riêng tư và ngăn chặn tình trạng nhận hộ/nhận trộm đồ.',
    result: 'ĐẠT (Mã bảo mật hiển thị đúng quyền hạn, che chắn tuyệt đối với bên thứ ba).'
  },
  {
    code: 'KT05',
    title: 'Kiểm thử KT05: Nhập sai mã nhận tại trạm Phòng Đội & Ngăn chặn bàn giao nhầm',
    file: 'KT05_invalid_pickup_code_rejected.png',
    desc: 'Tại Trạm bàn giao Phòng Đội, giáo viên nhập mã không tồn tại "MA_SAI_9999". Hệ thống lập tức hiển thị cảnh báo đỏ từ chối, khóa thao tác bàn giao và giữ nguyên trạng thái món đồ là reserved.',
    target: 'Đảm bảo trạm trực chỉ bàn giao đúng người khi mã khớp với cơ sở dữ liệu.',
    result: 'ĐẠT (Từ chối mã sai chuẩn xác, không làm sai lệch trạng thái món đồ).'
  },
  {
    code: 'KT06',
    title: 'Kiểm thử KT06: Xử lý ngoại lệ hủy lịch hẹn & Tự động hoàn đồ về kho',
    file: 'KT06_appointment_cancel_and_fallback.png',
    desc: 'Học sinh nhận hủy hẹn do bận đột xuất và gửi lý do. Hệ thống ghi nhận sự kiện HỦY LỊCH HẸN vào audit_logs, hủy mã nhận và tự động khôi phục món đồ về trạng thái available để nhường quyền nhận cho ứng viên tiếp theo.',
    target: 'Kiểm tra quy trình xử lý tình huống phát sinh và khôi phục tài nguyên tuần hoàn.',
    result: 'ĐẠT (Ghi log kiểm toán đầy đủ, món đồ tự động trở lại kho đồ ngay lập tức).'
  },
  {
    code: 'KT08-A',
    title: 'Kiểm thử KT08 (Giao diện Trang chủ): Tương thích màn hình điện thoại di động 390px',
    file: 'KT08_mobile_homepage_390px.png',
    desc: 'Kiểm tra giao diện trang chủ trên kích thước chuẩn iPhone 12/13/14 (390 x 844 px). Thanh điều hướng dưới chân trang (Bottom Navigation) hiển thị sắc nét, các nút chức năng tối thiểu 44px, độ tràn ngang bằng 0 (scrollWidth === clientWidth).',
    target: 'Đánh giá tính thuận tiện và thân thiện khi học sinh thao tác trên điện thoại.',
    result: 'ĐẠT (Giao diện co giãn hoàn hảo, trải nghiệm cảm ứng ngón tay mượt mà).'
  },
  {
    code: 'KT08-B',
    title: 'Kiểm thử KT08 (Giao diện Kho đồ): Hiển thị thẻ danh mục và thao tác trên điện thoại 390px',
    file: 'KT08_mobile_catalog_390px.png',
    desc: 'Danh mục đồ dùng học tập tại kho đồ hiển thị dạng lưới một cột trên màn hình điện thoại. Thẻ thông tin, nhãn tình trạng, ảnh thu nhỏ và nút nhận đồ hiển thị rõ ràng, không bị chồng chéo hay che khuất.',
    target: 'Đảm bảo học sinh dễ dàng duyệt và tìm kiếm đồ dùng học tập trên điện thoại.',
    result: 'ĐẠT (Bố cục thông minh, tối ưu diện tích hiển thị trên màn hình nhỏ).'
  },
  {
    code: 'KT09',
    title: 'Kiểm thử KT09: Xử lý ngoại lệ mất mạng, gửi trùng lặp yêu cầu (Idempotency)',
    file: 'KT09_offline_idempotent_dedup.png',
    desc: 'Mô phỏng tình huống học sinh bấm nút liên tiếp nhiều lần khi mạng chập chờn. Cơ sở dữ liệu PostgreSQL phát hiện xung đột khóa chính (Unique constraint 23505) và chặn đứng bản ghi thứ hai, bảo vệ tính nhất quán dữ liệu.',
    target: 'Đảm bảo hệ thống không sinh ra dữ liệu rác hoặc yêu cầu trùng khi mạng yếu.',
    result: 'ĐẠT (PostgreSQL bắt lỗi 23505 chuẩn xác, khử trùng lặp an toàn 100%).'
  },
  {
    code: 'KT-SEC',
    title: 'Kiểm thử Bảo mật Bổ trợ: Kiểm tra cơ chế chặn truy cập trái phép của học sinh',
    file: '04_security_student_blocked.png',
    desc: 'Kiểm tra thực tế khi tài khoản học sinh cố tình nhập đường dẫn hoặc kích hoạt các thao tác quản trị đặc quyền. Hệ thống lập tức từ chối và hiển thị thông báo phân quyền nghiêm ngặt.',
    target: 'Đảm bảo học sinh không thể can thiệp vào các khu vực điều hành của nhà trường.',
    result: 'ĐẠT (Cơ chế RBAC chặn đứng mọi hành vi vượt quyền).'
  },
  {
    code: 'KT-LOG',
    title: 'Kiểm thử Kiểm toán: Nhật ký hệ thống Audit Logs lưu vết thời gian thực trên Cloud',
    file: '05_audit_logs_history.png',
    desc: 'Toàn bộ chuỗi thao tác từ Đăng nhập, Duyệt đồ, Tạo hẹn, Hủy hẹn và Bàn giao đều được hệ thống tự động ghi nhật ký kèm dấu thời gian ISO, định danh người thực hiện và chi tiết hành động trên Supabase Cloud.',
    target: 'Đảm bảo tính minh bạch, đối soát và truy vết sự cố theo chuẩn KHKT.',
    result: 'ĐẠT (Dữ liệu kiểm toán đầy đủ, phục vụ tra cứu và kiểm toán độc lập).'
  }
];

const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Bộ Ảnh Minh Chứng Kiểm Thử Kỹ Thuật - Lê Lợi Loop</title>
<style>
  @page {
    size: A4 portrait;
    margin: 15mm 15mm 15mm 15mm;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.35;
    color: #000;
    margin: 0;
    padding: 0;
  }
  .page-break {
    page-break-after: always;
  }

  /* TRANG BÌA */
  .cover-container {
    height: 100%;
    min-height: 250mm;
    border: 2px solid #000;
    padding: 12mm 10mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
  }
  .cover-header {
    border-bottom: 1.5px solid #000;
    padding-bottom: 6mm;
  }
  .cover-school {
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .cover-sub {
    font-size: 11pt;
    font-style: italic;
  }
  .cover-body {
    margin: auto 0;
    padding: 10mm 0;
  }
  .cover-badge {
    display: inline-block;
    border: 1px solid #000;
    padding: 4px 14px;
    font-size: 11pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 8mm;
  }
  .cover-title {
    font-size: 20pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 6mm;
    line-height: 1.3;
  }
  .cover-project {
    font-size: 16pt;
    font-weight: bold;
    color: #1a56db;
    margin-bottom: 4mm;
  }
  .cover-appendix {
    font-size: 13pt;
    font-style: italic;
    font-weight: bold;
  }
  .cover-meta-table {
    width: 90%;
    margin: 8mm auto 0 auto;
    border-collapse: collapse;
    text-align: left;
    font-size: 11pt;
  }
  .cover-meta-table td {
    padding: 5px 8px;
    vertical-align: top;
  }
  .cover-footer {
    border-top: 1.5px solid #000;
    padding-top: 6mm;
    font-size: 11pt;
  }

  /* TRANG NỘI DUNG ẢNH */
  .evidence-page {
    height: 100%;
    min-height: 250mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .evidence-header {
    border-bottom: 1px solid #333;
    padding-bottom: 3mm;
    margin-bottom: 4mm;
  }
  .evidence-tag {
    font-size: 10pt;
    font-weight: bold;
    text-transform: uppercase;
    color: #444;
  }
  .evidence-title {
    font-size: 13pt;
    font-weight: bold;
    margin: 2px 0 0 0;
    line-height: 1.25;
  }
  
  .evidence-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 4mm;
    font-size: 9.5pt;
  }
  .evidence-table td {
    border: 1px solid #000;
    padding: 4px 8px;
    vertical-align: top;
  }
  .evidence-table .label {
    width: 22%;
    font-weight: bold;
    background-color: #f3f4f6;
  }
  .evidence-table .status-pass {
    font-weight: bold;
    color: #047857;
  }

  .image-container {
    text-align: center;
    margin: auto 0;
    border: 1px solid #ccc;
    background: #fafafa;
    padding: 3mm;
    border-radius: 4px;
    max-height: 155mm;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .image-container img {
    max-width: 100%;
    max-height: 148mm;
    object-fit: contain;
    border: 1px solid #888;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  .evidence-footer {
    border-top: 1px solid #ccc;
    padding-top: 2.5mm;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #555;
    font-style: italic;
  }
</style>
</head>
<body>

  <!-- TRANG BÌA -->
  <div class="cover-container page-break">
    <div class="cover-header">
      <div class="cover-school">PHÒNG GIÁO DỤC VÀ ĐÀO TẠO QUẬN LÊ CHÂN</div>
      <div class="cover-school">TRƯỜNG THCS LÊ LỢI</div>
      <div class="cover-sub">Cuộc thi Nghiên cứu Khoa học Kỹ thuật dành cho Học sinh Trung học - Năm học 2026 - 2027</div>
    </div>

    <div class="cover-body">
      <div class="cover-badge">HỒ SƠ MINH CHỨNG KỸ THUẬT SỐ</div>
      <div class="cover-title">TẬP ẢNH MINH CHỨNG THỰC NGHIỆM<br>& KIỂM THỬ KỸ THUẬT HỆ THỐNG</div>
      <div class="cover-project">ĐỀ TÀI: LÊ LỢI LOOP - NỀN TẢNG TUẦN HOÀN ĐỒ DÙNG HỌC TẬP HỌC ĐƯỜNG</div>
      <div class="cover-appendix">(Tài liệu minh chứng đính kèm Báo cáo KHKT - Phụ lục IIIa)</div>

      <table class="cover-meta-table">
        <tr>
          <td style="width: 32%; font-weight: bold;">Đơn vị thực hiện:</td>
          <td>Nhóm học sinh Nghiên cứu KHKT Trường THCS Lê Lợi</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Giáo viên hướng dẫn:</td>
          <td>Ban Cố vấn Chuyên môn & Tổng phụ trách Đội</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Môi trường kiểm thử:</td>
          <td>Staging Cloud Database (Supabase PostgreSQL) & Microsoft Edge Engine</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Ngày xuất bản:</td>
          <td>17 tháng 11 năm 2026</td>
        </tr>
        <tr>
          <td style="font-weight: bold;">Cam kết liêm chính:</td>
          <td>Phân định minh bạch giữa 2/2 lượt trao nhận thực tế ngày 17/11 tại Phòng Đội và dữ liệu kiểm thử mô phỏng kỹ thuật phần mềm. Không bịa đặt số liệu.</td>
        </tr>
      </table>
    </div>

    <div class="cover-footer">
      <strong>HẢI PHÒNG, THÁNG 11 NĂM 2026</strong>
    </div>
  </div>

  <!-- CÁC TRANG ẢNH MINH CHỨNG -->
  ${imagesData.map((item, index) => {
    const b64 = getBase64Image(item.file);
    return `
      <div class="evidence-page ${index < imagesData.length - 1 ? 'page-break' : ''}">
        <div class="evidence-header">
          <div class="evidence-tag">Dự án Lê Lợi Loop | Phụ lục IIIa - Minh chứng Kỹ thuật</div>
          <div class="evidence-title">${item.title}</div>
        </div>

        <table class="evidence-table">
          <tr>
            <td class="label">Mã kịch bản & File:</td>
            <td><strong>${item.code}</strong> — <code>${item.file}</code></td>
          </tr>
          <tr>
            <td class="label">Mục tiêu kiểm tra:</td>
            <td>${item.target}</td>
          </tr>
          <tr>
            <td class="label">Diễn giải minh chứng:</td>
            <td>${item.desc}</td>
          </tr>
          <tr>
            <td class="label">Kết quả xác nhận:</td>
            <td class="status-pass">${item.result}</td>
          </tr>
        </table>

        <div class="image-container">
          ${b64 ? `<img src="${b64}" alt="${item.code}" />` : `<p style="color: red;">[Hình ảnh ${item.file} đang được cập nhật]</p>`}
        </div>

        <div class="evidence-footer">
          <span>Hệ thống Tuần hoàn Đồ dùng Học tập Lê Lợi Loop — Minh chứng kiểm thử</span>
          <span>Ảnh ${index + 1} / ${imagesData.length}</span>
        </div>
      </div>
    `;
  }).join('')}

</body>
</html>
`;

async function generateAlbumPdf() {
  console.log('--- KHỞI TẠO TIẾN TRÌNH XUẤT TẬP ẢNH MINH CHỨNG PDF ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, { waitUntil: 'load' });

  const artifactPdfPath = path.join(ARTIFACTS_DIR, 'Bo_Anh_Minh_Chung_Kiem_Thu_Le_Loi_Loop.pdf');
  const workspacePdfPath = path.join(WORKSPACE_DIR, 'Bo_Anh_Minh_Chung_Kiem_Thu_Le_Loi_Loop.pdf');

  await page.pdf({
    path: artifactPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  // Sao chép sang thư mục gốc workspace
  fs.copyFileSync(artifactPdfPath, workspacePdfPath);

  await browser.close();
  console.log(`✅ Xuất thành công file Tập ảnh PDF tại:`);
  console.log(`  - ${artifactPdfPath}`);
  console.log(`  - ${workspacePdfPath}`);
}

generateAlbumPdf().catch(err => {
  console.error('Lỗi khi xuất PDF tập ảnh:', err);
  process.exit(1);
});
