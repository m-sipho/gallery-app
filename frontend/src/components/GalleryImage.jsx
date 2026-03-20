import { useState } from "react"
import { Maximize, Trash2 } from "lucide-react";


function GalleryImage({ index, image, onMaximize, onDelete }) {

    const [isLoading, setIsLoading] = useState(true);
    const imageRatio = image.width && image.height ? `${image.width} / ${image.height}` : '1 / 1'

    return (
        <div key={index} className='break-inside-avoid group relative overflow-hidden rounded-xl' style={{ aspectRatio: imageRatio }} onClick={() => {if (window.innerWidth < 768) onMaximize()}}>
            {isLoading && (
                <div className='w-full animate-pulse bg-gray-300 flex items-center justify-center' style={{ aspectRatio: imageRatio }}>
                    
                </div>
            )}
            <img src={image.url} alt={`Gallery Image ${index}`} className={`w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110 ${isLoading ? 'opacity-0 h-0' : 'opacity-100'}`} onLoad={() => setIsLoading(false)} loading='lazy' />
            <div className='absolute inset-0 bg-black/40 opacity-0 md:group-hover:opacity-100 transition-all flex items-center justify-center gap-5 pointer-events-none md:group-hover:pointer-events-auto'>
                <button className='cursor-pointer' onClick={(e) => {e.stopPropagation(); onMaximize()}} title='Maximize'>
                    <Maximize className='text-white hover:text-zinc-300' size={32} />
                </button>
                <button className='cursor-pointer' onClick={(e) => {e.stopPropagation(); onDelete(image.filename)}} title='Delete'>
                    <Trash2 className='text-white hover:text-zinc-300' size={32} />
                </button>
            </div>
        </div>
    )
}

export default GalleryImage