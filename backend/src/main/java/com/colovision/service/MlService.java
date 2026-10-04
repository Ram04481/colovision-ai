package com.colovision.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.imageio.ImageIO;

@Service
public class MlService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public MlService() {
        this.restClient = RestClient.builder()
                .baseUrl("http://127.0.0.1:8000")
                .build();
    }

    public PredictionResult predict(MultipartFile file) throws Exception {

        ByteArrayResource resource =
                new ByteArrayResource(file.getBytes()) {

                    @Override
                    public String getFilename() {
                        return file.getOriginalFilename();
                    }
                };

        String jsonResponse = restClient.post()
                .uri("/predict")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(
                        new org.springframework.util.LinkedMultiValueMap<>() {{
                            add("file", resource);
                        }}
                )
                .retrieve()
                .body(String.class);

        return parseResponse(jsonResponse);
    }

    private PredictionResult parseResponse(String json) throws IOException {
        JsonNode root = objectMapper.readTree(json);
        
        String predictedClass = root.path("predicted_class").asText();
        double confidence = root.path("confidence").asDouble();
        
        JsonNode probsNode = root.path("probabilities");
        double[] probabilities = new double[6];
        int i = 0;
        for (String key : new String[]{"adenocarcinoma", "high-grade in", "low-grade in", "normal", "polyp", "serrated adenoma"}) {
            probabilities[i++] = probsNode.path(key).asDouble();
        }
        
        String maskBase64 = root.path("mask_base64").asText();
        BufferedImage mask = decodeBase64Mask(maskBase64);
        BufferedImage overlay = createOverlay(mask);
        
        // Convert predicted class to title case for consistency with existing data
        String titleCaseClass = toTitleCase(predictedClass);
        
        return new PredictionResult(
            titleCaseClass,
            confidence,
            parseProbabilities(probabilities),
            mask,
            overlay
        );
    }
    
    private double[] parseProbabilities(double[] probs) {
        // Ensure order matches: adenocarcinoma, high-grade in, low-grade in, normal, polyp, serrated adenoma
        return probs;
    }

    private BufferedImage decodeBase64Mask(String base64) throws IOException {
        byte[] decoded = Base64.getDecoder().decode(base64);
        try (ByteArrayInputStream bis = new ByteArrayInputStream(decoded)) {
            return ImageIO.read(bis);
        }
    }
    
    private BufferedImage createOverlay(BufferedImage mask) {
        BufferedImage overlay = new BufferedImage(mask.getWidth(), mask.getHeight(), BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < mask.getHeight(); y++) {
            for (int x = 0; x < mask.getWidth(); x++) {
                if (mask.getRaster().getSample(x, y, 0) > 0) {
                    overlay.setRGB(x, y, 0xFFFF0000); // Red with full opacity
                }
            }
        }
        return overlay;
    }

    public record PredictionResult(
        String predictedClass,
        double confidence,
        double[] probabilities,
        BufferedImage mask,
        BufferedImage overlay
    ) {}

    private String toTitleCase(String input) {
        if (input == null || input.isEmpty()) return input;
        String[] words = input.split("[- ]");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1).toLowerCase());
            }
            if (result.length() > 0 && result.charAt(result.length() - 1) != ' ') {
                result.append(' ');
            }
        }
        return result.toString().trim();
    }
}