from PIL import Image, ImageOps
import os

# Paths
source_path = r"C:\Users\User\Desktop\Velora-AI\RAG\rag-frontend\src\assets\favicon-2.png"
dest_path = r"C:\Users\User\Desktop\Velora-AI\RAG\rag-frontend\src\assets\favicon-2-cropped.png"

try:
    img = Image.open(source_path)
    img = img.convert("RGBA")
    
    # Attempt 1: Crop transparency
    bbox = img.getbbox()
    
    # Attempt 2: If bbox is full size, try cropping white background
    if bbox == (0, 0, img.width, img.height):
        print("Transparent crop didn't shrink image. Checking for white background...")
        # Create grayscale image
        gray = img.convert("L")
        # Invert (white becomes black, dark becomes white)
        inverted = ImageOps.invert(gray)
        # Get bbox of non-black (original non-white)
        bbox_white = inverted.getbbox()
        
        if bbox_white:
            print(f"Found white background crop: {bbox_white}")
            bbox = bbox_white
        else:
            print("Image seems blank/white.")

    if bbox:
        cropped_img = img.crop(bbox)
        print(f"Original size: {img.size}")
        print(f"Cropped size: {cropped_img.size}")
        
        # Save cropped image
        cropped_img.save(dest_path)
        print(f"Successfully saved cropped favicon to {dest_path}")
    else:
        print("Image content could not be determined.")
        
except Exception as e:
    print(f"Error processing image: {e}")
