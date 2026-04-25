const categories = [
  {
    category: "Plastic",
    confidence: 0.92,
    tip: "Rinse if needed and place it in the dry recycling bin.",
    bin: "Dry recycling",
  },
  {
    category: "Organic",
    confidence: 0.88,
    tip: "Send food scraps and plant waste to compost or the wet waste bin.",
    bin: "Compost / wet waste",
  },
  {
    category: "Metal",
    confidence: 0.95,
    tip: "Empty the container and recycle it with other metal items.",
    bin: "Metal recycling",
  },
  {
    category: "Glass",
    confidence: 0.91,
    tip: "Keep it unbroken where possible and place it in glass recycling.",
    bin: "Glass recycling",
  },
  {
    category: "Paper",
    confidence: 0.89,
    tip: "Keep paper clean and dry before sending it for recycling.",
    bin: "Paper recycling",
  },
];

export async function classifyImage(imageData) {
  if (!imageData) {
    throw new Error("No image was captured.");
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));

  return categories[Math.floor(Math.random() * categories.length)];
}
