import { redirect } from "next/navigation";
import {
  DEFAULT_SLOT_COORDS,
  FORMATION_PRESETS,
  type FormationTemplate,
} from "@/entities/formation";
import type { FormationSlotCode } from "@/entities/position";
import { createClient } from "@/shared/api/supabase/server";

type TemplateSlotRow = {
  slot_name: FormationSlotCode;
  sort_order: number;
  x: number;
  y: number;
};

type TemplateRow = {
  formation_template_slots: TemplateSlotRow[];
  id: string;
  name: string;
};

export async function getCurrentTeamId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: team, error } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !team) {
    throw new Error(error?.message ?? "팀을 찾을 수 없습니다.");
  }

  return team.id as string;
}

async function seedDefaultTemplatesIfMissing(teamId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("formation_templates")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId)
    .eq("is_deleted", false);

  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  for (const preset of FORMATION_PRESETS) {
    const { data: template, error: templateError } = await supabase
      .from("formation_templates")
      .insert({ name: preset.label, team_id: teamId })
      .select("id")
      .single();

    if (templateError || !template) {
      throw new Error(templateError?.message ?? "기본 템플릿을 생성하지 못했습니다.");
    }

    const slotRows = preset.slots.map((slot, index) => {
      const coords = DEFAULT_SLOT_COORDS[slot.name] ?? slot;

      return {
        formation_template_id: template.id,
        slot_name: slot.name,
        sort_order: index,
        x: coords.x,
        y: coords.y,
      };
    });
    const { error: slotsError } = await supabase
      .from("formation_template_slots")
      .insert(slotRows);

    if (slotsError) throw new Error(slotsError.message);
  }
}

function mapTemplate(row: TemplateRow): FormationTemplate {
  return {
    id: row.id,
    key: row.id,
    label: row.name,
    slots: [...row.formation_template_slots]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((slot) => ({
        name: slot.slot_name,
        x: Number(slot.x),
        y: Number(slot.y),
      })),
  };
}

export async function getFormationTemplates() {
  const teamId = await getCurrentTeamId();

  await seedDefaultTemplatesIfMissing(teamId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formation_templates")
    .select("id, name, formation_template_slots(slot_name, sort_order, x, y)")
    .eq("team_id", teamId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as TemplateRow[]).map(mapTemplate);
}

export async function getFormationTemplate(templateId: string) {
  const teamId = await getCurrentTeamId();

  await seedDefaultTemplatesIfMissing(teamId);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formation_templates")
    .select("id, name, formation_template_slots(slot_name, sort_order, x, y)")
    .eq("team_id", teamId)
    .eq("is_deleted", false)
    .eq("id", templateId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapTemplate(data as unknown as TemplateRow);
}
