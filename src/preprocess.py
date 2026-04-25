import os
import shutil
from pathlib import Path
from sklearn.model_selection import train_test_split

# Get absolute paths based on script location
SCRIPT_DIR = Path(__file__).parent.absolute()
PROJECT_ROOT = SCRIPT_DIR.parent
DATASET_PATH = PROJECT_ROOT / "dataset_raw"
OUTPUT_PATH = PROJECT_ROOT / "dataset"

mapping = {
    "plastic": "plastic",
    "metal": "metal",
    "paper": "organic",
    "cardboard": "organic"
}

# Validate dataset_raw exists
if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Dataset path not found: {DATASET_PATH}")

# Create output folders
for split in ["train", "val"]:
    for cls in ["plastic", "metal", "organic"]:
        (OUTPUT_PATH / split / cls).mkdir(parents=True, exist_ok=True)

# Process dataset
total_images = 0
for folder in mapping:
    folder_path = DATASET_PATH / folder

    if not folder_path.exists():
        print(f"⚠️ Missing folder: {folder_path}")
        continue

    images = [f for f in os.listdir(folder_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp'))]
    
    if not images:
        print(f"⚠️ No images found in: {folder_path}")
        continue

    train_imgs, val_imgs = train_test_split(images, test_size=0.2, random_state=42)
    total_images += len(images)

    # Copy train images
    for img in train_imgs:
        src = folder_path / img
        dst = OUTPUT_PATH / "train" / mapping[folder] / img
        try:
            shutil.copy(str(src), str(dst))
        except Exception as e:
            print(f"Error copying {src}: {e}")

    # Copy validation images
    for img in val_imgs:
        src = folder_path / img
        dst = OUTPUT_PATH / "val" / mapping[folder] / img
        try:
            shutil.copy(str(src), str(dst))
        except Exception as e:
            print(f"Error copying {src}: {e}")

print(f" Dataset preprocessing completed! ({total_images} images processed)")
print(f"Output directory: {OUTPUT_PATH}")