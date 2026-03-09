import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Header,
  ImageRun,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
  TableLayoutType,
} from "docx";
import { storageService } from "./storage";

export async function generateWordDocument(templateData: ArrayBuffer, data: any) {
  // Fetch logo from storage
  let logoBuffer: ArrayBuffer | null = null;
  try {
    const logoBase64 = storageService.getLogo();
    if (logoBase64) {
      // Convert base64 to ArrayBuffer
      const base64Data = logoBase64.split(",")[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      logoBuffer = bytes.buffer;
    }
  } catch (e) {
    console.error("Could not process logo", e);
  }

  const BLUE_PRIMARY = "0070C0";
  const DARK_BLUE = "002060";
  const WHITE = "FFFFFF";
  const BLACK = "000000";
  const FONT_FAMILY = "AvantGarde Bk BT";
  const FONT_SIZE = 24; // 12pt (half-points)
  const SMALL_FONT_SIZE = 16; // 8pt

  const headerChildren: any[] = [];
  
  // Header with Logo (Left) and Title (Right)
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: logoBuffer ? [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: { width: 151, height: 113 }, // 4cm x 3cm approx
                    type: "png",
                  }),
                ],
              }),
            ] : [],
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "ACTA DE REUNIÓN DEL PROYECTO",
                    bold: true,
                    color: DARK_BLUE,
                    size: FONT_SIZE,
                    font: FONT_FAMILY,
                  }),
                ],
              }),
            ],
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
  });

  const content: any[] = [
    new Paragraph({ text: "" }),
    // Metadata block (Right aligned)
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "FECHA: ", bold: true, color: BLUE_PRIMARY, size: FONT_SIZE, font: FONT_FAMILY }),
        new TextRun({ text: data.date || "", size: FONT_SIZE, font: FONT_FAMILY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "HORA: ", bold: true, color: BLUE_PRIMARY, size: FONT_SIZE, font: FONT_FAMILY }),
        new TextRun({ text: `${data.start_time || ""} - ${data.end_time || ""}`, size: FONT_SIZE, font: FONT_FAMILY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "LUGAR: ", bold: true, color: BLUE_PRIMARY, size: FONT_SIZE, font: FONT_FAMILY }),
        new TextRun({ text: data.location || "", size: FONT_SIZE, font: FONT_FAMILY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: "Consecutivo: ", bold: true, color: BLUE_PRIMARY, size: FONT_SIZE, font: FONT_FAMILY }),
        new TextRun({ text: data.minute_number || "", size: FONT_SIZE, font: FONT_FAMILY }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "" }),

    // Project Info
    new Paragraph({
      children: [
        new TextRun({ text: "REUNIÓN / NOMBRE DEL PROYECTO: ", bold: true, color: BLUE_PRIMARY, size: FONT_SIZE, font: FONT_FAMILY }),
        new TextRun({ text: data.client || "", size: FONT_SIZE, font: FONT_FAMILY }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({ text: "ACTA PREPARADA POR: ", bold: true, color: BLUE_PRIMARY, size: FONT_SIZE, font: FONT_FAMILY }),
        new TextRun({ text: data.responsible || "", size: FONT_SIZE, font: FONT_FAMILY }),
      ],
    }),
    new Paragraph({ text: "" }),

    // Section 1: OBJETIVO DE LA REUNIÓN
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: DARK_BLUE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "1. OBJETIVO DE LA REUNIÓN", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: data.objective || "", color: BLACK, size: FONT_SIZE, font: FONT_FAMILY }),
      ],
      spacing: { before: 200, after: 200 },
    }),

    // Section 2: ASISTENTES
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: DARK_BLUE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "2. ASISTENTES", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Nombre", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
            new TableCell({
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Empresa", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
          ],
        }),
        ...(data.attendees || []).map((name: string) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: name, font: FONT_FAMILY, size: FONT_SIZE })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Logical Data", font: FONT_FAMILY, size: FONT_SIZE })] })] }),
          ],
        })),
      ],
    }),
    new Paragraph({ text: "" }),

    // Section 3: Temas Tratados
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: DARK_BLUE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "3. Temas Tratados", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Situación", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Comentarios/Anotaciones", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
          ],
        }),
        ...(data.topics || []).map((t: any) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.title, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })] }),
            new TableCell({
              children: [
                new Paragraph({ children: [new TextRun({ text: t.description, font: FONT_FAMILY, size: FONT_SIZE })] }),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Puntos Importantes:", bold: true, font: FONT_FAMILY, size: FONT_SIZE })] }),
                ...t.points.map((p: string) => new Paragraph({ children: [new TextRun({ text: `- ${p}`, font: FONT_FAMILY, size: FONT_SIZE })], indent: { left: 720 } })),
                new Paragraph({ text: "" }),
                new Paragraph({ children: [new TextRun({ text: "Decisiones:", bold: true, font: FONT_FAMILY, size: FONT_SIZE })] }),
                ...t.decisions.map((d: string) => new Paragraph({ children: [new TextRun({ text: `- ${d}`, font: FONT_FAMILY, size: FONT_SIZE })], indent: { left: 720 } })),
              ],
            }),
          ],
        })),
      ],
    }),
    new Paragraph({ text: "" }),

    // Section 4: Acuerdos
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: DARK_BLUE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "4. ACUERDOS", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Acción", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
            new TableCell({
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Responsable", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
            new TableCell({
              shading: { fill: BLUE_PRIMARY },
              children: [new Paragraph({ children: [new TextRun({ text: "Fecha Límite", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE })] })],
            }),
          ],
        }),
        ...(data.agreements || []).map((a: any) => new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.action, font: FONT_FAMILY, size: FONT_SIZE })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.responsible, font: FONT_FAMILY, size: FONT_SIZE })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.commitment_date || "N/A", font: FONT_FAMILY, size: FONT_SIZE })] })] }),
          ],
        })),
      ],
    }),
    new Paragraph({ text: "" }),

    // Section 5: Aceptación
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: DARK_BLUE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "5. ACEPTACIÓN", color: WHITE, bold: true, font: FONT_FAMILY, size: FONT_SIZE }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ 
          text: "En un plazo de 48 horas naturales a contar desde la fecha de envío de este documento, ambas partes podrán indicar cualquier ajuste o aclaración del documento. Pasado este tiempo si no se emite comentarios este documento será dado por aprobado.",
          font: FONT_FAMILY,
          size: SMALL_FONT_SIZE,
        }),
      ],
      spacing: { before: 200 },
    }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_FAMILY,
            size: FONT_SIZE,
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        headers: {
          default: new Header({
            children: [headerTable],
          }),
        },
        children: content,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Minuta_${data.minute_number || "Generada"}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
