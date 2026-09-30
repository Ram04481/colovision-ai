# Testing Strategy

## Test Pyramid

```
         E2E Tests (Few)
        /              \
   Integration Tests    \
  /          \          \
Unit Tests  Unit Tests  Unit Tests
(Frontend) (Backend)   (ML Service)
```

---

## Backend Testing (Spring Boot)

### Dependencies to Add
```xml
<!-- pom.xml -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.testcontainers</groupId>
  <artifactId>mysql</artifactId>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>org.mockito</groupId>
  <artifactId>mockito-junit-jupiter</artifactId>
  <scope>test</scope>
</dependency>
```

### Unit Tests (Services)
| Service | Test Cases |
|---------|------------|
| `AuthService` | register duplicate email/username, login success/fail, status check, password hashing |
| `AdminService` | approve/reject/suspend, status transitions |
| `ReportService` | PDF generation with various inputs |
| `ModelService` | Preprocessing output shapes, mock ONNX session |

### Integration Tests (Controllers)
```java
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
class PredictionControllerTest {
  @Container static MySQLContainer<?> mysql = new MySQLContainer<>("mysql:8");
  
  @Test
  void predict_validImage_returnsPrediction() { ... }
  @Test
  void predict_invalidFileType_returns415() { ... }
  @Test
  void predict_unauthorized_returns401() { ... }
}
```

### Repository Tests
```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = NONE)
class UserRepositoryTest {
  @Test
  void findByStatus_returnsCorrectUsers() { ... }
}
```

### Security Tests
```java
@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {
  @Test
  void userCannotAccessAdminEndpoints() { ... }
  @Test
  void expiredTokenRejected() { ... }
  @Test
  void malformedTokenRejected() { ... }
}
```

---

## Frontend Testing (React + Vitest)

### Dependencies to Add
```json
// package.json
"devDependencies": {
  "vitest": "^1.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "jsdom": "^23.0.0",
  "msw": "^2.0.0"
}
```

### Unit Tests (Components)
| Component | Test Cases |
|-----------|------------|
| `Login` | Form validation, user/admin toggle, submit calls API, error display |
| `Register` | Password mismatch, submit, success notice |
| `AddPatient` | Form validation, file selection, submit flow |
| `AdminDashboard` | Tab switching, approve/reject/suspend actions |
| `PrivateRoute` | Redirects unauthenticated, allows authenticated, role check |

### Integration Tests (Pages)
- Mock API with MSW
- Test full user flows: register → login → create patient → upload → view result

### E2E Tests (Playwright)
```typescript
// playwright.config.ts
test('complete user workflow', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="name"]', 'Test User');
  // ... fill form
  await page.click('button:has-text("Submit registration")');
  
  // Admin approves (separate test or API call)
  
  await page.goto('/login');
  await page.fill('[name="identifier"]', 'testuser');
  await page.fill('[name="password"]', 'password123');
  await page.click('button:has-text("Login")');
  
  await expect(page).toHaveURL('/dashboard');
  
  await page.goto('/patients/new');
  // ... fill patient form, upload image
  await page.click('button:has-text("Analyze")');
  
  await expect(page.locator('text=Analysis complete')).toBeVisible();
});
```

---

## ML Service Testing (FastAPI + PyTorch)

### Unit Tests
```python
# test_preprocessing.py
def test_segmentation_preprocessing():
    img = load_test_image()
    tensor = preprocess_segmentation(img)
    assert tensor.shape == (1, 3, 256, 256)
    assert tensor.min() >= -2.5 and tensor.max() <= 2.5  # normalized

def test_classification_preprocessing():
    img = load_test_image()
    tensor = preprocess_classification(img)
    assert tensor.shape == (1, 3, 224, 224)

# test_inference.py
def test_segmentation_inference():
    model = load_segmentation_model()
    output = model(test_tensor)
    assert output.shape == (1, 1, 256, 256)

def test_classification_inference():
    model = load_classification_model()
    output = model(test_tensor)
    assert output.shape == (1, 6)
    probs = torch.softmax(output, dim=1)
    assert abs(probs.sum().item() - 1.0) < 1e-6
```

### Model Parity Tests
- Run training notebook test images through exported model
- Compare predictions with training evaluation results
- Dice/IoU for segmentation, Accuracy/F1 for classification

### API Tests
```python
# test_api.py
def test_predict_endpoint():
    with TestClient(app) as client:
        response = client.post("/predict", files={"file": ("test.jpg", test_image, "image/jpeg")})
        assert response.status_code == 200
        data = response.json()
        assert "predicted_class" in data
        assert "confidence" in data
        assert "probabilities" in data
        assert len(data["probabilities"]) == 6
```

---

## Database Testing

### Testcontainers (MySQL)
- Spin up real MySQL for integration tests
- Flyway migration before tests
- Clean between tests (transaction rollback or truncate)

### Test Data
- Use `@Sql` scripts for consistent test data
- Factory classes for test entities

---

## CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env: { MYSQL_ROOT_PASSWORD: test, MYSQL_DATABASE: test }
        ports: [3306:3306]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '17' }
      - run: cd backend && mvn verify
      
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run build && npm test
      
  ml-service:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.10' }
      - run: cd ML_API && pip install -r requirements.txt && pytest
```

---

## Manual Testing Checklist

### Authentication
- [ ] Register new user → status PENDING
- [ ] Login as PENDING user → rejected
- [ ] Admin approves → user can login
- [ ] Admin rejects → user cannot login
- [ ] Admin suspends → user cannot login
- [ ] Admin login works
- [ ] JWT expires after 60 min
- [ ] Invalid token rejected

### Patient Management
- [ ] Create patient with all fields
- [ ] Duplicate patient ID rejected
- [ ] List patients for current user only
- [ ] View patient detail (own only)
- [ ] Edit patient (if implemented)

### Image Upload
- [ ] Valid JPG upload works
- [ ] Valid PNG upload works
- [ ] Invalid file type rejected
- [ ] File > 10MB rejected
- [ ] Corrupted image rejected

### AI Pipeline
- [ ] Segmentation produces mask
- [ ] Overlay created correctly
- [ ] Classification returns 6 probabilities
- [ ] Predicted class matches highest probability
- [ ] Results saved to database
- [ ] Mask/overlay files created

### Reporting
- [ ] Report generates on demand
- [ ] Report includes all data
- [ ] PDF downloads correctly
- [ ] Report view page works (when implemented)

### Admin
- [ ] Admin dashboard loads
- [ ] Pending users listed
- [ ] Approve moves user to approved
- [ ] Reject moves user to rejected
- [ ] Suspend works
- [ ] Non-admin cannot access admin APIs

### Security
- [ ] SQL injection attempts fail
- [ ] Path traversal attempts fail
- [ ] XSS attempts fail
- [ ] Rate limiting works (when implemented)