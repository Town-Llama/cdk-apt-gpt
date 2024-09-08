from dotenv import load_dotenv

load_dotenv()  # take environment variables from .env.


from gpt_scraper.vlm import (
    GptVisionLanguageModel,
    Phi3VisionLanguageModel,
    VisionLanguageModel,
)
from PIL import Image

img = Image.open("examples/example_menu.jpg")

vlm: VisionLanguageModel = Phi3VisionLanguageModel()

a1 = vlm.vlm(
    img,
    prompt="<|image_1|> Create a markdown table with all the items on the menu.  Include the columns NAME, DESCRIPTION, and PRICE.",
    system_prompt="Output a table in markdown format.",
)

print("A1\n", a1)

vlm = GptVisionLanguageModel()

a2 = vlm.vlm(
    img,
    prompt="<|image_1|> Create a markdown table with all the items on the menu.  Include the columns NAME, DESCRIPTION, and PRICE.",
    system_prompt="Output a table in markdown format.",
)

print("A2\n", a1)
