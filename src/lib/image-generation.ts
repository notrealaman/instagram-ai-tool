export interface ImageGenerationOptions {
  prompt: string;
  width?: number;
  height?: number;
  model?: "flux" | "flux-realism" | "flux-anime" | "flux-3d" | "turbo";
  seed?: number;
  enhance?: boolean;
}

export interface GeneratedImage {
  url: string;
  width: number;
  height: number;
}

const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";

const STYLE_SUFFIXES: Record<string, string> = {
  instagram: ", Instagram aesthetic, high quality, vibrant colors, professional photography",
  product: ", product photography, clean background, studio lighting, commercial quality",
  food: ", food photography, overhead shot, appetizing, restaurant quality",
  lifestyle: ", lifestyle photography, natural lighting, authentic feel",
  fitness: ", fitness photography, energetic, motivational, gym or outdoor",
  fashion: ", fashion photography, stylish, editorial quality",
  travel: ", travel photography, scenic, wanderlust, destination",
  business: ", professional business photo, corporate quality, clean modern",
};

export function generateImageUrl(options: ImageGenerationOptions): string {
  const {
    prompt,
    width = 1080,
    height = 1080,
    model = "flux",
    seed,
    enhance = true,
  } = options;

  // Add Instagram-style suffix if enhance is true
  const enhancedPrompt = enhance ? prompt + (STYLE_SUFFIXES.instagram || "") : prompt;

  const encodedPrompt = encodeURIComponent(enhancedPrompt);

  let url = `${POLLINATIONS_BASE_URL}/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`;

  if (seed !== undefined) {
    url += `&seed=${seed}`;
  }

  return url;
}

export async function generateImage(
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const url = generateImageUrl(options);

  // For Pollinations, we just return the URL
  // The client can display it directly or download it
  return {
    url,
    width: options.width || 1080,
    height: options.height || 1080,
  };
}

export function getInstagramSizes() {
  return [
    { name: "Square Post", width: 1080, height: 1080, description: "Standard Instagram post" },
    { name: "Portrait Post", width: 1080, height: 1350, description: "Taller format, more screen space" },
    { name: "Landscape Post", width: 1080, height: 608, description: "Wide format" },
    { name: "Story/Reel", width: 1080, height: 1920, description: "Full vertical for Stories & Reels" },
    { name: "Carousel", width: 1080, height: 1080, description: "Square for carousel posts" },
  ];
}

export function getStylePresets() {
  return [
    { id: "instagram", name: "Instagram Classic", suffix: STYLE_SUFFIXES.instagram },
    { id: "product", name: "Product Showcase", suffix: STYLE_SUFFIXES.product },
    { id: "food", name: "Food Photography", suffix: STYLE_SUFFIXES.food },
    { id: "lifestyle", name: "Lifestyle", suffix: STYLE_SUFFIXES.lifestyle },
    { id: "fitness", name: "Fitness", suffix: STYLE_SUFFIXES.fitness },
    { id: "fashion", name: "Fashion", suffix: STYLE_SUFFIXES.fashion },
    { id: "travel", name: "Travel", suffix: STYLE_SUFFIXES.travel },
    { id: "business", name: "Business", suffix: STYLE_SUFFIXES.business },
    { id: "none", name: "No Style (Raw)", suffix: "" },
  ];
}
