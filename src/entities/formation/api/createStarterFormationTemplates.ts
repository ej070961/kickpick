import "server-only";

import type { FormationSlotCode } from "@/entities/position";
import { createClient } from "@/shared/api/supabase/server";
import { DEFAULT_SLOT_COORDS } from "../config/slotCoords";
import { STARTER_FORMATION_TEMPLATES } from "../config/starterTemplates";

/**
 * 신규 팀이 바로 경기 생성을 시작할 수 있도록 시작 포메이션 템플릿을 생성합니다.
 */
export async function createStarterFormationTemplates(teamId: string) {
  const supabase = await createClient();
  const createdTemplateIds: string[] = [];

  try {
    for (const starterTemplate of STARTER_FORMATION_TEMPLATES) {
      const { data: template, error: templateError } = await supabase
        .from("formation_templates")
        .insert({ name: starterTemplate.label, team_id: teamId })
        .select("id")
        .single();

      if (templateError || !template) {
        throw new Error(
          templateError?.message ??
            "기본 포메이션 템플릿을 생성하지 못했습니다.",
        );
      }

      createdTemplateIds.push(template.id as string);

      const { error: slotsError } = await supabase
        .from("formation_template_slots")
        .insert(createSlotRows(template.id as string, starterTemplate.slots));

      if (slotsError) {
        throw new Error(slotsError.message);
      }
    }
  } catch (error) {
    if (createdTemplateIds.length > 0) {
      await supabase
        .from("formation_template_slots")
        .delete()
        .in("formation_template_id", createdTemplateIds);
      await supabase
        .from("formation_templates")
        .delete()
        .in("id", createdTemplateIds);
    }

    throw error;
  }
}

function createSlotRows(templateId: string, slots: FormationSlotCode[]) {
  return slots.map((slotName, index) => {
    const coords = DEFAULT_SLOT_COORDS[slotName];

    return {
      formation_template_id: templateId,
      slot_name: slotName,
      sort_order: index,
      x: coords.x,
      y: coords.y,
    };
  });
}
