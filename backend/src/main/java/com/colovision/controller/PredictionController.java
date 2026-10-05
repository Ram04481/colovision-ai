package com.colovision.controller;

import com.colovision.config.AppProperties;
import com.colovision.model.Patient;
import com.colovision.model.Prediction;
import com.colovision.repository.PatientRepository;
import com.colovision.repository.PredictionRepository;
import com.colovision.service.AuthService;
import com.colovision.service.MlService;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class PredictionController {

    private final PatientRepository patients;
    private final PredictionRepository predictions;
    private final AuthService auth;
    private final MlService ml;
    private final AppProperties props;
    private final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(PredictionController.class);

    public PredictionController(
            PatientRepository p,
            PredictionRepository x,
            AuthService a,
            MlService m,
            AppProperties q) {

        patients = p;
        predictions = x;
        auth = a;
        ml = m;
        props = q;
    }

    @PostMapping(
            value = "/prediction",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    Map<String, Object> predict(
            @RequestParam Long patient_id,
            @RequestParam("file") MultipartFile image,
            Authentication x) throws Exception {

        log.info("Prediction request received: patient_id={}, filename={}, contentType={}", 
                patient_id, image.getOriginalFilename(), image.getContentType());

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            var u = auth.currentUser(x.getName());
            currentUserId = u.id;
        }

        log.info("Current user ID: {}, isAdmin: {}", currentUserId, isAdmin);

        Patient patient = patients.findById(patient_id)
                .filter(p -> p.createdBy.equals(currentUserId))
                .orElseThrow(() ->
                        new NoSuchElementException("Patient not found"));

        log.info("Patient found: {}", patient.id);

        if (!Set.of("image/jpeg", "image/png")
                .contains(image.getContentType())) {

            throw new UnsupportedOperationException(
                    "Only JPG, JPEG, and PNG files are allowed");
        }

        BufferedImage original =
                ImageIO.read(image.getInputStream());

        if (original == null) {
            throw new IllegalArgumentException(
                    "Invalid image file");
        }

        log.info("Image validated: {}x{}", original.getWidth(), original.getHeight());

        String id = UUID.randomUUID().toString();

        Path images = props.uploadDir().resolve("images");
        Path results = props.uploadDir().resolve("results");

        Files.createDirectories(images);
        Files.createDirectories(results);

        String ext = "image/png".equals(image.getContentType())
                ? ".png"
                : ".jpg";

        Path source = images.resolve(id + ext);
        Path mask = results.resolve(id + "_mask.png");
        Path overlay = results.resolve(id + "_overlay.png");

        Files.copy(image.getInputStream(), source);

        log.info("Calling ML service...");
        var r = ml.predict(image);
        log.info("ML service returned: predictedClass={}, confidence={}", r.predictedClass(), r.confidence());

        // Save mask
        ImageIO.write(r.mask(), "png", mask.toFile());
        // Save overlay
        ImageIO.write(r.overlay(), "png", overlay.toFile());

        Prediction p = new Prediction();

        p.patientId = patient.id;
        p.imagePath = source.toString();
        p.segmentationPath = mask.toString();
        p.overlayPath = overlay.toString();
        p.predictedClass = r.predictedClass();
        p.confidence = r.confidence();

        double[] q = r.probabilities();

        p.adenocarcinomaProbability = q[0];
        p.highGradeProbability = q[1];
        p.lowGradeProbability = q[2];
        p.normalProbability = q[3];
        p.polypProbability = q[4];
        p.serratedProbability = q[5];

        predictions.save(p);

        return Map.of(
                "id", p.id,
                "predicted_class", r.predictedClass(),
                "confidence", r.confidence(),
                "probabilities", q,
                "mask_path", p.segmentationPath,
                "overlay_path", p.overlayPath
        );
    }

    @GetMapping("/predictions/{patientId}")
    List<Prediction> history(
            @PathVariable Long patientId,
            Authentication x) {

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            var u = auth.currentUser(x.getName());
            currentUserId = u.id;
        }

        patients.findById(patientId)
                .filter(p -> p.createdBy.equals(currentUserId))
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Patient not found"));

        return predictions
                .findByPatientIdOrderByCreatedAtDesc(patientId);
    }
}