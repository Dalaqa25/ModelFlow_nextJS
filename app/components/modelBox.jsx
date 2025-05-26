import modelData from 'app/modelsList/modeldata.js'
import Link from 'next/link';
import Filter from 'app/components/filter';
import { FiDownload } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';

export default function modelBox() {
    return (
        <div className='flex gap-7 w-full'>
            <Filter />
            <div className='w-full flex flex-col gap-7'>
                {modelData.map(model => (
                    <Link href={`/modelsList/${model.id}`} key={model.id} className='cutom-shadow p-1 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-50 transition-all max-w-[900px]'>
                        <div className='p-3.5 flex flex-col gap-5'>
                            <div className='flex gap-4'>
                                {model.image && (
                                <img src={model.image.src} 
                                    alt={model.image.alt} 
                                    className='w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover' />
                                )}
                                <div className='flex flex-col gap-2'>
                                    <h2 className='text-1xl sm:text-2xl font-semibold'>{model.name}</h2>
                                    <span className='flex gap-1 text-gray-500'>
                                        author: <p>{model.author}</p>
                                    </span>
                                </div>
                            </div>
                            <div className='flex gap-3 flex-wrap'>
                                {model.tags.map((tag, index) => (
                                    <div key={index} style={{ backgroundColor: '#efe7ff' }} className='font-light p-1 rounded-xl'>
                                        {tag}
                                    </div>
                                ))}
                            </div>
                            {/* Revives */}
                            <div className='flex items-center gap-4 font-light text-sm'>
                                <p>Uploaded: <span>12.05.2</span></p>
                                <p className='flex items-center gap-1'><FiDownload/><span>55</span></p>
                                <p className='flex items-center gap-1'><AiOutlineHeart/><span>55</span></p>
                            </div>
                            <span className='flex gap-1'>
                                Price: <span className='flex'>$<p>{model.price}</p></span>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    )
}