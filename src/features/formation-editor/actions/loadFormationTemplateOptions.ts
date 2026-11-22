"use server";

import { getFormationTemplateOptions } from "@/entities/formation/api/formationTemplateQueries";

/** 포메이션 변경에 사용할 템플릿 옵션을 조회합니다. */
export const loadFormationTemplateOptions = async () =>
  getFormationTemplateOptions();
