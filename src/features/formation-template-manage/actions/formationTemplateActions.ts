"use server";

import { refresh, revalidatePath } from "next/cache";
import { z } from "zod";
import { DEFAULT_SLOT_COORDS } from "@/entities/formation";
import {
  FORMATION_SLOT_CODES,
  type FormationSlotCode,
} from "@/entities/position";
import { requireCurrentTeamId } from "@/entities/team";
import { createClient } from "@/shared/api/supabase/server";

export type FormationTemplateFormState = {
  errors?: {
    name?: string[];
    slots?: string[];
  };
  message?: string;
  success?: boolean;
};

const FIELD_SLOT_CODES: FormationSlotCode[] = FORMATION_SLOT_CODES.filter(
  (position) => position !== "GK" && position !== "RC",
);

const templateSchema = z.object({
  name: z.string().min(1, "포메이션 이름을 입력해주세요.").trim(),
  slots: z
    .array(z.string())
    .refine((slots) => slots.length === 10, "필드 슬롯 10개를 선택해주세요."),
});

function isFieldSlotCode(value: string): value is FormationSlotCode {
  return FIELD_SLOT_CODES.includes(value as FormationSlotCode);
}

function parseFieldSlots(formData: FormData) {
  const uniqueSlots = new Set(
    formData
      .getAll("slots")
      .map(String)
      .filter((slot): slot is FormationSlotCode => isFieldSlotCode(slot)),
  );

  return [...uniqueSlots];
}

export async function createFormationTemplate(
  _state: FormationTemplateFormState,
  formData: FormData,
): Promise<FormationTemplateFormState> {
  const validatedFields = templateSchema.safeParse({
    name: formData.get("name"),
    slots: parseFieldSlots(formData),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  const { name, slots } = validatedFields.data;
  const { data: template, error: templateError } = await supabase
    .from("formation_templates")
    .insert({ name, team_id: teamId })
    .select("id")
    .single();

  if (templateError || !template) {
    return { message: "포메이션 템플릿을 생성하지 못했습니다." };
  }

  const slotRows = ["GK", ...slots].map((slotName, index) => {
    const name = slotName as FormationSlotCode;
    const coords = DEFAULT_SLOT_COORDS[name];

    return {
      formation_template_id: template.id,
      slot_name: name,
      sort_order: index,
      x: coords.x,
      y: coords.y,
    };
  });
  const { error: slotsError } = await supabase
    .from("formation_template_slots")
    .insert(slotRows);

  if (slotsError) {
    await supabase.from("formation_templates").delete().eq("id", template.id);
    return { message: "포메이션 슬롯을 저장하지 못했습니다." };
  }

  revalidatePath("/formations");
  revalidatePath("/matches/new");
  refresh();

  return { message: "포메이션 템플릿을 생성했습니다.", success: true };
}

export async function deleteFormationTemplate(formData: FormData) {
  const templateId = z.string().uuid().safeParse(formData.get("id"));

  if (!templateId.success) return;

  const supabase = await createClient();
  await supabase
    .from("formation_templates")
    .update({ is_deleted: true })
    .eq("id", templateId.data);

  revalidatePath("/formations");
  revalidatePath("/matches/new");
  refresh();
}
