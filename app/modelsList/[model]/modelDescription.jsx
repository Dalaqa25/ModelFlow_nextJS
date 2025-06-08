export default function ModelDescription({ description }) { 
    return (
        <div className='mt-10 mb-10 w-full flex flex-col gap-2 sm:gap-5'>
            <h2 className='text-2xl font-semibold sm:text-4xl'>Model Description</h2>    
            <p className='font-light text-lg text-gray-600'>
                {description}
            </p>
        </div>
    );
}