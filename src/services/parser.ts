/**
 * Service to parse structured text into meeting minute data.
 */

export function validateMinuteText(text: string): { valid: boolean; error?: string } {
  const lowerText = text.toLowerCase();
  
  // Basic check for essential sections
  const hasDate = lowerText.includes("fecha:");
  const hasTopics = lowerText.includes("temas tratados:");
  
  if (!hasDate) return { valid: false, error: "La información debe incluir una 'Fecha:'" };
  if (!hasTopics) return { valid: false, error: "La información debe incluir una sección de 'Temas Tratados:'" };
  
  return { valid: true };
}

export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return dateStr;
}

export function parseMinuteText(text: string) {
  const lines = text.split('\n');
  const result: any = {
    minute_number: "",
    client: "",
    meeting_name: "",
    date: "",
    start_time: "",
    end_time: "",
    location: "",
    responsible: "",
    objective: "",
    executive_summary: "",
    topics: [],
    agenda: [],
    agreements: [],
    pending_topics: [],
    attendees: [],
    absentees: []
  };

  let currentSection = "";
  let currentTopicSubSection = "";

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const lowerLine = line.toLowerCase();

    // Check for main fields
    if (lowerLine.startsWith("fecha:")) {
      let dateValue = line.substring(line.indexOf(":") + 1).trim();
      // Try to convert DD/MM/YYYY to YYYY-MM-DD for the HTML5 date input
      if (dateValue.includes("/")) {
        const parts = dateValue.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2];
          if (year.length === 4) {
            dateValue = `${year}-${month}-${day}`;
          }
        }
      }
      result.date = dateValue;
      continue;
    }
    if (lowerLine.startsWith("hora de inicio:") || lowerLine.startsWith("hora inicio:")) {
      result.start_time = line.substring(line.indexOf(":") + 1).trim();
      continue;
    }
    if (lowerLine.startsWith("hora fin:")) {
      result.end_time = line.substring(9).trim();
      continue;
    }
    if (lowerLine.startsWith("lugar:")) {
      result.location = line.substring(6).trim();
      continue;
    }
    if (lowerLine.startsWith("responsable:")) {
      result.responsible = line.substring(12).trim();
      continue;
    }
    if (lowerLine.startsWith("consecutivo:")) {
      result.minute_number = line.substring(12).trim();
      continue;
    }
    if (lowerLine.startsWith("nombre de la reunión:") || lowerLine.startsWith("reunión:")) {
      result.meeting_name = line.substring(line.indexOf(":") + 1).trim();
      continue;
    }
    if (lowerLine.startsWith("cliente:")) {
      result.client = line.substring(8).trim();
      continue;
    }
    if (lowerLine.startsWith("asistentes:")) {
      const content = line.substring(line.indexOf(":") + 1).trim();
      if (content) {
        result.attendees = content.split(",").map(s => s.trim()).filter(s => s);
      }
      currentSection = "attendees";
      continue;
    }
    if (lowerLine.startsWith("ausentes:")) {
      result.absentees = line.substring(9).trim().split(",").map(s => s.trim()).filter(s => s);
      continue;
    }
    if (lowerLine.startsWith("objetivo de la reunión:") || lowerLine.startsWith("objetivo:")) {
      result.objective = line.substring(line.indexOf(":") + 1).trim();
      continue;
    }

    // Check for section headers
    if (lowerLine.startsWith("temas tratados:")) {
      currentSection = "topics";
      continue;
    }
    if (lowerLine.startsWith("agenda:")) {
      const content = line.substring(7).trim();
      if (content) {
        result.agenda = content.split(",").map(s => s.trim()).filter(s => s);
      }
      currentSection = "agenda";
      continue;
    }
    if (lowerLine.startsWith("asistentes:")) {
      currentSection = "attendees";
      const content = line.substring(11).trim();
      if (content) {
        result.attendees = content.split(",").map(s => s.trim()).filter(s => s);
      }
      continue;
    }
    if (lowerLine.startsWith("acuerdo:") || lowerLine.startsWith("acuerdos:") || lowerLine.startsWith("acuerdos y compromisos:")) {
      currentSection = "agreements";
      continue;
    }
    if (lowerLine.startsWith("temas pendientes:")) {
      currentSection = "pending_topics";
      continue;
    }

    // Handle content within sections
    if (currentSection === "attendees") {
      if (line.startsWith("-") || line.startsWith("*")) {
        result.attendees.push(line.substring(1).trim());
      }
    } else if (currentSection === "agenda") {
      if (line.startsWith("-") || line.startsWith("*")) {
        result.agenda.push(line.substring(1).trim());
      }
    } else if (currentSection === "topics") {
      if (lowerLine.startsWith("tema:") || lowerLine.startsWith("título:")) {
        result.topics.push({ 
          title: line.substring(line.indexOf(":") + 1).trim(), 
          description: "", 
          points: [], 
          decisions: [] 
        });
        currentTopicSubSection = "";
      } else if (lowerLine.startsWith("detalle:") || lowerLine.startsWith("descripción:")) {
        if (result.topics.length > 0) {
          result.topics[result.topics.length - 1].description = line.substring(line.indexOf(":") + 1).trim();
        }
        currentTopicSubSection = "description";
      } else if (lowerLine.startsWith("puntos importantes:") || lowerLine.startsWith("puntos:")) {
        currentTopicSubSection = "points";
        if (result.topics.length > 0) {
          const content = line.substring(line.indexOf(":") + 1).trim();
          if (content) {
            const points = content.split(/[,;]|\s*-\s*/).map(s => s.trim()).filter(s => s);
            result.topics[result.topics.length - 1].points.push(...points);
          }
        }
      } else if (lowerLine.startsWith("decisiones:") || lowerLine.startsWith("decisión:")) {
        currentTopicSubSection = "decisions";
        if (result.topics.length > 0) {
          const content = line.substring(line.indexOf(":") + 1).trim();
          if (content) {
            const decisions = content.split(/[,;]|\s*-\s*/).map(s => s.trim()).filter(s => s);
            result.topics[result.topics.length - 1].decisions.push(...decisions);
          }
        }
      } else if (line.startsWith("-") || line.startsWith("*")) {
        const bulletContent = line.substring(1).trim();
        if (result.topics.length > 0) {
          if (currentTopicSubSection === "points") {
            result.topics[result.topics.length - 1].points.push(bulletContent);
          } else if (currentTopicSubSection === "decisions") {
            result.topics[result.topics.length - 1].decisions.push(bulletContent);
          } else if (currentTopicSubSection === "description") {
            result.topics[result.topics.length - 1].description += "\n- " + bulletContent;
          } else {
            result.topics[result.topics.length - 1].points.push(bulletContent);
          }
        }
      }
    } else if (currentSection === "agreements") {
      // Format: Acción | Responsable | Fecha
      const parts = line.split(/[|-]/).map(s => s.trim());
      if (parts[0] && !lowerLine.startsWith("acuerdos")) {
        result.agreements.push({
          action: parts[0].replace(/^[*-]\s*/, ""),
          responsible: parts[1] || "por confirmar",
          commitment_date: parts[2] || ""
        });
      }
    }
 else if (currentSection === "pending_topics") {
      result.pending_topics.push(line.replace(/^[*-]\s*/, ""));
    }
  }

  // Default summary if not provided
  if (!result.executive_summary) {
    result.executive_summary = result.objective || "Reunión de seguimiento.";
  }

  return result;
}
