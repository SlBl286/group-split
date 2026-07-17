"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { FundAllocationForm } from "./fund-allocation-form";

interface Member {
  userId: string;
  user: {
    id: string;
    displayName: string;
    avatar: string | null;
  };
}

interface FundAllocationTriggerProps {
  groupId: string;
  members: Member[];
  isFundManager: boolean;
}

export function FundAllocationTrigger({
  groupId,
  members,
  isFundManager,
}: FundAllocationTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isFundManager) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-1 font-bold text-xs h-9 sm:h-10 px-4 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700 cursor-pointer shrink-0"
      >
        <Coins className="h-4 w-4 text-white" />
        <span>Cấp tiền quỹ</span>
      </Button>

      <FundAllocationForm
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        groupId={groupId}
        members={members}
      />
    </>
  );
}
