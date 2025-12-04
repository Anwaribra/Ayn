from fastapi import FastAPI

app = FastAPI(title="Ayn API", version="0.1.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to Ayn Intelligent Quality Assurance API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
