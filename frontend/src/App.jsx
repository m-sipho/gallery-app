import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Maximize, Upload, Trash2 } from "lucide-react"

function App() {
  
  const [images, setImages] = useState([]);
  const [selectedImg, setSelectedImage] = useState(null);

  // Handle file upload
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...newImages]);
  }

  useEffect(() => {
    fetchImages();
  }, [images]);

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
    try {
      await axios.delete(`http://localhost:8000/images/${encodeURIComponent(filename)}`)
      setImages((prevImages) => prevImages.filter((image) => image.filename !== filename));
      alert("Image deleted successfully");
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
      </div>

      <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4'>
        {images.map((image, index) => (
          <div key={index} className='break-inside-avoid group relative overflow-hidden rounded-xl'>
            <img src={image.url} alt={`Gallery Image ${index}`} className='w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110' />
            <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-5'>
              <button className='cursor-pointer' onClick={() => setSelectedImage(image)} title='Maximize'>
                <Maximize className='text-white hover:text-zinc-300' size={32} />
              </button>
              <button className='cursor-pointer' title='Delete'>
                <Trash2 className='text-white hover:text-zinc-300' size={32} />
              </button>
            </div>
          </div>
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
