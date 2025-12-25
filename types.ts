
export enum TreeStyle {
  REALISTIC = 'realistic',
  CARTOON = 'cartoon',
  WATERCOLOR = 'watercolor',
  NEON = 'neon',
  ORIGAMI = 'origami',
  GOLDEN = 'golden',
  STAINED_GLASS = 'stained_glass',
  GEOMETRIC = 'geometric',
  OIL_PAINTING = 'oil_painting',
  CYBERPUNK = 'cyberpunk'
}

export interface TreeData {
  imageUrl: string;
  style: TreeStyle;
  revealed: boolean;
}
