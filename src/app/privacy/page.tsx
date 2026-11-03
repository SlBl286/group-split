import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Smartphone,
  Lock,
  Database,
  Share2,
  Trash2,
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Bell,
  CreditCard,
} from "lucide-react";

export const metadata = {
  title: "Chính sách quyền riêng tư | GroupSplit - Privacy Policy",
  description:
    "Chính sách quyền riêng tư của ứng dụng GroupSplit và phiên bản di động trên Google Play & App Store. Minh bạch về thu thập, sử dụng và bảo mật dữ liệu.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "03/11/2026";
  const effectiveDate = "01/01/2026";

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-5xl mx-auto items-center justify-between px-4">
          <BrandLogo size="md" href="/" />

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs sm:text-sm font-medium">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header Banner */}
          <div className="space-y-4 border-b pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-none font-semibold text-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                Google Play Compliant
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Hiệu lực: {effectiveDate}
              </Badge>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Cập nhật lần cuối: {lastUpdated}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
              Chính sách quyền riêng tư
              <span className="block text-xl sm:text-2xl font-semibold text-muted-foreground mt-2">
                Privacy Policy - GroupSplit
              </span>
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Chào mừng bạn đến với <strong>GroupSplit</strong> (&quot;chúng tôi&quot;, &quot;ứng dụng&quot; hoặc &quot;dịch vụ&quot;). 
              Chúng tôi cam kết tôn trọng và bảo vệ tối đa quyền riêng tư cũng như dữ liệu cá nhân của người dùng trên cả nền tảng Web 
              và ứng dụng di động (Android &amp; iOS). Chính sách quyền riêng tư này giải thích rõ ràng và minh bạch về cách chúng tôi 
              thu thập, sử dụng, lưu trữ, xử lý và chia sẻ dữ liệu liên quan đến bạn cũng như thiết bị của bạn khi sử dụng GroupSplit.
            </p>
          </div>

          {/* Quick Notice Callout */}
          <div className="p-4 sm:p-5 rounded-xl border border-primary/20 bg-primary/5 flex items-start gap-3.5">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed text-foreground/90 space-y-1">
              <p className="font-semibold text-foreground">Cam kết bảo vệ dữ liệu người dùng:</p>
              <p>
                GroupSplit <strong>tuyệt đối không bán hoặc thương mại hóa dữ liệu cá nhân</strong> của bạn cho các bên thứ ba. Mọi dữ liệu thu thập chỉ nhằm mục đích duy nhất là vận hành chức năng tính toán chi tiêu nhóm, đồng bộ hóa hóa đơn, gửi thông báo đẩy và hỗ trợ chuyển khoản thanh toán VietQR chính xác.
              </p>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="p-5 rounded-xl border bg-card/60">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Mục lục nội dung
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <a href="#section-1" className="text-muted-foreground hover:text-primary transition-colors">1. Thông tin và dữ liệu chúng tôi thu thập</a>
              <a href="#section-2" className="text-muted-foreground hover:text-primary transition-colors">2. Mục đích sử dụng dữ liệu</a>
              <a href="#section-3" className="text-muted-foreground hover:text-primary transition-colors">3. Dữ liệu thiết bị &amp; Quyền truy cập ứng dụng di động</a>
              <a href="#section-4" className="text-muted-foreground hover:text-primary transition-colors">4. Chia sẻ dữ liệu với bên thứ ba</a>
              <a href="#section-5" className="text-muted-foreground hover:text-primary transition-colors">5. Lưu trữ và Bảo mật dữ liệu</a>
              <a href="#section-6" className="text-muted-foreground hover:text-primary transition-colors">6. Quyền của bạn &amp; Hướng dẫn xóa dữ liệu</a>
              <a href="#section-7" className="text-muted-foreground hover:text-primary transition-colors">7. Quyền riêng tư của trẻ em</a>
              <a href="#section-8" className="text-muted-foreground hover:text-primary transition-colors">8. Thay đổi chính sách &amp; Thông tin liên hệ</a>
            </div>
          </div>

          {/* Section 1 */}
          <section id="section-1" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">1</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Thông tin và dữ liệu chúng tôi thu thập (Data We Collect)</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>Khi bạn tạo tài khoản và sử dụng GroupSplit, chúng tôi có thể thu thập các loại dữ liệu sau:</p>
              
              <div className="space-y-3">
                <div className="rounded-lg border p-4 bg-card/40">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-1.5">
                    <UserCheck className="h-4 w-4 text-primary" />
                    a. Dữ liệu tài khoản cá nhân (Account Information)
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
                    <li><strong>Tên hiển thị (Display Name)</strong>: Để hiển thị với các thành viên khác trong nhóm của bạn.</li>
                    <li><strong>Tên người dùng (Username)</strong>: Dùng để định danh tài khoản khi đăng nhập.</li>
                    <li><strong>Địa chỉ Email</strong>: Dùng để xác thực tài khoản, gửi thông báo hệ thống và hỗ trợ đặt lại mật khẩu an toàn.</li>
                    <li><strong>Mật khẩu</strong>: Được mã hóa băm một chiều an toàn bằng thuật toán mật mã tiêu chuẩn cao (chúng tôi không bao giờ lưu trữ mật khẩu dưới dạng văn bản thuần).</li>
                    <li><strong>Ảnh đại diện (Avatar)</strong>: Ảnh tùy chọn tải lên từ thiết bị hoặc đường dẫn ảnh đại diện để nhận diện cá nhân trong nhóm.</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4 bg-card/40">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-500" />
                    b. Dữ liệu ngân hàng phục vụ tạo mã VietQR (Financial &amp; Banking Details)
                  </h3>
                  <p className="text-xs sm:text-sm mb-2">
                    Nhằm mục đích tự động tạo mã thanh toán VietQR giúp bạn bè chuyển tiền trả nợ trực tiếp qua ứng dụng ngân hàng, người dùng có thể tùy ý cung cấp:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
                    <li>Tên ngân hàng thụ hưởng (ví dụ: Vietcombank, MBBank, Techcombank...).</li>
                    <li>Số tài khoản ngân hàng.</li>
                    <li>Tên chủ tài khoản thụ hưởng.</li>
                  </ul>
                  <div className="mt-2 text-xs bg-amber-500/10 text-amber-800 dark:text-amber-300 p-2.5 rounded border border-amber-500/20">
                    <strong>Lưu ý quan trọng:</strong> GroupSplit <strong>không phải là tổ chức trung gian thanh toán</strong> và <strong>không thu thập</strong> thông tin số thẻ tín dụng/ghi nợ, ngày hết hạn, mã bảo mật CVV/CVC, mã OTP xác thực hoặc mật khẩu đăng nhập Internet Banking của bạn. Tiền được chuyển trực tiếp giữa tài khoản ngân hàng của các cá nhân.
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-card/40">
                  <h3 className="font-semibold text-foreground flex items-center gap-2 mb-1.5">
                    <Database className="h-4 w-4 text-blue-500" />
                    c. Dữ liệu hoạt động chi tiêu &amp; nhóm (Expense &amp; Activity Data)
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm pl-1">
                    <li>Danh sách nhóm bạn tạo hoặc tham gia, tên nhóm, hình ảnh nhóm.</li>
                    <li>Các hóa đơn, chi phí chi tiết, ngày chi tiêu, danh mục, tỷ lệ phân chia giữa các thành viên.</li>
                    <li>Lịch sử thanh toán quyết toán nợ và ghi nhận đóng góp quỹ chung.</li>
                    <li>Hình ảnh hóa đơn, chứng từ chi tiêu do người dùng tự nguyện tải lên đính kèm.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">2</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Mục đích sử dụng dữ liệu (How We Use Information)</h2>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>Dữ liệu được thu thập được sử dụng duy nhất cho các mục đích hợp pháp sau đây:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-1">
                <li><strong>Cung cấp tính năng cốt lõi:</strong> Tính toán tỷ lệ chia tiền, phân bổ quỹ nhóm, tự động tổng hợp công nợ và tối ưu số lượng giao dịch chuyển tiền cần thực hiện giữa các thành viên.</li>
                <li><strong>Tạo mã QR chuyển khoản:</strong> Tự động tích hợp thông tin số tài khoản và số tiền cần thanh toán vào mã chuẩn VietQR để người dùng chuyển khoản nhanh chóng, chính xác.</li>
                <li><strong>Gửi thông báo tức thời:</strong> Thông báo khi có chi tiêu mới, yêu cầu duyệt chi, nhắc nợ hoặc xác nhận thành viên chuyển khoản thành công.</li>
                <li><strong>Bảo mật tài khoản:</strong> Xác minh người dùng khi đăng nhập, phát hiện và ngăn chặn hành vi truy cập trái phép hoặc tấn công mạng.</li>
                <li><strong>Cải thiện và nâng cấp ứng dụng:</strong> Đánh giá hiệu suất hệ thống, sửa lỗi phần mềm và tối ưu hóa trải nghiệm người dùng trên thiết bị di động.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">3</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Dữ liệu thiết bị &amp; Quyền ứng dụng di động (Mobile Device &amp; Permissions)</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>
                Để phiên bản ứng dụng di động trên Cửa hàng Google Play và Apple App Store hoạt động ổn định và gửi thông báo kịp thời, hệ thống thu thập thông tin kỹ thuật của thiết bị:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-lg border bg-card/40">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm mb-1">
                    <Smartphone className="h-4 w-4 text-primary" />
                    Mã định danh thiết bị (Device ID)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Định danh phiên đăng nhập duy nhất trên từng thiết bị (UUID), giúp người dùng quản lý các thiết bị đang đăng nhập và có thể thu hồi quyền đăng nhập từ xa bất cứ lúc nào.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card/40">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm mb-1">
                    <Bell className="h-4 w-4 text-blue-500" />
                    Push Notification Token
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mã thiết bị từ Google Firebase Cloud Messaging (FCM) hoặc Apple APNs để gửi thông báo đẩy đến điện thoại khi có cập nhật mới về hóa đơn hay thanh toán.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card/40">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm mb-1">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    Thông tin phần cứng &amp; Hệ điều hành
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Tên thiết bị (Model), loại hệ điều hành (Android / iOS), phiên bản OS và phiên bản ứng dụng nhằm đảm bảo tính tương thích và xử lý lỗi ứng dụng khi phát sinh sự cố.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border bg-card/40">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-xs sm:text-sm mb-1">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                    Nhật ký kỹ thuật &amp; Địa chỉ IP
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Địa chỉ IP và thời điểm truy cập gần nhất (last active) được ghi nhận nhằm mục đích an ninh thông tin, phòng chống tấn công brute-force và lạm dụng API.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-muted/40 border text-xs sm:text-sm space-y-1">
                <p className="font-semibold text-foreground">Các quyền truy cập thiết bị (Permissions Request):</p>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>Quyền thông báo (POST_NOTIFICATIONS):</strong> Cho phép gửi thông báo đẩy về các hoạt động nhóm. Người dùng có thể bật/tắt quyền này bất kỳ lúc nào trong Cài đặt hệ thống của điện thoại.</li>
                  <li><strong>Quyền truy cập bộ nhớ/ảnh hoặc camera (Nếu tải ảnh biên lai):</strong> Chỉ được yêu cầu khi bạn chủ động nhấn nút chọn ảnh biên lai chi tiêu hoặc tải mã QR lên ứng dụng.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">4</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Chia sẻ dữ liệu với bên thứ ba (Third-Party Services)</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>
                GroupSplit chỉ chia sẻ dữ liệu với các đối tác cung cấp dịch vụ hạ tầng kỹ thuật đáng tin cậy nhằm duy trì hoạt động của ứng dụng:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-1">
                <li>
                  <strong className="text-foreground">Google Firebase Cloud Messaging (FCM):</strong> 
                  Sử dụng để gửi thông báo đẩy đến điện thoại Android của bạn. Firebase chỉ nhận mã Push Token để định tuyến thông báo và tuân thủ các quy định bảo mật của Google.
                </li>
                <li>
                  <strong className="text-foreground">Cổng kết nối SePay (Tùy chọn):</strong> 
                  Nếu bạn kích hoạt tính năng tự động nhận diện giao dịch qua SePay Webhook, thông tin nội dung chuyển khoản được đối soát tự động để cập nhật trạng thái hóa đơn.
                </li>
                <li>
                  <strong className="text-foreground">Dịch vụ gửi Email (Resend / SMTP Server):</strong> 
                  Sử dụng địa chỉ email của bạn để gửi mã OTP, liên kết kích hoạt tài khoản hoặc đặt lại mật khẩu.
                </li>
                <li>
                  <strong className="text-foreground">Zalo Bot API (Tùy chọn):</strong> 
                  Chỉ nhận thông tin mã chat ID cá nhân khi bạn tự nguyện bấm liên kết để nhận thông báo qua Zalo.
                </li>
              </ul>
              <div className="p-3 rounded-lg border bg-muted/20 text-xs">
                <strong>Cam kết rõ ràng:</strong> Chúng tôi <strong>không tích hợp SDK quảng cáo thu thập hành vi người dùng</strong> và <strong>không cung cấp dữ liệu cho bất kỳ nhà môi giới dữ liệu (data brokers)</strong> nào.
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">5</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Lưu trữ và Bảo mật dữ liệu (Storage &amp; Data Security)</h2>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>Chúng tôi áp dụng các tiêu chuẩn kỹ thuật hàng đầu để bảo vệ dữ liệu người dùng:</p>
              <ul className="list-disc list-inside space-y-1.5 pl-1">
                <li><strong>Mã hóa đường truyền (HTTPS/TLS):</strong> Toàn bộ dữ liệu trao đổi giữa thiết bị di động/trình duyệt và máy chủ GroupSplit đều được mã hóa qua giao thức SSL/TLS an toàn.</li>
                <li><strong>Mã hóa mật khẩu:</strong> Mật khẩu người dùng được băm an toàn, đảm bảo ngay cả quản trị viên hệ thống cũng không thể đọc được mật khẩu gốc.</li>
                <li><strong>Xác thực phiên làm việc:</strong> Sử dụng Token bảo mật có thời hạn và cơ chế Refresh Token được kiểm soát chặt chẽ trên từng thiết bị di động.</li>
                <li><strong>Thời gian lưu trữ:</strong> Dữ liệu được lưu trữ trong thời gian tài khoản của bạn đang hoạt động trên hệ thống hoặc cho tới khi bạn thực hiện quyền yêu cầu xóa dữ liệu.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 - Crucial for Google Play Compliance */}
          <section id="section-6" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">6</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quyền của bạn &amp; Hướng dẫn xóa dữ liệu (User Rights &amp; Data Deletion)</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>
                Tuân thủ nghiêm ngặt <strong>Chính sách dữ liệu người dùng của Google Play</strong>, bạn luôn có toàn quyền kiểm soát dữ liệu cá nhân của mình:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border bg-card/50">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-1.5">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Quyền truy cập và cập nhật thông tin
                  </h3>
                  <p className="text-xs sm:text-sm">
                    Bạn có thể xem, chỉnh sửa tên hiển thị, ảnh đại diện, thông tin tài khoản ngân hàng bất kỳ lúc nào tại mục <strong>Cài đặt tài khoản (Settings)</strong> trên ứng dụng hoặc website.
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-card/50">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2 mb-1.5">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                    Quản lý &amp; Hủy kích hoạt thiết bị di động
                  </h3>
                  <p className="text-xs sm:text-sm">
                    Khi đăng nhập trên thiết bị mới, bạn có thể kiểm tra danh sách thiết bị đã liên kết và chủ động đăng xuất hoặc thu hồi quyền truy cập (revoke) để vô hiệu hóa ngay lập tức mã Push Token trên thiết bị cũ.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                  <h3 className="font-semibold text-destructive text-sm flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4" />
                    Quy trình yêu cầu xóa tài khoản và xóa vĩnh viễn dữ liệu (Account &amp; Data Deletion Request)
                  </h3>
                  <p className="text-xs sm:text-sm mb-2 text-foreground/90">
                    Người dùng có quyền yêu cầu xóa vĩnh viễn tài khoản và toàn bộ dữ liệu liên quan khỏi hệ thống GroupSplit mà không cần chịu bất kỳ điều kiện ràng buộc nào:
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm pl-1 text-foreground/85">
                    <li>
                      <strong>Cách gửi yêu cầu:</strong> Gửi email trực tiếp từ địa chỉ email bạn đã đăng ký đến hộp thư hỗ trợ chính thức: <a href="mailto:support@qy286.me" className="text-primary font-semibold underline">support@qy286.me</a> với tiêu đề <code>[Yêu cầu xóa tài khoản GroupSplit]</code>.
                    </li>
                    <li>
                      <strong>Nội dung yêu cầu bao gồm:</strong> Tên đăng nhập (Username) và địa chỉ Email tài khoản cần xóa.
                    </li>
                    <li>
                      <strong>Thời gian xử lý:</strong> Đội ngũ quản trị sẽ xác minh quyền sở hữu và tiến hành xóa hoàn toàn dữ liệu trong vòng <strong>tối đa 7 ngày làm việc</strong> kể từ khi tiếp nhận yêu cầu.
                    </li>
                    <li>
                      <strong>Phạm vi dữ liệu bị xóa vĩnh viễn:</strong> Toàn bộ thông tin hồ sơ người dùng, email, mật khẩu, thông tin tài khoản ngân hàng liên kết, mã định danh thiết bị (Device IDs), token thông báo và các thiết lập liên quan.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">7</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Quyền riêng tư của trẻ em (Children&apos;s Privacy)</h2>
            </div>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>
                Ứng dụng GroupSplit không hướng đến và không chủ ý thu thập thông tin nhận dạng cá nhân từ trẻ em dưới 13 tuổi (hoặc độ tuổi tối thiểu theo quy định của pháp luật sở tại).
              </p>
              <p>
                Nếu phụ huynh hoặc người giám hộ phát hiện con em mình đã cung cấp thông tin cá nhân cho chúng tôi mà không có sự đồng ý của cha mẹ, vui lòng liên hệ ngay với chúng tôi tại <a href="mailto:support@qy286.me" className="text-primary underline">support@qy286.me</a>. Chúng tôi sẽ nhanh chóng thực hiện các biện pháp cần thiết để xóa ngay thông tin đó khỏi máy chủ.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">8</div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Thay đổi chính sách &amp; Thông tin liên hệ (Contact Information)</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-2 sm:pl-10">
              <p>
                Chúng tôi có thể cập nhật Chính sách quyền riêng tư này theo thời gian nhằm phản ánh các tính năng mới hoặc tuân thủ các quy định pháp luật cũng như chính sách cập nhật của Google Play. Khi có sự thay đổi quan trọng, chúng tôi sẽ thông báo trực tiếp trên ứng dụng hoặc cập nhật ngày &quot;Cập nhật lần cuối&quot; ở đầu trang web này.
              </p>

              <div className="rounded-xl border p-5 bg-card/60 space-y-2.5 text-foreground">
                <h3 className="font-bold text-sm uppercase tracking-wider text-primary">Thông tin liên hệ chính thức:</h3>
                <div className="text-xs sm:text-sm space-y-1.5 text-muted-foreground">
                  <p><strong>Ứng dụng:</strong> GroupSplit - Chia tiền nhóm thông minh</p>
                  <p><strong>Đội ngũ phát triển:</strong> Ban quản trị GroupSplit Team</p>
                  <p className="flex items-center gap-1.5">
                    <strong>Hòm thư hỗ trợ quyền riêng tư:</strong> 
                    <a href="mailto:support@qy286.me" className="text-primary font-medium hover:underline flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      support@qy286.me
                    </a>
                  </p>
                  <p><strong>Website chính thức:</strong> <Link href="/" className="text-primary hover:underline">https://groupsplit.qy286.me</Link></p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Back Button */}
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} GroupSplit. Mọi quyền được bảo lưu.</p>
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Quay về trang chủ
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

