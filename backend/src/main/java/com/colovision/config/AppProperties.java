package com.colovision.config;
import java.nio.file.Path; import org.springframework.boot.context.properties.ConfigurationProperties;
@ConfigurationProperties(prefix="app") public record AppProperties(String jwtSecret,long accessTokenExpireMinutes,String corsOrigins,Path uploadDir,Path modelsDir) {}
