package com.colovision.controller;
import java.util.*; import org.springframework.http.*; import org.springframework.security.access.AccessDeniedException; import org.springframework.security.authentication.BadCredentialsException; import org.springframework.web.bind.annotation.*; import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
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
        return error(HttpStatus.BAD_REQUEST,e.getMessage());
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
