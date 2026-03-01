import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Upload } from "lucide-react"
import GalleryImage from './components/GalleryImage';

function App() {
  
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Handle file upload
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setTotalFiles(files.length);
    setIsUploading(true);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      setCurrentFileIndex(i + 1);
      const formData = new FormData();

      formData.append("file", files[i]);

      try {
        const response = await axios.post("http://localhost:8000/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (ProgressEvent) => {
            const individualPercent = Math.round(
              (ProgressEvent.loaded * 100) / ProgressEvent.total
            );

            const totalBase = (i / files.length) * 100;
            const currentWeight = (individualPercent / files.length);
            setUploadProgress(Math.round(totalBase + currentWeight));
          }
        });

        if (response.status === 200) {
          console.log(`${files[i].name} uploaded successfully!`);
        }
      } catch (error) {
        console.error(`Error uploading ${files[i].name}:`, error);
        alert(`Failed to upload ${files[i].name}`)
      }
    }

    console.log("Files uploaded successfully");

    setIsUploading(false);
    setUploadProgress(0);

    fetchImages();
  }

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      // Make an HTTP GET request to the FastAPI server to fetch all images
      const response = await axios.get("http://localhost:8000/images");

      setImages(response.data.image_urls)
    } catch (error) {
      console.error("Error fetching images:", error)
      alert("Error fetching messages", error);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(`http://localhost:8000/images/${encodeURIComponent(filename)}`)
      setImages((prevImages) => prevImages.filter((image) => image.filename !== filename));

      if (selectedImg?.filename === filename) {
        setSelectedImage(null);
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Error deleting image");
    }
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-6xl mx-auto flex flex-col items-center mb-12'>
        <h1 className='text-3xl font-bold text-center mb-8'>Gallery App</h1>
        <hr />

        <label className='flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-full cursor-pointer transition-all'>
          <Upload size={20} />
          <span className='font-semibold'>Upload Image</span>
          <input type="file" multiple className='hidden' onChange={handleUpload} accept='image/*' />
        </label>

        {isUploading && (
          <div className="w-full max-w-md mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-emerald-700 italic">
                Uploading {currentFileIndex} of {totalFiles}
              </span>
              <span className="text-sm font-bold text-emerald-700">
                {uploadProgress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-sm">
              <div 
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 overflow-y-auto'>
        {images.map((image, index) => (
          <GalleryImage index={index} image={image} onMaximize={setSelectedImage} onDelete={handleDelete} />
        ))}
      </div>

      {selectedImg && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300'>
          <button onClick={() => setSelectedImage(null)} className='absolute top-6 right-6 text-white hover:text-gray-300 transition-colors'>
            <X className='cursor-pointer' size={40} />
          </button>
          <img src={selectedImg.url} alt="Fullscreen view" className='max-w-full text-white max-h-[90vh] rounded-lg object-contain' />
        </div>
      )}
    </div>
  )
}

export default App
