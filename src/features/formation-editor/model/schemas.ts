import { z } from "zod";
import { PLAYER_POSITION_CODES } from "@/entities/position";

export const slotUpdateSchema = z
  .array(
    z.object({
      fitScore: z.number().int().min(0).max(10).nullable(),
      id: z.string().uuid(),
      isManual: z.boolean(),
      playerId: z.string().uuid().nullable(),
      playerType: z.enum(["general", "guest"]).nullable(),
    }),
  )
  .superRefine((slots, context) => {
    slots.forEach((slot, index) => {
      if (Boolean(slot.playerId) !== Boolean(slot.playerType)) {
        context.addIssue({
          code: "custom",
          message: "선수 ID와 유형을 함께 전달해야 합니다.",
          path: [index, "playerType"],
        });
      }
    });
  });

export const regenerationSchema = z.object({
  mode: z.enum(["full", "preserve_players"]),
  templateId: z.string().uuid(),
});

export const participantIdentitySchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["general", "guest"]),
});

export const guestPlayerSchema = z.object({
  id: z.string().uuid().optional(),
  mainPosition: z.enum(PLAYER_POSITION_CODES),
  name: z.string().trim().min(1),
  playerNumber: z.number().int().min(0).max(999).nullable(),
  subPositions: z.array(z.enum(PLAYER_POSITION_CODES)).default([]),
});
