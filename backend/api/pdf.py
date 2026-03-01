from fastapi import APIRouter, HTTPException, UploadFile, File
from models.schemas import PDFInfo, DriveUploadRequest
from core import db, pdf_utils
from typing import List

router = APIRouter(prefix="/pdf", tags=["pdf"])

@router.get("/list/{user_id}", response_model=List[PDFInfo])
async def get_pdfs(user_id: str):
    return db.get_saved_pdfs(user_id)

@router.post("/upload/{user_id}")
async def upload_pdf(user_id: str, file: UploadFile = File(...)):
    try:
        content = await file.read()
        text = pdf_utils.extract_text_from_pdf(content)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        db.save_pdf(user_id, file.filename, text)
        return {"status": "success", "filename": file.filename}
    except Exception as e:
        import traceback
        traceback.print_exc()  # Print full traceback to server logs
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-drive")
async def upload_drive(request: DriveUploadRequest):
    try:
        text = pdf_utils.extract_text_from_drive_url(request.url)
        # Use a short label for Drive files
        filename = f"Drive_{request.url[-10:]}" 
        db.save_pdf(request.user_id, filename, text)
        return {"status": "success", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{pdf_id}")
async def delete_pdf(pdf_id: int):
    db.delete_saved_pdf(pdf_id)
    return {"status": "success"}
