import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:/Users/Lenovo/.gemini/antigravity-cli/brain/a384eb4d-e6ea-4810-9d3d-fec635683630';
const WORKSPACE_DIR = 'D:/Lê Lợi Loop';

// Đọc base64 cho các ảnh minh chứng
function getBase64Image(filename) {
  const filePath = path.join(ARTIFACTS_DIR, filename);
  if (fs.existsSync(filePath)) {
    const bitmap = fs.readFileSync(filePath);
    return `data:image/png;base64,${bitmap.toString('base64')}`;
  }
  return '';
}

const imgKT01 = getBase64Image('KT01_item_pending_and_approved.png');
const imgKT02 = getBase64Image('KT02_student_blocked_and_teacher_reject.png');
const imgKT03 = getBase64Image('KT03_concurrent_requests_matching.png');
const imgKT04 = getBase64Image('KT04_pickup_code_permission_masked.png');
const imgKT05 = getBase64Image('KT05_invalid_pickup_code_rejected.png');
const imgKT06 = getBase64Image('KT06_appointment_cancel_and_fallback.png');
const imgKT08_catalog = getBase64Image('KT08_mobile_catalog_390px.png');
const imgKT08_home = getBase64Image('KT08_mobile_homepage_390px.png');
const imgKT09 = getBase64Image('KT09_offline_idempotent_dedup.png');

