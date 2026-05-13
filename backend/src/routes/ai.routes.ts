import express, { Request, Response } from "express";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/generate-image", protect(["admin"]), async (req: Request, res: Response) => {
  try {
    const { prompt, size = "medium" } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Prompt requerido" });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: "OpenAI API key no configurada" });
    }

    const sizeMap: Record<string, string> = {
      small: "256x256",
      medium: "512x512",
      large: "1024x1024"
    };

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: `${prompt}, 3D print design, product photography, clean white background`,
        n: 1,
        size: sizeMap[size] || "512x512"
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      return res.status(500).json({ error: "Error al generar imagen" });
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    res.json({ imageUrl });
  } catch (e) {
    console.error("AI generate error:", e);
    res.status(500).json({ error: "Error interno" });
  }
});

export default router;