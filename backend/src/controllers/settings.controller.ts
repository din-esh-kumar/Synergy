// src/controllers/settings.controller.ts
import { Request, Response } from "express";
import User from "../models/User.model";
import { createNotification } from "../utils/notificationEngine";

/**
 * GET /settings
 * Returns profile data (name, email, role, phone, avatar) for the logged-in user.
 */
const getSettings = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select(
      "name email role phone avatar"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        phone: (user as any).phone ?? "",
        avatar: (user as any).avatar ?? "",
      },
      // You can extend this later with notifications, theme, etc.
    });
  } catch (err: any) {
    console.error("getSettings error:", err);
    return res
      .status(500)
      .json({ message: "Failed to load settings", error: err.message });
  }
};

/**
 * PATCH /settings/notifications
 * Currently a stub; extend to persist per-user notification preferences.
 */
const updateNotifications = async (req: Request, res: Response) => {
  try {
    // const { notifications } = req.body;
    // TODO: save notifications for this user
    return res.json({ success: true });
  } catch (err: any) {
    console.error("updateNotifications error:", err);
    return res.status(500).json({
      message: "Failed to update notifications",
      error: err.message,
    });
  }
};

/**
 * PATCH /settings/theme
 * Currently a stub; extend to persist theme if required.
 */
const updateTheme = async (req: Request, res: Response) => {
  try {
    // const { theme } = req.body;
    // TODO: save theme for this user
    return res.json({ success: true });
  } catch (err: any) {
    console.error("updateTheme error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update theme", error: err.message });
  }
};

/**
 * PATCH /settings/profile
 * Updates editable profile fields (name, phone, avatar) for the logged-in user.
 */
const updateProfile = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;
    const userId = authUser?._id;
    const updaterId = authUser?._id?.toString();
    const updaterRole = authUser?.role;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { name, phone, avatarUrl, targetUserId } = req.body;
    const targetUserIdStr = targetUserId || userId.toString();
    const isSelfUpdate = targetUserIdStr === updaterId;

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (phone !== undefined) updateFields.phone = phone;
    if (avatarUrl !== undefined) updateFields.avatar = avatarUrl;

    const user = await User.findByIdAndUpdate(
      targetUserIdStr,
      updateFields,
      { new: true }
    ).select("name email role phone avatar");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ NOTIFY TARGET USER IF UPDATED BY ADMIN (not self-update)
    if (!isSelfUpdate && updaterRole === 'ADMIN') {
      await createNotification({
        userId: targetUserIdStr,
        type: 'system',
        action: 'updated',
        title: 'Profile updated',
        message: `Your profile was updated by an admin (${authUser.name || authUser.email})`,
        entityType: 'user',
        entityId: targetUserIdStr,
        icon: 'user',
        color: '#6366f1',
        actionUrl: '/settings',
      });
    }

    return res.json({
      success: true,
      message: "Profile updated",
      user,
    });
  } catch (err: any) {
    console.error("updateProfile error:", err);
    return res
      .status(500)
      .json({ message: "Failed to update profile", error: err.message });
  }
};

export default {
  getSettings,
  updateNotifications,
  updateTheme,
  updateProfile,
};
