import ExcelJS from "exceljs";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export interface ExpenseExportData {
  group: {
    id: string;
    name: string;
    currency?: string;
  };
  dateRange: {
    from?: string | null;
    to?: string | null;
  };
  expenses: {
    id: string;
    title: string;
    description?: string | null;
    amount: number;
    date: Date;
    category: string;
    fundingSource: string; // "MEMBER" | "FUND"
    paidBy: {
      displayName: string;
      username: string;
    };
    splits: {
      amount: number;
      user: {
        displayName: string;
        username: string;
      };
    }[];
  }[];
  members: {
    userId: string;
    user: {
      displayName: string;
      username: string;
    };
  }[];
}

export async function generateGroupExpensesWorkbook(data: ExpenseExportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "GroupSplit";
  workbook.lastModifiedBy = "GroupSplit System";
  workbook.created = new Date();
  workbook.modified = new Date();

  const { group, dateRange, expenses, members } = data;

  // Format date labels
  const fromLabel = dateRange.from ? format(new Date(dateRange.from), "dd/MM/yyyy") : "Bắt đầu";
  const toLabel = dateRange.to ? format(new Date(dateRange.to), "dd/MM/yyyy") : "Hiện tại";
  const exportedAtStr = format(new Date(), "HH:mm, dd/MM/yyyy", { locale: vi });

  // -------------------------------------------------------------
  // SHEET 1: CHI TIẾT CHI TIÊU
  // -------------------------------------------------------------
  const sheet1 = workbook.addWorksheet("Chi tiết chi tiêu", {
    views: [{ showGridLines: true }],
  });

  // Title & Metadata Rows
  sheet1.mergeCells("A1:I1");
  const titleCell1 = sheet1.getCell("A1");
  titleCell1.value = `BÁO CÁO CHI TIẾT CHI TIÊU - ${group.name.toUpperCase()}`;
  titleCell1.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell1.alignment = { horizontal: "center", vertical: "middle" };
  sheet1.getRow(1).height = 36;

  sheet1.mergeCells("A2:I2");
  const subCell1 = sheet1.getCell("A2");
  subCell1.value = `Khoảng thời gian: ${fromLabel} - ${toLabel}  |  Ngày xuất: ${exportedAtStr}`;
  subCell1.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF475569" } };
  subCell1.alignment = { horizontal: "center", vertical: "middle" };
  sheet1.getRow(2).height = 20;

  sheet1.addRow([]); // Blank row 3

  // Table Headers
  const headersSheet1 = [
    "STT",
    "Ngày chi",
    "Nội dung chi tiêu",
    "Danh mục",
    "Số tiền (VNĐ)",
    "Người chi trả",
    "Nguồn tiền",
    "Chi tiết người chia tiền",
    "Ghi chú",
  ];
  const headerRow1 = sheet1.addRow(headersSheet1);
  headerRow1.height = 28;
  headerRow1.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" }, // Blue-800
    };
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF1E3A8A" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } },
    };
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: "thin", color: { argb: "FFE2E8F0" } },
    bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
    left: { style: "thin", color: { argb: "FFE2E8F0" } },
    right: { style: "thin", color: { argb: "FFE2E8F0" } },
  };

  const startRowIndex = 5;
  expenses.forEach((item, index) => {
    const formattedDate = format(new Date(item.date), "dd/MM/yyyy");
    const fundingSourceText = item.fundingSource === "FUND" ? "Quỹ nhóm" : "Cá nhân tự ứng";
    
    // Build splits summary: "Tên: 50.000đ, Tên 2: 50.000đ"
    const splitSummary = item.splits && item.splits.length > 0
      ? item.splits
          .map((s) => `${s.user.displayName}: ${s.amount.toLocaleString("vi-VN")}đ`)
          .join("; ")
      : "Chia đều tất cả";

    const row = sheet1.addRow([
      index + 1,
      formattedDate,
      item.title,
      item.category || "Khác",
      item.amount,
      item.paidBy.displayName,
      fundingSourceText,
      splitSummary,
      item.description || "",
    ]);

    row.height = 24;

    const isEven = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.border = thinBorder;
      cell.font = { name: "Arial", size: 10 };
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" }, // slate-50
        };
      }

      // Column alignments & formats
      if (colNumber === 1) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 2) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 4 || colNumber === 7) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = '#,##0" ₫"';
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  const endRowIndex = startRowIndex + expenses.length - 1;
  const totalRowIndex = endRowIndex + 1;

  if (expenses.length > 0) {
    const totalRow = sheet1.addRow([
      "TỔNG CỘNG",
      "",
      "",
      "",
      { formula: `SUM(E${startRowIndex}:E${endRowIndex})`, result: expenses.reduce((s, e) => s + e.amount, 0) },
      "",
      "",
      "",
      "",
    ]);

    sheet1.mergeCells(`A${totalRowIndex}:D${totalRowIndex}`);
    totalRow.height = 26;
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF1E3A8A" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDBEAFE" }, // blue-100
      };
      cell.border = {
        top: { style: "medium", color: { argb: "FF1E40AF" } },
        bottom: { style: "double", color: { argb: "FF1E40AF" } },
        left: { style: "thin", color: { argb: "FF94A3B8" } },
        right: { style: "thin", color: { argb: "FF94A3B8" } },
      };
      if (colNumber === 1) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = '#,##0" ₫"';
      }
    });
  }

  // Auto-fit column widths
  sheet1.columns = [
    { key: "stt", width: 8 },
    { key: "date", width: 14 },
    { key: "title", width: 28 },
    { key: "category", width: 16 },
    { key: "amount", width: 18 },
    { key: "paidBy", width: 20 },
    { key: "fundingSource", width: 18 },
    { key: "splits", width: 36 },
    { key: "description", width: 24 },
  ];

  // -------------------------------------------------------------
  // SHEET 2: TỔNG HỢP THỐNG KÊ
  // -------------------------------------------------------------
  const sheet2 = workbook.addWorksheet("Tổng hợp thống kê", {
    views: [{ showGridLines: true }],
  });

  // Sheet 2 Title
  sheet2.mergeCells("A1:F1");
  const titleCell2 = sheet2.getCell("A1");
  titleCell2.value = `TỔNG HỢP THỐNG KÊ CHI TIÊU - ${group.name.toUpperCase()}`;
  titleCell2.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1E3A8A" } };
  titleCell2.alignment = { horizontal: "center", vertical: "middle" };
  sheet2.getRow(1).height = 36;

  sheet2.mergeCells("A2:F2");
  const subCell2 = sheet2.getCell("A2");
  subCell2.value = `Khoảng thời gian: ${fromLabel} - ${toLabel}  |  Ngày xuất: ${exportedAtStr}`;
  subCell2.font = { name: "Arial", size: 10, italic: true, color: { argb: "FF475569" } };
  subCell2.alignment = { horizontal: "center", vertical: "middle" };
  sheet2.getRow(2).height = 20;

  sheet2.addRow([]); // Blank row 3

  // Section 1: KPI Summary Table
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const fundAmount = expenses.filter((e) => e.fundingSource === "FUND").reduce((sum, e) => sum + e.amount, 0);
  const memberAmount = expenses.filter((e) => e.fundingSource === "MEMBER").reduce((sum, e) => sum + e.amount, 0);
  const avgPerExpense = expenses.length > 0 ? Math.round(totalAmount / expenses.length) : 0;

  sheet2.addRow(["I. CHỈ SỐ TỔNG QUAN"]).eachCell((c) => {
    c.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1E3A8A" } };
  });

  const kpiRows = [
    ["Tổng chi tiêu trong kỳ", totalAmount, "VNĐ"],
    ["Số lượng hóa đơn đã duyệt", expenses.length, "Khoản chi"],
    ["Chi từ Quỹ nhóm", fundAmount, "VNĐ"],
    ["Chi do Thành viên tự ứng", memberAmount, "VNĐ"],
    ["Chi tiêu trung bình / hóa đơn", avgPerExpense, "VNĐ"],
  ];

  kpiRows.forEach(([metric, val, unit]) => {
    const r = sheet2.addRow(["", metric, val, unit]);
    r.height = 22;
    r.getCell(2).font = { name: "Arial", size: 10, bold: true };
    r.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(3).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF0F172A" } };
    r.getCell(3).alignment = { horizontal: "right", vertical: "middle" };
    if (typeof val === "number" && unit === "VNĐ") {
      r.getCell(3).numFmt = '#,##0" ₫"';
    } else {
      r.getCell(3).numFmt = "#,##0";
    }
    r.getCell(4).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(4).font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
    
    // Add cell border
    [2, 3, 4].forEach((colIdx) => {
      r.getCell(colIdx).border = thinBorder;
      r.getCell(colIdx).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    });
  });

  sheet2.addRow([]); // Blank row
  sheet2.addRow([]); // Blank row

  // Section 2: Breakdown by Category
  sheet2.addRow(["II. CƠ CẤU CHI TIÊU THEO DANH MỤC"]).eachCell((c) => {
    c.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1E3A8A" } };
  });

  const catHeaderRow = sheet2.addRow(["", "STT", "Tên Danh mục", "Số khoản chi", "Tổng số tiền (VNĐ)", "Tỷ lệ (%)"]);
  catHeaderRow.height = 26;
  [2, 3, 4, 5, 6].forEach((colIdx) => {
    const cell = catHeaderRow.getCell(colIdx);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" }, // Emerald-700
    };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF065F46" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } },
    };
  });

  // Calculate category aggregates
  const categoryMap = new Map<string, { count: number; total: number }>();
  expenses.forEach((e) => {
    const cat = e.category || "Khác";
    const current = categoryMap.get(cat) || { count: 0, total: 0 };
    categoryMap.set(cat, { count: current.count + 1, total: current.total + e.amount });
  });

  const categoryList = Array.from(categoryMap.entries())
    .map(([category, { count, total }]) => ({ category, count, total }))
    .sort((a, b) => b.total - a.total);

  categoryList.forEach((catItem, idx) => {
    const percentage = totalAmount > 0 ? catItem.total / totalAmount : 0;
    const r = sheet2.addRow(["", idx + 1, catItem.category, catItem.count, catItem.total, percentage]);
    r.height = 22;
    r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(4).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(5).numFmt = '#,##0" ₫"';
    r.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(6).numFmt = "0.0%";

    [2, 3, 4, 5, 6].forEach((colIdx) => {
      const cell = r.getCell(colIdx);
      cell.border = thinBorder;
      cell.font = { name: "Arial", size: 10 };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
  });

  sheet2.addRow([]); // Blank row
  sheet2.addRow([]); // Blank row

  // Section 3: Breakdown by Member
  sheet2.addRow(["III. THỐNG KÊ CHI TIÊU & THỤ HƯỞNG THEO THÀNH VIÊN"]).eachCell((c) => {
    c.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF1E3A8A" } };
  });

  const memberHeaderRow = sheet2.addRow([
    "",
    "STT",
    "Thành viên",
    "Tổng đã chi trả (1)",
    "Tổng thụ hưởng / chia (2)",
    "Chênh lệch (1) - (2)",
  ]);
  memberHeaderRow.height = 26;
  [2, 3, 4, 5, 6].forEach((colIdx) => {
    const cell = memberHeaderRow.getCell(colIdx);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4338CA" }, // Indigo-700
    };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF312E81" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } },
    };
  });

  // Calculate member stats:
  // Paid: total expenses where paidBy is this member and fundingSource === "MEMBER"
  // Benefited: total splits assigned to this member across all expenses in this period
  const memberStatsMap = new Map<string, { displayName: string; username: string; paid: number; split: number }>();
  
  // Initialize with all group members
  members.forEach((m) => {
    memberStatsMap.set(m.userId, {
      displayName: m.user.displayName,
      username: m.user.username,
      paid: 0,
      split: 0,
    });
  });

  expenses.forEach((e) => {
    // Member paid
    if (e.fundingSource === "MEMBER" && e.paidBy) {
      const existing = memberStatsMap.get(e.paidBy.username) || memberStatsMap.get((e as any).paidById);
      if (existing) {
        existing.paid += e.amount;
      } else {
        // Find by username or add
        for (const val of memberStatsMap.values()) {
          if (val.username === e.paidBy.username || val.displayName === e.paidBy.displayName) {
            val.paid += e.amount;
            break;
          }
        }
      }
    }

    // Split shares
    if (e.splits) {
      e.splits.forEach((s) => {
        let found = false;
        for (const val of memberStatsMap.values()) {
          if (val.username === s.user.username || val.displayName === s.user.displayName) {
            val.split += s.amount;
            found = true;
            break;
          }
        }
        if (!found) {
          memberStatsMap.set(s.user.username, {
            displayName: s.user.displayName,
            username: s.user.username,
            paid: 0,
            split: s.amount,
          });
        }
      });
    }
  });

  const memberStatsList = Array.from(memberStatsMap.values()).sort((a, b) => b.paid - a.paid);

  memberStatsList.forEach((mStat, idx) => {
    const diff = mStat.paid - mStat.split;
    const r = sheet2.addRow(["", idx + 1, mStat.displayName, mStat.paid, mStat.split, diff]);
    r.height = 22;
    r.getCell(2).alignment = { horizontal: "center", vertical: "middle" };
    r.getCell(3).alignment = { horizontal: "left", vertical: "middle" };
    r.getCell(4).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(4).numFmt = '#,##0" ₫"';
    r.getCell(5).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(5).numFmt = '#,##0" ₫"';
    r.getCell(6).alignment = { horizontal: "right", vertical: "middle" };
    r.getCell(6).numFmt = '#,##0" ₫"';

    if (diff > 0) {
      r.getCell(6).font = { name: "Arial", size: 10, bold: true, color: { argb: "FF15803D" } }; // green-700
    } else if (diff < 0) {
      r.getCell(6).font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB91C1C" } }; // red-700
    } else {
      r.getCell(6).font = { name: "Arial", size: 10 };
    }

    [2, 3, 4, 5, 6].forEach((colIdx) => {
      const cell = r.getCell(colIdx);
      cell.border = thinBorder;
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
      }
    });
  });

  // Auto-fit Sheet 2 columns
  sheet2.columns = [
    { key: "pad", width: 4 },
    { key: "col1", width: 8 },
    { key: "col2", width: 30 },
    { key: "col3", width: 22 },
    { key: "col4", width: 22 },
    { key: "col5", width: 22 },
  ];

  // Write to Buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
