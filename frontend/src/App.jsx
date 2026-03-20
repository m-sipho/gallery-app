import { useState, useEffect } from 'react'
import axios from 'axios'
import { X, Upload, ChevronLeft, ChevronRight, Trash2, Loader } from "lucide-react"
import GalleryImage from './components/GalleryImage';

function App() {
  
  const [images, setImages] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedImgIndex, setSelectedImgIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [nextOffset, setNextOffset] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;  // Minimum distance considered a swipe
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      showNext();
    }

    if (isRightSwipe) {
      showPrev();
    }
  };

  // Prevent scrolling on Fullscreen view
  useEffect(() => {
    if (selectedImgIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [selectedImgIndex])


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImgIndex === null) return;
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "Escape") setSelectedImgIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImgIndex, images.length]);

  // Navigate to the right
  const showNext = (e) => {
    e?.stopPropagation();
    if (selectedImgIndex < images.length - 1) {
      setSelectedImgIndex(selectedImgIndex + 1);
    }
  };

  // Navigate to the left
  const showPrev = (e) => {
    e?.stopPropagation();
    if (selectedImgIndex > 0) {
      setSelectedImgIndex(selectedImgIndex - 1);
    }
  };

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
        const response = await axios.post(`${API_URL}/upload`, formData, {
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

  const fetchImages = async (isInitial = true) => {
    try {
      if (!isInitial) {
        setIsLoadingMore(true);
      } else {
        setIsInitialLoading(true);
      }

      // Use the nextOffset if we are loading more images, otherwise start afresh
      const url = isInitial ? `${API_URL}/images?limit=20` : `${API_URL}/images?limit=20&offset=${encodeURIComponent(nextOffset)}`;

      // Make an HTTP GET request to the FastAPI server to fetch all images
      const response = await axios.get(url);

      if (isInitial) {
        setImages(response.data.image_urls);
      } else {
        // Append the new images to the existing ones
        setImages(prev => [...prev, ...response.data.image_urls]);
      }

      setNextOffset(response.data.next_offset);
    } catch (error) {
      console.error("Error fetching images:", error)
      alert("Error fetching messages", error);
    } finally {
      setIsLoadingMore(false);
      setIsInitialLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;

    try {
      await axios.delete(`${API_URL}/images/${encodeURIComponent(filename)}`)
      setImages((prevImages) => prevImages.filter((image) => image.filename !== filename));

      setSelectedImgIndex(null);
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
      
      {isInitialLoading ? (
        <div className='flex items-center justify-center h-[50vh]'>
          <div className='relative flex items-center justify-center'>
            <Loader strokeWidth={1} size={140} className='animate-spin text-zinc-500/20' />

            <div className='absolute inset-0 flex items-center justify-center'>
              <p className='text-[13px] text-zinc-500 font-mono tracking-tighter animate-pulse'>FETCHING</p>
            </div>
          </div>
        </div>
      ) : (
        <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 overflow-y-auto'>
          {images.map((image, index) => (
            <GalleryImage index={index} image={image} onMaximize={() => setSelectedImgIndex(index)} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {selectedImgIndex !== null && (
        <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} className='fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm animate-in fade-in duration-300'>
          {/* Close Button */}
          <div className="w-full flex justify-between items-center p-6">
            <button className='p-3 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all border border-red-500/20' title='Delete Image' onClick={(e) => {e.stopPropagation(); handleDelete(images[selectedImgIndex].filename);}}>
              <Trash2 size={20} />
            </button>

            <button onClick={() => setSelectedImgIndex(null)} className='text-white/70 hover:text-white transition-colors'>
              <X size={40} />
            </button>
          </div>

          {/* Arrows and Image */}
          <div className="flex-1 relative flex items-center justify-center w-full min-h-0 px-4">
            
            {/* Left Arrow */}
            {selectedImgIndex > 0 && (
              <button onClick={showPrev} className='hidden md:block absolute left-6 p-3 rounded-full bg-white/5 text-white hover:bg-white/20 transition-all z-20'>
                <ChevronLeft size={30} />
              </button>
            )}

            {/* The Image Container */}
            <div className='relative h-full flex items-center justify-center max-w-5xl' onClick={(e) => e.stopPropagation()}>
              <img src={images[selectedImgIndex].url} alt="Fullscreen view" className='max-w-full max-h-full rounded-lg object-contain shadow-2xl select-none'/>
            </div>

            {/* Right Arrow */}
            {selectedImgIndex < images.length - 1 && (
              <button onClick={showNext} className='hidden md:block absolute right-6 p-3 rounded-full bg-white/5 text-white hover:bg-white/20 transition-all z-20'>
                <ChevronRight size={30} />
              </button>
            )}
          </div>

          {/* 3. BOTTOM BAR: Counter Section */}
          <div className='w-full py-10 flex flex-col items-center gap-2'>
            <div className='text-white font-mono bg-white/10 px-6 py-2 rounded-full border border-white/5 tracking-widest'>
              <span className='text-emerald-400 font-bold'>{selectedImgIndex + 1}</span>
              <span className='mx-2 opacity-30'>/</span>
              {images.length}
            </div>
            
            {/* Optional: Show filename here since we have space now */}
            <p className="text-white/30 text-xs italic truncate max-w-50">
              {images[selectedImgIndex].filename}
            </p>
          </div>
        </div>
      )}

      <div className='flex flex-col items-center py-12'>
        {nextOffset ? (
          <button onClick={() => fetchImages(false)} disabled={isLoadingMore} className='flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-3 rounded-full transition-all disabled:opacity-50'>
            {isLoadingMore ? (
              <>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Loading...</span>
              </>
            ) : (
              "Load More"
            )}
          </button>
        ) : (
          images.length > 0 && (
            <p className='text-zinc-500 italic'>You've reached the end of the gallery.</p>
          )
        )}
      </div>
    </div>
  )
}

export default App
