package com.colovision.controller;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
@RestControllerAdvice public class ApiExceptionHandler { 
    private final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(NoSuchElementException.class) 
    ResponseEntity<?> missing(Exception e){
        log.warn("NoSuchElementException: {}", e.getMessage());
        return error(HttpStatus.NOT_FOUND,e.getMessage());
    }
    @ExceptionHandler({IllegalArgumentException.class,MethodArgumentTypeMismatchException.class}) 
    ResponseEntity<?> invalid(Exception e){
        log.warn("IllegalArgumentException/MethodArgumentTypeMismatchException: {}", e.getMessage(), e);
        // Check if it's a duplicate email/username error - return 409 Conflict
        String message = e.getMessage();
        if (message != null && (message.contains("already registered") || message.contains("already exists"))) {
            return error(HttpStatus.CONFLICT, message);
        }
        return error(HttpStatus.BAD_REQUEST, message);
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validationError(MethodArgumentNotValidException e){
        log.warn("Validation error: {}", e.getMessage());
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        return error(HttpStatus.BAD_REQUEST, message);
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> dataIntegrity(DataIntegrityViolationException e){
        log.warn("Data integrity violation: {}", e.getMessage());
        String message = e.getMessage();
        if (message != null && message.contains("Duplicate entry")) {
            if (message.contains("email")) {
                return error(HttpStatus.CONFLICT, "Email address is already registered.");
            }
            if (message.contains("username")) {
                return error(HttpStatus.CONFLICT, "Username is already registered.");
            }
        }
        return error(HttpStatus.CONFLICT, "Data integrity violation");
    }
    @ExceptionHandler(UnsupportedOperationException.class) 
    ResponseEntity<?> type(Exception e){
        log.warn("UnsupportedOperationException: {}", e.getMessage());
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE,e.getMessage());
    }
    @ExceptionHandler(BadCredentialsException.class) 
    ResponseEntity<?> bad(Exception e){
        log.warn("BadCredentialsException: {}", e.getMessage());
        return error(HttpStatus.UNAUTHORIZED,e.getMessage());
    }
    @ExceptionHandler(AccessDeniedException.class) 
    ResponseEntity<?> denied(Exception e){
        log.warn("AccessDeniedException: {}", e.getMessage());
        return error(HttpStatus.FORBIDDEN,e.getMessage());
    }
    @ExceptionHandler(IllegalStateException.class) 
    ResponseEntity<?> unavailable(Exception e){
        log.warn("IllegalStateException: {}", e.getMessage());
        return error(HttpStatus.SERVICE_UNAVAILABLE,e.getMessage());
    }
    @ExceptionHandler(Exception.class) 
    ResponseEntity<?> generic(Exception e){
        log.error("Unhandled exception: {}", e.getMessage(), e);
        return error(HttpStatus.INTERNAL_SERVER_ERROR,e.getMessage());
    }
    private ResponseEntity<?> error(HttpStatus s,String m){return ResponseEntity.status(s).body(Map.of("detail",m==null?"Request could not be completed":m));} 
}
