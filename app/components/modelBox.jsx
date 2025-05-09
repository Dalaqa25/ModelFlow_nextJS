import modelData from 'app/modelsList/modeldata.js'

export default function modelBox() {
    return (
        <div className='flex flex-wrap gap-4'>
            {modelData.map(model => (
                <div key={model.id} className='border-gray-300 border-2 min-w-[250px] w-1/4 p-1 rounded-2xl overflow-hidden'>
                    <div className='p-3.5 flex flex-col gap-5'>
                        <div className='flex gap-4'>
                            <img src='logo.png' alt='logo' className='w-[70px] h-[70px]'/>
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
                        <button className='btn-primary text-white rounded-xl py-2 text-lg'>View</button>
                    </div>
                </div>
            ))}
        </div>
    )
}