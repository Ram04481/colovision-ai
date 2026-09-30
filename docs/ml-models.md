# ML Models

> **Source of Truth**: Training notebooks in `ML_API/` (`final_segmentation.ipynb`, `final_mega_project__classification_model.ipynb`)
> **Never invent architecture details**. If unverifiable, mark **NEEDS VERIFICATION**.

---

## Segmentation Model

### Model File
- **Path**: `ML_API/best_segmentation_model.pth` (293 MB)
- **Format**: PyTorch state_dict (or full checkpoint with optimizer)
- **Training Notebook**: `ML_API/final_segmentation.ipynb`

### Architecture
| Parameter | Value | Source |
|-----------|-------|--------|
| Framework | segmentation-models-pytorch (smp) | Notebook |
| Model | `smp.Unet` | Notebook |
| Encoder | `resnet34` | Notebook |
| Encoder Weights | `imagenet` | Notebook |
| Input Channels | 3 | Notebook |
| Output Classes | 1 (binary) | Notebook |
| Activation | None (logits) | Notebook |

### Input Preprocessing (Training)
```python
train_transform = A.Compose([
    A.Resize(256, 256),
    A.HorizontalFlip(p=0.5),
    A.VerticalFlip(p=0.5),
    A.Rotate(limit=30, p=0.5),
    A.RandomBrightnessContrast(p=0.2),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])

val_transform = A.Compose([
    A.Resize(256, 256),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])
```

**Inference Preprocessing** (must match `val_transform`):
1. Resize to 256×256
2. Normalize: ImageNet mean/std
3. Convert to CHW tensor (float32, 0-1 range)
4. Add batch dimension → `[1, 3, 256, 256]`

### Output
- **Raw**: Logits `[1, 1, 256, 256]` (no activation)
- **Post-process**: Sigmoid → threshold 0.5 → binary mask `[256, 256]`
- **Training Threshold**: 0.5 (used in evaluation)

### Checkpoint Format
```python
# Saved during training
torch.save({
    "epoch": epoch,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "best_dice": best_dice
}, "best_segmentation_model.pth")
```

**Verification Needed**: Does the `.pth` contain full checkpoint or just `state_dict`?

### Device Handling
- **Training**: CUDA if available (`torch.device("cuda" if torch.cuda.is_available() else "cpu")`)
- **Inference**: Must support CPU and GPU

### Loss Function
```python
# Combined BCE + Dice
bce_loss = nn.BCEWithLogitsLoss()
dice_loss = DiceLoss()
def combined_loss(pred, target):
    return bce_loss(pred, target) + dice_loss(pred, target)
```

---

## Classification Model

### Model File
- **Path**: `ML_API/best_classifier_model_v3.pth` (48 MB)
- **Format**: PyTorch checkpoint with metadata
- **Training Notebook**: `ML_API/final_mega_project__classification_model.ipynb`

### Architecture
| Parameter | Value | Source |
|-----------|-------|--------|
| Framework | timm | Notebook |
| Model | `timm.create_model("efficientnet_b0", pretrained=True, num_classes=6)` | Notebook |
| Input Channels | 3 | Notebook (RGB) |
| Output Classes | 6 | Notebook |

### Class Mapping (Training)
```python
# Labels extracted from filenames: "ClassName_number.png"
# LabelEncoder produces alphabetical order:
class_names = [
    'adenocarcinoma',      # 0
    'high-grade in',       # 1
    'low-grade in',        # 2
    'normal',              # 3
    'polyp',               # 4
    'serrated adenoma'     # 5
]
```

**CRITICAL**: Training uses **lowercase** class names. Current `ModelService.CLASSES` uses **Title Case**:
```java
// ModelService.java line 14
private static final String[] CLASSES = {
    "Adenocarcinoma", "High-grade IN", "Low-grade IN", 
    "Normal", "Polyp", "Serrated Adenoma"
};
```

**If ONNX export preserves class order but not names**: Index mapping is correct but display names differ.
**If class order differs**: Predictions will be wrong.

### Input Preprocessing (Training)
```python
val_transform = A.Compose([
    A.Resize(224, 224),
    A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
    ToTensorV2()
])
```

**Inference Preprocessing** (must match exactly):
1. Resize to 224×224
2. Normalize: ImageNet mean/std
3. Convert to CHW tensor
4. Add batch dimension → `[1, 3, 224, 224]`

### Output
- **Raw**: Logits `[1, 6]`
- **Post-process**: Softmax → probabilities `[6]`
- **Prediction**: `argmax` → class index → class name

### Checkpoint Format
```python
checkpoint = {
    "epoch": best_epoch,
    "model_state_dict": best_model_state,
    "optimizer_state_dict": optimizer.state_dict(),
    "scheduler_state_dict": scheduler.state_dict(),
    "best_val_loss": best_val_loss,
    "best_val_accuracy": best_val_accuracy,
    "best_val_f1": best_val_f1,
    "class_names": class_names  # CRITICAL - preserves training class order
}
```

**Verification Needed**: Load checkpoint and verify `class_names` order matches expectation.

### Device Handling
- **Training**: CUDA if available
- **Inference**: Must support CPU and GPU

### Loss Function
```python
# Class-weighted CrossEntropyLoss
class_counts = [556, 130, 446, 53, 332, 41]
class_weights = 1.0 / torch.sqrt(class_counts)
class_weights = class_weights / class_weights.mean()
criterion = nn.CrossEntropyLoss(weight=class_weights.to(DEVICE))
```

### Optimizer & Scheduler
```python
optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), 
                              lr=3e-5, weight_decay=1e-4)
scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=3)
```

---

## Export Requirements

### Option A: ONNX Export (Current Backend Expectation)
```python
# Segmentation
torch.onnx.export(model, dummy_input, "segmentation.onnx",
    input_names=["input"], output_names=["output"],
    dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
    opset_version=17)

# Classification
torch.onnx.export(model, dummy_input, "classifier.onnx",
    input_names=["input"], output_names=["output"],
    dynamic_axes={"input": {0: "batch"}, "output": {0: "batch"}},
    opset_version=17)
```

**Backend Expectation**: `ModelService` looks for:
- `segmentation.onnx` or `best_segmentation_model.onnx`
- `classifier.onnx` or `best_classifier_model_v3.onnx`

### Option B: PyTorch Direct in FastAPI (Alternative)
Keep `.pth` files, load with `torch.load()`, run inference in FastAPI.
**Advantage**: No export step, exact training parity.
**Backend Change**: Spring Boot calls FastAPI instead of ONNX Runtime.

---

## NEEDS VERIFICATION

| Item | Status | Action Required |
|------|--------|-----------------|
| Segmentation `.pth` format (state_dict vs full checkpoint) | ❓ | Load and inspect keys |
| Classification `.pth` `class_names` order | ❓ | Load checkpoint, print `class_names` |
| Optimal segmentation threshold (0.5 vs tuned) | ❓ | Check validation metrics |
| Classification input: full image vs segmented crop | ❓ | Verify training data pipeline |
| ONNX export opset compatibility with ONNX Runtime 1.20 | ❓ | Test export + load |
| Model memory requirements (GPU VRAM) | ❓ | Measure during inference |