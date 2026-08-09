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

export type TemplateFormState = {
  errors?: {
    id?: string[];
    name?: string[];
    slots?: string[];
  };
  message?: string;
  success?: boolean;
};

const FIELD_SLOT_CODES: FormationSlotCode[] = FORMATION_SLOT_CODES.filter(
  (position) => position !== "GK" && position !== "RC",
);

const fieldSlotSchema = z.custom<FormationSlotCode>(
  (value) => typeof value === "string" && isFieldSlotCode(value),
  "포지션 정보가 올바르지 않습니다.",
);
const templateSchema = z.object({
  name: z.string().min(1, "포메이션 이름을 입력해주세요.").trim(),
  slots: z
    .array(fieldSlotSchema)
    .refine((slots) => slots.length === 10, "포지션 10개를 선택해주세요."),
});
const templateUpdateSchema = templateSchema.extend({
  id: z.string().uuid("수정할 포메이션 정보가 올바르지 않습니다."),
});

function isFieldSlotCode(value: string): value is FormationSlotCode {
  return FIELD_SLOT_CODES.includes(value as FormationSlotCode);
}

function parseFieldSlots(formData: FormData): FormationSlotCode[] {
  const uniqueSlots = new Set(
    formData
      .getAll("slots")
      .map(String)
      .filter((slot): slot is FormationSlotCode => isFieldSlotCode(slot)),
  );

  return [...uniqueSlots];
}

export async function createFormationTemplate(
  _state: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
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

  const { error: slotsError } = await supabase
    .from("formation_template_slots")
    .insert(createTemplateSlotRows(template.id as string, slots));

  if (slotsError) {
    await supabase.from("formation_templates").delete().eq("id", template.id);
    return { message: "포메이션 슬롯을 저장하지 못했습니다." };
  }

  revalidatePath("/formations");
  revalidatePath("/matches/new");
  refresh();

  return { message: "포메이션 템플릿을 생성했습니다.", success: true };
}

export async function updateFormationTemplate(
  _state: TemplateFormState,
  formData: FormData,
): Promise<TemplateFormState> {
  const validatedFields = templateUpdateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    slots: parseFieldSlots(formData),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { id, name, slots } = validatedFields.data;
  const { error } = await supabase.rpc("replace_formation_template", {
    p_name: name,
    p_slots: createTemplateSlotPayload(slots),
    p_template_id: id,
  });

  if (error) {
    return { message: "포메이션 템플릿을 수정하지 못했습니다." };
  }

  revalidatePath("/formations");
  revalidatePath("/matches/new");
  refresh();

  return { message: "포메이션을 수정했습니다.", success: true };
}

export async function deleteFormationTemplate(formData: FormData) {
  const templateId = z.string().uuid().safeParse(formData.get("id"));

  if (!templateId.success) return;

  const supabase = await createClient();
  const teamId = await requireCurrentTeamId();
  await supabase
    .from("formation_templates")
    .update({ is_deleted: true })
    .eq("id", templateId.data)
    .eq("team_id", teamId)
    .eq("is_deleted", false);

  revalidatePath("/formations");
  revalidatePath("/matches/new");
  refresh();
}

function createTemplateSlotRows(
  templateId: string,
  fieldSlots: FormationSlotCode[],
) {
  return createTemplateSlotPayload(fieldSlots).map((slot) => ({
    formation_template_id: templateId,
    ...slot,
  }));
}

function createTemplateSlotPayload(fieldSlots: FormationSlotCode[]) {
  return ["GK", ...fieldSlots].map((slotName, index) => {
    const name = slotName as FormationSlotCode;
    const coords = DEFAULT_SLOT_COORDS[name];

    return {
      slot_name: name,
      sort_order: index,
      x: coords.x,
      y: coords.y,
    };
  });
}
