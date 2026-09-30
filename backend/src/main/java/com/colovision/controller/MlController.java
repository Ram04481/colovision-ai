package com.colovision.controller;

import com.colovision.service.MlService;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ml")
public class MlController {

    private final MlService mlService;

    public MlController(MlService mlService) {
        this.mlService = mlService;
    }

    @PostMapping(
            value = "/predict",
            consumes = "multipart/form-data"
    )
    public String predict(
            @RequestParam("file") MultipartFile file
    ) throws Exception {

        return mlService.predict(file);
    }
}