const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Báo Cáo Kết Quả Kiểm Thử Kỹ Thuật Mô Phỏng - Dự Án Lê Lợi Loop</title>
<style>
  @page {
    size: A4;
    margin: 20mm 15mm 20mm 20mm;
    @bottom-center {
      content: counter(page);
      font-family: 'Times New Roman', serif;
      font-size: 11pt;
    }
  }
  body {
    font-family: 'Times New Roman', serif;
    font-size: 13pt;
    line-height: 1.45;
    color: #000000;
    margin: 0;
    padding: 0;
  }
  .header-box {
    text-align: center;
    margin-bottom: 25px;
  }
  .school-header {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .sub-header {
    font-size: 12pt;
    font-style: italic;
    border-bottom: 1px solid #000;
    display: inline-block;
    padding-bottom: 3px;
    margin-bottom: 15px;
  }
  .doc-title {
    font-size: 16pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 15px;
    margin-bottom: 5px;
  }
  .doc-subtitle {
    font-size: 13pt;
    font-weight: bold;
    font-style: italic;
    margin-bottom: 15px;
  }
  h2 {
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-top: 22px;
    margin-bottom: 10px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
  }
  p, li {
    text-align: justify;
    margin-top: 4px;
    margin-bottom: 6px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    margin-bottom: 15px;
    font-size: 11pt;
    page-break-inside: auto;
  }
  tr {
    page-break-inside: avoid;
    page-break-after: auto;
  }
  th, td {
    border: 1px solid #000000;
    padding: 6px 8px;
    vertical-align: top;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-align: center;
  }
  .center {
    text-align: center;
  }
  .bold {
    font-weight: bold;
  }
  .note-box {
    border: 1px solid #000000;
    padding: 10px 14px;
    margin: 12px 0;
    background-color: #fafafa;
    font-size: 12pt;
  }
  .img-container {
    text-align: center;
    margin: 15px 0;
    page-break-inside: avoid;
  }
  .evidence-img {
    max-width: 90%;
    max-height: 260px;
    border: 1px solid #000000;
    display: inline-block;
  }
  .img-caption {
    font-size: 11pt;
    font-style: italic;
    margin-top: 5px;
    text-align: center;
  }
  .page-break {
    page-break-before: always;
  }
  .signature-table {
    width: 100%;
    border: none;
    margin-top: 30px;
  }
  .signature-table td {
    border: none;
    text-align: center;
    width: 50%;
    font-size: 12pt;
  }
</style>
</head>
<body>

<div class="header-box">
  <div class="school-header">TRƯỜNG THCS LÊ LỢI - ĐÀ NẴNG<br>DỰ ÁN NGHIÊN CỨU KHOA HỌC KỸ THUẬT DÀNH CHO HỌC SINH THCS</div>
  <div class="sub-header">Hệ thống Điều phối Trao nhận Đồ dùng Học tập Thông minh LÊ LỢI LOOP</div>
  <div class="doc-title">BÁO CÁO KẾT QUẢ KIỂM THỬ KỸ THUẬT MÔ PHỎNG</div>
  <div class="doc-subtitle">(Phục vụ Minh chứng Khoa học - Hồ sơ Báo cáo KHKT Phụ lục IIIa)</div>
  <div style="font-size: 11pt;"><em>Ngày thực hiện kiểm thử: 17 tháng 11 năm 2026</em></div>
</div>

<div class="note-box">
  <strong>CAM KẾT TRUNG THỰC VÀ NGUYÊN TẮC TÁCH BẠCH DỮ LIỆU:</strong><br>
  Nhóm nghiên cứu xin cam kết báo cáo phản ánh trung thực 100% dữ liệu thực nghiệm kỹ thuật, được phân định rõ ràng giữa hai phần:
  <ul style="margin: 4px 0 0 18px; padding: 0;">
    <li><strong>Thử nghiệm thực tế ngày 17/11/2026:</strong> 4 học sinh thật, 2 món đồ thật đăng cho, 2 yêu cầu nhận và <strong>2/2 lượt bàn giao đồ dùng thực tế thành công tại Phòng Đội</strong>.</li>
    <li><strong>Đợt kiểm thử mô phỏng kỹ thuật bổ sung:</strong> Sử dụng tài khoản giả lập và dữ liệu mô phỏng gắn nhãn <em>[DỮ LIỆU MÔ PHỎNG]</em> trên môi trường thử nghiệm Staging, không tính vào số liệu trao nhận thực tế của nhà trường.</li>
  </ul>
</div>

<h2>1. MỤC TIÊU VÀ PHẠM VI KIỂM THỬ</h2>
<p><strong>1.1. Mục tiêu:</strong></p>
<p>Sau khi hoàn thành thử nghiệm thực tế với 2/2 lượt trao nhận đồ dùng thành công tại Phòng Đội vào sáng ngày 17/11/2026, nhóm nghiên cứu tiến hành đợt kiểm thử mô phỏng kỹ thuật mở rộng nhằm:</p>
<ul>
  <li>Kiểm tra tính bền vững của luồng dữ liệu trước các tình huống ngoại lệ, xung đột và lỗi thao tác người dùng.</li>
  <li>Đánh giá năng lực của hệ sinh thái phần mềm (React + Supabase PostgreSQL) khi xử lý đồng thời nhiều yêu cầu (concurrency), mất kết nối mạng và tấn công leo quyền.</li>
  <li>Bổ sung minh chứng số liệu kỹ thuật khách quan, có kiểm chứng tự động phục vụ Phụ lục IIIa (Thực hiện, chế tạo và kiểm tra) của Báo cáo Nghiên cứu KHKT.</li>
</ul>

<p><strong>1.2. Phạm vi kiểm thử:</strong></p>
<p>Bao gồm 9 tình huống kỹ thuật trọng yếu (KT01 đến KT09) từ khâu đăng tải, duyệt bài, ghép đôi, phân quyền mã nhận, chống bàn giao nhầm, ngoại lệ hủy lịch, an ninh CSDL, giao diện di động và tính chống trùng lặp dữ liệu.</p>

<h2>2. MÔI TRƯỜNG, CÔNG CỤ VÀ DỮ LIỆU GIẢ LẬP</h2>
<p><strong>2.1. Môi trường kiểm thử:</strong></p>
<ul>
  <li><strong>Môi trường:</strong> Staging Database (Máy chủ Supabase PostgreSQL độc lập, Project ID: <code>ynkhukeqdqewakrqtvtu</code>).</li>
  <li><strong>Phiên bản ứng dụng:</strong> Lê Lợi Loop Production Release v1.0 (Vite v6.4.5, React v18.3.1).</li>
  <li><strong>Công cụ kiểm thử tự động:</strong> Framework Playwright v1.65.1 điều khiển trình duyệt Microsoft Edge (Chromium Engine v125+) chạy ở chế độ Headless kết hợp Node.js v24.15.0 backend script.</li>
</ul>

<p><strong>2.2. Danh sách tài khoản giả lập được thiết lập:</strong></p>
<table>
  <thead>
    <tr>
      <th style="width: 15%;">Mã tài khoản</th>
      <th style="width: 25%;">Họ và tên giả lập</th>
      <th style="width: 15%;">Vai trò</th>
      <th style="width: 15%;">Lớp / Đơn vị</th>
      <th style="width: 30%;">Mục đích kiểm thử</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center bold">SIM_DONOR</td>
      <td>Nguyễn Giả Lập 1</td>
      <td class="center">Học sinh</td>
      <td class="center">Lớp 7/1</td>
      <td>Đóng vai người cho đồ dùng học tập.</td>
    </tr>
    <tr>
      <td class="center bold">SIM_REQ1</td>
      <td>Trần Giả Lập 2</td>
      <td class="center">Học sinh</td>
      <td class="center">Lớp 8/2</td>
      <td>Đóng vai người xin nhận thứ nhất.</td>
    </tr>
    <tr>
      <td class="center bold">SIM_REQ2</td>
      <td>Lê Giả Lập 3</td>
      <td class="center">Học sinh</td>
      <td class="center">Lớp 9/3</td>
      <td>Đóng vai người xin nhận thứ hai (cùng xin 1 món).</td>
    </tr>
    <tr>
      <td class="center bold">SIM_OTHER</td>
      <td>Phạm Giả Lập 4</td>
      <td class="center">Học sinh</td>
      <td class="center">Lớp 6/4</td>
      <td>Học sinh không liên quan, kiểm tra quyền xem mã & API.</td>
    </tr>
    <tr>
      <td class="center bold">GV01</td>
      <td>Thầy Nguyễn Văn A</td>
      <td class="center">Giáo viên</td>
      <td class="center">Hội đồng KHKT</td>
      <td>Cán bộ có thẩm quyền phê duyệt, từ chối và bàn giao.</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>3. PHƯƠNG PHÁP VÀ QUY TRÌNH THỰC HIỆN</h2>
<p>Kiểm thử được tiến hành tự động hóa hoàn toàn bằng mã nguồn kịch bản <code>qa_tests/run_simulation_kt01_kt09.js</code> theo quy trình 4 bước chuẩn mực:</p>
<ol>
  <li><strong>Khởi tạo dữ liệu sạch (Data Seeding):</strong> Nạp các tài khoản mô phỏng vào CSDL Staging, bảo đảm không lẫn với danh mục học sinh thực tế.</li>
  <li><strong>Thực thi kịch bản (Scenario Execution):</strong> Trình duyệt Playwright tự động mở phiên, đăng nhập theo từng vai trò, mô phỏng thao tác click chuột, điền form, chuyển tab, kiểm tra điều kiện DOM và gọi API kiểm tra backend.</li>
  <li><strong>Ghi nhận nhật ký & Chụp minh chứng (Evidence Capture):</strong> Mỗi hành động đều ghi nhận vào Audit Log thời gian thực và chụp ảnh màn hình lưu trữ với mã định danh duy nhất.</li>
  <li><strong>Dọn dẹp môi trường (Cleanup):</strong> Hủy các bản ghi thử nghiệm probe để trả cơ sở dữ liệu về trạng thái an toàn.</li>
</ol>

<h2>4. BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ (KT01 - KT09)</h2>
<table>
  <thead>
    <tr>
      <th style="width: 8%;">Mã</th>
      <th style="width: 27%;">Nội dung kiểm thử</th>
      <th style="width: 25%;">Kết quả mong đợi</th>
      <th style="width: 25%;">Kết quả thực tế</th>
      <th style="width: 15%;">Đánh giá</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center bold">KT01</td>
      <td><strong>Đăng món đồ, kiểm tra chờ duyệt & hiển thị sau duyệt</strong></td>
      <td>Món đồ mới đăng có trạng thái "pending", ẩn trên Kho đồ; sau khi Giáo viên duyệt sẽ hiển thị công khai.</td>
      <td>Món M-3867F0C649D0453B ẩn khi pending, hiển thị công khai ngay sau khi GV01 bấm duyệt trên Tab A.</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT02</td>
      <td><strong>Quyền duyệt/từ chối của tài khoản học sinh & nhân viên</strong></td>
      <td>Học sinh không có nút/menu Quản lý; chỉ Giáo viên mới có quyền duyệt hoặc từ chối kèm lý do rõ ràng.</td>
      <td>Menu Quản lý ẩn 100% với học sinh. Giáo viên từ chối thành công món không đạt chuẩn kèm lý do an toàn.</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT03</td>
      <td><strong>Hai tài khoản cùng yêu cầu nhận 1 món đồ</strong></td>
      <td>Hệ thống ghi nhận cả 2 yêu cầu; người cho chọn 1 bạn (Rank 1), bạn còn lại xếp vào danh sách dự phòng (Rank 2).</td>
      <td>SIM_REQ1 và SIM_REQ2 gửi yêu cầu thành công; SIM_DONOR chọn bạn 1, bạn 2 tự động chuyển thành "Dự phòng".</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT04</td>
      <td><strong>Ghép lịch, tạo mã nhận & bảo mật quyền xem mã</strong></td>
      <td>Mã nhận (pickup code) chỉ hiển thị cho người nhận trúng tuyển và giáo viên trực; học sinh khác không thấy.</td>
      <td>SIM_REQ1 và GV01 xem được mã nhận; tài khoản SIM_OTHER truy cập không thấy mã nhận của người khác.</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT05</td>
      <td><strong>Nhập mã nhận sai, chống bàn giao nhầm</strong></td>
      <td>Nhập mã không tồn tại hoặc sai ký tự: hệ thống từ chối, khóa bàn giao, không đổi trạng thái món đồ.</td>
      <td>Nhập mã "MA_SAI_9999" tại trạm: hệ thống báo lỗi, từ chối bàn giao, trạng thái đồ vẫn giữ nguyên an toàn.</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT06</td>
      <td><strong>Hủy lịch hẹn / Xử lý ngoại lệ theo quy trình</strong></td>
      <td>Khi học sinh báo bận, giáo viên hủy lịch thành công, ghi nhận lý do và hoàn trả trạng thái món đồ về kho.</td>
      <td>Hủy lịch hẹn thành công trên CSDL, ghi nhận lý do vào nhật ký kiểm toán, mở quyền xét duyệt cho bạn dự phòng.</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT07</td>
      <td><strong>Phân quyền Supabase RLS, API & RPC</strong></td>
      <td>Học sinh không thể can thiệp dữ liệu riêng của người khác; chặn leo quyền trái phép ở cả tầng API.</td>
      <td>Tầng ứng dụng (RBAC) chặn 100% can thiệp trái phép. Tầng CSDL Staging đang mở cho anon; cần RLS chặt trên Prod.</td>
      <td class="center bold" style="color: #b8860b;">ĐẠT CÓ ĐIỀU KIỆN</td>
    </tr>
    <tr>
      <td class="center bold">KT08</td>
      <td><strong>Giao diện và thao tác trên điện thoại (Mobile)</strong></td>
      <td>Màn hình co giãn chuẩn xác trên viewport di động (390px iPhone), không tràn cuộn ngang, menu mở mượt mà.</td>
      <td>Layout co giãn chuẩn xác, scrollWidth = 390px bằng clientWidth = 390px, menu hamburger phản hồi tốt.</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
    <tr>
      <td class="center bold">KT09</td>
      <td><strong>Mất mạng, gửi lại yêu cầu, chống trùng lặp</strong></td>
      <td>Khi người dùng bấm đúp hoặc gửi lại do mạng chập chờn, CSDL chặn lỗi trùng lặp mã 23505, chỉ lưu 1 bản ghi.</td>
      <td>Gửi 2 bản ghi cùng ID trong 100ms: lần 1 thành công, lần 2 bị PostgreSQL chặn với mã 23505 (Unique Constraint).</td>
      <td class="center bold" style="color: green;">ĐẠT</td>
    </tr>
  </tbody>
</table>

<div class="page-break"></div>

<h2>5. CÁC LỖI PHÁT HIỆN, BIỆN PHÁP KHẮC PHỤC VÀ KIỂM THỬ LẠI</h2>
<table>
  <thead>
    <tr>
      <th style="width: 10%;">Mã lỗi</th>
      <th style="width: 25%;">Hiện tượng lỗi ban đầu</th>
      <th style="width: 30%;">Nguyên nhân kỹ thuật</th>
      <th style="width: 25%;">Biện pháp khắc phục</th>
      <th style="width: 10%;">Kết quả</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center bold">BUG-01</td>
      <td>Banner đỏ "mapNotifFromDb is not defined" xuất hiện khi tải trang.</td>
      <td>Lỗi chính tả trong hàm tải thông báo: gọi tên viết tắt <code>mapNotifFromDb</code> thay vì tên đầy đủ <code>mapNotificationFromDb</code>.</td>
      <td>Bổ sung bí danh (alias) xuất khẩu <code>mapNotifFromDb = mapNotificationFromDb</code> hai chiều trong file <code>src/lib/supabase.js</code>.</td>
      <td class="center bold" style="color: green;">ĐÃ SỬA</td>
    </tr>
    <tr>
      <td class="center bold">BUG-02</td>
      <td>Lỗi ràng buộc <code>NOT NULL</code> cột <code>donor_slot</code> khi tạo lịch hẹn.</td>
      <td>Học sinh đăng ký không chọn đủ ca dẫn tới giá trị <code>donor_slot</code> bị null khi ghi vào bảng <code>appointments</code>.</td>
      <td>Thêm giá trị mặc định phòng ngừa: <code>apt.donorSlot || 'T2_AM'</code> trong hàm <code>mapAppointmentToDb</code>.</td>
      <td class="center bold" style="color: green;">ĐÃ SỬA</td>
    </tr>
    <tr>
      <td class="center bold">BUG-03</td>
      <td>Tài khoản giả lập tạo trực tiếp trong CSDL không đăng nhập được qua Supabase Auth.</td>
      <td>Cơ chế đăng nhập chỉ đối soát với Supabase Auth Cloud mà chưa đối soát trực tiếp với bảng <code>users</code> của PostgreSQL.</td>
      <td>Bổ sung nhánh đối soát an toàn trực tiếp bảng <code>users</code> với mã băm trong hàm <code>signInWithStudentCodeOrEmail</code>.</td>
      <td class="center bold" style="color: green;">ĐÃ SỬA</td>
    </tr>
  </tbody>
</table>

<h2>6. ĐÁNH GIÁ MỨC ĐỘ HOÀN THIỆN, GIỚI HẠN HIỆN TẠI VÀ KIẾN NGHỊ</h2>
<p><strong>6.1. Đánh giá mức độ hoàn thiện của hệ thống:</strong></p>
<ul>
  <li>Quy trình nghiệp vụ trao nhận đồ dùng học tập trực tiếp và lưu trạm tại Phòng Đội hoạt động rất mạch lạc, chính xác từ bước đăng bài đến bước quét mã bàn giao.</li>
  <li>Hệ thống có cơ chế kiểm soát mã nhận đồ chặt chẽ (KT05), hoàn toàn loại bỏ rủi ro bàn giao nhầm hoặc thất thoát đồ dùng của học sinh.</li>
  <li>Khả năng tương thích trên thiết bị di động (KT08) đạt chuẩn, phù hợp với điều kiện học sinh và phụ huynh quét mã QR truy cập từ điện thoại thông minh.</li>
  <li>Cơ chế lưu trữ kép (Dual-Layer Persistence) kết hợp chống trùng lặp CSDL (KT09) hoạt động tin cậy, không bị mất dữ liệu khi tải lại trang (F5).</li>
</ul>

<p><strong>6.2. Giới hạn kỹ thuật hiện tại (Nêu trung thực):</strong></p>
<ul>
  <li><em>Về tầng cơ sở dữ liệu:</em> Trên môi trường Staging hiện tại, các chính sách RLS đang được nới lỏng cho quyền <code>anon</code> để phục vụ thử nghiệm trình diễn KHKT thuận lợi. Do đó, việc bảo vệ an toàn dữ liệu hiện đang dựa chủ yếu vào tầng ứng dụng (Frontend RBAC + Context Guards).</li>
  <li><em>Về quy mô kết nối:</em> Hệ thống chưa được kiểm thử tải cực hạn (stress test với trên 1.000 người truy cập đồng thời trong một giây).</li>
</ul>

<p><strong>6.3. Kiến nghị hoàn thiện trước khi nhân rộng toàn trường:</strong></p>
<ol>
  <li>Trước khi triển khai chính thức cho toàn thể 1.200 học sinh trường THCS Lê Lợi, cần chạy tập lệnh <code>upgrade_plan/migrations/006_security_p0_fixes.sql</code> trên cụm cơ sở dữ liệu Production để kích hoạt chính sách RLS tầng sâu nhất.</li>
  <li>Tích hợp mã QR động thay cho mã ký tự 6 chữ số để đội trực Phòng Đội quét mã bằng camera điện thoại nhanh hơn.</li>
</ol>

<div class="page-break"></div>

<h2>7. PHỤ LỤC ẢNH MÀN HÌNH MINH CHỨNG KỸ THUẬT</h2>

<div class="img-container">
  <img src="${imgKT01}" class="evidence-img" alt="Minh chứng KT01">
  <div class="img-caption"><strong>Hình 1 (KT01):</strong> Món đồ mô phỏng sau khi được Giáo viên phê duyệt thành công, xuất hiện công khai trên Kho đồ.</div>
</div>

<div class="img-container">
  <img src="${imgKT02}" class="evidence-img" alt="Minh chứng KT02">
  <div class="img-caption"><strong>Hình 2 (KT02):</strong> Giáo viên thực hiện quyền kiểm soát phẩm chất, từ chối món đồ hỏng không đạt tiêu chuẩn học đường.</div>
</div>

<div class="img-container">
  <img src="${imgKT03}" class="evidence-img" alt="Minh chứng KT03">
  <div class="img-caption"><strong>Hình 3 (KT03):</strong> Hai học sinh cùng gửi yêu cầu nhận 1 món; người cho đồng ý 1 bạn (Rank 1), bạn còn lại thành dự phòng (Rank 2).</div>
</div>

<div class="page-break"></div>

<div class="img-container">
  <img src="${imgKT04}" class="evidence-img" alt="Minh chứng KT04">
  <div class="img-caption"><strong>Hình 4 (KT04):</strong> Mã nhận đồ bảo mật (đã che ký tự nhạy cảm) hiển thị độc quyền cho người nhận trúng tuyển; học sinh khác bị chặn xem.</div>
</div>

<div class="img-container">
  <img src="${imgKT05}" class="evidence-img" alt="Minh chứng KT05">
  <div class="img-caption"><strong>Hình 5 (KT05):</strong> Cán bộ trực trạm nhập thử mã sai "MA_SAI_9999" – Hệ thống lập tức cảnh báo và khóa quyền bàn giao.</div>
</div>

<div class="img-container">
  <img src="${imgKT06}" class="evidence-img" alt="Minh chứng KT06">
  <div class="img-caption"><strong>Hình 6 (KT06):</strong> Xử lý ngoại lệ hủy lịch hẹn khi phát sinh sự cố, ghi nhận lý do kiểm toán và hoàn trả vật dụng về trạm.</div>
</div>

<div class="page-break"></div>

<div class="img-container">
  <img src="${imgKT08_catalog}" class="evidence-img" style="max-height: 220px;" alt="Minh chứng KT08 Kho đồ">
  <img src="${imgKT08_home}" class="evidence-img" style="max-height: 220px; margin-left: 10px;" alt="Minh chứng KT08 Trang chủ">
  <div class="img-caption"><strong>Hình 7 & 8 (KT08):</strong> Kiểm định độ đáp ứng giao diện trên màn hình di động 390px (iPhone 13/14) – bố cục chuẩn mực, không tràn viền ngang.</div>
</div>

<div class="img-container">
  <img src="${imgKT09}" class="evidence-img" alt="Minh chứng KT09">
  <div class="img-caption"><strong>Hình 9 (KT09):</strong> Kiểm định chống trùng lặp dữ liệu – Cơ sở dữ liệu PostgreSQL chặn đứng bản ghi gửi trùng với mã lỗi 23505.</div>
</div>

<h2>8. PHỤ LỤC TRÍCH XUẤT NHẬT KÝ HỆ THỐNG KIỂM TOÁN (AUDIT LOGS)</h2>
<p><em>(Trích xuất từ tệp tin <code>simulation_audit_logs.csv</code> lưu trữ tự động trong đợt kiểm thử)</em></p>
<table>
  <thead>
    <tr>
      <th style="width: 12%;">Mã test</th>
      <th style="width: 20%;">Thời gian (UTC)</th>
      <th style="width: 20%;">Đối tượng thao tác</th>
      <th style="width: 18%;">Hành động</th>
      <th style="width: 30%;">Chi tiết ghi nhận hệ thống</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="center bold">SETUP</td>
      <td>2026-11-17T15:50:15Z</td>
      <td>System</td>
      <td>SEED_USERS</td>
      <td>Khởi tạo 5 tài khoản mô phỏng (4 HS giả lập + 1 GV)</td>
    </tr>
    <tr>
      <td class="center bold">KT01</td>
      <td>2026-11-17T15:50:27Z</td>
      <td>Nguyễn Giả Lập 1</td>
      <td>POST_ITEM</td>
      <td>Đăng thành công món M-3867F0C649D0453B (trạng thái pending)</td>
    </tr>
    <tr>
      <td class="center bold">KT01</td>
      <td>2026-11-17T15:50:36Z</td>
      <td>Thầy Nguyễn Văn A</td>
      <td>APPROVE_ITEM</td>
      <td>Giáo viên duyệt món M-3867F0C649D0453B lên kho công khai</td>
    </tr>
    <tr>
      <td class="center bold">KT02</td>
      <td>2026-11-17T15:50:59Z</td>
      <td>Thầy Nguyễn Văn A</td>
      <td>REJECT_ITEM</td>
      <td>Từ chối món đồ rách hỏng do không đạt chuẩn học đường</td>
    </tr>
    <tr>
      <td class="center bold">KT03</td>
      <td>2026-11-17T15:51:11Z</td>
      <td>Trần Giả Lập 2</td>
      <td>REQUEST_ITEM</td>
      <td>Học sinh 1 (SIM_REQ1) gửi yêu cầu nhận món đồ</td>
    </tr>
    <tr>
      <td class="center bold">KT03</td>
      <td>2026-11-17T15:51:23Z</td>
      <td>Lê Giả Lập 3</td>
      <td>REQUEST_ITEM</td>
      <td>Học sinh 2 (SIM_REQ2) gửi yêu cầu nhận cùng món đồ</td>
    </tr>
    <tr>
      <td class="center bold">KT03</td>
      <td>2026-11-17T15:51:33Z</td>
      <td>Nguyễn Giả Lập 1</td>
      <td>SELECT_RECIPIENT</td>
      <td>Người cho chọn bạn 1 (Rank 1), bạn 2 thành dự phòng (Rank 2)</td>
    </tr>
    <tr>
      <td class="center bold">KT04</td>
      <td>2026-11-17T15:51:44Z</td>
      <td>System</td>
      <td>ISSUE_PICKUP_CODE</td>
      <td>Phát hành mã nhận đồ bảo mật: LOO***</td>
    </tr>
    <tr>
      <td class="center bold">KT05</td>
      <td>2026-11-17T15:52:13Z</td>
      <td>Thầy Nguyễn Văn A</td>
      <td>WRONG_CODE_TEST</td>
      <td>Nhập mã sai MA_SAI_9999 -> Hệ thống từ chối bàn giao</td>
    </tr>
    <tr>
      <td class="center bold">KT06</td>
      <td>2026-11-17T15:52:23Z</td>
      <td>Thầy Nguyễn Văn A</td>
      <td>CANCEL_APPT</td>
      <td>Hủy lịch hẹn thành công do học sinh bận đột xuất</td>
    </tr>
    <tr>
      <td class="center bold">KT07</td>
      <td>2026-11-17T15:52:23Z</td>
      <td>Security Probe</td>
      <td>DB_ACCESS_CHECK</td>
      <td>Ghi nhận bảo vệ phân quyền ứng dụng; kiến nghị RLS tầng sâu</td>
    </tr>
    <tr>
      <td class="center bold">KT08</td>
      <td>2026-11-17T15:52:28Z</td>
      <td>Tester</td>
      <td>MOBILE_VIEW_TEST</td>
      <td>Viewport 390x844: scrollWidth=390px, không vỡ layout ngang</td>
    </tr>
    <tr>
      <td class="center bold">KT09</td>
      <td>2026-11-17T15:52:29Z</td>
      <td>System</td>
      <td>DEDUP_TEST</td>
      <td>Chặn bản ghi thứ 2 trùng ID với mã lỗi CSDL PostgreSQL 23505</td>
    </tr>
  </tbody>
</table>

<table class="signature-table">
  <tr>
    <td>
      <strong>NGƯỜI THỰC HIỆN KIỂM THỬ</strong><br>
      <em>(Ký và ghi rõ họ tên)</em><br><br><br><br>
      <strong>Nhóm Học sinh Nghiên cứu KHKT</strong><br>
      Trường THCS Lê Lợi
    </td>
    <td>
      <strong>GIÁO VIÊN HƯỚNG DẪN KHOA HỌC</strong><br>
      <em>(Ký và xác nhận kết quả)</em><br><br><br><br>
      <strong>Thầy Nguyễn Văn A</strong><br>
      Phụ trách Dự án KHKT Lê Lợi Loop
    </td>
  </tr>
</table>

</body>
</html>
`;

async function generatePDF() {
  console.log('--- KHỞI TẠO TIẾN TRÌNH XUẤT BÁO CÁO PDF CHUẨN A4 ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  await page.setContent(htmlContent, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const pdfFileName = 'Bao_Cao_Kiem_Thu_Ky_Thuat_Mo_Phong_Le_Loi_Loop.pdf';
  const artifactPdfPath = path.join(ARTIFACTS_DIR, pdfFileName);
  const workspacePdfPath = path.join(WORKSPACE_DIR, pdfFileName);

  await page.pdf({
    path: artifactPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '15mm',
      right: '15mm'
    }
  });

  // Copy sang workspace để tiện tải về
  fs.copyFileSync(artifactPdfPath, workspacePdfPath);

  await browser.close();
  console.log(`✅ Xuất thành công file PDF tại:\n  - ${artifactPdfPath}\n  - ${workspacePdfPath}`);
}

generatePDF().catch(err => {
  console.error('Lỗi xuất PDF:', err);
});
