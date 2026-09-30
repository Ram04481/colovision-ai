package com.colovision.service;

import ai.onnxruntime.*;
import com.colovision.config.AppProperties;
import jakarta.annotation.PreDestroy;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.nio.file.*;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ModelService {
  private static final String[] CLASSES = {"Adenocarcinoma", "High-grade IN", "Low-grade IN", "Normal", "Polyp", "Serrated Adenoma"};
  private final OrtEnvironment environment = OrtEnvironment.getEnvironment();
  private OrtSession segmenter, classifier;

  public ModelService(AppProperties properties) throws Exception {
    Files.createDirectories(properties.modelsDir());
    Path segmentation = locate(properties.modelsDir(), "segmentation.onnx", "best_segmentation_model.onnx");
    Path classification = locate(properties.modelsDir(), "classifier.onnx", "best_classifier_model_v3.onnx");
    if (segmentation != null && classification != null) {
      segmenter = environment.createSession(segmentation.toString(), new OrtSession.SessionOptions());
      classifier = environment.createSession(classification.toString(), new OrtSession.SessionOptions());
    }
  }

  private static Path locate(Path directory, String standardName, String suppliedName) {
    Path standard = directory.resolve(standardName), supplied = directory.resolve(suppliedName);
    return Files.exists(standard) ? standard : Files.exists(supplied) ? supplied : null;
  }

  public Result predict(BufferedImage image) throws Exception {
    if (segmenter == null || classifier == null) throw new IllegalStateException("Missing ONNX models in the models folder.");
    try (OnnxTensor input = OnnxTensor.createTensor(environment, tensor(image, 256, 256)); OrtSession.Result output = segmenter.run(Map.of(segmenter.getInputNames().iterator().next(), input))) {
      float[][][][] data = (float[][][][]) output.get(0).getValue();
      BufferedImage mask = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
      for (int y = 0; y < mask.getHeight(); y++) for (int x = 0; x < mask.getWidth(); x++) {
        float raw = data[0][0][Math.min(255, y * 256 / mask.getHeight())][Math.min(255, x * 256 / mask.getWidth())];
        mask.getRaster().setSample(x, y, 0, sigmoid(raw) > .5f ? 255 : 0);
      }
      BufferedImage overlay = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
      Graphics2D graphics = overlay.createGraphics(); graphics.drawImage(image, 0, 0, null);
      graphics.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, .35f)); graphics.drawImage(redMask(mask), 0, 0, null); graphics.dispose();
      return classify(image, mask, overlay);
    }
  }

  private Result classify(BufferedImage image, BufferedImage mask, BufferedImage overlay) throws Exception {
    try (OnnxTensor input = OnnxTensor.createTensor(environment, tensor(image, 224, 224)); OrtSession.Result output = classifier.run(Map.of(classifier.getInputNames().iterator().next(), input))) {
      float[][] logits = (float[][]) output.get(0).getValue(); double[] probabilities = softmax(logits[0]); int best = 0;
      for (int i = 1; i < probabilities.length; i++) if (probabilities[i] > probabilities[best]) best = i;
      return new Result(CLASSES[best], probabilities[best], probabilities, mask, overlay);
    }
  }

  private static float sigmoid(float value) { return 1f / (1f + (float) Math.exp(-value)); }
  private static BufferedImage redMask(BufferedImage mask) { BufferedImage output = new BufferedImage(mask.getWidth(), mask.getHeight(), BufferedImage.TYPE_INT_ARGB); for (int y = 0; y < mask.getHeight(); y++) for (int x = 0; x < mask.getWidth(); x++) if (mask.getRaster().getSample(x, y, 0) > 0) output.setRGB(x, y, 0xFFFF0000); return output; }
  private static float[][][][] tensor(BufferedImage source, int width, int height) { BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB); resized.getGraphics().drawImage(source, 0, 0, width, height, null); float[][][][] values = new float[1][3][height][width]; for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) { int rgb = resized.getRGB(x, y); values[0][0][y][x] = ((rgb >> 16) & 255) / 255f; values[0][1][y][x] = ((rgb >> 8) & 255) / 255f; values[0][2][y][x] = (rgb & 255) / 255f; } return values; }
  private static double[] softmax(float[] values) { double max = values[0], sum = 0; for (float value : values) if (value > max) max = value; double[] result = new double[values.length]; for (int i = 0; i < values.length; i++) sum += result[i] = Math.exp(values[i] - max); for (int i = 0; i < values.length; i++) result[i] /= sum; return result; }
  public record Result(String label, double confidence, double[] probabilities, BufferedImage mask, BufferedImage overlay) {}
  @PreDestroy public void close() throws OrtException { if (segmenter != null) segmenter.close(); if (classifier != null) classifier.close(); }
}
