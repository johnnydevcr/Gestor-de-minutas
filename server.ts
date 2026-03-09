import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import multer from "multer";
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
} from "docx";

const db = new Database("app.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    file_data BLOB,
    mime_type TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS minutes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    minute_number TEXT NOT NULL,
    client TEXT,
    client_id INTEGER,
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    location TEXT,
    responsible TEXT,
    attendees TEXT,
    absentees TEXT,
    objective TEXT,
    executive_summary TEXT,
    topics TEXT,
    pending_topics TEXT,
    transcript TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agreements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    minute_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    responsible TEXT,
    commitment_date TEXT,
    status TEXT DEFAULT 'pendiente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (minute_id) REFERENCES minutes(id) ON DELETE CASCADE
  );
`);

// Migration: Add client_id to minutes if it doesn't exist
try {
  db.prepare("ALTER TABLE minutes ADD COLUMN client_id INTEGER").run();
} catch (e) {
  // Column already exists or table doesn't exist yet (handled by CREATE TABLE)
}

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Settings
  app.get("/api/settings/logo", (req, res) => {
    const logo = db
      .prepare("SELECT file_data, mime_type FROM settings WHERE key = 'logo'")
      .get() as any;
    if (!logo || !logo.file_data) {
      return res.status(404).json({ error: "Logo not found" });
    }
    res.setHeader("Content-Type", logo.mime_type);
    res.send(logo.file_data);
  });

  app.post("/api/settings/logo", upload.single("logo"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const stmt = db.prepare(`
      INSERT INTO settings (key, file_data, mime_type) 
      VALUES ('logo', ?, ?)
      ON CONFLICT(key) DO UPDATE SET file_data = excluded.file_data, mime_type = excluded.mime_type, updated_at = CURRENT_TIMESTAMP
    `);
    stmt.run(req.file.buffer, req.file.mimetype);
    res.json({ success: true });
  });

  // Designs
  app.get("/api/designs", (req, res) => {
    res.json([
      {
        id: "classic",
        name: "Diseño Clásico",
        description: "Estructura tradicional y formal.",
      },
      {
        id: "modern",
        name: "Diseño Moderno",
        description: "Estilo contemporáneo con énfasis en la claridad.",
      },
      {
        id: "minimalist",
        name: "Diseño Minimalista",
        description: "Limpio, directo y sin distracciones.",
      },
    ]);
  });

  app.get("/api/designs/:id/download", async (req, res) => {
    try {
      const designId = req.params.id;
      const logoRow = db
        .prepare("SELECT file_data FROM settings WHERE key = 'logo'")
        .get() as any;
      const logoBuffer = logoRow ? logoRow.file_data : null;

      let headerChildren: any[] = [];
      if (logoBuffer) {
        headerChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: logoBuffer,
                transformation: { width: 150, height: 50 },
                type: "png",
              }),
            ],
          }),
        );
      }

      // Base content for all designs (placeholders for docxtemplater)
      const content = [
        new Paragraph({
          text: "Minuta de Reunión",
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({ text: "Número de Minuta: ", bold: true }),
            new TextRun("{{NUMERO_MINUTA}}"),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Cliente/Proyecto: ", bold: true }),
            new TextRun("{{CLIENTE}}"),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Fecha: ", bold: true }),
            new TextRun("{{FECHA}}"),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Hora de Inicio: ", bold: true }),
            new TextRun("{{HORA_INICIO}}"),
            new TextRun({ text: "  Hora de Fin: ", bold: true }),
            new TextRun("{{HORA_FIN}}"),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Lugar: ", bold: true }),
            new TextRun("{{LUGAR}}"),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Responsable: ", bold: true }),
            new TextRun("{{RESPONSABLE}}"),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Asistentes", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "{{ASISTENTES}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Ausentes", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "{{AUSENTES}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Objetivo de la Reunión",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "{{OBJETIVO_REUNION}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Resumen Ejecutivo",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "{{RESUMEN_EJECUTIVO}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Temas Tratados",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "{{TEMAS_TRATADOS}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "Acuerdos", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: "{{ACUERDOS}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Temas Pendientes",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: "{{PENDIENTES}}" }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Tabla de Acuerdos (Avanzado)",
          heading: HeadingLevel.HEADING_1,
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Acción", bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Responsable", bold: true }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Fecha Límite", bold: true }),
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
                    new Paragraph("{{#TABLA_ACUERDOS}}"),
                    new Paragraph("{{action}}")
                  ],
                }),
                new TableCell({ children: [new Paragraph("{{responsible}}")] }),
                new TableCell({
                  children: [
                    new Paragraph("{{commitment_date}}"),
                    new Paragraph("{{/TABLA_ACUERDOS}}"),
                  ],
                }),
              ],
            }),
          ],
        }),
      ];

      // We can customize the document properties based on designId
      // For simplicity, we just use the same structure but you could change fonts/colors here
      const doc = new Document({
        sections: [
          {
            properties: {},
            headers: {
              default: new Header({
                children: headerChildren,
              }),
            },
            children: content,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Plantilla_${designId}.docx"`,
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      );
      res.send(buffer);
    } catch (error) {
      console.error("Error generating design template:", error);
      res.status(500).json({ error: "Failed to generate design template" });
    }
  });

  // Clients
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name ASC").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    const { name, code } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO clients (name, code) VALUES (?, ?)");
      const info = stmt.run(name, code);
      res.json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/clients/:id", (req, res) => {
    const { name, code } = req.body;
    try {
      const stmt = db.prepare("UPDATE clients SET name = ?, code = ? WHERE id = ?");
      stmt.run(name, code, req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/clients/:id", (req, res) => {
    try {
      const stmt = db.prepare("DELETE FROM clients WHERE id = ?");
      stmt.run(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Minutes
  app.get("/api/minutes", (req, res) => {
    const { client_id } = req.query;
    let query = "SELECT id, minute_number, client, client_id, date, responsible, created_at FROM minutes";
    let params: any[] = [];

    if (client_id) {
      query += " WHERE client_id = ?";
      params.push(client_id);
    }

    query += " ORDER BY created_at DESC";
    
    const minutes = db.prepare(query).all(...params);
    res.json(minutes);
  });

  app.get("/api/minutes/:id", (req, res) => {
    const minute = db
      .prepare("SELECT * FROM minutes WHERE id = ?")
      .get(req.params.id) as any;
    if (!minute) {
      return res.status(404).json({ error: "Minute not found" });
    }
    minute.attendees = JSON.parse(minute.attendees || "[]");
    minute.absentees = JSON.parse(minute.absentees || "[]");
    minute.topics = JSON.parse(minute.topics || "[]");
    minute.pending_topics = JSON.parse(minute.pending_topics || "[]");

    const agreements = db
      .prepare("SELECT * FROM agreements WHERE minute_id = ?")
      .all(req.params.id);
    res.json({ ...minute, agreements });
  });

  app.post("/api/minutes", (req, res) => {
    try {
      const {
        minute_number,
        client,
        client_id,
        date,
        start_time,
        end_time,
        location,
        responsible,
        attendees,
        absentees,
        objective,
        executive_summary,
        topics,
        pending_topics,
        transcript,
        agreements,
      } = req.body;

      const insertMinute = db.prepare(`
        INSERT INTO minutes (
          minute_number, client, client_id, date, start_time, end_time, location, responsible,
          attendees, absentees, objective, executive_summary, topics, pending_topics, transcript
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertAgreement = db.prepare(`
        INSERT INTO agreements (minute_id, action, responsible, commitment_date, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        const info = insertMinute.run(
          minute_number,
          client,
          client_id,
          date,
          start_time,
          end_time,
          location,
          responsible,
          JSON.stringify(attendees || []),
          JSON.stringify(absentees || []),
          objective,
          executive_summary,
          JSON.stringify(topics || []),
          JSON.stringify(pending_topics || []),
          transcript,
        );

        const minuteId = info.lastInsertRowid;

        if (agreements && Array.isArray(agreements)) {
          for (const ag of agreements) {
            insertAgreement.run(
              minuteId,
              ag.action,
              ag.responsible,
              ag.commitment_date,
              ag.status || "pendiente",
            );
          }
        }
        return minuteId;
      });

      const newId = transaction();
      res.json({ id: newId });
    } catch (error: any) {
      console.error("Error saving minute:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/minutes/:id", (req, res) => {
    try {
      const {
        client,
        client_id,
        date,
        start_time,
        end_time,
        location,
        responsible,
        attendees,
        absentees,
        objective,
        executive_summary,
        topics,
        pending_topics,
        transcript,
        agreements,
      } = req.body;
      const id = req.params.id;

      const updateMinute = db.prepare(`
        UPDATE minutes SET
          client = ?, client_id = ?, date = ?, start_time = ?, end_time = ?, location = ?, responsible = ?,
          attendees = ?, absentees = ?, objective = ?, executive_summary = ?, topics = ?, pending_topics = ?, transcript = ?
        WHERE id = ?
      `);

      const deleteAgreements = db.prepare(
        "DELETE FROM agreements WHERE minute_id = ?",
      );
      const insertAgreement = db.prepare(`
        INSERT INTO agreements (minute_id, action, responsible, commitment_date, status)
        VALUES (?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        updateMinute.run(
          client,
          client_id,
          date,
          start_time,
          end_time,
          location,
          responsible,
          JSON.stringify(attendees || []),
          JSON.stringify(absentees || []),
          objective,
          executive_summary,
          JSON.stringify(topics || []),
          JSON.stringify(pending_topics || []),
          transcript,
          id,
        );

        deleteAgreements.run(id);

        if (agreements && Array.isArray(agreements)) {
          for (const ag of agreements) {
            insertAgreement.run(
              id,
              ag.action,
              ag.responsible,
              ag.commitment_date,
              ag.status || "pendiente",
            );
          }
        }
      });

      transaction();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating minute:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Agreements
  app.get("/api/agreements", (req, res) => {
    const agreements = db
      .prepare(
        `
      SELECT a.*, m.minute_number, m.client 
      FROM agreements a
      JOIN minutes m ON a.minute_id = m.id
      ORDER BY a.created_at DESC
    `,
      )
      .all();
    res.json(agreements);
  });

  app.put("/api/agreements/:id/status", (req, res) => {
    const { status } = req.body;
    const stmt = db.prepare("UPDATE agreements SET status = ? WHERE id = ?");
    stmt.run(status, req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
