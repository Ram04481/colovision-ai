from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "ML API is running"
    }


@app.post("/predict")
def predict():
    return {
        "message": "Prediction endpoint is working"
    }