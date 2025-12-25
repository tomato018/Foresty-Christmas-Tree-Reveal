
import { GoogleGenAI } from "@google/genai";
import { TreeStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const STYLE_PROMPTS: Record<TreeStyle, string> = {
  [TreeStyle.REALISTIC]: "A breathtakingly realistic, majestic Christmas tree with a soft amber glow. Intricate pine needles with light dusting of snow, warm golden string lights, classic glass ornaments. Professional photography, shallow depth of field, cozy living room atmosphere in the background, very warm color palette.",
  [TreeStyle.CARTOON]: "A high-end 'realistic cartoon' style illustration, reminiscent of classic hand-painted Disney or Ghibli backgrounds. Rich gouache textures, soft glowing lanterns, whimsical warm details, nostalgic holiday charm, vibrant but warm colors, thick painterly edges.",
  [TreeStyle.WATERCOLOR]: "An exquisite watercolor and ink painting of a Christmas tree. Flowing washes of deep forest green and gold, artistic bleeding edges, delicate white highlights, warm candlelight reflections, expressive brushwork on textured paper.",
  [TreeStyle.NEON]: "Artistic synthwave Christmas tree with a warm retro-glow. Soft neon tubes in gold and crimson, cinematic bloom, digital painting with high-end textures, nostalgic 80s holiday aesthetic, dark warm background.",
  [TreeStyle.ORIGAMI]: "Sophisticated paper-art Christmas tree. Hand-folded from warm ivory and gold parchment, soft studio lighting creating gentle shadows, intricate paper textures, elegant and tactile fine art style.",
  [TreeStyle.GOLDEN]: "A masterpiece painting of a tree made of liquid gold and warm embers. Glowing particles, ethereal light, rich impasto textures, opulent and shimmering, dark velvet atmosphere with golden reflections.",
  [TreeStyle.STAINED_GLASS]: "A glowing stained glass mosaic Christmas tree. Warm light pouring through amber, ruby, and emerald glass panels. Intricate leaded lines, kaleidoscopic warm reflections, cathedral-like atmosphere.",
  [TreeStyle.GEOMETRIC]: "Modern artistic interpretation of a tree. Warm wooden triangular forms with copper accents, clean architectural lines, sophisticated amber lighting, contemporary art museum aesthetic, organic textures.",
  [TreeStyle.OIL_PAINTING]: "A classic Old Masters oil painting of a Christmas tree. Heavy impasto brushstrokes, rich textures, dramatic chiaroscuro lighting with a strong warm amber glow, deep shadows, timeless fine art masterpiece.",
  [TreeStyle.CYBERPUNK]: "A detailed 'Cyber-Noir' Christmas tree. Warm holographic projections of ornaments, soft orange and red neon wires, rainy atmospheric city window reflection, rich digital paint texture, cozy-futuristic vibe."
};

export const generateChristmasTree = async (style: TreeStyle): Promise<string> => {
  try {
    const prompt = `
      SUBJECT: One magnificent, centrally-aligned Christmas tree.
      STYLE: ${STYLE_PROMPTS[style]}.
      
      CRITICAL INSTRUCTIONS:
      1. Generate ONLY one single tree in the center of the frame.
      2. The tree MUST have a beautiful, glowing star or topper.
      3. Use a 3:4 vertical composition.
      4. COLOR PALETTE: Emphasize warm golds, deep ambers, and rich festive reds.
      5. AVOID: Do NOT produce generic 3D renders, plastic CGI, or sterile low-poly art. 
      6. TEXTURE: Prioritize rich, organic, and painterly textures (oil paint, gouache, or high-end photography).
      7. The background must be dark and atmospheric to make the warm lighting pop.
    `.trim();
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image data received from Gemini");
  } catch (error) {
    console.error("Error generating Christmas tree:", error);
    return `https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&q=80&w=1200&h=1600`;
  }
};
