import requests
from PIL import Image
import io
import os
import sys

def download_and_compress(file_id, output_path):
    url = f"https://drive.google.com/uc?export=download&id={file_id}"
    print(f"Downloading from: {url}")
    response = requests.get(url, stream=True)
    
    if response.status_code == 200:
        content = response.content
        if b"html" in content[:100].lower() and b"google" in content[:100].lower():
            print(f"Failed to download {file_id}: File is not public or requires confirmation.")
            return False
            
        print(f"Successfully downloaded {file_id}. Original size: {len(content) / 1024:.2f} KB")
        img = Image.open(io.BytesIO(content))
        
        if img.mode == 'RGBA':
            bg = Image.new('RGB', img.size, (255, 255, 255))
            bg.paste(img, mask=img.split()[3])
            img = bg
        elif img.mode != 'RGB':
            img = img.convert('RGB')
            
        img.save(output_path, "JPEG", quality=75, optimize=True)
        size = os.path.getsize(output_path)
        print(f"Saved to {output_path}. New size: {size / 1024:.2f} KB")
        return True
    else:
        print(f"Failed to download {file_id}: HTTP {response.status_code}")
        return False

def compress_local_file(input_path, output_path, target_kb=490):
    """Resize and compress a local image file to LINE Rich Menu spec (2500x1686, <500KB)."""
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return False

    img = Image.open(input_path)
    print(f"Original size: {os.path.getsize(input_path) / 1024:.1f} KB, dimensions: {img.size}")
    img = img.resize((2500, 1686), Image.Resampling.LANCZOS)

    if img.mode == 'RGBA':
        bg = Image.new('RGB', img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != 'RGB':
        img = img.convert('RGB')

    for quality in [85, 75, 65, 55, 45]:
        buf = io.BytesIO()
        img.save(buf, 'JPEG', quality=quality, optimize=True)
        size_kb = len(buf.getvalue()) / 1024
        if size_kb <= target_kb:
            with open(output_path, 'wb') as f:
                f.write(buf.getvalue())
            print(f"Saved {output_path} at quality={quality}. Size: {size_kb:.1f} KB")
            return True

    print("Could not compress below target size.")
    return False

# Drive IDs
farmer_id = "1E93hbQdoAmGLQmN7vtaj_2tupxqJ76dd"
admin_id = "1FM_t7Hqj_MHPqFfzLUiQFjiD-uMEc0Y4"

print("--- Compressing Farmer Menu ---")
download_and_compress(farmer_id, "farmer_menu_compressed.jpg")

print("\n--- Compressing Admin Menu ---")
download_and_compress(admin_id, "admin_menu_compressed.jpg")

# วางไฟล์รูป customer menu ในโฟลเดอร์นี้แล้วตั้งชื่อว่า customer_menu_raw.jpg
print("\n--- Compressing Customer Menu (local file) ---")
compress_local_file("customer_menu_raw.jpg", "customer_menu_resized.jpg")

