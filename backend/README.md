# ColoVision AI backend — Spring Boot

This backend has been migrated from FastAPI/Python to Spring Boot 3 and Java 17. The React client still calls the same `/api/...` endpoints; its default API address is now `http://localhost:8080/api`.

## Run

1. Install Java 17+, Maven 3.9+, and MySQL 8.
2. Create the database: `CREATE DATABASE colorectal_ai;`.
3. Set `DATABASE_USERNAME`, `DATABASE_PASSWORD`, and a strong `JWT_SECRET_KEY` environment variable. `DATABASE_URL` may be set to override the default MySQL connection URL.
4. Export the trained PyTorch models to ONNX and place them in `models/` as:
   - `segmentation.onnx`
   - `classifier.onnx`
5. Run `mvn spring-boot:run`.

The API is available on port 8080, uploads and generated files are stored in `uploads/`, and schema updates are managed by JPA/Hibernate.

## Model migration requirement

Java/Spring cannot load PyTorch `.pth` state dictionaries. Export each model with its exact trained architecture and preprocessing contract to ONNX. The service deliberately returns `503` for prediction requests until both ONNX files are present; it never returns invented medical predictions. Verify the input/output tensor shapes and replace the default 256×256 segmentation and 224×224 classification preprocessing if training used different values.

## First administrator

The application keeps the original policy: there is no public administrator-registration endpoint. Insert the first administrator directly into the `admins` table with a BCrypt password hash.
