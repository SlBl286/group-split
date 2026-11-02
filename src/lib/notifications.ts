import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";
import { sendPushNotificationToUser } from "@/lib/push-notifications";

interface CreateNotificationParams {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  link?: string;
  entityId?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        content: params.content,
        type: params.type,
        link: params.link,
        entityId: params.entityId,
      },
    });

    // Asynchronously send push notification to registered user mobile devices
    sendPushNotificationToUser({
      userId: params.userId,
      title: params.title,
      body: params.content,
      data: {
        notificationId: notification.id,
        type: params.type,
        link: params.link || "",
        entityId: params.entityId || "",
      },
    }).catch((err) => {
      console.error("[Push Notification Error]:", err);
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

export async function enrichNotifications(notifications: any[]) {
  const inviteIds = notifications
    .filter((n) => n.type === "GROUP_INVITE" && n.entityId)
    .map((n) => n.entityId as string);

  const joinRequestIds = notifications
    .filter((n) => n.type === "JOIN_REQUEST" && n.entityId)
    .map((n) => n.entityId as string);

  const expenseIds = notifications
    .filter(
      (n) =>
        (n.type === "EXPENSE_PENDING" ||
          n.type === "EXPENSE_APPROVED" ||
          n.type === "EXPENSE_REJECTED") &&
        n.entityId
    )
    .map((n) => n.entityId as string);

  const settlementIds = notifications
    .filter(
      (n) =>
        (n.type === "SETTLEMENT_CREATED" ||
          n.type === "SETTLEMENT_CONFIRMED" ||
          n.type === "SETTLEMENT_PENDING") &&
        n.entityId
    )
    .map((n) => n.entityId as string);

  const fundContributionIds = notifications
    .filter((n) => n.type === "FUND_CONTRIBUTION" && n.entityId)
    .map((n) => n.entityId as string);

  const [invitations, joinRequests, expenses, settlements, fundContributions] =
    await Promise.all([
      inviteIds.length > 0
        ? prisma.groupInvitation.findMany({
            where: { id: { in: inviteIds } },
            select: { id: true, status: true, group: { select: { id: true, name: true } } },
          })
        : [],
      joinRequestIds.length > 0
        ? prisma.groupJoinRequest.findMany({
            where: { id: { in: joinRequestIds } },
            select: { id: true, status: true, group: { select: { id: true, name: true } } },
          })
        : [],
      expenseIds.length > 0
        ? prisma.expense.findMany({
            where: { id: { in: expenseIds } },
            select: {
              id: true,
              title: true,
              amount: true,
              status: true,
              groupId: true,
              group: { select: { id: true, name: true, ownerId: true } },
              paidBy: { select: { id: true, displayName: true } },
            },
          })
        : [],
      settlementIds.length > 0
        ? prisma.settlement.findMany({
            where: { id: { in: settlementIds } },
            select: {
              id: true,
              amount: true,
              isConfirmed: true,
              groupId: true,
              toUserId: true,
              group: { select: { id: true, name: true } },
              fromUser: { select: { id: true, displayName: true } },
            },
          })
        : [],
      fundContributionIds.length > 0
        ? prisma.fundContribution.findMany({
            where: { id: { in: fundContributionIds } },
            select: {
              id: true,
              amount: true,
              status: true,
              groupId: true,
              group: { select: { id: true, name: true } },
              user: { select: { id: true, displayName: true } },
            },
          })
        : [],
    ]);

  const inviteMap = new Map(invitations.map((i) => [i.id, i]));
  const joinMap = new Map(joinRequests.map((j) => [j.id, j]));
  const expenseMap = new Map(expenses.map((e) => [e.id, e]));
  const settlementMap = new Map(settlements.map((s) => [s.id, s]));
  const fundMap = new Map(fundContributions.map((f) => [f.id, f]));

  return notifications.map((n) => {
    let entityStatus: string | undefined = undefined;
    let details: any = {};

    if (n.type === "GROUP_INVITE" && n.entityId) {
      const inv = inviteMap.get(n.entityId);
      entityStatus = inv?.status;
      if (inv) details = { groupId: inv.group.id, groupName: inv.group.name };
    } else if (n.type === "JOIN_REQUEST" && n.entityId) {
      const jr = joinMap.get(n.entityId);
      entityStatus = jr?.status;
      if (jr) details = { groupId: jr.group.id, groupName: jr.group.name };
    } else if (n.entityId && expenseMap.has(n.entityId)) {
      const exp = expenseMap.get(n.entityId)!;
      entityStatus = exp.status;
      details = {
        expenseId: exp.id,
        expenseTitle: exp.title,
        amount: exp.amount,
        groupId: exp.groupId,
        groupName: exp.group.name,
        groupOwnerId: exp.group.ownerId,
        paidByName: exp.paidBy.displayName,
      };
    } else if (n.entityId && settlementMap.has(n.entityId)) {
      const set = settlementMap.get(n.entityId)!;
      entityStatus = set.isConfirmed ? "CONFIRMED" : "PENDING";
      details = {
        settlementId: set.id,
        amount: set.amount,
        isConfirmed: set.isConfirmed,
        groupId: set.groupId,
        groupName: set.group.name,
        fromUserName: set.fromUser.displayName,
        toUserId: set.toUserId,
      };
    } else if (n.entityId && fundMap.has(n.entityId)) {
      const fund = fundMap.get(n.entityId)!;
      entityStatus = fund.status;
      details = {
        fundId: fund.id,
        amount: fund.amount,
        groupId: fund.groupId,
        groupName: fund.group.name,
        contributorName: fund.user.displayName,
      };
    }

    return {
      ...n,
      entityStatus,
      ...details,
    };
  });
}
