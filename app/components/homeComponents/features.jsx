'use client';
export default function features() {
    return(
        <div className='flex w-[80%] mx-auto text-center justify-center max-w-[1250px] gap-10'>
            <div className='models-box  '>
                <h1>Model A</h1>
                <p>Description: </p>
                <button className='text-white btn-primary px-10 py-3 rounded hover:px-13 shadow'>Explore</button>
            </div>
            <div className='models-box '>
                <h1>Model B</h1>
                <p>Description: </p>
                <button className='text-white btn-primary px-10 py-3 rounded hover:px-13 shadow'>Explore</button>
            </div>
            <div className='models-box '>
                <h1>Model C</h1>
                <p>Description: </p>
                <button className='text-white btn-primary px-10 py-3 rounded hover:px-13 shadow'>Explore</button>
            </div>
            <img src='3dcube.png' alt='suiii' className='absolute w-1/9 left-1 rotate-on-hover'/>
            <img src='3dcube.png' alt='suiii' className='absolute w-1/9 right-1 rotate-on-hover'/>
        </div>
    )
}