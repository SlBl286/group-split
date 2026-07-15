"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface JoinGroupButtonProps {
  groupId: string;
}

export function JoinGroupButton({ groupId }: JoinGroupButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    setLoading(true);

    const res = await fetch(`/api/groups/${groupId}/join`, {
      method: "POST",
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      toast.success("Đã tham gia nhóm!");
      router.push(`/groups/${groupId}`);
    } else {
      toast.error(data.error || "Tham gia thất bại");
    }
  }

  return (
    <Button
      onClick={handleJoin}
      disabled={loading}
      className="w-full gap-2"
      size="lg"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <UserPlus className="h-4 w-4" />
      )}
      Tham gia nhóm
    </Button>
  );
}
