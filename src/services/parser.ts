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
    agreements: [],
    pending_topics: [],
    attendees: [],
    absentees: []
  };

  let currentSection = "";

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
    if (lowerLine.startsWith("nombre de la reunión:") || lowerLine.startsWith("reunión:")) {
      result.meeting_name = line.substring(line.indexOf(":") + 1).trim();
      result.client = result.meeting_name; // Fallback for client if needed
      continue;
    }
    if (lowerLine.startsWith("asistentes:")) {
      result.attendees = line.substring(11).trim().split(",").map(s => s.trim()).filter(s => s);
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
    if (lowerLine.startsWith("acuerdo:") || lowerLine.startsWith("acuerdos:")) {
      currentSection = "agreements";
      continue;
    }
    if (lowerLine.startsWith("temas pendientes:")) {
      currentSection = "pending_topics";
      continue;
    }

    // Handle content within sections
    if (currentSection === "topics") {
      if (lowerLine.startsWith("tema:") || lowerLine.startsWith("título:")) {
        result.topics.push({ 
          title: line.substring(line.indexOf(":") + 1).trim(), 
          description: "", 
          points: [], 
          decisions: [] 
        });
      } else if (lowerLine.startsWith("detalle:") || lowerLine.startsWith("descripción:")) {
        if (result.topics.length > 0) {
          result.topics[result.topics.length - 1].description = line.substring(line.indexOf(":") + 1).trim();
        }
      } else if (lowerLine.startsWith("puntos importantes:") || lowerLine.startsWith("puntos:")) {
        if (result.topics.length > 0) {
          const content = line.substring(line.indexOf(":") + 1).trim();
          if (content) {
            const points = content.split(/[,;]|\s*-\s*/).map(s => s.trim()).filter(s => s);
            result.topics[result.topics.length - 1].points = points;
          }
        }
      } else if (lowerLine.startsWith("decisiones:") || lowerLine.startsWith("decisión:")) {
        if (result.topics.length > 0) {
          const content = line.substring(line.indexOf(":") + 1).trim();
          if (content) {
            const decisions = content.split(/[,;]|\s*-\s*/).map(s => s.trim()).filter(s => s);
            result.topics[result.topics.length - 1].decisions = decisions;
          }
        }
      } else if (line.startsWith("-") || line.startsWith("*")) {
        // Handle bullet points for the last active section/topic
        const bulletContent = line.substring(1).trim();
        if (currentSection === "topics" && result.topics.length > 0) {
          // If we don't know if it's a point or decision, we might need more state
          // For now, let's assume if it's a bullet point under a topic, it's a point
          result.topics[result.topics.length - 1].points.push(bulletContent);
        }
      }
    } else if (currentSection === "agreements") {
      // Format: Acción - Responsable - Fecha
      const parts = line.split("-").map(s => s.trim());
      if (parts[0]) {
        result.agreements.push({
          action: parts[0],
          responsible: parts[1] || "por confirmar",
          commitment_date: parts[2] || ""
        });
      }
    } else if (currentSection === "pending_topics") {
      result.pending_topics.push(line.replace(/^[*-]\s*/, ""));
    }
  }

  // Default summary if not provided
  if (!result.executive_summary) {
    result.executive_summary = result.objective || "Reunión de seguimiento.";
  }

  return result;
}
