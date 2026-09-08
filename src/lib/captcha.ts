import crypto from "node:crypto";

const SECRET = process.env.AUTH_SECRET || "groupsplit_captcha_secret_key_2026";

export interface CaptchaData {
  id: string;
  question: string;
  hash: string;
}

export interface Riddle {
  question: string;
  answers: string[];
}

/**
 * Danh sách câu đố mẹo hay, phổ biến, câu hỏi và đáp án rõ ràng.
 * Mỗi câu đố bao gồm nhiều biến thể câu trả lời được chấp nhận.
 */
export const RIDDLE_BANK: Riddle[] = [
  // --- Nhóm câu đố mẹo có kết quả là SỐ ---
  {
    question: "Một năm có 7 tháng có 31 ngày. Hỏi có bao nhiêu tháng có 28 ngày? (Gợi ý: Điền số)",
    answers: ["12", "mười hai", "muoi hai", "12 tháng", "12 thang"],
  },
  {
    question: "Bạn có 3 quả táo, bạn lấy đi 2 quả. Hỏi bạn còn lại mấy quả táo? (Gợi ý: Điền số)",
    answers: ["2", "hai", "2 quả", "2 qua"],
  },
  {
    question: "Bố mẹ có 6 người con trai, mỗi người con trai có 1 cô em gái. Hỏi gia đình có mấy người con? (Gợi ý: Điền số)",
    answers: ["7", "bảy", "bay", "7 người", "7 con"],
  },
  {
    question: "1 đàn vịt: 2 con đi trước 2 con, 2 con đi sau 2 con, 2 con đi giữa 2 con. Có mấy con vịt? (Gợi ý: Điền số)",
    answers: ["4", "bốn", "bon", "tư", "tu", "4 con"],
  },
  {
    question: "Có 10 ngọn nến đang cháy, gió thổi tắt 3 ngọn, sau đó tắt thêm 2 ngọn. Hỏi cuối cùng còn lại mấy ngọn nến? (Gợi ý: Điền số)",
    answers: ["5", "năm", "nam", "5 ngọn", "5 cay"],
  },
  {
    question: "Ốc sên leo cây cao 10m: ngày leo 3m, đêm tụt 2m. Sau bao nhiêu ngày thì lên tới đỉnh? (Gợi ý: Điền số)",
    answers: ["8", "tám", "tam", "8 ngày", "8 ngay"],
  },
  {
    question: "Chia 30 cho 1/2 rồi cộng thêm 10 thì bằng bao nhiêu? (Gợi ý: Điền số)",
    answers: ["70", "bảy mươi", "bay muoi"],
  },
  {
    question: "Một người có 3 đứa con: con đầu tên Xuân, con thứ 2 tên Hạ, con thứ 3 tên Thu. Nhà có mấy người? (Gợi ý: Điền số)",
    answers: ["5", "năm", "nam", "5 người", "5 nguoi"],
  },

  // --- Nhóm câu đố mẹo chữ / đời sống hài hước ---
  {
    question: "Con gì đập thì sống, không đập thì chết? (Gợi ý: 2 - 3 chữ)",
    answers: ["tim", "con tim", "trái tim", "trai tim", "quả tim", "qua tim"],
  },
  {
    question: "Bố mẹ của Nam có 3 người con: Xuân, Hạ. Người thứ ba tên là gì?",
    answers: ["Nam", "nam", "bé Nam", "be nam"],
  },
  {
    question: "Quần gì rộng nhất thế giới? (Gợi ý: 2 chữ)",
    answers: ["quần đảo", "quan dao"],
  },
  {
    question: "Cái gì tay trái cầm được mà tay phải không bao giờ cầm được? (Gợi ý: 2 chữ)",
    answers: ["tay phải", "tay phai", "cánh tay phải", "cùi chỏ phải", "khuỷu tay phải"],
  },
  {
    question: "Lịch nào dài nhất? (Gợi ý: 2 chữ)",
    answers: ["lịch sử", "lich su"],
  },
  {
    question: "Xã nào đông dân nhất thế giới? (Gợi ý: 2 chữ)",
    answers: ["xã hội", "xa hoi"],
  },
  {
    question: "Con đường nào dài nhất trong cuộc đời một con người? (Gợi ý: 2 chữ)",
    answers: ["đường đời", "duong doi"],
  },
  {
    question: "Cái gì đi thì nằm, đứng thì nằm, nhưng nằm lại đứng? (Gợi ý: Bộ phận cơ thể)",
    answers: ["bàn chân", "ban chan", "chân", "chan", "bàn chân người"],
  },
  {
    question: "Bỏ ngoài nướng trong, ăn ngoài bỏ trong là gì? (Gợi ý: 1 - 2 chữ)",
    answers: ["bắp", "ngô", "bắp ngô", "trái bắp", "trai bap", "ngo", "bap"],
  },
  {
    question: "Cái gì người mua biết, người bán biết, người dùng không bao giờ biết? (Gợi ý: 2 chữ)",
    answers: ["quan tài", "quan tai", "áo quan", "ao quan"],
  },
  {
    question: "Núi nào bị chặt ra từng khúc? (Gợi ý: 2 chữ)",
    answers: ["thái sơn", "thai son", "núi thái sơn", "nui thai son"],
  },
  {
    question: "Bệnh gì bác sĩ phải bó tay? (Gợi ý: 2 chữ)",
    answers: ["gãy tay", "gay tay", "bệnh gãy tay", "gay tay"],
  },
  {
    question: "Hoa gì biết nói và biết đi? (Gợi ý: 2 chữ)",
    answers: ["hoa hậu", "hoa hau", "người đẹp"],
  },
  {
    question: "Cái gì có 4 chân nhưng không bao giờ biết đi? (Gợi ý: Đồ vật trong nhà)",
    answers: ["bàn", "cái bàn", "ghế", "cái ghế", "ban", "cai ban", "ghe", "cai ghe"],
  },
  {
    question: "Cái gì bạn không bao giờ mượn nhưng luôn luôn phải trả? (Gợi ý: 2 chữ)",
    answers: ["lời chào", "loi chao", "câu trả lời", "cau tra loi", "lời cảm ơn", "loi cam on"],
  },
];

