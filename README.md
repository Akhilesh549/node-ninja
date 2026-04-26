# Waste Segregation using Computer Vision

## Problem Statement

**Problem:**
Improper waste segregation leads to environmental pollution, lower recycling efficiency, and increased landfill waste.

**Challenge:**
Build a system that:
- Accepts waste images from camera or upload
- Classifies waste into categories like plastic, paper, glass, metal, e-waste, organic, and trash
- Suggests the correct disposal method
- Tracks scan history and statistics

**Goal:**
Promote proper waste management and support smart city and sustainability initiatives.

---

# Node Ninja - Waste Classification Project

Node Ninja is a waste segregation application that uses computer vision and machine learning to classify waste items from images and guide users on proper disposal.

It includes:
- A React frontend dashboard
- A Node.js backend API
- A Flask-based ML prediction service powered by TensorFlow
- A trained image classification model

## Tech Stack

### Frontend
- React
- Vite
- Recharts
- JavaScript

### Backend
- Node.js
- Express
- Multer
- CORS
- Firebase SDK

### ML Service
- Python
- Flask
- TensorFlow
- OpenCV
- NumPy
- h5py

### Storage
- Firebase when configured
- Local JSON fallback when Firebase is not available

---

## Project Structure

```text
node-ninja/
├── backend/
│   ├── app.py
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Dashboard.jsx
│   │   ├── LoginPage.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── models/
│   └── final_waste_classifier.h5
├── special_dataset/
├── train_special.py
├── requirements.txt
└── README.md
