from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import logging

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
        s3_client.upload_fileobj(file.file, s3_bucket_name, f"gallery/{file.filename}")
        return {"message": "image successfully uploaded"}
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to upload the image"
        )

@app.get("/images")
async def get_all_images():
    try:
        # List all objects (images) in the S3 bucket
        response = s3_client.list_objects_v2(Bucket=s3_bucket_name, Prefix="gallery/")
        files = response.get("Contents", [])
        logger.info(files)
        image_list = []

        for obj in files:
            fname = obj["Key"]
            logger.info(fname)
            # Generate the pre-signed URL
            url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": s3_bucket_name, "Key": fname},
                ExpiresIn=3600
            )
            image_list.append({"url": url, "filename": fname.split("/")[-1]})

        return {"image_urls": image_list}
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
