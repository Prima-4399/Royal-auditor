"""Minimal FastAPI test to verify service starts."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return JSONResponse(
        {"status": "ok"},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.get("/version")
async def version():
    return JSONResponse(
        {"version": "minimal-test"},
        headers={"Access-Control-Allow-Origin": "*"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
