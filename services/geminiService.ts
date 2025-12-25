
import { GoogleGenAI } from "@google/genai";
import { TreeStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const STYLE_PROMPTS: Record<TreeStyle, string> = {
  [TreeStyle.REALISTIC]: "A breathtakingly realistic, majestic Christmas fir tree, captured with a professional macro lens. Intricate frost on deep green needles, cinematic warm golden string lights, elegant hand-blown glass ornaments. Soft bokeh, high-end studio photography, dark atmospheric background.",
  [TreeStyle.CARTOON]: "A cozy storybook-style Christmas tree illustration, Ghibli-inspired hand-painted textures. Vibrant colors, soft glowing lanterns, whimsical ornaments, charming and detailed line art, enchanting holiday atmosphere, dark navy background.",
  [TreeStyle.WATERCOLOR]: "A masterpiece watercolor painting of a Christmas tree. Ethereal washes of emerald and gold, artistic paint splatters, delicate white glowing dots for lights, dreamlike and fluid, painted on high-quality textured paper, dark charcoal artistic background.",
  [TreeStyle.NEON]: "A sleek futuristic Christmas tree made of glowing fiber optic cables and neon glass tubes. Vibrant cyan and magenta luminescence, high-tech aesthetic, digital art, sharp edges, pure black obsidian background.",
  [TreeStyle.ORIGAMI]: "A stunning origami Christmas tree folded from luxury metallic and washi papers. Precise geometric folds, subtle pearlescent sheen, intricate patterns, minimal and sophisticated paper art, dark dramatic background.",
  [TreeStyle.GOLDEN]: "A luxurious Christmas tree made of swirling liquid gold and sparkling diamond dust. Hyper-detailed particles, glowing magical aura, opulent and shimmering, silhouette of pure light, dark velvet background.",
  [TreeStyle.STAINED_GLASS]: "A magnificent stained glass Christmas tree mosaic. Intricate leaded lines, vibrant translucent jewel-toned glass panels, light glowing from behind the glass, cathedral art style, kaleidoscopic colors, dark background.",
  [TreeStyle.GEOMETRIC]: "An abstract, modern geometric Christmas tree. Minimalist triangular forms, clean architectural lines, sophisticated color palette of forest green and copper, contemporary art museum style, dark minimal background.",
  [TreeStyle.OIL_PAINTING]: "A rich, textured oil painting of a Christmas tree in the style of the Old Masters. Thick impasto brushstrokes, deep shadows and brilliant highlights, warm amber glow, classical fine art masterpiece, dark canvas background.",
  [TreeStyle.CYBERPUNK]: "A gritty, high-detail cyberpunk Christmas tree. Glitch art effects, holographic projections, glowing circuit patterns, integrated tech wires, rainy neon city night aesthetic, dark rainy background."
};

export const generateChristmasTree = async (style: TreeStyle): Promise<string> => {
  try {
    // Strengthen the global prompt instructions to ensure a single centered tree
    const prompt = `
      SUBJECT: One magnificent, centrally-aligned Christmas tree.
      STYLE: ${STYLE_PROMPTS[style]}.
      
      CRITICAL INSTRUCTIONS:
      1. Generate ONLY one single tree in the center of the frame.
      2. The tree MUST have a beautiful, glowing star or topper.
      3. Use a 3:4 vertical composition.
      4. The background must be dark, solid, or atmospheric to make the tree pop.
      5. NO landscapes, NO people, NO outdoor scenes, NO multiple trees.
      6. Avoid generic low-quality 3D renders; prioritize artistic depth, texture, and high-end aesthetic beauty.
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
    // Return a themed fallback placeholder if API fails
    return `https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&q=80&w=1200&h=1600`;
  }
};
