"""Image generation tool — produces images via Vertex AI Imagen (mock for now)."""

import json

from langchain_core.tools import tool

ASPECT_RATIOS = {
    "1:1": (1024, 1024),
    "16:9": (1920, 1080),
    "9:16": (1080, 1920),
    "4:3": (1024, 768),
}


@tool
def generate_image(
    prompt: str,
    model: str = "imagen-4-standard",
    aspect_ratio: str = "1:1",
    style: str | None = None,
) -> str:
    """Generate an image using Vertex AI Imagen. Returns JSON with image URL and metadata."""
    # TODO: Replace mock with real Vertex AI Imagen 4 integration.
    # from vertexai.preview.vision_models import ImageGenerationModel
    # image_model = ImageGenerationModel.from_pretrained(model)
    # response = image_model.generate_images(prompt=final_prompt, ...)

    # Build the effective prompt
    final_prompt = prompt
    if style:
        final_prompt = f"{prompt}, {style} style"

    # Resolve dimensions from aspect ratio
    width, height = ASPECT_RATIOS.get(aspect_ratio, (1024, 1024))

    result = {
        "url": "https://placeholder.com/generated.png",
        "width": width,
        "height": height,
        "model": model,
        "prompt": final_prompt,
    }

    return json.dumps(result, ensure_ascii=False)
