from fastapi import FastAPI, UploadFile, File, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import logging
from PIL import Image
import io
import re

load_dotenv()

# Configure logging
logger = logging.getLogger("gallery")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

logger.addHandler(handler)

aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
aws_region_name = os.getenv("AWS_REGION_NAME")
s3_bucket_name = os.getenv("S3_BUCKET_NAME")

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://gallery-app-blue-ten.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

s3_client = boto3.client(
    "s3",
    aws_access_key_id=aws_access_key_id,
    aws_secret_access_key=aws_secret_access_key,
    region_name=aws_region_name,
)

@app.get("/")
def health_check():
    return {"message": "hello_world"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Upload a file to an S3 bucket"""
    try:
        # Read file to get dimensions
        content = await file.read()
        img = Image.open(io.BytesIO(content))
        width, height = img.size

        s3_key = f"gallery/w{width}_h{height}_{file.filename}"

        s3_client.put_object(
            Bucket=s3_bucket_name,
            Key=s3_key,
            Body=content,
            ContentType=file.content_type,
            Metadata={
                "width": str(width),
                "height": str(height)
            }
        )
        file_url = f"https://{s3_bucket_name}.s3.{aws_region_name}.amazonaws.com/gallery/{file.filename}"
        return {
            "message": "image successfully uploaded",
            "url": file_url,
            "filename": file.filename,
            "width": width,
            "height": height
        }
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to upload the image"
        )

@app.get("/images")
async def get_all_images(limit: int = Query(20, gt=0, le=100), offset: str = Query(None)):
    try:
        # Use list_objects_v2 with MaxKeys for pagination
        params = {
            "Bucket": s3_bucket_name,
            "Prefix": "gallery/",
            "MaxKeys": limit
        }

        if offset:
            params["ContinuationToken"] = offset
        

        response = s3_client.list_objects_v2(**params)
        files = response.get("Contents", [])
        next_token = response.get("NextContinuationToken")

        image_list = []
        for obj in files:
            fname = obj["Key"]

            # Use regex to find width and height
            dimensions = re.search(r'w(\d+)_h(\d+)_', fname)
            width = int(dimensions.group(1)) if dimensions else 0
            height = int(dimensions.group(2)) if dimensions else 0

            # Generate the pre-signed URL
            url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": s3_bucket_name, "Key": fname},
                ExpiresIn=3600
            )
            logger.info(f"Size: {obj["Size"]}")
            image_list.append({
                "url": url,
                "filename": fname.split("/")[-1],
                "width": width,
                "height": height,
                "size": obj["Size"],
                "last_modified": obj["LastModified"]
            })
        return {
            "image_urls": image_list,
            "next_offset": next_token
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
@app.delete("/images/{filename}")
async def delete_image(filename: str):
    try:
        # Delete the image from AWS S3
        s3_client.delete_object(Bucket=s3_bucket_name, Key=f"gallery/{filename}")
        return {"message": f"Successfully deleted {filename}"}
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