/**
 * Chuẩn hóa chuỗi câu trả lời:
 * - Chuyển chữ thường
 * - Bỏ dấu tiếng Việt (NFD)
 * - Loại bỏ khoảng trắng và ký tự đặc biệt
 */
export function normalizeAnswer(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

/**
 * Sinh ngẫu nhiên câu đố mẹo và tạo mã băm hash HMAC để xác thực
 */
export function generateCaptcha(): CaptchaData {
  const riddleIndex = Math.floor(Math.random() * RIDDLE_BANK.length);
  const riddle = RIDDLE_BANK[riddleIndex];

  const id = crypto.randomBytes(8).toString("hex");
  const timestamp = Date.now();
  const rawPayload = `${id}:${riddleIndex}:${timestamp}`;

  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(rawPayload)
    .digest("hex");

  // Format: signature.timestamp.riddleIndex
  const hash = `${signature}.${timestamp}.${riddleIndex}`;

  return {
    id,
    question: riddle.question,
    hash,
  };
}

/**
 * Kiểm tra câu trả lời CAPTCHA từ phía client gửi lên
 */
export function verifyCaptcha(
  id: string,
  userAnswer: string,
  hash: string
): boolean {
  if (!id || !userAnswer || !hash) return false;

  const parts = hash.split(".");
  if (parts.length < 3) return false;

  const [expectedSignature, timestampStr, riddleIndexStr] = parts;
  const timestamp = Number(timestampStr);
  const riddleIndex = Number(riddleIndexStr);

  // Hết hạn CAPTCHA sau 5 phút
  if (isNaN(timestamp) || Date.now() - timestamp > 5 * 60 * 1000) {
    return false;
  }

  if (isNaN(riddleIndex) || riddleIndex < 0 || riddleIndex >= RIDDLE_BANK.length) {
    return false;
  }

  // Xác thực chữ ký HMAC để bảo đảm câu hỏi & timestamp không bị can thiệp
  const rawPayload = `${id}:${riddleIndex}:${timestamp}`;
  const computedSignature = crypto
    .createHmac("sha256", SECRET)
    .update(rawPayload)
    .digest("hex");

  let isSignatureValid = false;
  try {
    isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }

  if (!isSignatureValid) {
    return false;
  }

  // Kiểm tra câu trả lời với các đáp án hợp lệ đã được chuẩn hóa
  const riddle = RIDDLE_BANK[riddleIndex];
  const normalizedUser = normalizeAnswer(userAnswer);

  if (!normalizedUser) return false;

  return riddle.answers.some(
    (ans) => normalizeAnswer(ans) === normalizedUser
  );
}
