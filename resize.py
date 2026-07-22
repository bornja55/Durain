import requests
from PIL import Image
import io
import os

def resize_and_compress(file_id, output_path):
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    print(f"Downloading from: {url}")
    response = requests.get(url, stream=True)
    
    if response.status_code == 200:
        content = response.content
        img = Image.open(io.BytesIO(content))
        print(f"Original dimensions: {img.size}")
        
        # Resize to exactly 2500x1686 (LINE Rich Menu requirement)
        img = img.resize((2500, 1686), Image.Resampling.LANCZOS)
        
        if img.mode == 'RGBA':
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
            
        img.save(output_path, "JPEG", quality=85, optimize=True)
        size = os.path.getsize(output_path)
        print(f"Saved {output_path} with dimensions 2500x1686. New size: {size / 1024:.2f} KB")
        return True
    else:
        print(f"Failed to download {file_id}: HTTP {response.status_code}")
        return False

# Drive IDs (the ones user just provided)
admin_id = "1oaQ8d4djfExd-h5e3mtas07y1sfddBP-"
farmer_id = "1fsEm8m8v3YxXEjfBx3uapg_Q5CGjJQLd"

print("--- Resizing and Compressing Farmer Menu ---")
resize_and_compress(farmer_id, "farmer_menu_resized.jpg")

print("\n--- Resizing and Compressing Admin Menu ---")
resize_and_compress(admin_id, "admin_menu_resized.jpg")
