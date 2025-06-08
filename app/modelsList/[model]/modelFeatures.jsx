export default function ModelFeatures({ features }) {
    const featureList = typeof features === "string" ? features.split(",") : features;

    return (
        <div className='mt-10 mb-10 w-full flex flex-col gap-5'>
            <h2 className='text-4xl font-semibold'>Key Features</h2>
            <div className='flex justify-between w-full items-center'>
                <ul className='list-disc pl-6 flex flex-col gap-3'>
                    {featureList && featureList.map((feature, index) => (
                        <li key={index} className='font-light text-lg text-gray-600'>
                            {feature.trim()}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}