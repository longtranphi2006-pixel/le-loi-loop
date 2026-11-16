import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

function getBase64Image(filePath) {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${fullPath}`);
    return '';
  }
  const ext = path.extname(fullPath).slice(1);
  const data = fs.readFileSync(fullPath).toString('base64');
  return `data:image/${ext};base64,${data}`;
}

const images = {
  home: getBase64Image('qa_tests/evidence/layer1/01_desktop_home.png'),
  register: getBase64Image('qa_tests/evidence/auth/01_register_form_filled.png'),
  donate: getBase64Image('qa_tests/evidence/layer1/04_desktop_donate.png'),
  catalog: getBase64Image('qa_tests/evidence/layer1/02_desktop_catalog.png'),
  detail: getBase64Image('qa_tests/evidence/layer1/03_desktop_detail.png'),
  pickupCode: getBase64Image('qa_tests/evidence/layer2/2_3_recipient_pickup_code.png'),
  ticketModal: getBase64Image('qa_tests/evidence/multi_tab/02_printable_ticket_modal.png'),
  station: getBase64Image('qa_tests/evidence/layer1/07_desktop_station.png'),
  handover: getBase64Image('qa_tests/evidence/layer2/2_3_handover_success.png')
};

const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Sổ Tay Hướng Dẫn Sử Dụng Lê Lợi Loop</title>
  <style>
    @page {
      size: A4;
      margin: 10mm 12mm 12mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 12px;
      background-color: #ffffff;
    }

    .page {
      height: 275mm;
      max-height: 275mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-after: always;
      position: relative;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* HEADER & FOOTER */
    .doc-header {
      border-bottom: 2px solid #059669;
      padding-bottom: 6px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .doc-header .school {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #047857;
      letter-spacing: 0.5px;
    }
    .doc-header .project-tag {
      font-size: 10px;
      background: #ecfdf5;
      color: #065f46;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      border: 1px solid #a7f3d0;
    }

    .doc-footer {
      border-top: 1px dashed #cbd5e1;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #64748b;
    }

    /* COVER BANNER */
    .cover-banner {
      background: linear-gradient(135deg, #065f46 0%, #047857 50%, #0d9488 100%);
      color: white;
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 12px;
      text-align: center;
      box-shadow: 0 3px 8px rgba(5, 150, 105, 0.15);
    }
    .cover-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(4px);
      padding: 2px 12px;
      border-radius: 16px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .cover-title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.3px;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .cover-slogan {
      font-size: 12px;
      font-weight: 500;
      opacity: 0.95;
      font-style: italic;
      margin-bottom: 8px;
    }
    .cover-meta {
      display: flex;
      justify-content: center;
      gap: 16px;
      font-size: 10.5px;
      opacity: 0.92;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 6px;
    }

    /* SECTION STYLES */
    h2.section-title {
      font-size: 15px;
      font-weight: 800;
      color: #065f46;
      margin-top: 8px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
    }
    h2.section-title .step-num {
      background: #059669;
      color: white;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
    }

    h3.sub-title {
      font-size: 12.5px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 6px;
      margin-bottom: 4px;
    }

    p {
      margin-bottom: 6px;
      text-align: justify;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 6px;
    }
    li {
      margin-bottom: 3px;
    }

    /* CALLOUT BOXES */
    .callout {
      border-radius: 8px;
      padding: 8px 12px;
      margin: 8px 0;
      font-size: 11.5px;
      line-height: 1.4;
    }
    .callout-green {
      background: #f0fdf4;
      border-left: 3.5px solid #10b981;
      color: #166534;
    }
    .callout-blue {
      background: #eff6ff;
      border-left: 3.5px solid #3b82f6;
      color: #1e40af;
    }
    .callout-amber {
      background: #fffbeb;
      border-left: 3.5px solid #f59e0b;
      color: #92400e;
    }

    /* SCREENSHOT SHOWCASE */
    .img-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 6px;
      margin: 6px 0;
      box-shadow: 0 1px 4px rgba(0,0,0,0.03);
      text-align: center;
    }
    .img-card img {
      max-width: 100%;
      max-height: 155px;
      height: auto;
      border-radius: 4px;
      display: block;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      object-fit: contain;
    }
    .img-card.large img {
      max-height: 175px;
    }
    .img-caption {
      font-size: 10px;
      color: #64748b;
      text-align: center;
      margin-top: 4px;
      font-weight: 600;
      font-style: italic;
    }

    /* GRID COLUMNS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 6px 0;
    }

    /* STEP FLOW CHART BOX */
    .flow-steps {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin: 8px 0;
    }
    .flow-step-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 4px;
      text-align: center;
    }
    .flow-step-box .s-num {
      width: 18px;
      height: 18px;
      background: #059669;
      color: white;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
    }
    .flow-step-box .s-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #0f172a;
    }
    .flow-step-box .s-desc {
      font-size: 9px;
      color: #64748b;
      margin-top: 2px;
      line-height: 1.25;
    }

    /* TABLE */
    table.custom-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 11px;
    }
    table.custom-table th, table.custom-table td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    table.custom-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
  </style>
</head>
<body>

  <!-- ==================== TRANG 1 ==================== -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="school">Trường THCS Lê Lợi — Quận Ngũ Hành Sơn, TP. Đà Nẵng</div>
        <div class="project-tag">Dự án KHKT Học sinh 2026</div>
      </div>

      <div class="cover-banner">
        <div class="cover-badge">CẨM NANG HƯỚNG DẪN DÀNH CHO HỌC SINH</div>
        <h1 class="cover-title">NỀN TẢNG TUẦN HOÀN ĐỒ DÙNG HỌC TẬP<br>"LÊ LỢI LOOP"</h1>
        <div class="cover-slogan">"Đồ cũ trao tay – Giá trị ở lại – Tiếp sức bạn đến trường"</div>
        <div class="cover-meta">
          <div>🌐 <strong>Web:</strong> https://le-loi-loop.vercel.app/</div>
          <div>🏢 <strong>Trạm:</strong> Văn phòng Đội / Trạm KHKT</div>
          <div>⚡ <strong>Đồng bộ:</strong> Supabase PostgreSQL</div>
        </div>
      </div>

      <h2 class="section-title">
        <span class="step-num">★</span>
        1. Ý nghĩa & Mục tiêu của Dự án Lê Lợi Loop
      </h2>
      <p>
        Trong mỗi năm học, có hàng trăm món đồ dùng học tập (như sách giáo khoa, truyện tranh, thước kẻ, compa, máy tính Casio, cặp sách...) còn rất mới nhưng không được sử dụng tiếp, trong khi nhiều bạn học sinh khác lại đang rất cần.
      </p>
      <p>
        <strong>Lê Lợi Loop</strong> là nền tảng số do thầy trò Trường THCS Lê Lợi phát triển nhằm kết nối học sinh trao tặng đồ dùng học tập hoàn toàn miễn phí, góp phần giảm thiểu rác thải học đường và lan tỏa lối sống xanh sẻ chia.
      </p>

      <div class="callout callout-green">
        <strong>💡 Điểm cốt lõi - Mô hình Trạm Lê Lợi Trung gian:</strong> Học sinh ca Sáng và ca Chiều không cần phải gặp mặt trực tiếp. Bạn Cho chỉ việc gửi đồ tại Trạm (Phòng Đội), Đội Tình nguyện sẽ kiểm tra vệ sinh sạch sẽ và trao lại cho Bạn Nhận theo đúng ca hẹn, <strong>đảm bảo tính tế nhị, bảo mật tuyệt đối danh tính người nhận</strong>.
      </div>

      <div class="img-card large">
        <img src="${images.home}" alt="Giao diện Trang chủ Lê Lợi Loop" />
        <div class="img-caption">Hình 1: Giao diện Trang chủ trực quan của hệ thống Lê Lợi Loop với số liệu đếm thời gian thực</div>
      </div>

      <h2 class="section-title">
        <span class="step-num">✦</span>
        2. Sơ đồ Chu trình 5 Bước Trao - Nhận Chuẩn hóa
      </h2>
      <div class="flow-steps">
        <div class="flow-step-box">
          <div class="s-num">1</div>
          <div class="s-title">Đăng ký / Login</div>
          <div class="s-desc">Bằng Mã học sinh (không cần email)</div>
        </div>
        <div class="flow-step-box">
          <div class="s-num">2</div>
          <div class="s-title">Bạn Cho Đăng đồ</div>
          <div class="s-desc">Chụp ảnh, mô tả độ mới & ca rảnh</div>
        </div>
        <div class="flow-step-box">
          <div class="s-num">3</div>
          <div class="s-title">Bạn Nhận Đăng ký</div>
          <div class="s-desc">Gửi nhu cầu & chọn ca nhận</div>
        </div>
        <div class="flow-step-box">
          <div class="s-num">4</div>
          <div class="s-title">Ghép nối LoopMatch</div>
          <div class="s-desc">Chọn người nhận & sinh mã bảo mật</div>
        </div>
        <div class="flow-step-box">
          <div class="s-num">5</div>
          <div class="s-title">Trao nhận tại Trạm</div>
          <div class="s-desc">Quét QR / Đọc mã tại Phòng Đội</div>
        </div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Đề tài Nghiên cứu KHKT: Lê Lợi Loop — THCS Lê Lợi, TP. Đà Nẵng</div>
      <div>Trang 1 / 4</div>
    </div>
  </div>

  <!-- ==================== TRANG 2 ==================== -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="school">Trường THCS Lê Lợi — Sổ Tay Hướng Dẫn Sử Dụng Lê Lợi Loop</div>
        <div class="project-tag">Hướng dẫn Học sinh</div>
      </div>

      <h2 class="section-title">
        <span class="step-num">1</span>
        Bước 1: Hướng dẫn Đăng ký & Đăng nhập Hệ thống
      </h2>
      <p>
        Hệ thống được tối ưu hóa riêng cho học sinh THCS, <strong>không yêu cầu email cá nhân</strong>. Các em chỉ cần tạo tài khoản bằng Mã học sinh:
      </p>
      <ol>
        <li>Truy cập website: <strong style="color: #059669;">https://le-loi-loop.vercel.app/</strong> trên điện thoại hoặc máy tính.</li>
        <li>Bấm nút <strong>"Đăng ký"</strong> ở góc trên thanh menu.</li>
        <li>Điền form đăng ký:
          <ul>
            <li><strong>Họ và tên:</strong> Nhập họ tên đầy đủ của em (VD: <em>Trần Bảo An</em>).</li>
            <li><strong>Mã học sinh / Tên đăng nhập:</strong> Viết liền không dấu (VD: <code>hs001</code>, <code>an71</code>, <code>nam82</code>).</li>
            <li><strong>Lớp & Ca học:</strong> Chọn đúng lớp (6/1 ... 9/4) và ca học (<em>Sáng</em> hoặc <em>Chiều</em>) để hệ thống ghép lịch hẹn chuẩn xác.</li>
            <li><strong>Mật khẩu:</strong> Đặt mật khẩu dễ nhớ (tối thiểu 6 ký tự).</li>
          </ul>
        </li>
        <li>Bấm <strong>"Đăng ký tài khoản"</strong> để kích hoạt tài khoản tức thì!</li>
      </ol>

      <div class="img-card">
        <img src="${images.register}" alt="Form đăng ký học sinh Lê Lợi Loop" />
        <div class="img-caption">Hình 2: Form Đăng ký tài khoản học sinh tích hợp kiểm tra ca học thông minh</div>
      </div>

      <h2 class="section-title">
        <span class="step-num">2</span>
        Bước 2: Hướng dẫn Trao tặng Đồ dùng (Dành cho Bạn Cho)
      </h2>
      <p>
        Khi em có sách cũ, truyện tranh, compa, thước kẻ, cặp sách... còn dùng tốt, hãy chia sẻ lên hệ thống:
      </p>
      <ol>
        <li>Bấm vào tab <strong>"Đăng đồ"</strong> (biểu tượng dấu cộng) trên thanh menu.</li>
        <li>Nhập thông tin món đồ: Tên món đồ, Danh mục (Sách/Vở, Dụng cụ vẽ, Máy tính...), Mô tả độ mới (mới 90%, còn hộp...).</li>
        <li>Chọn ảnh thật chụp từ máy hoặc chọn ảnh gợi ý có sẵn.</li>
        <li>Đánh dấu các <strong>khung giờ ra chơi</strong> em có thể mang đồ đến gửi tại Phòng Đội.</li>
        <li>Bấm <strong>"Đăng món đồ ngay"</strong>. Bài đăng sẽ được lưu ở trạng thái <em>"Chờ duyệt"</em> để thầy cô phụ trách kiểm tra trước khi công khai lên Kho đồ.</li>
      </ol>

      <div class="img-card">
        <img src="${images.donate}" alt="Giao diện đăng đồ trao tặng" />
        <div class="img-caption">Hình 3: Giao diện Đăng đồ trao tặng kèm chọn lịch gửi đồ tại Trạm Lê Lợi</div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Đề tài Nghiên cứu KHKT: Lê Lợi Loop — THCS Lê Lợi, TP. Đà Nẵng</div>
      <div>Trang 2 / 4</div>
    </div>
  </div>

  <!-- ==================== TRANG 3 ==================== -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="school">Trường THCS Lê Lợi — Sổ Tay Hướng Dẫn Sử Dụng Lê Lợi Loop</div>
        <div class="project-tag">Hướng dẫn Học sinh</div>
      </div>

      <h2 class="section-title">
        <span class="step-num">3</span>
        Bước 3: Tìm kiếm & Đăng ký Nhận đồ (Dành cho Bạn Nhận)
      </h2>
      <p>
        Khi em đang thiếu sách giáo khoa, máy tính cầm tay hay dụng cụ học tập, hãy ghé thăm <strong>Kho đồ</strong>:
      </p>
      <ol>
        <li>Vào tab <strong>"Kho đồ"</strong>, sử dụng bộ lọc danh mục hoặc thanh tìm kiếm (VD: <em>Compa</em>, <em>Casio</em>, <em>Toán 7</em>).</li>
        <li>Bấm <strong>"Xem chi tiết"</strong> món đồ em cần để kiểm tra hình ảnh và tình trạng.</li>
        <li>Bấm nút <strong>"Gửi yêu cầu nhận món đồ này"</strong>.</li>
        <li>Điền lý do ngắn gọn (VD: <em>"Compa của em bị hỏng nên cần để học môn Hình học"</em>) và chọn các ca em có thể đến nhận đồ.</li>
        <li>Bấm <strong>"Xác nhận gửi yêu cầu"</strong>.</li>
      </ol>

      <div class="grid-2">
        <div class="img-card">
          <img src="${images.catalog}" alt="Kho đồ dùng học tập" />
          <div class="img-caption">Hình 4A: Kho đồ phân loại khoa học theo môn học</div>
        </div>
        <div class="img-card">
          <img src="${images.detail}" alt="Chi tiết món đồ và nút yêu cầu" />
          <div class="img-caption">Hình 4B: Xem mô tả & Gửi yêu cầu nhận đồ</div>
        </div>
      </div>

      <h2 class="section-title">
        <span class="step-num">4</span>
        Bước 4: Cơ chế Ghép nối LoopMatch & Mã Nhận đồ Bí mật
      </h2>
      <p>
        Khi có nhiều bạn cùng đăng ký một món đồ, thuật toán <strong>LoopMatch</strong> cùng Thầy Cô phụ trách sẽ cân nhắc chọn bạn học sinh thực sự cần nhất (ưu tiên hoàn cảnh khó khăn, sự trùng khớp ca học và điểm đóng góp xanh).
      </p>
      <p>
        Khi em được chọn là người nhận chính thức, hệ thống sẽ gửi thông báo và hiển thị trong mục <strong>"Hoạt động"</strong> một <strong>Lịch hẹn nhận đồ</strong> kèm <strong>MÃ NHẬN ĐỒ BÍ MẬT</strong> (VD: <code>LOOP-7429</code> hoặc mã QR).
      </p>

      <div class="callout callout-amber">
        <strong>🔒 NGUYÊN TẮC BẢO MẬT & TẾ NHỊ TUYỆT ĐỐI:</strong>
        <br>• Mã nhận đồ này <strong>chỉ có riêng em và Đội trực trạm</strong> biết.
        <br>• Bạn cho đồ cũng <strong>không biết</strong> ai là người nhận. Em hoàn toàn yên tâm về sự riêng tư!
      </div>

      <div class="img-card">
        <img src="${images.pickupCode}" alt="Mã nhận đồ bí mật và lịch hẹn tại trạm" />
        <div class="img-caption">Hình 5: Lịch hẹn và Mã nhận đồ bảo mật hiển thị trong mục "Hoạt động của tôi"</div>
      </div>
    </div>

    <div class="doc-footer">
      <div>Đề tài Nghiên cứu KHKT: Lê Lợi Loop — THCS Lê Lợi, TP. Đà Nẵng</div>
      <div>Trang 3 / 4</div>
    </div>
  </div>

  <!-- ==================== TRANG 4 ==================== -->
  <div class="page">
    <div>
      <div class="doc-header">
        <div class="school">Trường THCS Lê Lợi — Sổ Tay Hướng Dẫn Sử Dụng Lê Lợi Loop</div>
        <div class="project-tag">Hướng dẫn Học sinh</div>
      </div>

      <h2 class="section-title">
        <span class="step-num">5</span>
        Bước 5: Tiếp nhận & Bàn giao Thực tế tại Trạm Lê Lợi
      </h2>

      <h3 class="sub-title">5.1. Dành cho Bạn Cho: Nộp đồ tại Trạm</h3>
      <p>
        Theo lịch đã hẹn, em mang món đồ sạch sẽ đến <strong>Phòng Đội / Trạm KHKT</strong>. Đội Tình nguyện sẽ kiểm tra chất lượng, in phiếu tiếp nhận dán tem QR lên đồ dùng và cất vào <strong>Ô tủ kệ lưu trữ (K1 - K10)</strong>. Em sẽ được cộng Điểm Xanh (Green Points) vinh danh!
      </p>

      <h3 class="sub-title">5.2. Dành cho Bạn Nhận: Nhận đồ tại Trạm</h3>
      <p>
        Đến Phòng Đội đúng khung giờ ra chơi đã hẹn. Em mở điện thoại cho Đội trực quét mã QR hoặc đọc to <strong>Mã nhận đồ</strong> (VD: <code>LOOP-7429</code>). Đội trực đối chiếu trên hệ thống và trao đồ tận tay em!
      </p>

      <div class="grid-2">
        <div class="img-card">
          <img src="${images.ticketModal}" alt="Phiếu tiếp nhận và tem QR dán lên đồ dùng" />
          <div class="img-caption">Hình 6A: Phiếu tiếp nhận & Tem QR định vị dán lên đồ dùng</div>
        </div>
        <div class="img-card">
          <img src="${images.handover}" alt="Màn hình bàn giao thành công tại trạm" />
          <div class="img-caption">Hình 6B: Màn hình đối chiếu mã & Bàn giao hoàn tất</div>
        </div>
      </div>

      <h2 class="section-title">
        <span class="step-num">★</span>
        3. Khung Giờ Hoạt Động & Văn Hóa Ứng Xử Học Sinh
      </h2>

      <table class="custom-table">
        <thead>
          <tr>
            <th style="width: 22%;">Buổi học</th>
            <th style="width: 32%;">Khung giờ mở cửa Trạm</th>
            <th style="width: 23%;">Địa điểm</th>
            <th style="width: 23%;">Đội ngũ trực</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Ca Sáng</strong> (T2 – T6)</td>
            <td><strong>09:15 – 10:00</strong> (Ra chơi sáng)</td>
            <td>Văn phòng Đội</td>
            <td>CLB Tình nguyện Lê Lợi</td>
          </tr>
          <tr>
            <td><strong>Ca Chiều</strong> (T2 – T6)</td>
            <td><strong>14:00 – 14:45</strong> (Ra chơi chiều)</td>
            <td>Văn phòng Đội</td>
            <td>CLB Tình nguyện Lê Lợi</td>
          </tr>
        </tbody>
      </table>

      <div class="callout callout-green">
        <strong>🌿 VĂN HÓA ỨNG XỬ "3 ĐÚNG - 3 KHÔNG" TẠI LÊ LỢI LOOP:</strong>
        <br>✔ <strong>Đúng hẹn:</strong> Đến nộp và nhận đồ đúng ca đã hẹn để không làm phiền bạn trực trạm.
        <br>✔ <strong>Đúng chất lượng:</strong> Chỉ trao tặng đồ dùng còn nguyên vẹn, sử dụng tốt, đã làm sạch.
        <br>✔ <strong>Đúng tinh thần:</strong> Nâng niu, giữ gìn đồ dùng sau khi nhận; lan tỏa tinh thần sẻ chia.
        <br>✖ <strong>Không vụ lợi:</strong> Toàn bộ hoạt động đều miễn phí, nghiêm cấm mọi hình thức mua bán.
        <br>✖ <strong>Không spam:</strong> Không đăng đồ hư hỏng hoặc đăng ký xin đồ bừa bãi khi không có nhu cầu.
        <br>✖ <strong>Không để lộ mã:</strong> Bảo mật mã nhận đồ của mình để tránh việc thất lạc đồ dùng.
      </div>

      <div class="callout callout-blue">
        <strong>📞 THÔNG TIN HỖ TRỢ:</strong> Thầy Nguyễn Văn A (Phụ trách KHKT - Văn phòng Đội) • Trực tiếp trên website qua mục góp ý.
      </div>
    </div>

    <div class="doc-footer">
      <div>Đề tài Nghiên cứu KHKT: Lê Lợi Loop — THCS Lê Lợi, TP. Đà Nẵng © 2026</div>
      <div>Trang 4 / 4</div>
    </div>
  </div>

</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 Đang khởi tạo Playwright để biên dịch PDF...');
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('📄 Đang nạp nội dung tài liệu HTML...');
  await page.setContent(htmlContent, { waitUntil: 'load' });

  const outputPdfPath = path.resolve('Huong_Dan_Su_Dung_Le_Loi_Loop.pdf');
  const publicPdfPath = path.resolve('public/Huong_Dan_Su_Dung_Le_Loi_Loop.pdf');

  console.log('🖨️ Đang xuất tệp PDF A4 chuẩn in ấn...');
  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  if (!fs.existsSync(path.resolve('public'))) {
    fs.mkdirSync(path.resolve('public'), { recursive: true });
  }
  fs.copyFileSync(outputPdfPath, publicPdfPath);

  await browser.close();
  console.log(`✅ Xuất thành công tệp PDF tại: ${outputPdfPath}`);
  console.log(`✅ Đã copy bản sao vào thư mục Web public: ${publicPdfPath}`);
}

generatePDF().catch(err => {
  console.error('❌ Lỗi khi xuất PDF:', err);
  process.exit(1);
});
