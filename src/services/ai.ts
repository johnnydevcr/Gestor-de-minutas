import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeTranscript(transcript: string) {
  const prompt = `
    Eres un asistente corporativo experto en analizar transcripciones de reuniones y generar minutas profesionales.
    Analiza la siguiente transcripción y extrae la información solicitada en formato JSON.

    Transcripción:
    """
    ${transcript}
    """

    Instrucciones:
    1. Identifica los datos generales de la reunión:
       - minute_number: Genera un número de minuta si no se menciona (ej. MIN-2026-001).
       - client: Cliente o Proyecto.
       - date: Fecha de la reunión (formato YYYY-MM-DD).
       - start_time: Hora de inicio (formato HH:MM).
       - end_time: Hora de fin (formato HH:MM).
       - location: Lugar o plataforma (ej. Teams, Zoom, Oficina).
       - responsible: Responsable de la minuta.
    2. Identifica el "Objetivo de la reunión" (un párrafo corto).
    3. Crea un "Resumen ejecutivo" (máximo 5 líneas explicando qué se discutió, decisiones y próximos pasos).
    4. Identifica los "Temas tratados" estructurados con título, descripción, puntos importantes y decisiones.
    5. Identifica "Acuerdos" (tareas asignadas) con acción, responsable (si no es claro, pon "por confirmar") y fecha de compromiso (si se menciona).
    6. Identifica "Temas pendientes" que requieren seguimiento.
    7. Identifica "Participantes" (asistentes) mencionados en la transcripción.
    8. Identifica "Ausentes" si se mencionan.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          minute_number: { type: Type.STRING },
          client: { type: Type.STRING },
          date: { type: Type.STRING },
          start_time: { type: Type.STRING },
          end_time: { type: Type.STRING },
          location: { type: Type.STRING },
          responsible: { type: Type.STRING },
          objective: { type: Type.STRING, description: "Objetivo de la reunión" },
          executive_summary: { type: Type.STRING, description: "Resumen ejecutivo" },
          topics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                points: { type: Type.ARRAY, items: { type: Type.STRING } },
                decisions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["title", "description", "points", "decisions"]
            }
          },
          agreements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING },
                responsible: { type: Type.STRING },
                commitment_date: { type: Type.STRING }
              },
              required: ["action", "responsible"]
            }
          },
          pending_topics: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          attendees: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          absentees: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["minute_number", "client", "date", "start_time", "end_time", "location", "responsible", "objective", "executive_summary", "topics", "agreements", "pending_topics", "attendees", "absentees"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}
