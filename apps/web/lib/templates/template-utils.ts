import { BOOTH_TEMPLATES, getTemplateName, isValidTemplate } from "./templates";
import { getTemplateStyle } from "./template-styles";

export function normalizeTemplateId(value: unknown) {
  const id = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isValidTemplate(id) ? id : "classic-love-collage";
}

export { BOOTH_TEMPLATES, getTemplateName, getTemplateStyle, isValidTemplate };
