import modelData from 'app/modelsList/modeldata.js'
import {Search} from "lucide-react";

export default function modelBox() {
    return (
        <div className='flex gap-7 w-full'>
            <div className='h-[700px] w-[400px] hidden md:block rounded-lg shadow'>
            </div>
            <section className='flex flex-col gap-7 w-full'>
                {modelData.map(model => (
                    <div key={model.id} className='shadow p-1 rounded-2xl overflow-hidden cursor-pointer hover:bg-gray-50 transition-all'>
                        <div className='p-3.5 flex flex-col gap-5'>
                            <div className='flex gap-4'>
                                <div className='flex flex-col gap-2'>
                                    <h2 className='text-2xl font-semibold'>{model.name}</h2>
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
                            <span className='flex gap-1'>
                                Price: <span className='flex'>$<p>{model.price}</p></span>
                            </span>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    )
}