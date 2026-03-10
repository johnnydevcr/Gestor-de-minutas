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
  Footer,
  TextWrappingType,
  TextWrappingSide,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  HorizontalPositionAlign,
  VerticalPositionAlign,
} from "docx";
import { storageService } from "./storage";
import { formatDateForDisplay } from "./parser";

export async function generateWordDocument(templateData: ArrayBuffer, data: any) {
  const processImage = (base64: string | null) => {
    if (!base64) return null;
    try {
      const base64Data = base64.split(",")[1];
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (e) {
      console.error("Could not process image", e);
      return null;
    }
  };

  const getAspectRatio = async (base64: string | null): Promise<number> => {
    if (!base64) return 1;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img.width / img.height);
      img.onerror = () => resolve(1);
      img.src = base64;
    });
  };

  const logoBase64 = storageService.getLogo();
  const headerBase64 = storageService.getHeader();
  const footerBase64 = storageService.getFooter();

  const logoAspectRatio = await getAspectRatio(logoBase64);
  const headerAspectRatio = await getAspectRatio(headerBase64);
  const footerAspectRatio = await getAspectRatio(footerBase64);

  const logoBuffer = processImage(logoBase64);
  const headerBuffer = processImage(headerBase64);
  const footerBuffer = processImage(footerBase64);

  const BLUE_EMPHASIS_1_DARK_50 = "1F4E79"; 
  const LIGHT_GRAY_BG = "F2F2F2"; // 5% darkness
  const BORDER_COLOR = "D9D9D9"; // Light gray
  const BLACK = "000000";
  const WHITE = "FFFFFF";
  const FONT_FAMILY = "Aptos";
  
  // Helper for conversion cm to pixels (approx 1cm = 37.8px)
  // docx uses EMU for some things, but ImageRun uses pixels for width/height
  const cmToPx = (cm: number) => Math.round(cm * 37.795);
  // Word margins use twips (1/1440 inch). 1cm = 566.9 twips
  const cmToTwips = (cm: number) => Math.round(cm * 566.929);
  // Word floating offsets use EMU (English Metric Units). 1cm = 360000 EMU
  const cmToEmu = (cm: number) => Math.round(cm * 360000);

  const headerChildren: any[] = [];
  if (headerBuffer) {
    const headerWidthCm = 21.59;
    const headerHeightCm = headerWidthCm / headerAspectRatio;
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: headerBuffer,
            transformation: { 
              width: cmToPx(headerWidthCm), 
              height: cmToPx(headerHeightCm) 
            },
            floating: {
              horizontalPosition: { 
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.CENTER,
              },
              verticalPosition: { 
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.TOP,
              },
              wrap: { type: TextWrappingType.NONE },
              behindDocument: true,
            },
            type: "png",
          }),
        ],
      })
    );
  }

  const footerChildren: any[] = [];
  if (footerBuffer) {
    const footerWidthCm = 21.59;
    const footerHeightCm = footerWidthCm / footerAspectRatio;
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: footerBuffer,
            transformation: { 
              width: cmToPx(footerWidthCm), 
              height: cmToPx(footerHeightCm) 
            },
            floating: {
              horizontalPosition: { 
                relative: HorizontalPositionRelativeFrom.PAGE,
                align: HorizontalPositionAlign.CENTER,
              },
              verticalPosition: { 
                relative: VerticalPositionRelativeFrom.PAGE,
                align: VerticalPositionAlign.BOTTOM,
              },
              wrap: { type: TextWrappingType.NONE },
              behindDocument: true,
            },
            type: "png",
          }),
        ],
      })
    );
  }

  if (logoBuffer) {
    const logoWidthCm = 3.45;
    const logoHeightCm = logoWidthCm / logoAspectRatio;
    footerChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { 
              width: cmToPx(logoWidthCm), 
              height: cmToPx(logoHeightCm) 
            },
            floating: {
              horizontalPosition: { 
                relative: HorizontalPositionRelativeFrom.MARGIN,
                align: HorizontalPositionAlign.RIGHT,
              },
              verticalPosition: { 
                relative: VerticalPositionRelativeFrom.PAGE,
                offset: cmToEmu(27.8),
              },
              wrap: { type: TextWrappingType.NONE },
              behindDocument: false,
            },
            type: "png",
          }),
        ],
      })
    );
  }

  const content: any[] = [
    // Table #1
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Acta de Reunión",
                      size: 44, // 22pt
                      color: BLUE_EMPHASIS_1_DARK_50,
                      font: FONT_FAMILY,
                      bold: true,
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: LIGHT_GRAY_BG },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: data.minute_number || "",
                      size: 32, // 16pt
                      color: BLACK,
                      font: FONT_FAMILY,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Cliente: ", bold: true, size: 28, font: FONT_FAMILY }),
                    new TextRun({ text: data.client || "", size: 28, font: FONT_FAMILY }),
                  ],
                }),
              ],
            }),
            new TableCell({ children: [] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Reunión: ", bold: true, size: 28, font: FONT_FAMILY }),
                    new TextRun({ text: data.meeting_name || "", size: 28, font: FONT_FAMILY }),
                  ],
                }),
              ],
            }),
            new TableCell({ children: [] }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Responsable: ", bold: true, size: 28, font: FONT_FAMILY }),
                    new TextRun({ text: data.responsible || "", size: 28, font: FONT_FAMILY }),
                  ],
                }),
              ],
            }),
            new TableCell({ children: [] }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { before: 240, after: 240 } }),

    // Table #2
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Fecha: ", bold: true, size: 28, font: FONT_FAMILY }),
                    new TextRun({ text: formatDateForDisplay(data.date) || "", size: 28, font: FONT_FAMILY }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Hora: ", bold: true, size: 28, font: FONT_FAMILY }),
                    new TextRun({ text: `${data.start_time || ""} - ${data.end_time || ""}`, size: 28, font: FONT_FAMILY }),
                  ],
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Lugar: ", bold: true, size: 28, font: FONT_FAMILY }),
                    new TextRun({ text: data.location || "", size: 28, font: FONT_FAMILY }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { before: 240, after: 240 } }),

    // Table #3
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              shading: { fill: LIGHT_GRAY_BG },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Objetivo", bold: true, size: 28, font: FONT_FAMILY })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: data.objective || "", size: 24, font: FONT_FAMILY })],
                }),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: LIGHT_GRAY_BG },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "Asistentes", bold: true, size: 28, font: FONT_FAMILY })],
                }),
              ],
            }),
            new TableCell({
              children: (data.attendees || []).map((a: string) => 
                new Paragraph({
                  bullet: { level: 0 },
                  children: [new TextRun({ text: a, size: 24, font: FONT_FAMILY })],
                })
              ),
            }),
          ],
        }),
      ],
    }),

    new Paragraph({ text: "", spacing: { before: 240, after: 240 } }),

    // Agenda
    new Paragraph({
      shading: { fill: LIGHT_GRAY_BG },
      children: [new TextRun({ text: "Agenda", bold: true, size: 28, font: FONT_FAMILY })],
    }),
    new Paragraph({ text: "" }),
    ...(data.topics || []).map((t: any) => 
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text: t.title, size: 24, font: FONT_FAMILY })],
      })
    ),

    new Paragraph({ text: "", spacing: { before: 240, after: 240 } }),

    // Temas Tratados
    new Paragraph({
      shading: { fill: LIGHT_GRAY_BG },
      children: [new TextRun({ text: "Temas Tratados", bold: true, size: 28, font: FONT_FAMILY })],
    }),
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      },
      rows: (data.topics || []).map((t: any) => 
        new TableRow({
          children: [
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              verticalAlign: VerticalAlign.CENTER,
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [new TextRun({ text: t.title, bold: true, size: 28, font: FONT_FAMILY })],
                }),
              ],
            }),
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "Detalle:", bold: true, size: 24, font: FONT_FAMILY })] }),
                new Paragraph({ children: [new TextRun({ text: t.description, size: 24, font: FONT_FAMILY })] }),
                ...(t.points && t.points.length > 0 ? [
                  new Paragraph({ children: [new TextRun({ text: "Puntos importantes:", bold: true, size: 24, font: FONT_FAMILY })] }),
                  ...t.points.map((p: string) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: p, size: 24, font: FONT_FAMILY })] }))
                ] : []),
                ...(t.decisions && t.decisions.length > 0 ? [
                  new Paragraph({ children: [new TextRun({ text: "Decisiones:", bold: true, size: 24, font: FONT_FAMILY })] }),
                  ...t.decisions.map((d: string) => new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: d, size: 24, font: FONT_FAMILY })] }))
                ] : []),
              ],
            }),
          ],
        })
      ),
    }),

    new Paragraph({ text: "", spacing: { before: 240, after: 240 } }),

    // Acuerdos y compromisos
    new Paragraph({
      shading: { fill: LIGHT_GRAY_BG },
      children: [new TextRun({ text: "Acuerdos y compromisos", bold: true, size: 28, font: FONT_FAMILY })],
    }),
    new Paragraph({ text: "" }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        left: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        right: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({ shading: { fill: LIGHT_GRAY_BG }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "N°", bold: true, size: 28, font: FONT_FAMILY })] })] }),
            new TableCell({ shading: { fill: LIGHT_GRAY_BG }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Acuerdo/Compromiso", bold: true, size: 28, font: FONT_FAMILY })] })] }),
            new TableCell({ shading: { fill: LIGHT_GRAY_BG }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Responsable", bold: true, size: 28, font: FONT_FAMILY })] })] }),
            new TableCell({ shading: { fill: LIGHT_GRAY_BG }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Fecha Compromiso", bold: true, size: 28, font: FONT_FAMILY })] })] }),
          ],
        }),
        ...(data.agreements || []).map((a: any, index: number) => 
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (index + 1).toString(), size: 24, font: FONT_FAMILY })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.action, size: 24, font: FONT_FAMILY })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.responsible, size: 24, font: FONT_FAMILY })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: a.commitment_date || "", size: 24, font: FONT_FAMILY })] })] }),
            ],
          })
        ),
      ],
    }),

    new Paragraph({ text: "", spacing: { before: 240, after: 240 } }),

    // Aceptación
    new Paragraph({
      shading: { fill: LIGHT_GRAY_BG },
      children: [new TextRun({ text: "Aceptación", bold: true, size: 28, font: FONT_FAMILY })],
    }),
    new Paragraph({
      children: [
        new TextRun({ 
          text: "En un plazo de 48 horas naturales a contar desde la fecha de envío de este documento, Ambas partes podrán indicar cualquier ajuste o aclaración del documento. Pasado este tiempo si no se emite comentarios este documento será dado por aprobado.",
          size: 16, // 8pt
          font: FONT_FAMILY,
        }),
      ],
      spacing: { before: 120 },
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: cmToTwips(3.97),
              bottom: cmToTwips(2.54),
              left: cmToTwips(3.17),
              right: cmToTwips(3.17),
              header: cmToTwips(1.27),
              footer: cmToTwips(1.27),
            },
          },
        },
        headers: {
          default: new Header({
            children: headerChildren,
          }),
        },
        footers: {
          default: new Footer({
            children: footerChildren,
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
