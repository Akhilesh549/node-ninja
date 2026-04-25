# Node Ninja - Waste Classification ML Project

A machine learning project for classifying waste into four categories: **Metal**, **Plastic**, **Organic**, and **Paper/Cardboard**.

## Project Structure

```
node-ninja/
├── README.md                 # This file
├── requirements.txt          # Python dependencies
├── train.py                  # Training script
├── dataset_raw/              # Raw dataset (source)
│   ├── cardboard/
│   ├── metal/
│   ├── paper/
│   └── plastic/
├── dataset/                  # Processed dataset (created after preprocessing)
│   ├── train/
│   │   ├── metal/
│   │   ├── organic/          # paper + cardboard combined
│   │   └── plastic/
│   └── val/
│       ├── metal/
│       ├── organic/          # paper + cardboard combined
│       └── plastic/
└── src/
    └── preprocess.py         # Data preprocessing script
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Prepare Raw Dataset
Place your waste images in the `dataset_raw/` folder organized by category:
- `dataset_raw/metal/` - Metal waste images
- `dataset_raw/plastic/` - Plastic waste images
- `dataset_raw/paper/` - Paper waste images
- `dataset_raw/cardboard/` - Cardboard waste images

Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`

### 3. Preprocess Dataset
The preprocessing script will:
- Split data into 80% train, 20% validation
- Combine `paper` and `cardboard` into `organic` category
- Organize data into the `dataset/` folder structure

```bash
python src/preprocess.py
```

Expected output:
```
✅ Dataset preprocessing completed! (XXXX images processed)
Output directory: c:\path\to\node-ninja\dataset
```

### 4. Train the Model
```bash
python train.py
```

The model will:
- Use ResNet50 pretrained on ImageNet
- Train for 20 epochs with Adam optimizer
- Save weights to `model_weights.pth`

## Class Mapping

| Raw Dataset | Processed Dataset | Count |
|-------------|------------------|-------|
| `cardboard` | `organic`        | -     |
| `metal`     | `metal`          | -     |
| `paper`     | `organic`        | -     |
| `plastic`   | `plastic`        | -     |

## Key Changes Made

✅ **Fixed preprocess.py:**
- Changed to absolute paths using `Path` module (no more relative path errors)
- Added validation for missing folders and images
- Filter only image files (ignore other formats)
- Added error handling for file operations
- Improved console output with status indicators
- Image count tracking

✅ **Created train.py:**
- ResNet50 based model with transfer learning
- Data augmentation for robust training
- Validation during training
- Model checkpoint saving

✅ **Updated requirements.txt:**
- Added all necessary dependencies (PyTorch, scikit-learn, OpenCV, Pillow)

## Troubleshooting

**Error: "Dataset path not found"**
- Ensure `dataset_raw/` folder exists in the project root
- Verify folders contain image files

**Error: "No images found"**
- Check that image files have proper extensions (.jpg, .png, etc.)
- Ensure image files are not corrupted

**GPU not available?**
- The script automatically falls back to CPU
- GPU training is recommended for faster processing (NVIDIA CUDA required)

## Next Steps

1. Add more preprocessing features (image resizing, normalization)
2. Implement model evaluation metrics
3. Add prediction script for inference
4. Deploy model as API/web service

---
**Created for Node Ninja Hackathon**