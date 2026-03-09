/**
 * Service to parse structured text into meeting minute data.
 */

export function parseMinuteText(text: string) {
  const lines = text.split('\n');
  const result: any = {
    minute_number: "",
    client: "",
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
      result.date = line.substring(6).trim();
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
      result.client = line.substring(line.indexOf(":") + 1).trim();
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
