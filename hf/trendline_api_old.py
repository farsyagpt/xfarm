from fastapi import FastAPI, BackgroundTasks, File, Form, UploadFile, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import time
from engine import render_dynamic_video

app = FastAPI(title="VisualTrendline API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/render")
async def render_video(
    csv_file: UploadFile = File(...),
    title: str = Form("TABUNGAN VS INVESTASI"),
    subtitle: str = Form("Simulasi"),
    aspect_ratio: str = Form("16:9"),
    theme: str = Form("black"),
    colA: str = Form("Tabungan"),
    colB: str = Form("Investasi"),
    colorA: str = Form("#22C55E"),
    colorB: str = Form("#EF4444"),
    emojiA: str = Form("💰"),
    emojiB: str = Form("📈"),
    imageA: UploadFile = File(None),
    imageB: UploadFile = File(None)
):
    job_id = str(uuid.uuid4())
    
    os.makedirs("OUTPUT_VIDEOS", exist_ok=True)
    os.makedirs("TEMP_UPLOADS", exist_ok=True)
    
    csv_data = (await csv_file.read()).decode("utf-8")
    
    marker_img_A = None
    if imageA:
        marker_img_A = f"TEMP_UPLOADS/{job_id}_A_{imageA.filename}"
        with open(marker_img_A, "wb") as f:
            f.write(await imageA.read())

    marker_img_B = None
    if imageB:
        marker_img_B = f"TEMP_UPLOADS/{job_id}_B_{imageB.filename}"
        with open(marker_img_B, "wb") as f:
            f.write(await imageB.read())
            
    output_mp4 = f"OUTPUT_VIDEOS/{job_id}.mp4"
    
    try:
        render_dynamic_video(
            data_csv=csv_data,
            output_mp4=output_mp4,
            title=title,
            subtitle=subtitle,
            theme=theme,
            aspect_ratio=aspect_ratio,
            colA=colA,
            colB=colB,
            colorA=colorA,
            colorB=colorB,
            emojiA=emojiA,
            emojiB=emojiB,
            marker_img_A=marker_img_A,
            marker_img_B=marker_img_B
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    return FileResponse(output_mp4, media_type="video/mp4")

@app.get("/api/health")
def healthcheck():
    return {"status": "ok"}
