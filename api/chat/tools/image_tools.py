"""Image generation tool — produces images via Imagen, Gemini (nano-banana) or DALL-E 3."""

import base64
import json

from langchain_core.tools import tool

from chat.tools.retry import retry_on_error
from config import settings

ASPECT_RATIOS = {
    "1:1": (1024, 1024),
    "16:9": (1920, 1080),
    "9:16": (1080, 1920),
    "4:3": (1024, 768),
}

IMAGEN_MODEL_MAP = {
    "imagen-4-standard": "imagen-4.0-generate-001",
    "imagen-4-fast": "imagen-4.0-fast-generate-001",
    "imagen-4-ultra": "imagen-4.0-ultra-generate-001",
}

NANO_BANANA_MODEL = "gemini-2.5-flash-image"

DALLE_SIZE_MAP = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3": "1024x1024",
}


def _generate_with_imagen(prompt: str, model: str, aspect_ratio: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    @retry_on_error(max_retries=3, base_delay=1.0)
    def _call():
        return client.models.generate_images(
            model=model,
            prompt=prompt,
            config=types.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio if aspect_ratio in ASPECT_RATIOS else "1:1",
            ),
        )

    response = _call()
    if not response.generated_images:
        raise ValueError(f"Modelo '{model}' não retornou imagem (indisponível para esta API key)")
    image_bytes = response.generated_images[0].image.image_bytes
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def _generate_with_nano_banana(prompt: str, aspect_ratio: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.GOOGLE_API_KEY)

    @retry_on_error(max_retries=3, base_delay=1.0)
    def _call():
        return client.models.generate_content(
            model=NANO_BANANA_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio if aspect_ratio in ASPECT_RATIOS else "1:1",
                ),
            ),
        )

    response = _call()
    for part in response.candidates[0].content.parts:
        inline_data = getattr(part, "inline_data", None)
        if inline_data and inline_data.data:
            b64 = base64.b64encode(inline_data.data).decode("utf-8")
            mime = inline_data.mime_type or "image/png"
            return f"data:{mime};base64,{b64}"
    raise ValueError("Nano Banana não retornou imagem")


def _generate_with_dalle(prompt: str, aspect_ratio: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    size = DALLE_SIZE_MAP.get(aspect_ratio, "1024x1024")

    @retry_on_error(max_retries=3, base_delay=1.0)
    def _call():
        return client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size=size,
            n=1,
            response_format="b64_json",
        )

    response = _call()
    b64 = response.data[0].b64_json
    return f"data:image/png;base64,{b64}"


@tool
def generate_image(
    prompt: str,
    model: str = "imagen-4-standard",
    aspect_ratio: str = "1:1",
    style: str | None = None,
) -> str:
    """Generate an image from a text prompt.

    Returns JSON with the image as a data URI and metadata.
    """
    final_prompt = f"{prompt}, {style} style" if style else prompt
    width, height = ASPECT_RATIOS.get(aspect_ratio, ASPECT_RATIOS["1:1"])

    try:
        if model == "dall-e-3" and settings.OPENAI_API_KEY:
            url = _generate_with_dalle(final_prompt, aspect_ratio)
        elif model == "nano-banana" and settings.GOOGLE_API_KEY:
            url = _generate_with_nano_banana(final_prompt, aspect_ratio)
        elif settings.GOOGLE_API_KEY:
            imagen_model = IMAGEN_MODEL_MAP.get(model, IMAGEN_MODEL_MAP["imagen-4-standard"])
            url = _generate_with_imagen(final_prompt, imagen_model, aspect_ratio)
        else:
            return json.dumps(
                {"error": "Nenhuma API key configurada para geração de imagem."},
                ensure_ascii=False,
            )
    except Exception as exc:
        return json.dumps({"error": f"[generate_image error] {exc}"}, ensure_ascii=False)

    result = {
        "url": url,
        "width": width,
        "height": height,
        "model": model,
        "prompt": final_prompt,
    }
    return json.dumps(result, ensure_ascii=False)
