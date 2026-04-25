import cv2
import numpy as np
from tensorflow.keras.models import load_model

model = load_model("../models/waste_classifier.h5")

classes = ['metal', 'organic', 'plastic']

img = cv2.imread("test.jpeg")   # put any test image
if img is None:
    raise FileNotFoundError("Image file not found. Please provide a valid test image.")
img = cv2.resize(img, (224,224))
img = img / 255.0
img = np.reshape(img, (1,224,224,3))

pred = model.predict(img)
label = classes[np.argmax(pred)]
confidence = np.max(pred)

print(f"Prediction: {label}")
print(f"Confidence: {confidence*100:.2f}%")