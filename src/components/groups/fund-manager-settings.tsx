"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Member {
  userId: string;
  user: {
    id: string;
    displayName: string;
    username: string;
  };
}

interface FundManagerSettingsProps {
  groupId: string;
  members: Member[];
  currentFundManagerId: string | null;
}

export function FundManagerSettings({
  groupId,
  members,
  currentFundManagerId,
}: FundManagerSettingsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(currentFundManagerId || "none");

  async function handleSave() {
    setLoading(true);
    const fundManagerId = selectedId === "none" ? null : selectedId;

    try {
      const res = await fetch(`/api/groups/${groupId}/fund-manager`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundManagerId }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        toast.success("Đã cập nhật người quản lý quỹ!");
        router.refresh();
      } else {
        toast.error(data.error || "Cập nhật thất bại");
      }
    } catch (err) {
      setLoading(false);
      toast.error("Lỗi kết nối máy chủ");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Người quản lý quỹ</CardTitle>
        <CardDescription className="text-xs">
          Chỉ định một thành viên chịu trách nhiệm cầm quỹ và phát tiền trợ cấp hàng ngày. Mặc định là Trưởng nhóm.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm ring-offset-background focus:outline-hidden focus:ring-2 focus:ring-ring"
          >
            <option value="none">Chưa chỉ định (Mặc định: Trưởng nhóm)</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.user.displayName} (@{m.user.username})
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading || selectedId === (currentFundManagerId || "none")}
          className="w-full sm:w-auto font-bold h-10 px-6 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
