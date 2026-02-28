from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv

load_dotenv()

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
        response = s3_client.upload_fileobj(file.file, s3_bucket_name, f"gallery/{file.filename}")
        return {"message": f"image successfully uploaded: {response}"}
    except ClientError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to upload the image"
        )