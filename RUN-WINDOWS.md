# Run the project on Windows

## 1. Install required software

Install Java 17 or newer, MySQL 8, Node.js LTS, and Maven. Java is already installed on this computer. Install Maven from an Administrator PowerShell window:

```powershell
winget install -e --id Apache.Maven
```

Close PowerShell, open it again, and confirm the installation:

```powershell
mvn -version
node --version
npm --version
```

Each command must be entered separately. Do not join commands on one line.

## 2. Start MySQL and create the database

Start your MySQL service, then sign in to MySQL and run:

```sql
CREATE DATABASE colorectal_ai;
```

The default connection uses MySQL user `root`, password `ram123`, and port `3306`. If your password is different, set it for the current PowerShell window before starting the backend:

```powershell
$env:DATABASE_USERNAME = "root"
$env:DATABASE_PASSWORD = "your-mysql-password"
$env:JWT_SECRET_KEY = "replace-this-with-a-long-random-secret-of-at-least-32-characters"
```

## 3. Keep the supplied ONNX model files in place

The archive already includes both files in `backend\models`:

```text
best_classifier_model_v3.onnx
best_segmentation_model.onnx
```

Do not replace them with `.pth` files. The corrected backend accepts these exact ONNX names. It also accepts the alternate names `classifier.onnx` and `segmentation.onnx`.

## 4. Start the backend

Open a PowerShell window, go to the `backend` folder, and run:

```powershell
cd "C:\path\to\colorectal-ai-ready\backend"
mvn spring-boot:run
```

Wait until the output says that the application started. Verify it in a browser at `http://localhost:8080/health`. It should return `{"status":"ok"}`.

## 5. Start the frontend

Open a second PowerShell window and run:

```powershell
cd "C:\path\to\colorectal-ai-ready\frontend"
npm install
npm run dev
```

Open the local Vite address shown by the command, normally `http://localhost:5173`.

## Common errors

- `mvn is not recognized`: Maven is not installed or PowerShell was not reopened after installation.
- MySQL connection refused or access denied: start MySQL and set `DATABASE_PASSWORD` to the real MySQL password.
- Model error during image analysis: keep both supplied `.onnx` files in `backend\models`; they must not be empty or renamed to `.pth`.
- Port already in use: set `$env:SERVER_PORT = "8081"` before backend startup, then set `VITE_API_URL=http://localhost:8081/api` for the frontend.
